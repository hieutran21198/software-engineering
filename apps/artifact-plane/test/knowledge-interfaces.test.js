import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createAppServer} from '../server/http.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {fixtureRepository, inPlaceFixture, fingerprint, git} from './fixtures.js';

async function server(t) {
  const app = createAppServer();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  return (route, body, headers = {}) => fetch(`${base}${route}`, {method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
}
async function mcp(t, options) {
  const app = createFlowMcpServer(options), client = new Client({name: 'edit-test', version: '1'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await app.server.connect(b);await client.connect(a);
  t.after(() => app.close());
  return client;
}
const addRequirement = {operation: 'document.add', input: {artifact: 'tenant', kind: 'requirement', title: 'Tenant naming'}};

test('W8: edit routes keep the local origin rules, a 2 MiB limit and mapped error bodies', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const post = await server(t);
  assert.equal((await post('/api/knowledge/edit', {path: f.root, ...addRequirement}, {Origin: 'https://foreign.example'})).status, 403);
  assert.equal((await post('/api/knowledge/edit', '{}', {'Content-Type': 'text/plain'})).status, 415);
  assert.equal((await post('/api/knowledge/edit', '{')).status, 400);
  assert.equal((await post('/api/knowledge/edit', 'x'.repeat(2 * 1024 * 1024 + 10))).status, 413);
  // A request above the read-route limit but within 2 MiB reaches the service.
  const large = await post('/api/knowledge/edit', {path: f.root, operation: 'document.save', input: {path: 'docs/artifacts/tenant/specifications/identity.md', body: 'x'.repeat(100000)}});
  assert.equal(large.status, 403);
  const protectedBody = await large.json();
  assert.equal(protectedBody.code, 'protected-branch');
  assert.equal(protectedBody.action, 'branch.create');
  assert.equal((await post('/api/knowledge/edit', {path: f.root, operation: 'nope'})).status, 400);
  assert.equal((await post('/api/knowledge/edit', {path: '/no/such/repository', ...addRequirement})).status, 404);
  const branch = await post('/api/knowledge/git', {path: f.root, operation: 'branch.create', input: {name: 'work'}});
  assert.equal(branch.status, 200);
  assert.equal((await branch.json()).status.branch, 'work');
  const preview = await (await post('/api/knowledge/edit', {path: f.root, operation: 'document.save', input: {path: 'docs/artifacts/tenant/specifications/identity.md', body: '# Identity\n\nChanged.\n'}, dryRun: true})).json();
  const conflict = await post('/api/knowledge/edit', {path: f.root, operation: 'document.save', input: {path: 'docs/artifacts/tenant/specifications/identity.md', body: '# X\n'}, expected: {'docs/artifacts/tenant/specifications/identity.md': '0'.repeat(64)}});
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).current['docs/artifacts/tenant/specifications/identity.md'], '# Identity\n\nStable identity rules.\n');
  const invalid = await post('/api/knowledge/edit', {path: f.root, operation: 'artifact.dependencies.set', input: {artifact: 'tenant', dependsOn: ['authentication']}});
  assert.equal(invalid.status, 422);
  assert.ok((await invalid.json()).diagnostics.some(d => d.code === 'cycle'));
  const applied = await post('/api/knowledge/edit', {path: f.root, operation: 'document.save', input: {path: 'docs/artifacts/tenant/specifications/identity.md', body: '# Identity\n\nChanged.\n'}, expected: preview.expected});
  assert.equal(applied.status, 200);
  const body = await applied.json();
  assert.equal(body.applied, true);
  assert.match(body.operationId, /^op-/);
  assert.deepEqual(body.status.knowledge, [{status: ' M', path: 'docs/artifacts/tenant/specifications/identity.md'}]);
  assert.equal((await post('/api/explore', 'x'.repeat(17000))).status, 413);
});

test('W8: MCP write tools exist only with --allow-writes and match the HTTP result', async t => {
  const a = await fixtureRepository(inPlaceFixture()), b = await fixtureRepository(inPlaceFixture());
  t.after(a.cleanup);t.after(b.cleanup);
  for (const f of [a, b]) git(f.root, 'switch', '-q', '-c', 'work');
  const readOnly = await mcp(t, {roots: [a.root]});
  const names = (await readOnly.listTools()).tools.map(tool => tool.name);
  assert.ok(!names.includes('apply_knowledge_operation') && !names.includes('preview_knowledge_operation'));
  const refused = await readOnly.callTool({name: 'apply_knowledge_operation', arguments: addRequirement}).catch(error => ({isError: true, error}));
  assert.equal(refused.isError, true);
  const before = await fingerprint(a.root);

  const client = await mcp(t, {roots: [a.root], allowWrites: true});
  const tools = (await client.listTools()).tools;
  const apply = tools.find(tool => tool.name === 'apply_knowledge_operation');
  assert.deepEqual(apply.annotations, {readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false});
  const preview = await client.callTool({name: 'preview_knowledge_operation', arguments: addRequirement});
  assert.equal(preview.structuredContent.applied, false);
  assert.deepEqual(await fingerprint(a.root), before);
  const outside = await client.callTool({name: 'apply_knowledge_operation', arguments: {path: b.root, ...addRequirement}});
  assert.equal(outside.isError, true);
  assert.equal(JSON.parse(outside.content[0].text).status, 403);
  const viaMcp = await client.callTool({name: 'apply_knowledge_operation', arguments: addRequirement});
  assert.equal(viaMcp.isError, undefined);

  const post = await server(t);
  const viaHttp = await (await post('/api/knowledge/edit', {path: b.root, ...addRequirement})).json();
  const path = 'docs/artifacts/tenant/requirements/tenant-naming.md';
  assert.equal(await readFile(join(a.root, path), 'utf8'), await readFile(join(b.root, path), 'utf8'));
  const shape = response => ({operation: response.operation, applied: response.applied, result: response.result, files: response.files.map(({path, action, after}) => ({path, action, after})), diagnostics: response.diagnostics});
  assert.deepEqual(shape(viaMcp.structuredContent), shape(viaHttp));
});

test('B7: the browser route records a person and MCP records an agent; no request chooses the channel', async t => {
  const a = await fixtureRepository(inPlaceFixture()), b = await fixtureRepository(inPlaceFixture());
  t.after(a.cleanup);t.after(b.cleanup);
  for (const f of [a, b]) git(f.root, 'switch', '-q', '-c', 'work');
  const spec = 'docs/artifacts/tenant/specifications/identity.md';
  const record = {operation: 'claim.record', input: {path: spec, id: 'stable-ids', kind: 'assumption', statement: 'Tenant IDs never change.', basis: 'inferred', check: 'Rename a tenant and compare its ID.'}};
  const verify = {operation: 'claim.verify', input: {path: spec, id: 'stable-ids', ran: 'Renamed a tenant.', observed: 'The ID stayed the same.', outcome: 'holds'}};
  const post = await server(t);
  const http = async request => {const preview = await (await post('/api/knowledge/edit', {...request, dryRun: true})).json();return post('/api/knowledge/edit', {...request, expected: preview.expected});};
  assert.equal((await http({path: a.root, ...record})).status, 200);
  const viaHttp = await (await http({path: a.root, ...verify})).json();
  assert.equal(viaHttp.result.verifiedBy, 'person');
  assert.match(await readFile(join(a.root, spec), 'utf8'), /verified_by: person\n/);
  const chosen = await post('/api/knowledge/edit', {path: a.root, ...verify, channel: 'agent'});
  assert.equal(chosen.status, 400);

  const client = await mcp(t, {roots: [b.root], allowWrites: true});
  const tool = async request => {const preview = await client.callTool({name: 'preview_knowledge_operation', arguments: request});return client.callTool({name: 'apply_knowledge_operation', arguments: {...request, expected: preview.structuredContent.expected}});};
  assert.equal((await tool(record)).isError, undefined);
  const viaMcp = await tool(verify);
  assert.equal(viaMcp.structuredContent.result.verifiedBy, 'agent');
  assert.match(await readFile(join(b.root, spec), 'utf8'), /verified_by: agent\n/);
  const refused = await client.callTool({name: 'apply_knowledge_operation', arguments: {...verify, channel: 'person'}}).catch(error => ({isError: true, error}));
  assert.equal(refused.isError, true);
});
