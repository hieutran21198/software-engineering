import test from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { createAppServer } from "../server/http.js";
import { fixtureRepository } from "./fixtures.js";

test("local API response contract and validation reject hostile or malformed requests", async (t) => {
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (body, headers = {}) =>
    fetch(`${base}/api/explore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
  const response = await request(JSON.stringify({ path: fixture.root }));
  assert.equal(response.status, 200);
  const view = await response.json();
  assert.deepEqual(Object.keys(view).sort(), [
    "artifacts",
    "diagnostics",
    "edges",
    "references",
    "repository",
    "unitsOfWork",
    "workflow",
  ]);
  assert.equal(view.repository.path, fixture.root);
  assert.equal(view.artifacts.length, 3);
  assert.equal((await request("{")).status, 400);
  assert.equal((await request("{}")).status, 400);
  assert.equal(
    (await request("{}", { Origin: "https://foreign.example" })).status,
    403,
  );
  const hostileHost = await new Promise((resolve) => {
    const req = httpRequest(
      `${base}/api/explore`,
      {
        method: "POST",
        headers: {
          Host: "foreign.example",
          "Content-Type": "application/json",
        },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.end("{}");
  });
  assert.equal(hostileHost, 403);
  assert.equal(
    (await request("{}", { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal((await request("x".repeat(17000))).status, 413);
  assert.equal((await fetch(`${base}/api/explore`)).status, 405);
  assert.equal((await fetch(`${base}/server/reader.js`)).status, 404);
});

// Impact route, MCP tool and delegated flow impact share one impact service.
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {InMemoryTransport} from "@modelcontextprotocol/sdk/inMemory.js";
import {createFlowMcpServer} from "../server/flow-mcp.js";
import {createFlowService} from "../server/flow-index.js";
import {createImpactService} from "../server/impact.js";
import {impactRepository} from "./impact-fixtures.js";
async function impactSetup(t) {
  const repo = await impactRepository();
  let flowService;
  const impactService = createImpactService({stateDir: repo.stateDir, roots: [repo.root], loader: (path, settings) => flowService.load(path, settings)});
  flowService = createFlowService({stateDir: repo.stateDir, roots: [repo.root], impactService, embedder: {signature: "stub", embed: async texts => texts.map(() => [1, 0])}});
  const server = createAppServer({impactService, flowService, flowRoots: [repo.root]});
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const app = createFlowMcpServer({service: flowService, impactService, roots: [repo.root]});
  const client = new Client({name: "impact-test", version: "1"});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await app.server.connect(b);await client.connect(a);
  t.after(async () => {await client.close();server.closeAllConnections();await new Promise(resolve => server.close(resolve));await flowService.close();await impactService.close();await repo.cleanup();});
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (route, body) => {const response = await fetch(base + route, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});return {status: response.status, body: await response.json()};};
  return {repo, client, post, flowService};
}
const withoutTiming = result => {const copy = JSON.parse(JSON.stringify(result));delete copy.metrics;return copy;};

test("impact route validates fields and returns the envelope", async t => {
  const {repo, post} = await impactSetup(t);
  const origins = [{path: "docs/artifacts/a/specifications/contract.md"}];
  assert.equal((await post("/api/impact/query", {path: repo.root, origins, extra: 1})).status, 400);
  assert.equal((await post("/api/impact/query", {path: repo.root})).status, 422);
  assert.equal((await post("/api/impact/query", {path: repo.root, origins, commit: "HEAD"})).status, 422);
  assert.equal((await post("/api/impact/query", {path: repo.root, origins, depth: 5})).status, 422);
  assert.equal((await post("/api/impact/query", {path: repo.root, origins, worktree: repo.stateDir})).status, 422);
  assert.equal((await post("/api/impact/query", {path: repo.root, origins, knowledge: "other"})).status, 422);
  const {status, body} = await post("/api/impact/query", {path: repo.root, origins});
  assert.equal(status, 200);
  for (const key of ["repository", "worktree", "context", "revision", "generation", "freshness", "completeness", "data", "diagnostics", "omissions"]) assert.ok(key in body, key);
  assert.ok(body.data.direct.some(i => i.entity === "flow:a:login"));
  assert.ok(body.data.direct.some(i => i.entity === "docs/artifacts/b/specifications/consumer.md" && i.paths[0][0].via === "references"));
  assert.equal(body.context.knowledge, "planning");
  assert.ok(body.data.coverage.not_analyzed.length);
});

test("get_change_impact returns the same facts as the route and the compact text", async t => {
  const {repo, client, post} = await impactSetup(t);
  const request = {path: repo.root, origins: [{path: "src/check.js", symbols: ["check"]}], format: "json"};
  const http = await post("/api/impact/query", request);
  const mcp = await client.callTool({name: "get_change_impact", arguments: request});
  assert.equal(mcp.isError, undefined);
  assert.deepEqual(withoutTiming(mcp.structuredContent), withoutTiming(http.body));
  const tool = (await client.listTools()).tools.find(t => t.name === "get_change_impact");
  assert.deepEqual(tool.annotations, {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false});
  const text = await client.callTool({name: "get_change_impact", arguments: {...request, format: undefined, budget: 400}});
  assert.ok(text.content[0].text.startsWith("Changed: src/check.js"));
  assert.ok(text.content[0].text.length <= 400);
  const invalid = await client.callTool({name: "get_change_impact", arguments: {path: repo.root}});
  assert.equal(invalid.isError, true);assert.equal(JSON.parse(invalid.content[0].text).status, 422);
});

test("the flow impact operation delegates and keeps its shape, ordering and knowledge selector", async t => {
  const {repo, client, post, flowService} = await impactSetup(t);
  const contract = "docs/artifacts/a/specifications/contract.md";
  // The impact service and the flow query share one fingerprint-cached repository read.
  assert.equal(await flowService.load(repo.root), await flowService.load(repo.root + "/", {knowledge: "planning"}));
  const {status, body} = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: [contract, "missing/file.js"], limit: 1});
  assert.equal(status, 200);
  assert.equal(body.data.total, 2);assert.equal(body.data.flows.length, 1);
  const rest = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: [contract, "missing/file.js"], limit: 1, cursor: body.data.next});
  const flows = [...body.data.flows, ...rest.body.data.flows];
  assert.deepEqual(flows.map(f => f.logicalId).sort(), ["a:login", "b:report"]);
  const login = flows.find(f => f.logicalId === "a:login");
  assert.equal(login.paths[0].target, contract);assert.equal(login.paths[0].kind, "supports");assert.equal(login.paths[0].reason, "Define the identity rules.");
  assert.ok(flows.every(f => f.id && f.title && "createdAt" in f));
  assert.deepEqual(body.data.unresolved, ["missing/file.js"]);
  assert.ok(body.diagnostics.some(d => d.code === "unresolved-impact-selector"));
  assert.ok(body.data.artifactOptions.some(a => a.id === "a"));
  const flowSeed = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: ["a:login"], limit: 100});
  assert.deepEqual(flowSeed.body.data.flows.map(f => f.logicalId).sort(), ["a:login", "b:report"]);
  const scoped = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: [contract], artifact: "b", limit: 100});
  assert.deepEqual(scoped.body.data.flows.map(f => f.logicalId), ["b:report"]);
  const established = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: [contract], knowledge: "established", limit: 100});
  assert.equal(established.status, 200);
  const mcp = await client.callTool({name: "get_impact_context", arguments: {path: repo.root, ids: [contract], limit: 100}});
  const http = await post("/api/flows/query", {path: repo.root, operation: "impact", ids: [contract], limit: 100});
  assert.deepEqual(withoutTiming(mcp.structuredContent), withoutTiming(http.body));
});
