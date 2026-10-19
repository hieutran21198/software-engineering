import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  rm,
  writeFile,
  rename,
  symlink,
  utimes,
} from "node:fs/promises";
import { join } from "node:path";
import {existsSync} from "node:fs";
import { tmpdir } from "node:os";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import {fileURLToPath} from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createFlowMcpServer } from "../server/flow-mcp.js";
import { createAppServer } from "../server/http.js";
import { createFlowService } from "../server/flow-index.js";
import {
  registeredSourceFingerprint,
  repositoryFingerprint,
} from "../server/repository-events.js";
import {
  fixtureRepository,
  sourceFixture,
  git,
  fingerprint,
} from "./fixtures.js";
function files() {
  const result = sourceFixture();
  result.set("src/check.js", "export const membership = true;\n");
  for (const id of ["login", "reporting"]) {
    const flow = {
      id,
      artifact: "tenant",
      title: "Tenant " + id,
      trigger: "A member requests access.",
      outcome: "Membership checked.",
      entry_steps: ["check"],
      steps: [
        {
          id: "check",
          title: "Check membership",
          supports: ["code", "identity"],
        },
      ],
      transitions: [],
      support: [
        {
          id: "code",
          kind: "implementation",
          path: "src/check.js",
          requires: "Validate membership.",
          basis: "static",
        },
        {
          id: "identity",
          kind: "element",
          artifact: "tenant",
          element: "specifications/identity.md",
          requires: "Tenant identity rules.",
          basis: "documented",
        },
      ],
    };
    result.set(
      `docs/artifacts/tenant/versions/1.0.0/specifications/flows/${id}.md`,
      "---\n" + JSON.stringify({ flow }) + "\n---\n# " + flow.title + "\n",
    );
  }
  return result;
}
async function setup(t, inputFiles = files(), inputEmbedder) {
  const fixture = await fixtureRepository(inputFiles),
    stateDir = await mkdtemp(join(tmpdir(), "plane-flow-adapter-"));
  const service = createFlowService({
    stateDir,
    roots: [fixture.root],
    embedder: inputEmbedder || {
      signature: "test",
      embed: async (texts) => texts.map(() => [1, 0]),
    },
  });
  const server = createAppServer({
    flowService: service,
    flowRoots: [fixture.root],
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const app = createFlowMcpServer({ service, roots: [fixture.root] });
  const client = new Client({ name: "flow-test", version: "1" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await app.server.connect(b);
  await client.connect(a);
  t.after(async () => {
    await client.close();
    await app.close();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await service.close();
    await fixture.cleanup();
    await rm(stateDir, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${server.address().port}/api/flows/query`;
  return {
    fixture,
    service,
    client,
    async http(body, headers = {}) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}
function stable(result) {
  const copy = structuredClone(result);
  delete copy.metrics;
  return copy;
}
test("HTTP and MCP expose equivalent scoped search/detail/impact/source context", async (t) => {
  const { fixture, client, http } = await setup(t),
    before = await fingerprint(fixture.root),
    listed = await client.listTools();
  assert.deepEqual(listed.tools.map((t) => t.name).sort(), [
    "check_records",
    "get_change_brief",
    "get_change_context",
    "get_change_description",
    "get_change_impact",
    "get_change_review",
    "get_change_status",
    "get_flow",
    "get_impact_context",
    "read_change_context_source",
    "read_flow_source",
    "search_flows",
  ]);
  assert.ok(
    listed.tools.every(
      (t) => t.annotations.readOnlyHint && !t.annotations.destructiveHint,
    ),
  );
  let detail;
  for (const [name, args] of [
    ["search_flows", { operation: "search", query: "membership" }],
    ["get_flow", { operation: "detail", flow: "tenant:login" }],
    ["get_impact_context", { operation: "impact", ids: ["src/check.js"] }],
  ]) {
    const request = { path: fixture.root, knowledge: "established", ...args },
      response = await http(request);
    assert.equal(response.status, 200);
    const { operation, ...arguments_ } = request,
      mcp = await client.callTool({ name, arguments: arguments_ });
    assert.equal(mcp.isError, undefined);
    assert.deepEqual(stable(response.body), stable(mcp.structuredContent));
    assert.deepEqual(JSON.parse(mcp.content[0].text), mcp.structuredContent);
    if (operation === "detail") detail = response.body;
  }
  const source = detail.data.sources.find((s) => s.path === "src/check.js"),
    request = {
      path: fixture.root,
      knowledge: "established",
      operation: "source",
      flow: "tenant:login",
      source: source.id,
      budget: 12,
    },
    response = await http(request),
    { operation, ...arguments_ } = request,
    mcp = await client.callTool({
      name: "read_flow_source",
      arguments: arguments_,
    });
  assert.deepEqual(stable(response.body), stable(mcp.structuredContent));
  assert.equal(response.body.data.text.length, 12);
  assert.ok(response.body.pagination.next);
  assert.deepEqual(await fingerprint(fixture.root), before);
});
test("adapters deny unsafe source IDs, invalid selectors and foreign origins", async (t) => {
  const { fixture, client, http } = await setup(t),
    body = {
      path: fixture.root,
      operation: "source",
      flow: "tenant:login",
      source: "/etc/passwd",
    };
  const forbiddenState=join(fixture.root,'.git','private-flow-state');
  assert.throws(()=>createFlowService({stateDir:forbiddenState}),/outside repositories/);
  assert.equal(existsSync(forbiddenState),false);
  assert.equal((await http(body)).status, 403);
  const { operation, ...arguments_ } = body,
    mcp = await client.callTool({
      name: "read_flow_source",
      arguments: arguments_,
    });
  assert.equal(mcp.isError, true);
  assert.equal(JSON.parse(mcp.content[0].text).status, 403);
  assert.equal(
    (await http({ path: "relative", operation: "search" })).status,
    422,
  );
  const invalid = await client.callTool({
    name: "search_flows",
    arguments: { path: "relative" },
  });
  assert.equal(JSON.parse(invalid.content[0].text).status, 422);
  assert.equal(
    (
      await http(
        { path: fixture.root, operation: "search" },
        { Origin: "https://foreign.invalid" },
      )
    ).status,
    403,
  );
  const strict = await client
    .callTool({
      name: "search_flows",
      arguments: { path: fixture.root, unrecognized: "selector" },
    })
    .catch((error) => ({ error }));
  assert.ok(strict.error || strict.isError);
});
test("source cursors reconstruct bounded content and reject changed context", async (t) => {
  const { fixture, http } = await setup(t),
    detail = await http({
      path: fixture.root,
      operation: "detail",
      flow: "tenant:login",
    }),
    source = detail.body.data.sources.find((s) => s.path === "src/check.js");
  let cursor,
    text = "";
  do {
    const result = await http({
      path: fixture.root,
      operation: "source",
      flow: "tenant:login",
      source: source.id,
      budget: 7,
      cursor,
    });
    assert.equal(result.status, 200);
    text += result.body.data.text;
    cursor = result.body.pagination.next;
  } while (cursor);
  assert.equal(text, "export const membership = true;\n");
  const page = await http({
    path: fixture.root,
    operation: "source",
    flow: "tenant:login",
    source: source.id,
    budget: 7,
  });
  await writeFile(
    join(fixture.root, "src/check.js"),
    "export const membership = false;\n",
  );
  assert.equal(
    (
      await http({
        path: fixture.root,
        operation: "source",
        flow: "tenant:login",
        source: source.id,
        budget: 7,
        cursor: page.body.pagination.next,
      })
    ).status,
    422,
  );
});
test("registered source observation detects repeated dirty edits and ignores unrelated bytes", async (t) => {
  const { fixture, service } = await setup(t);
  await service.query({
    path: fixture.root,
    operation: "detail",
    flow: "tenant:login",
  });
  const observe = async () =>
      registeredSourceFingerprint(
        fixture.root,
        await repositoryFingerprint(fixture.root),
        service.observedSources(fixture.root),
      ),
    start = await observe(),
    path = join(fixture.root, "src/check.js");
  await writeFile(path, 'export const membership = "first";\n');
  await utimes(path, 1, 1);
  const first = await observe();
  await writeFile(path, 'export const membership = "other";\n');
  await utimes(path, 1, 1);
  const second = await observe();
  assert.notEqual(start.fingerprint, first.fingerprint);
  assert.notEqual(first.fingerprint, second.fingerprint);
  await writeFile(join(fixture.root, "src/unrelated.js"), "unchanged");
  const unrelated = await observe();
  await writeFile(join(fixture.root, "src/unrelated.js"), "different");
  assert.equal((await observe()).fingerprint, unrelated.fingerprint);
  await rename(path, join(fixture.root, "src/renamed.js"));
  assert.notEqual((await observe()).fingerprint, second.fingerprint);
});
test("source observation rejects escaping symlinks and unregistered worktrees", async (t) => {
  const { fixture } = await setup(t),
    base = await repositoryFingerprint(fixture.root),
    outside = await mkdtemp(join(tmpdir(), "flow-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(join(outside, "private.js"), "secret one");
  await symlink(
    join(outside, "private.js"),
    join(fixture.root, "src/escape.js"),
  );
  git(fixture.root, "add", "src/escape.js");
  const sources = [
      { worktree: fixture.root, path: "src/escape.js", kind: "implementation" },
      { worktree: outside, path: "private.js", kind: "implementation" },
    ],
    before = await registeredSourceFingerprint(fixture.root, base, sources);
  await writeFile(join(outside, "private.js"), "secret two");
  assert.equal(
    (await registeredSourceFingerprint(fixture.root, base, sources))
      .fingerprint,
    before.fingerprint,
  );
});
test("service close drains accepted requests and rejects new requests", async (t) => {
  const { fixture, service } = await setup(t),
    accepted = service.query({
      path: fixture.root,
      operation: "search",
      query: "membership",
    }),
    closed = service.close();
  await assert.rejects(
    service.query({ path: fixture.root, operation: "search" }),
    (e) => e.status === 503,
  );
  assert.equal((await accepted).freshness, "fresh");
  await closed;
  await service.close();
});

test('real stdio client initializes, lists tools and reads only configured roots',async t=>{
 const fixture=await fixtureRepository(files()),other=await fixtureRepository(files()),stateDir=await mkdtemp(join(tmpdir(),'plane-flow-stdio-'));
 const before=await fingerprint(fixture.root),client=new Client({name:'stdio-test',version:'1'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../server/flow-mcp-stdio.js',import.meta.url)),'--repository',fixture.root,'--state-dir',stateDir],stderr:'pipe'});
 let stderr='';transport.stderr?.on('data',chunk=>stderr+=chunk);
 t.after(async()=>{await client.close();await fixture.cleanup();await other.cleanup();await rm(stateDir,{recursive:true,force:true});});
 await client.connect(transport);assert.equal((await client.listTools()).tools.length,12);
 const result=await client.callTool({name:'search_flows',arguments:{query:'membership'}});
 assert.equal(result.isError,undefined);assert.equal(result.structuredContent.data.flows.length,2);assert.equal(result.structuredContent.freshness,'fresh');
 assert.ok(result.structuredContent.diagnostics.some(d=>d.code==='flow-model-unavailable'));
 const denied=await client.callTool({name:'search_flows',arguments:{path:other.root}});assert.equal(denied.isError,true);assert.equal(JSON.parse(denied.content[0].text).status,403);
 assert.deepEqual(await fingerprint(fixture.root),before);assert.ok(!stderr.includes('SyntaxError'));
});

test('actual HTTP and MCP agree on complete named filtering and artifact participation', async t => {
  const input=files();
  const template=JSON.parse(input.get('docs/artifacts/tenant/versions/1.0.0/specifications/flows/login.md').split('---\n')[1]).flow;
  for(let i=0;i<25;i++) {
    const flow={...template,id:`lookup-${i}`,title:`Lookup ${i}`};
    input.set(`docs/artifacts/tenant/versions/1.0.0/specifications/flows/lookup-${i}.md`,'---\n'+JSON.stringify({flow})+'\n---\n# '+flow.title+'\n');
  }
  for(const [id,support] of [['participating',[{id:'rules',kind:'element',artifact:'authentication',element:'specifications/login.md',basis:'documented',requires:'Use referenced identity rules.'}]],['unrelated',[{id:'rules',kind:'implementation',path:'src/check.js',basis:'static',requires:'Unrelated code.'}]]]) {
    const flow={...template,id,artifact:'authentication',title:`Lookup ${id}`,support,steps:[{id:'check',title:'Check',supports:['rules']}]};
    input.set(`docs/artifacts/authentication/versions/1.0.0/specifications/flows/${id}.md`,'---\n'+JSON.stringify({flow})+'\n---\n# Flow\n');
  }
  let calls=0;
  const {fixture,http,client}=await setup(t,input,{signature:'adapter-spy',embed:async texts=>{calls++;return texts.map(()=>[1,0]);}});
  const before=await fingerprint(fixture.root);
  async function parity(args, expectedStatus=200){
    const request={path:fixture.root,knowledge:'established',...args};
    const response=await http(request);
    assert.equal(response.status,expectedStatus);
    const {operation,...arguments_}=request;
    const tool=operation==='impact'?'get_impact_context':'search_flows';
    const mcp=await client.callTool({name:tool,arguments:arguments_});
    if(expectedStatus===200){assert.equal(mcp.isError,undefined);assert.deepEqual(stable(response.body),stable(mcp.structuredContent));return response.body;}
    assert.equal(mcp.isError,true);
    assert.equal(JSON.parse(mcp.content[0].text).status,expectedStatus);
  }
  const request={operation:'search',match:'title',artifact:'tenant',query:' Lookup ',limit:20};
  const first=await parity(request);assert.equal(first.data.total,26);assert.equal(first.data.flows.length,20);
  assert.ok(first.data.artifactOptions.some(a=>a.id==='initial'&&a.title==='Initial'));
  const second=await parity({...request,cursor:first.data.next});assert.equal(second.data.flows.length,6);
  assert.ok([...first.data.flows,...second.data.flows].some(f=>f.logicalId==='authentication:participating'));
  assert.ok(![...first.data.flows,...second.data.flows].some(f=>f.logicalId==='authentication:unrelated'));
  const title=await parity({...request,query:'  LOOKUP 24  '});assert.deepEqual(title.data.flows.map(f=>f.logicalId),['tenant:lookup-24']);
  assert.equal((await parity({...request,query:'unrelated'})).data.total,0);
  assert.equal((await parity({...request,artifact:'initial'})).data.total,0);
  await parity({...request,artifact:'missing'},422);
  await parity({...request,artifact:'authentication',cursor:first.data.next},422);
  assert.equal(calls,0,'title requests must not execute embedding inference');
  await parity({...request,match:'discovery',cursor:first.data.next},422);
  const discovery=await parity({...request,match:'discovery',query:'membership'});
  assert.equal(discovery.data.total,28);assert.ok(!discovery.data.flows.some(f=>f.logicalId==='authentication:unrelated'));
  const impact=await parity({operation:'impact',ids:['docs/artifacts/tenant/versions/1.0.0/specifications/identity.md'],artifact:'tenant',limit:100});
  assert.ok(impact.data.flows.some(f=>f.logicalId==='authentication:participating'));
  assert.deepEqual(await fingerprint(fixture.root),before);
  assert.equal((await http({...request,path:fixture.root,operation:'impact',ids:['artifact:tenant']})).status,422);
  assert.equal((await http({...request,path:fixture.root,match:'unknown'})).status,422);
  const invalid=await client.callTool({name:'get_flow',arguments:{flow:'tenant:login',artifact:'tenant'}});assert.equal(invalid.isError,true);
});

// In-place layout: established flows come from the protected tree, planning
// flows from the working tree, with the same facts over HTTP and MCP.
import {inPlaceFixture} from "./fixtures.js";
test("L2/L7: in-place established and planning flows have HTTP and MCP parity", async (t) => {
  const input = inPlaceFixture();
  input.set("src/check.js", "export const membership = true;\n");
  const flow = (title) => "---\n" + JSON.stringify({flow: {id: "login", artifact: "tenant", title, trigger: "Begin.", outcome: "Done.", entry_steps: ["check"], steps: [{id: "check", title: "Check", supports: ["identity"]}], transitions: [], support: [{id: "identity", kind: "element", artifact: "tenant", element: "specifications/identity.md", requires: "Identity rules.", basis: "documented"}]}}) + "\n---\n# Flow\n";
  input.set("docs/artifacts/tenant/specifications/flows/login.md", flow("Established login"));
  const { fixture, client, http } = await setup(t, input);
  git(fixture.root, "checkout", "-q", "-b", "change-next");
  await writeFile(join(fixture.root, "docs/artifacts/tenant/specifications/flows/login.md"), flow("Proposed login"));
  await writeFile(join(fixture.root, "docs/artifacts/tenant/specifications/identity.md"), "# Identity\n\nChanged rules.\n");
  const before = await fingerprint(fixture.root);
  const titles = {};
  for (const knowledge of ["established", "planning"]) {
    const request = { path: fixture.root, knowledge, operation: "search", match: "title", artifact: "tenant", limit: 20 };
    const response = await http(request), { operation, ...args } = request;
    const mcp = await client.callTool({ name: "search_flows", arguments: args });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.deepEqual(stable(response.body), stable(mcp.structuredContent));
    titles[knowledge] = response.body.data.flows.map((f) => f.title);
    const detail = await http({ path: fixture.root, knowledge, operation: "detail", flow: response.body.data.flows[0].id });
    const support = detail.body.data.flow.support[0];
    assert.equal(support.resolved, true);
    if (knowledge === "planning") assert.equal(support.targetLabel, "proposed");
  }
  assert.deepEqual(titles, { established: ["Established login"], planning: ["Proposed login"] });
  assert.deepEqual(await fingerprint(fixture.root), before);
});

// Model-aware flows: graph, detail and impact parity, invalidation on model
// definition edits, and worktree isolation of concrete model identity.
test("P4/P5: model detail, known participation and impact have HTTP and MCP parity and refresh per worktree", async (t) => {
  const input = inPlaceFixture();
  input.set("src/check.js", "export const membership = true;\n");
  const models = (title) => "---\nmodels:\n  - id: member\n    title: " + title + "\n    description: The member who signs in.\n    sources: [specifications/identity.md]\n---\n# Models\n";
  const flow = (id) => "---\n" + JSON.stringify({flow: {id, artifact: "tenant", title: "Flow " + id, trigger: "Begin.", outcome: "Done.", entry_steps: ["check"], steps: [{id: "check", title: "Check", supports: ["identity"], interactions: [{from: "member", to: "member", action: "Check membership", outcome: "Checked.", supports: ["identity"]}]}], transitions: [], support: [{id: "identity", kind: "element", artifact: "tenant", element: "specifications/identity.md", requires: "Identity rules.", basis: "documented"}], participants: [{id: "member", artifact: "tenant", model: "member", requires: "Signs in."}]}}) + "\n---\n# Flow\n";
  input.set("docs/artifacts/tenant/specifications/domain-model.md", models("Member"));
  input.set("docs/artifacts/tenant/specifications/flows/login.md", flow("login"));
  input.set("docs/artifacts/tenant/specifications/flows/report.md", flow("report"));
  const { fixture, client, http } = await setup(t, input);
  const before = await fingerprint(fixture.root);
  const parity = async (args, tool) => {
    const request = { path: fixture.root, knowledge: "planning", ...args };
    const response = await http(request), { operation, ...rest } = request;
    const mcp = await client.callTool({ name: tool, arguments: rest });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.deepEqual(stable(response.body), stable(mcp.structuredContent));
    return response.body;
  };
  const list = await parity({ operation: "search", match: "title", artifact: "tenant", limit: 20 }, "search_flows");
  const login = list.data.flows.find((f) => f.logicalId === "tenant:login");
  const detail = await parity({ operation: "detail", flow: login.id }, "get_flow");
  const [model] = detail.data.models;
  assert.equal(model.logicalId, "tenant:member");
  assert.equal(model.title, "Member");
  assert.deepEqual(model.knownFlows.map((f) => f.logicalId), ["tenant:report"]);
  assert.ok(detail.data.graph.nodes.some((n) => n.kind === "model"));
  assert.ok(detail.data.graph.edges.some((e) => e.kind === "interaction" && e.action === "Check membership"));
  assert.ok(detail.data.sources.some((s) => s.path === "docs/artifacts/tenant/specifications/domain-model.md"));
  const impact = await parity({ operation: "impact", ids: ["tenant:member"], limit: 100 }, "get_impact_context");
  assert.deepEqual(impact.data.flows.map((f) => f.logicalId).sort(), ["tenant:login", "tenant:report"]);
  // A model definition edit invalidates the index for this worktree only.
  const other = join(fixture.root, "..", "plane-model-worktree-" + Date.now());
  git(fixture.root, "worktree", "add", "-q", "-b", "model-edit", other);
  t.after(() => rm(other, { recursive: true, force: true }));
  await writeFile(join(other, "docs/artifacts/tenant/specifications/domain-model.md"), models("Edited member"));
  const otherList = await http({ path: fixture.root, worktree: other, knowledge: "planning", operation: "search", match: "title", artifact: "tenant", limit: 20 });
  const otherDetail = await http({ path: fixture.root, worktree: other, knowledge: "planning", operation: "detail", flow: otherList.body.data.flows.find((f) => f.logicalId === "tenant:login").id });
  assert.equal(otherDetail.body.data.models[0].title, "Edited member");
  const again = await http({ path: fixture.root, knowledge: "planning", operation: "detail", flow: login.id });
  assert.equal(again.body.data.models[0].title, "Member");
  await writeFile(join(fixture.root, "docs/artifacts/tenant/specifications/domain-model.md"), models("Renamed member"));
  const refreshed = await http({ path: fixture.root, knowledge: "planning", operation: "detail", flow: login.id });
  assert.equal(refreshed.status, 200, JSON.stringify(refreshed.body));
  assert.equal(refreshed.body.data.models[0].title, "Renamed member");
  assert.notEqual(refreshed.body.revision, detail.revision);
  await writeFile(join(fixture.root, "docs/artifacts/tenant/specifications/domain-model.md"), models("Member"));
  // Reads never write: only the test's own edits and its worktree registration changed.
  const files = (value) => Object.fromEntries(Object.entries(value).filter(([path]) => !path.startsWith(".git/")));
  assert.deepEqual(files(await fingerprint(fixture.root)), files(before));
});
