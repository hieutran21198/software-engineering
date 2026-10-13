import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { buildTaskGraph } from '../server/task-graph.js';
import { checklist } from '../server/workflow.js';
import { exploreRepository } from '../server/reader.js';
import { fixtureRepository, sourceFixture, fingerprint, git } from './fixtures.js';
const prefix = 'docs/artifacts/authentication/changes/change-login/';
const task = (id, dependencies = []) => `---\nid: ${id}\ndepends_on: ${JSON.stringify(dependencies)}\n---\n# ${id}\n\n- [ ] Verify behavior\n`;
function files(plan = '[a.md, b.md, nested/c.md, d.md]', overrides = []) {
  return new Map([[`${prefix}tasks/README.md`, `---\ntasks: ${plan}\n---\n# Plan`], [`${prefix}tasks/a.md`, task('a')], [`${prefix}tasks/b.md`, task('b', ['a'])], [`${prefix}tasks/nested/c.md`, task('c', ['a'])], [`${prefix}tasks/d.md`, task('d', ['b','c'])], [`${prefix}tasks/history.md`, task('history')], ...overrides]);
}
const graph = (records, unsafe) => buildTaskGraph(records, prefix, checklist, unsafe);
test('fork/join emits exact membership, evidence and prerequisite edges', () => {
  const result = graph(files());
  assert.equal(result.state, 'available');
  assert.deepEqual(result.edges, [{source:'a',target:'b'}, {source:'a',target:'c'}, {source:'b',target:'d'}, {source:'c',target:'d'}]);
  assert.deepEqual(result.tasks[0], {id:'a',path:`${prefix}tasks/a.md`,title:'a',dependsOn:[],body:task('a'),checked:0,unchecked:1,state:'observed'});
  assert.equal(result.tasks.length,4);
});
test('single, disconnected, empty and legacy plans stay distinct', () => {
  assert.equal(graph(files('[a.md]')).tasks.length,1);
  const records=files('[a.md, b.md]', [[`${prefix}tasks/b.md`,task('b')]]);
  assert.deepEqual(graph(records).edges,[]);
  assert.deepEqual(graph(files('[]')), {state:'available',tasks:[],edges:[],diagnostics:[]});
  assert.equal(graph(new Map()).state,'unavailable');
  assert.equal(graph(new Map([[`${prefix}tasks/README.md`,'---\n\n---\n# Legacy']])).state,'unavailable');
  assert.equal(graph(new Map([[`${prefix}tasks/README.md`,'# Legacy']])).state,'unavailable');
});
const cases = [
  ['malformed-plan', '---\ntasks: [\n---'],
  ['malformed-plan', '---\ntasks: []\ntasks: []\n---'],
  ['malformed-plan', '---\ntasks: a.md\n---'],
  ...['[a.md, a.md]','[../outside.md]','[/absolute.md]','[README.md]','[nested/../a.md]','["a\\\\b.md"]','[null]','["a\\u0000.md"]','[a.txt]','[./a.md]','[a//b.md]','["C:/a.md"]'].map(value => ['malformed-plan',`---\ntasks: ${value}\n---`]),
  ['missing-task','---\ntasks: [absent.md]\n---'],
];
for (const [index,[code,plan]] of cases.entries()) test(`invalid plan ${index}: ${code}`, () => {
  const result=graph(files(undefined,[[`${prefix}tasks/README.md`,plan]]));
  assert.equal(result.state,'invalid');assert.deepEqual(result.edges,[]);assert.ok(result.diagnostics.some(d=>d.code===code));
});
const invalidTasks = [
  ['malformed-task','# Missing metadata'], ['malformed-task','---\nid: a\n---'],
  ['malformed-task','---\nid: Bad ID\ndepends_on: []\n---'], ['malformed-task','---\nid: a\ndepends_on: {}\n---'],
  ['malformed-task','---\nid: a\nid: b\ndepends_on: []\n---'], ['malformed-task','---\nid: a\ndepends_on: [\n---'],
  ['malformed-task','---\nid: a\ndepends_on: [3]\n---'],
  ['duplicate-task-id',task('b')], ['unknown-prerequisite',task('a',['missing'])],
  ['self-dependency',task('a',['a'])], ['duplicate-prerequisite',task('a',['b','b'])], ['task-cycle',task('a',['d'])],
];
for (const [index,[code,body]] of invalidTasks.entries()) test(`invalid task ${index}: ${code}`, () => {
  const result=graph(files(undefined,[[`${prefix}tasks/a.md`,body]]));
  assert.equal(result.state,'invalid');assert.equal(result.tasks.length,4);assert.deepEqual(result.edges,[]);assert.ok(result.diagnostics.some(d=>d.code===code));
});
test('real worktree graphs preserve source bytes/Git metadata and remain isolated', async t => {
  const records=sourceFixture(); for (const entry of files()) records.set(...entry);
  const secondPrefix=prefix.replace('change-login','change-second');
  records.set(`${secondPrefix}README.md`,'# Second');
  records.set(`${secondPrefix}tasks/README.md`,'---\ntasks: [a.md]\n---');records.set(`${secondPrefix}tasks/a.md`,task('a'));
  const fixture=await fixtureRepository(records);
  const worktree=`${fixture.root}-other`;git(fixture.root,'worktree','add','-b','other',worktree);
  t.after(async()=>{git(fixture.root,'worktree','remove','--force',worktree);await fixture.cleanup();});
  const before=await fingerprint(fixture.root), otherBefore=await fingerprint(worktree);
  const view=await exploreRepository(fixture.root);await exploreRepository(fixture.root);
  const changes=view.workflow.worktrees.flatMap(w=>w.changes.filter(c=>c.artifact==='authentication').map(c=>({path:w.path,...c})));
  assert.equal(changes.length,4);
  assert.equal(new Set(changes.map(c=>JSON.stringify([c.path,c.artifact,c.name,c.taskGraph.tasks[0].path]))).size,4);
  assert.ok(changes.every(c=>c.taskGraph.tasks[0].id==='a'));
  assert.deepEqual(await fingerprint(fixture.root),before);assert.deepEqual(await fingerprint(worktree),otherBefore);
});
test('task aliases outside tasks are rejected without changing existing knowledge scanning',async t=>{
  const records=sourceFixture();for(const entry of files('[alias.md]'))records.set(...entry);
  const fixture=await fixtureRepository(records);t.after(fixture.cleanup);
  const outside=join(fixture.root,'docs/artifacts/authentication/changes/change-login/specifications/outside.md');
  await writeFile(outside,task('outside'));
  await symlink(outside,join(fixture.root,`${prefix}tasks/alias.md`));
  const view=await exploreRepository(fixture.root),change=view.workflow.worktrees[0].changes.find(c=>c.name==='change-login');
  assert.equal(change.taskGraph.state,'invalid');assert.deepEqual(change.taskGraph.tasks,[]);assert.ok(change.taskGraph.diagnostics.some(d=>d.code==='malformed-plan'));
  assert.ok(!view.artifacts.find(a=>a.id==='authentication').elements.some(e=>e.path==='tasks/alias.md'));
  assert.ok(view.diagnostics.some(d=>d.code==='unsafe-path'));
});
