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
import { tmpdir } from "node:os";
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
async function setup(t) {
  const fixture = await fixtureRepository(files()),
    stateDir = await mkdtemp(join(tmpdir(), "plane-flow-adapter-"));
  const service = createFlowService({
    stateDir,
    roots: [fixture.root],
    embedder: {
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
    "get_flow",
    "get_impact_context",
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
