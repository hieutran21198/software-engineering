import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {fixtureRepository, inPlaceFixture, fingerprint, git, versionRecord} from './fixtures.js';
import {createKnowledgeService} from '../server/knowledge-operations.js';
import {createAppServer} from '../server/http.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';
import {scanRepository, git as runGit} from '../server/reader.js';
import {recordChecks} from '../server/record-checks.js';
import {taskCovers} from '../src/delivery-records.js';

const REQUIREMENT = 'docs/artifacts/tenant/requirements/naming.md';
const CHANGE = 'docs/artifacts/tenant/changes/';
function files(extra = []) {
  const result = inPlaceFixture();
  result.set(REQUIREMENT, '# Tenant naming\n\n## Acceptance criteria\n\n- R1: A tenant has a name.\n- R2: Tenant names are unique.\n');
  for (const [path, body] of extra) result.set(path, body);
  return result;
}
async function editable(t, extra) {
  const fixture = await fixtureRepository(files(extra));
  t.after(fixture.cleanup);
  git(fixture.root, 'switch', '-q', '-c', 'work');
  return fixture;
}
// Preview, then apply with the previewed digests; the applied files are exactly the listed files.
function operator(root, service = createKnowledgeService()) {
  const run = async (operation, input) => {
    const preview = await service.apply({path: root, operation, input, dryRun: true});
    const before = await fingerprint(root);
    const applied = await service.apply({path: root, operation, input, expected: preview.expected});
    const after = await fingerprint(root);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).sort();
    assert.deepEqual(changed, applied.files.map(x => x.path).sort(), operation);
    assert.deepEqual(applied.files.map(x => x.after), preview.files.map(x => x.after));
    return applied;
  };
  run.service = service;
  return run;
}
const read = (root, path) => readFile(join(root, path), 'utf8');
const actions = response => response.files.map(x => [x.action, x.path]).sort((a, b) => a[1].localeCompare(b[1]));
const put = async (root, path, body) => {await mkdir(dirname(join(root, path)), {recursive: true});await writeFile(join(root, path), body);};
const commit = (root, message) => {git(root, 'add', 'docs');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
const errors = async root => (await validateKnowledge(root)).diagnostics.filter(d => d.severity === 'error');
async function sharedErrors(root, scope) {
  const scan = await scanRepository(root);
  return (await recordChecks({root, scan, git: runGit, scope})).filter(d => d.severity === 'error');
}
const covers = ids => [{element: 'requirements/naming.md', ids}];
const smallInput = {artifact: 'tenant', title: 'Keep tenant names', reason: 'Tenant names were lost after a restart.', tier: 'small', compatibility: 'patch',
  plan: 'One task delivers and validates the outcome. It covers R1 in requirements/naming.md. Compatibility: patch.',
  tasks: [{title: 'Persist names', covers: covers(['R1']), dod: ['A tenant name survives a restart.']}]};

test('PA2: change.scaffold for a small change writes at most 7 files that pass the shared checks, and one undo restores them', async t => {
  const f = await editable(t), run = operator(f.root), before = await fingerprint(f.root);
  const small = await run('change.scaffold', smallInput);
  const prefix = `${CHANGE}change-keep-tenant-names/`;
  assert.ok(small.files.length <= 7);
  assert.deepEqual(actions(small), [['create', `${prefix}README.md`], ['create', `${prefix}tasks/01-persist-names.md`], ['create', `${prefix}tasks/README.md`]]);
  assert.deepEqual(small.result, {artifact: 'tenant', change: 'change-keep-tenant-names', tasks: [{task: 'persist-names', path: `${prefix}tasks/01-persist-names.md`}]});
  const readme = await read(f.root, `${prefix}README.md`), plan = await read(f.root, `${prefix}tasks/README.md`), task = await read(f.root, `${prefix}tasks/01-persist-names.md`);
  assert.match(readme, /^---\ntier: small\n---\n\n# Keep tenant names\n/);
  assert.match(readme, /## Plan\n\nOne task delivers and validates the outcome\. It covers R1/);
  assert.match(readme, /## Tier decisions\n/);
  assert.match(plan, /compatibility: patch\n/);
  assert.match(plan, /tasks:\n {2}- 01-persist-names\.md\n/);
  assert.doesNotMatch(plan, /approval/i);
  assert.deepEqual(taskCovers(task, `${prefix}tasks/01-persist-names.md`).covers, [{artifact: 'tenant', element: 'requirements/naming.md', ids: ['R1']}]);
  assert.doesNotMatch(task, /## Prerequisites|approv/i);
  assert.match(task, /depends_on: \[\]\n/);
  assert.match(task, /- \[ \] A tenant name survives a restart\./);
  assert.ok(!small.files.some(x => x.path.includes('units-of-work')));
  assert.deepEqual(await errors(f.root), []);
  assert.deepEqual(await sharedErrors(f.root, {artifact: 'tenant', change: 'change-keep-tenant-names'}), []);
  const scan = await scanRepository(f.root);
  const change = scan.snapshot.artifacts.find(a => a.id === 'tenant').changes.find(c => c.name === 'change-keep-tenant-names');
  assert.deepEqual({tier: change.tier, declared: change.tierDeclared, compatibility: change.compatibility}, {tier: 'small', declared: true, compatibility: 'patch'});

  await run('undo', {operationId: small.operationId});
  assert.deepEqual(await fingerprint(f.root), before);
});

test('PA2: change.scaffold refuses a second small task, unknown covered IDs, invalid fields and a one-member brief that the configuration does not require', async t => {
  const f = await editable(t), run = operator(f.root), before = await fingerprint(f.root);
  const refuse = (input, check) => assert.rejects(run('change.scaffold', input), check);
  await refuse({...smallInput, tasks: [...smallInput.tasks, {title: 'Second'}]}, e => e.status === 422 && e.field === 'tasks');
  await refuse({...smallInput, tasks: [{title: 'Persist names', covers: covers(['R9'])}]}, e => e.status === 422 && e.code === 'validation-failed' && e.diagnostics.some(d => d.code === 'covers-unknown-id' && /R9/.test(d.message)));
  await refuse({...smallInput, tasks: [{title: 'Persist names', covers: [{element: 'requirements/missing.md', ids: ['R1']}]}]}, e => e.code === 'validation-failed' && e.diagnostics.some(d => d.code === 'covers-unknown-id'));
  await refuse({...smallInput, tasks: [{title: 'Persist names', covers: [{element: 'specifications/x.md', ids: ['R1']}]}]}, e => e.status === 422 && e.field === 'covers');
  await refuse({...smallInput, tasks: [{title: 'Persist names', extra: true}]}, e => e.field === 'tasks');
  await refuse({...smallInput, tier: 'tiny'}, e => e.field === 'tier');
  await refuse({...smallInput, compatibility: 'huge'}, e => e.field === 'compatibility');
  await refuse({...smallInput, unit: {title: 'Names'}}, e => e.field === 'unit');
  await refuse({...smallInput, tier: 'medium', tasks: []}, e => e.field === 'tasks');
  assert.deepEqual(await fingerprint(f.root), before);
});

test('PA2: change.scaffold for a medium change writes the existing set with a unit brief; one undo restores the pre-images', async t => {
  const f = await editable(t), run = operator(f.root), before = await fingerprint(f.root);
  const medium = await run('change.scaffold', {artifact: 'tenant', title: 'Tenant naming', reason: 'Tenants need names.', compatibility: 'minor', tasks: [
    {title: 'Store names', covers: covers(['R1', 'R2']), dod: ['Names are stored.', 'Duplicate names are refused.'], scope: 'server/names.js'},
    {title: 'Show names', prerequisites: ['store-names'], dod: ['The page shows the name.']},
  ]});
  const prefix = `${CHANGE}change-tenant-naming/`;
  assert.deepEqual(actions(medium), [`${prefix}README.md`, `${prefix}tasks/01-store-names.md`, `${prefix}tasks/02-show-names.md`, `${prefix}tasks/README.md`, 'docs/artifacts/units-of-work/tenant-naming/README.md'].map(p => ['create', p]));
  assert.equal(medium.result.unit, 'tenant-naming');
  assert.match(await read(f.root, `${prefix}README.md`), /^---\ntier: medium\n---\n/);
  const plan = await read(f.root, `${prefix}tasks/README.md`);
  assert.match(plan, /compatibility: minor\n/);
  assert.match(plan, /tasks:\n {2}- 01-store-names\.md\n {2}- 02-show-names\.md\n/);
  assert.match(plan, /## Approval and prerequisites/);
  assert.match(await read(f.root, `${prefix}tasks/02-show-names.md`), /depends_on: \[store-names\]\n/);
  assert.deepEqual(await errors(f.root), []);
  assert.deepEqual(await sharedErrors(f.root, {artifact: 'tenant', change: 'change-tenant-naming'}), []);
  await run('undo', {operationId: medium.operationId});
  assert.deepEqual(await fingerprint(f.root), before);
});

test('PA2: the configuration decides the unit brief of a one-member small change', async t => {
  const f = await editable(t, [['docs/artifacts/add.config.yaml', 'version: 1\nunit_brief:\n  required_for: [small, medium, large]\n']]);
  const small = await operator(f.root)('change.scaffold', smallInput);
  assert.equal(small.files.length, 4);
  assert.equal(small.result.unit, 'keep-tenant-names');
  assert.deepEqual(await errors(f.root), []);
});

test('PI3: task.add and task.update write covers; the task has no Prerequisites section; evidence.record omits the default source', async t => {
  const f = await editable(t), run = operator(f.root), change = {artifact: 'tenant', change: 'change-names'}, path = `${CHANGE}change-names/tasks/01-store-names.md`;
  const started = await run('change.start', {...change, title: 'Names', reason: 'Names.', tier: 'large', compatibility: 'major', plan: 'Two tasks store and show names.'});
  assert.deepEqual(started.files.map(x => x.path), [`${CHANGE}change-names/README.md`, `${CHANGE}change-names/tasks/README.md`]);
  assert.match(started.files[0].after, /^---\ntier: large\n---\n/);
  assert.match(started.files[1].after, /compatibility: major\n[\s\S]*# Names plan\n\nTwo tasks store and show names\.\n/);
  await assert.rejects(run('task.add', {...change, title: 'Store names', covers: [{element: 'requirements/naming.md', ids: ['r1']}]}), e => e.status === 422 && e.field === 'covers');
  await run('task.add', {...change, title: 'Store names', covers: covers(['R1']), dod: ['Stored.']});
  let task = await read(f.root, path);
  assert.deepEqual(taskCovers(task, path).covers, [{artifact: 'tenant', element: 'requirements/naming.md', ids: ['R1']}]);
  assert.doesNotMatch(task, /## Prerequisites|## Governing knowledge/);
  await run('task.update', {...change, id: 'store-names', covers: covers(['R1', 'R2'])});
  assert.deepEqual(taskCovers(await read(f.root, path), path).covers[0].ids, ['R1', 'R2']);
  await run('task.update', {...change, id: 'store-names', covers: []});
  assert.doesNotMatch(await read(f.root, path), /covers/);
  await run('evidence.record', {path, method: 'npm test', result: 'passed', detail: 'All 12 tests passed.'});
  task = await read(f.root, path);
  assert.match(task, /evidence_records:\n {2}- id: npm-test\n {4}method: npm test\n {4}result: passed\n---/);
  assert.match(task, /## Evidence\n\n### npm-test\n\nAll 12 tests passed\.\n/);
  assert.deepEqual(await errors(f.root), []);
  assert.deepEqual(await sharedErrors(f.root, change), []);
});

const prepare = {artifact: 'tenant', change: 'change-names', reason: 'Adds names.', summary: 'Tenants have names.', acknowledgeUnchecked: true};
async function namesChange(t, extra) {
  const f = await editable(t, extra), run = operator(f.root);
  await run('change.start', {artifact: 'tenant', title: 'Names', reason: 'Names.', compatibility: 'minor'});
  await run('task.add', {artifact: 'tenant', change: 'change-names', title: 'Store names', covers: covers(['R1']), dod: ['Stored.']});
  return {f, run};
}
const other = [
  ['docs/artifacts/tenant/versions/1.1.0/README.md', versionRecord('change-other')],
  ['docs/artifacts/tenant/changes/change-other/README.md', '# Other\n\nReason and scope.\n'],
  ['docs/artifacts/tenant/changes/change-other/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
];

test('PA3: version.prepare computes from the protected number after a parallel change took the next minor number and renames its own record', async t => {
  const {f, run} = await namesChange(t);
  const first = await run('version.prepare', prepare);
  assert.deepEqual({version: first.result.version, base: first.result.base, level: first.result.level}, {version: '1.1.0', base: '1.0.0', level: 'minor'});
  commit(f.root, 'names 1.1.0');
  // A parallel change takes 1.1.0 on the protected branch.
  git(f.root, 'switch', '-q', 'main');
  const readme = await read(f.root, 'docs/artifacts/tenant/README.md');
  await put(f.root, 'docs/artifacts/tenant/README.md', readme.replace('current_version: 1.0.0', 'current_version: 1.1.0'));
  for (const [path, body] of other) await put(f.root, path, body);
  commit(f.root, 'other 1.1.0');
  git(f.root, 'switch', '-q', 'work');

  const second = await run('version.prepare', prepare);
  assert.deepEqual({version: second.result.version, base: second.result.base}, {version: '1.2.0', base: '1.1.0'});
  assert.deepEqual(actions(second), [['replace', 'docs/artifacts/tenant/README.md'], ['delete', 'docs/artifacts/tenant/versions/1.1.0/README.md'], ['create', 'docs/artifacts/tenant/versions/1.2.0/README.md']]);
  assert.match(await read(f.root, 'docs/artifacts/tenant/README.md'), /current_version: 1\.2\.0\n/);
  assert.match(await read(f.root, 'docs/artifacts/tenant/versions/1.2.0/README.md'), /^---\nsource_change: change-names\n---\n\n# tenant 1\.2\.0 — Names\n\nCompatible minor version\./);
  // The same number again rewrites the record of this change.
  const again = await run('version.prepare', {...prepare, summary: 'Tenants have unique names.'});
  assert.deepEqual(actions(again), [['replace', 'docs/artifacts/tenant/versions/1.2.0/README.md']]);
  assert.deepEqual(await errors(f.root), []);
  assert.deepEqual((await sharedErrors(f.root, {artifact: 'tenant', change: 'change-names'})).map(d => d.code), []);
});

test('PA3: version.prepare refuses a computed number that is not greater than another version record', async t => {
  // The working tree holds 1.1.0 of a parallel change; the local protected branch is still at 1.0.0.
  const {f, run} = await namesChange(t, other);
  await assert.rejects(run('version.prepare', prepare), e => e.status === 409 && e.field === 'level' && /1\.1\.0 is not greater than version 1\.1\.0/.test(e.message));
  await assert.rejects(run('version.prepare', {...prepare, level: 'patch'}), e => e.status === 409 && /1\.0\.1 is not greater than version 1\.1\.0/.test(e.message));
  // A change that the protected branch names in a version record is established.
  await assert.rejects(run('version.prepare', {...prepare, change: 'change-initial', level: 'major'}), e => e.status === 422 && e.code === 'protected-record');
  assert.equal((await run('version.prepare', {...prepare, level: 'major'})).result.version, '2.0.0');
});

test('PA3: version.prepare needs a level or a plan compatibility, and a readable protected branch', async t => {
  const f = await editable(t), run = operator(f.root);
  await run('change.start', {artifact: 'tenant', title: 'Names', reason: 'Names.'});
  await assert.rejects(run('version.prepare', prepare), e => e.status === 422 && e.field === 'level' && /no compatibility/.test(e.message));
  commit(f.root, 'names');
  git(f.root, 'branch', '-q', '-m', 'main', 'old');
  await assert.rejects(run('version.prepare', {...prepare, level: 'minor'}), e => e.status === 422 && e.code === 'unknown-baseline');
});

async function server(t) {
  const app = createAppServer();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  return body => fetch(`${base}/api/knowledge/edit`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
}
async function mcp(t, roots) {
  const app = createFlowMcpServer({roots, allowWrites: true}), client = new Client({name: 'delivery-test', version: '1'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await app.server.connect(b);await client.connect(a);
  t.after(() => app.close());
  return client;
}

test('PI8: HTTP and MCP write tools take the new inputs with the same result; no request field selects the channel', async t => {
  const a = await editable(t), b = await editable(t);
  const post = await server(t), client = await mcp(t, [b.root]);
  const scaffold = {operation: 'change.scaffold', input: smallInput};
  const viaHttp = await (await post({path: a.root, ...scaffold})).json();
  const viaMcp = await client.callTool({name: 'apply_knowledge_operation', arguments: scaffold});
  assert.equal(viaMcp.isError, undefined);
  const shape = r => ({operation: r.operation, applied: r.applied, result: r.result, files: r.files.map(({path, action, after}) => ({path, action, after})), diagnostics: r.diagnostics});
  assert.equal(viaHttp.applied, true);
  assert.deepEqual(shape(viaMcp.structuredContent), shape(viaHttp));

  const evidence = {operation: 'evidence.record', input: {path: `${CHANGE}change-keep-tenant-names/tasks/01-persist-names.md`, method: 'npm test', result: 'passed', detail: 'Passed.'}};
  const update = {operation: 'task.update', input: {artifact: 'tenant', change: 'change-keep-tenant-names', id: 'persist-names', covers: covers(['R1', 'R2'])}};
  const version = {operation: 'version.prepare', input: {artifact: 'tenant', change: 'change-keep-tenant-names', reason: 'Fixes names.', summary: 'Names persist.', acknowledgeUnchecked: true}};
  for (const request of [update, evidence, version]) {
    const preview = await (await post({path: a.root, ...request, dryRun: true})).json();
    const http = await (await post({path: a.root, ...request, expected: preview.expected})).json();
    const toolPreview = await client.callTool({name: 'preview_knowledge_operation', arguments: request});
    const tool = await client.callTool({name: 'apply_knowledge_operation', arguments: {...request, expected: toolPreview.structuredContent.expected}});
    assert.equal(http.applied, true, request.operation);
    assert.deepEqual(shape(tool.structuredContent), shape(http), request.operation);
  }
  assert.match(await read(a.root, 'docs/artifacts/tenant/versions/1.0.1/README.md'), /Compatible patch version\./);
  assert.equal((await post({path: a.root, ...scaffold, channel: 'agent'})).status, 400);
  const chosen = await client.callTool({name: 'apply_knowledge_operation', arguments: {...scaffold, channel: 'person'}}).catch(error => ({isError: true, error}));
  assert.equal(chosen.isError, true);
});
