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
  assert.equal(c.currentStep,'Requirement'); assert.equal(c.steps.find(s=>s.name==='Approval').state,'unknown');
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
