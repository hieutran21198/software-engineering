// MCP tools of an agent session (artifact-plane specifications/agent-integration.md:
// MCP, Validation; requirements AI8, AI9, AIA5).
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, realpath} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import pkg from '../package.json' with {type: 'json'};
import {fixtureRepository, inPlaceFixture, git} from './fixtures.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {worktreeStatus} from '../server/agent-guidance.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';

const app = fileURLToPath(new URL('../server/app.js', import.meta.url));
const INSTRUCTIONS = `Artifact Plane reads ADD knowledge and Git. It never approves, pushes, merges or establishes versions.
Resume or start: get_change_status. Discover flows and specifications: search_flows, get_flow, read_flow_source.
Specification and Plan: get_impact_context, get_change_impact. Review and context: get_change_review, get_change_context, read_change_context_source.
Before a self-check or the PR: check_records, get_change_brief, get_change_description.`;
const READ_ONLY = {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false};
const temporary = async t => {const dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-agent-mcp-')));t.after(() => rm(dir, {recursive: true, force: true}));return dir;};
// The change status fixture on a change branch, with a linked worktree.
async function fixture(t) {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const root = await realpath(f.root), other = join(await temporary(t), 'other');
  git(root, 'checkout', '-q', '-b', 'change-login');
  git(root, 'worktree', 'add', '-q', '-b', 'change-other', other);
  return {root, other};
}
async function memoryClient(t, options) {
  const server = createFlowMcpServer(options), client = new Client({name: 'agent-mcp-test', version: '1'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.server.connect(a);await client.connect(b);
  t.after(async () => {await client.close();await server.close();});
  return client;
}
const error = result => {assert.equal(result.isError, true);return JSON.parse(result.content[0].text);};

test('AIA5: an MCP client lists the new read-only tools and receives the instructions and the package version', async t => {
  const {root} = await fixture(t);
  const client = await memoryClient(t, {roots: [root]});
  const tools = (await client.listTools()).tools;
  for (const name of ['get_change_status', 'check_records']) assert.deepEqual(tools.find(tool => tool.name === name)?.annotations, READ_ONLY, name);
  assert.ok(tools.every(tool => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint));
  assert.equal(client.getInstructions(), INSTRUCTIONS);
  assert.deepEqual(client.getServerVersion(), {name: 'artifact-plane-flows', version: pkg.version});
});

test('AI8: get_change_status equals worktreeStatus and check_records equals validateKnowledge for one change', async t => {
  const {root, other} = await fixture(t);
  const client = await memoryClient(t, {roots: [root]});
  const status = await client.callTool({name: 'get_change_status', arguments: {}});
  const expected = await worktreeStatus(root);
  assert.ok(expected.changes.some(c => c.change === 'change-login'));
  assert.deepEqual(status.structuredContent, expected);
  assert.deepEqual(JSON.parse(status.content[0].text), expected);
  const linked = await client.callTool({name: 'get_change_status', arguments: {path: root, worktree: other}});
  assert.deepEqual(linked.structuredContent, await worktreeStatus(other));
  assert.equal(linked.structuredContent.repository, root);
  assert.equal(error(await client.callTool({name: 'get_change_status', arguments: {worktree: await temporary(t)}})).status, 422);
  assert.equal(error(await client.callTool({name: 'get_change_status', arguments: {path: other}})).status, 403);
  assert.equal(error(await client.callTool({name: 'get_change_status', arguments: {worktree: 'relative'}})).status, 400);

  const checked = await client.callTool({name: 'check_records', arguments: {change: 'authentication/change-login'}});
  const result = await validateKnowledge(root, {change: 'authentication/change-login'});
  assert.equal(result.schema, 'add-validate.result.v1');assert.equal(result.scope, 'authentication/change-login');
  assert.deepEqual(checked.structuredContent, result);
  assert.deepEqual(JSON.parse(checked.content[0].text), result);
  assert.deepEqual((await client.callTool({name: 'check_records', arguments: {path: root}})).structuredContent, await validateKnowledge(root));
  const linkedCheck = await client.callTool({name: 'check_records', arguments: {path: root, worktree: other, change: 'authentication/change-login'}});
  const linkedResult = await validateKnowledge(other, {change: 'authentication/change-login'});
  assert.equal(linkedResult.repository, other);
  assert.deepEqual(linkedCheck.structuredContent, linkedResult);
  assert.equal(error(await client.callTool({name: 'check_records', arguments: {worktree: await temporary(t)}})).status, 422);
  assert.deepEqual(error(await client.callTool({name: 'check_records', arguments: {change: 'authentication/change-missing'}})), {error: 'authentication/change-missing has no change record.', status: 400});
  assert.equal(error(await client.callTool({name: 'check_records', arguments: {path: other}})).status, 403);
});

test('AI9: without --repository the server uses the Git top level of its working directory', async t => {
  const {root} = await fixture(t), stateDir = await temporary(t);
  const client = new Client({name: 'agent-mcp-stdio', version: '1'});
  const transport = new StdioClientTransport({command: process.execPath, args: [app, 'mcp', '--state-dir', stateDir], cwd: join(root, 'docs/artifacts'), stderr: 'pipe'});
  t.after(() => client.close());
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, pkg.version);
  const status = await client.callTool({name: 'get_change_status', arguments: {}});
  assert.equal(status.structuredContent.worktree, root);
  assert.deepEqual(status.structuredContent, await worktreeStatus(root));
  const search = await client.callTool({name: 'search_flows', arguments: {}});
  assert.equal(search.isError, undefined);
});

test('AI9: outside a Git work tree the server fails with the usage error', async t => {
  const dir = await temporary(t);
  const result = spawnSync(process.execPath, [app, 'mcp'], {cwd: dir, encoding: 'utf8', input: '', env: {...process.env, GIT_CEILING_DIRECTORIES: dirname(dir)}});
  assert.equal(result.status, 1);
  assert.equal(result.stderr.trim(), 'Configure at least one --repository root.');
  assert.equal(result.stdout, '');
});
