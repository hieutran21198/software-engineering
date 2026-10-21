import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { exploreRepository } from '../server/reader.js';
import { checklist, parseWorktrees } from '../server/workflow.js';
import { fixtureRepository, fingerprint, git } from './fixtures.js';
const base = 'docs/artifacts/demo/';
const change = `${base}changes/change-next/`;
async function put(root,path,value) { await mkdir(join(root,path,'..'),{recursive:true}); await writeFile(join(root,path),value); }
function commit(root, subject) { git(root,'add','.'); git(root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm',subject); return git(root,'rev-parse','HEAD'); }
async function setup(t) {
  const f = await fixtureRepository(new Map([
    [`${base}README.md`,'# Demo\n\n## Current version\n1.0.0\n'],
    [`${base}versions/1.0.0/requirements/main.md`,'# Requirements\n\n## Self-check\nPassed.'],
    [`${base}versions/1.0.0/tasks/01.md`,'# Task\n- [x] Complete\n\n## Evidence\nTests passed.'],
  ])); t.after(f.cleanup); return f;
}
test('Markdown checklists omit code examples and count nested real tasks; malformed/empty is unknown', () => {
  assert.deepEqual(checklist('- [x] Done\n  - [ ] Next\n\n```md\n- [x] example\n```'), {checked:1,unchecked:1,state:'observed'});
  assert.equal(checklist('- [maybe] bad').state,'unknown'); assert.equal(checklist('# None').state,'unknown');
  const trees = parseWorktrees('worktree /tmp/日本 space\0HEAD abc\0branch refs/heads/feature\0locked reason\0\0worktree /missing\0detached\0prunable reason\0');
  assert.equal(trees[0].path,'/tmp/日本 space'); assert.equal(trees[0].locked,true); assert.equal(trees[1].detached,true); assert.equal(trees[1].prunable,true);
});
test('B12-B14: real registered worktrees, inherited criteria, phase commits and read-only refresh',async t => {
  const f = await setup(t);
  await put(f.root,`${change}README.md`,'# Change');
  await put(f.root,`${change}requirements/main.md`,'# Requirements\nNew requirement.\n\n## Self-check\nPassed.');
  await put(f.root,`${change}tasks/01.md`,'# Task\n- [x] Complete\n\n## Evidence\nTests passed.');
  const requirementId = commit(f.root,'arbitrary subject; requirement evidence is in content');
  await put(f.root,`${change}specifications/main.md`,'# Specification\n\n## Self-check\nPassed.');
  const specId = commit(f.root,'another arbitrary subject');
  const other = `${f.root}-日本 space`;
  git(f.root,'worktree','add','-q','--detach',other);
  t.after(()=>rm(other,{recursive:true,force:true}));
  git(f.root,'worktree','lock',other);
  await put(f.root,`${change}requirements/main.md`,'# Requirements\nUncommitted new requirement.');
  const before = await fingerprint(f.root), otherBefore = await fingerprint(other);
  const view = await exploreRepository(f.root); await exploreRepository(f.root);
  assert.deepEqual(await fingerprint(f.root),before); assert.deepEqual(await fingerprint(other),otherBefore);
  assert.equal(view.workflow.historyLimit,200); assert.equal(view.workflow.worktrees.length,2);
  const selected = view.workflow.worktrees.find(w=>w.selected); const c = selected.changes[0];
  assert.equal(c.currentStep,'Requirement'); assert.equal(c.steps.some(s=>s.name==='Approval'),false); assert.equal(c.steps.length,6);
  assert.ok(c.steps.find(s=>s.name==='Requirement').commits.some(c=>c.id===requirementId));
  assert.ok(c.steps.find(s=>s.name==='Specification').commits.some(c=>c.id===specId));
  assert.equal(c.tasks[0].inherited,true); assert.equal(c.steps.find(s=>s.name==='Implementation').state,'unknown');
  const detached = view.workflow.worktrees.find(w=>!w.selected); assert.equal(detached.detached,true); assert.equal(detached.locked,true); assert.equal(detached.branch,null);
  await rm(other,{recursive:true,force:true});
  assert.equal((await exploreRepository(f.root)).workflow.worktrees.find(w=>!w.selected).availability,'unavailable');
});
test('finished identical snapshots retain historical commits but no inferred running step; squash remains ambiguous', async t=> {
  const f = await setup(t);
  await put(f.root,`${change}README.md`,'# Change');
  await put(f.root,`${change}requirements/main.md`,'# Requirements\nNew requirement.\n\n## Self-check\nPassed.');
  await put(f.root,`${change}specifications/main.md`,'# Specification\n\n## Self-check\nPassed.');
  const id = commit(f.root,'squashed phases');
  let c = (await exploreRepository(f.root)).workflow.worktrees[0].changes[0];
  assert.equal(c.currentStep,null); assert.match(c.inferenceReason,/several phases/);
  assert.ok(c.steps.filter(s=>s.commits.some(c=>c.id===id)).length>=2);
  await put(f.root,`${base}versions/1.0.0/requirements/main.md`,'# Requirements\nNew requirement.\n\n## Self-check\nPassed.');
  await put(f.root,`${base}versions/1.0.0/specifications/main.md`,'# Specification\n\n## Self-check\nPassed.');
  commit(f.root,'snapshot established');
  c = (await exploreRepository(f.root)).workflow.worktrees[0].changes[0];
  assert.equal(c.currentStep,null); assert.match(c.inferenceReason,/No distinguishable ongoing/);
  assert.ok(c.steps.find(s=>s.name==='Requirement').commits.some(c=>c.id===id));
});

test('explicit completion transition keeps full exact commit; later evidence edits do not invent completion', async t => {
  const f = await setup(t);
  await put(f.root,`${change}README.md`,'# Change');
  await put(f.root,`${change}requirements/main.md`,'# Requirements\nNew requirement.');
  commit(f.root,'requirement draft');
  await put(f.root,`${change}requirements/main.md`,'# Requirements\nNew requirement.\n\n## Self-check\nPassed.');
  const completion = commit(f.root,'completed requirement');
  const c = (await exploreRepository(f.root)).workflow.worktrees[0].changes[0];
  const phase = c.steps.find(s=>s.name==='Requirement');
  assert.equal(phase.state,'documented-complete'); assert.equal(phase.completionCommit.id,completion);
  assert.equal(phase.completionCommit.subject,'completed requirement');
});

test('history cap and shallow evidence are disclosed; non-ADD and unavailable roots stay visible', async () => {
  const { readWorkflow } = await import('../server/workflow.js');
  const data = {files:new Map(),snapshot:{artifacts:[]}};
  const commands=[];
  const fakeGit = async (root,args) => {
    commands.push(args);
    if (args[0]==='worktree') return 'worktree /selected\0HEAD abc\0branch refs/heads/main\0\0worktree /no-add\0HEAD def\0\0worktree /missing\0HEAD ghi\0\0';
    if(args[0]==='log') return Array.from({length:201},(_,i)=>`${i.toString(16).padStart(40,'0')}\0subject ${i}\0\ndocs/artifacts/demo/README.md\0`).join('');
    if(args[0]==='rev-parse') return 'true';
    return '';
  };
  const scan = async root => { const e = new Error(root==='/no-add'?'Repository has no readable docs/artifacts directory.':'Missing worktree'); e.status=404; throw e; };
  const workflow = await readWorkflow('/selected',data,scan,fakeGit);
  assert.ok(workflow.worktrees[0].diagnostics.some(d=>d.code==='history-limited'));
  assert.ok(workflow.worktrees[0].diagnostics.some(d=>d.code==='shallow-history'));
  assert.equal(workflow.worktrees[1].availability,'non-add');assert.equal(workflow.worktrees[2].availability,'unavailable');
  assert.equal(commands.filter(c=>c[0]==='worktree').length,1);assert.ok(commands.find(c=>c[0]==='log').includes('-201'));
});

test('negative and planned self-check text cannot prove completion', async()=>{
 const {explicitCompletion}=await import('../server/workflow.js');
 for(const text of ['## Self-check\nIncomplete.', '## Self-check\nTests have not passed.', '## Plan\nRun self-check and mark complete after approval.', '- [x] One\n- [ ] Next\n## Evidence\nTests passed.']) assert.equal(explicitCompletion(text),false);
 assert.equal(explicitCompletion('## Self-check\nPassed.'),true);
});

test('B17: retained lifecycle and recency come from declarations, snapshots and real commit times', async t => {
 const f=await setup(t);
 const current=`${base}changes/change-next/`,older=`${base}changes/change-zolder/`,newer=`${base}changes/change-anewer/`;
 await put(f.root,`${base}README.md`,'# Demo\n\n## Current version\n1.0.0\n\n## Active change\n[Next](changes/change-next/README.md)');
 for(const prefix of [current,older,newer]) {await put(f.root,prefix+'README.md','# Change');await put(f.root,prefix+'requirements/main.md','# Distinct '+prefix);}
 commit(f.root,'initial change records');
 await put(f.root,older+'requirements/main.md','# Older history');
 const oldId=commit(f.root,'old update');
 await put(f.root,newer+'requirements/main.md','# Newer history');
 const newId=commit(f.root,'new update');
 const before=await fingerprint(f.root);
 const changes=(await exploreRepository(f.root)).workflow.worktrees[0].changes;
 assert.equal(changes.find(c=>c.name==='change-next').history,false);
 for(const [name,id] of [['change-zolder',oldId],['change-anewer',newId]]) {
  const c=changes.find(c=>c.name===name);assert.equal(c.history,true);assert.match(c.historyReason,/does not prove completion/);
  assert.equal(c.lastCommitAt,Number(git(f.root,'show','-s','--format=%ct',id)));
 }
 assert.deepEqual(await fingerprint(f.root),before);
 await put(f.root,current+'requirements/main.md','# Requirements\n\n## Self-check\nPassed.');
 const view=await exploreRepository(f.root);
 assert.equal(view.workflow.worktrees[0].changes.find(c=>c.name==='change-next').history,true);
 await put(f.root,`${base}README.md`,'# Demo\n\n## Current version\n1.0.0');
 const ambiguous=(await exploreRepository(f.root)).workflow.worktrees[0].changes;
 assert.equal(ambiguous.find(c=>c.name==='change-zolder').history,false);
 await put(f.root,`${base}changes/change-uncommitted/README.md`,'# Uncommitted');
 await put(f.root,`${base}changes/change-uncommitted/requirements/main.md`,'# New');
 assert.equal((await exploreRepository(f.root)).workflow.worktrees[0].changes.find(c=>c.name==='change-uncommitted').lastCommitAt,null);
});

// In-place layout: phases come from declared fields only; no history replay.
import { scanRepository, git as readerGit } from '../server/reader.js';
import { evidenceFor } from '../server/workflow.js';
import { inPlaceFixture } from './fixtures.js';
test('L3: in-place phases derive from declarations without git log; undeclared steps are not declared', async t => {
  const f = await fixtureRepository(inPlaceFixture()); t.after(f.cleanup);
  const auth = 'docs/artifacts/authentication/', plan = `${auth}changes/change-login/tasks/`;
  git(f.root, 'checkout', '-q', '-b', 'change-login');
  await put(f.root, `${auth}requirements/login.md`, `---\nself_check:\n  result: passed\n  source: ${auth}requirements/login.md#self-check\n---\n# Login need\n\n## Self-check\n\nCoverage checked.\n`);
  await put(f.root, `${plan}README.md`, `---\ntasks: [01-login.md]\nself_check: {result: incomplete, source: "${plan}README.md#plan-self-check"}\n---\n# Plan\n\n## Plan self-check\n\nDependencies open.\n`);
  await put(f.root, `${plan}01-login.md`, `---\nid: login\ndepends_on: []\nevidence_records:\n  - {id: tests, method: npm test, result: passed, source: "${plan}01-login.md#evidence"}\n---\n# Task\n\n- [x] Done.\n\n## Evidence\n\nTests passed.\n`);
  const data = await scanRepository(f.root), calls = [], diagnostics = [];
  const spy = (root, args, raw) => { calls.push(args[0]); return readerGit(root, args, raw); };
  const changes = await evidenceFor(f.root, data, spy, null, diagnostics);
  const login = changes.find(c => c.artifact === 'authentication' && c.name === 'change-login');
  assert.deepEqual(Object.fromEntries(login.steps.map(s => [s.name, s.state])), {Requirement: 'documented-complete', Specification: 'not-declared', Plan: 'declared-incomplete', Implementation: 'documented-complete', Validation: 'documented-complete', 'Version preparation': 'not-declared'});
  assert.equal(login.currentStep, 'Specification');
  assert.equal(login.history, false);
  const initial = changes.find(c => c.artifact === 'authentication' && c.name === 'change-initial');
  assert.equal(initial.history, true);assert.equal(initial.steps.at(-1).state, 'documented-complete');assert.match(initial.historyReason, /protected ref/);
  assert.ok(!calls.includes('log'), calls.join(','));
  assert.deepEqual(diagnostics, []);
});
test('L3: a change whose README is on main reads the self-checks of its committed documents', async t => {
  const files = inPlaceFixture(), auth = 'docs/artifacts/authentication/';
  for (const kind of ['requirements', 'specifications']) files.set(`${auth}${kind}/login.md`, `---\nself_check:\n  result: passed\n  source: ${auth}${kind}/login.md#self-check\n---\n# Login\n\n## Self-check\n\nChecked.\n`);
  const f = await fixtureRepository(files); t.after(f.cleanup);
  const diagnostics = [], changes = await evidenceFor(f.root, await scanRepository(f.root), readerGit, null, diagnostics);
  const login = changes.find(c => c.artifact === 'authentication' && c.name === 'change-login');
  assert.equal(login.merged, true);
  assert.equal(login.steps.find(s => s.name === 'Requirement').state, 'documented-complete');
  assert.equal(login.steps.find(s => s.name === 'Specification').state, 'documented-complete');
  assert.notEqual(login.currentStep, 'Requirement');
  assert.deepEqual(diagnostics, []);
});
test('L3: malformed or unresolvable declarations are diagnostics, not positive evidence', async t => {
  const files = inPlaceFixture(), plan = 'docs/artifacts/authentication/changes/change-login/tasks/';
  files.set(`${plan}README.md`, `---\ntasks: [01-login.md]\nself_check: {result: successful, source: "${plan}README.md"}\n---\n# Plan\n`);
  files.set(`${plan}01-login.md`, `---\nid: login\ndepends_on: []\nevidence_records:\n  - {id: tests, method: npm test, result: passed, source: "${plan}01-login.md#missing"}\n---\n# Task\n\n- [x] Done.\n`);
  const f = await fixtureRepository(files); t.after(f.cleanup);
  const diagnostics = [], changes = await evidenceFor(f.root, await scanRepository(f.root), readerGit, null, diagnostics);
  const login = changes.find(c => c.name === 'change-login' && c.artifact === 'authentication');
  assert.equal(login.steps.find(s => s.name === 'Plan').state, 'not-declared');
  assert.equal(login.steps.find(s => s.name === 'Validation').state, 'not-declared');
  assert.deepEqual(diagnostics.map(d => d.code).sort(), ['invalid-evidence-record', 'missing-evidence']);
});
