// Change status, Current work, the stepper rule and the brief difference of an
// unestablished version (artifact-plane specifications/human-guidance.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fixtureRepository, inPlaceFixture, versionRecord, git} from './fixtures.js';
import {impactFiles, impactRepository} from './impact-fixtures.js';
import {scanRepository, git as readerGit} from '../server/reader.js';
import {evidenceFor, upstreamState} from '../server/workflow.js';
import {queryRepository} from '../server/repository-query.js';
import {createReviewService} from '../server/change-review.js';
import {createImpactService} from '../server/impact.js';
import {changeStatus, currentChanges, isCurrent, phaseModel, phaseLabel, sidebarRows, enterRow} from '../src/work-model.js';

const step = (name, state) => ({name, state, evidence: []});
const NAMES = ['Requirement', 'Specification', 'Plan', 'Implementation', 'Validation', 'Version preparation'];
const steps = complete => NAMES.map((name, i) => step(name, i < complete ? 'documented-complete' : 'not-declared'));
const open = (complete, extra = {}) => ({artifact: 'a', name: 'change-x', layout: 'in-place', version: null, delivered: false, history: false, currentStep: NAMES[complete] ?? null, steps: steps(complete), tasks: [], ...extra});
const prepared = (extra = {}) => ({...open(6), currentStep: null, version: '1.1.0', history: true, tasks: [{path: 't.md', checked: 2, unchecked: 0}], upstream: 'none', ...extra});

test('HG1: each status of the Change status table derives from the change fixture', () => {
  const branch = {branch: 'work'};
  const cases = [
    [open(3), branch, ['In progress', 'Implementation', 'Complete the Definition of Done items and record evidence.', 'Continue', 'active']],
    [open(5), branch, ['Ready for version', 'Ready for version', 'Prepare the version record.', 'Prepare version', 'active']],
    [prepared({tasks: [{path: 't.md', checked: 1, unchecked: 2}]}), branch, ['Unchecked items', 'Unchecked items', 'Check or explain 2 unchecked DoD items before team review.', 'Open plan', 'waiting']],
    [prepared({upstream: 'none'}), branch, ['Ready for team review', 'Ready for team review', 'Push branch work and open a pull request with the PR description. The Plane never pushes.', 'Copy PR description', 'waiting']],
    [prepared({upstream: 'ahead'}), branch, ['Ready for team review', 'Ready for team review', 'Push branch work and open a pull request with the PR description. The Plane never pushes.', 'Copy PR description', 'waiting']],
    [prepared({upstream: 'same'}), branch, ['Waiting for merge', 'Waiting for merge', 'Team review and the merge of work establish version 1.1.0.', null, 'waiting']],
    [prepared({delivered: true, upstream: 'same'}), branch, ['Delivered', 'Delivered 1.1.0', '', null, 'done']],
  ];
  for (const [change, context, [name, text, next, action, family]] of cases)
    assert.deepEqual(changeStatus(change, context), {name, text, next, action, family}, name);
  for (const upstream of ['behind', 'diverged']) assert.equal(changeStatus(prepared({upstream})).name, 'Ready for team review');
  assert.equal(changeStatus(prepared({upstream: 'none'})).next, 'Push this branch and open a pull request with the PR description. The Plane never pushes.');
  assert.equal(changeStatus(prepared({tasks: [{path: 't.md', checked: 1, unchecked: 1}]})).next, 'Check or explain 1 unchecked DoD item before team review.');
  assert.equal(changeStatus({...prepared(), loadState: 'not-loaded'}).name, 'Reading');
  assert.equal(changeStatus({...open(0), history: true}).name, 'Retained');
});

test('HG2: a prepared version stays in Current work; a delivered change is only in History', () => {
  const ready = {...prepared(), name: 'change-ready'}, delivered = {...prepared({delivered: true}), name: 'change-done'}, working = {...open(2), name: 'change-open'};
  const retained = {...open(0), name: 'change-old', history: true};
  const worktree = {path: '/w', branch: 'work', changes: [ready, delivered, working, retained], unitsOfWork: []};
  assert.deepEqual(currentChanges(worktree).map(c => c.name), ['change-ready', 'change-open']);
  assert.deepEqual([ready, delivered, working, retained].map(isCurrent), [true, false, true, false]);
  const snapshot = {artifacts: [{id: 'a', title: 'A', layout: 'in-place', elements: [], changes: []}]};
  const rows = sidebarRows({snapshot, worktree, expanded: new Set(), history: true});
  const heading = rows.findIndex(r => r.key === 'h:history'), names = (from, to) => rows.slice(from, to).filter(r => r.page?.kind === 'change').map(r => r.page.change);
  assert.deepEqual(names(0, heading), ['change-ready', 'change-open']);
  assert.deepEqual(names(heading).sort(), ['change-done', 'change-old']);
  assert.equal(rows.find(r => r.key === 'c:a/change-ready').detail, 'A · Ready for team review');
});

test('CP13, claim sidebar-enter-exact-concept: concept rows join the filtered tree first under their artifact', () => {
  const doc = (path, title) => ({path, file: `docs/artifacts/add/${path}`, title, source: 'working', state: 'unchanged'});
  const snapshot = {artifacts: [
    {id: 'add', title: 'Artifact-Driven Development', layout: 'in-place', elements: [doc('requirements/version-records.md', 'Version records'), doc('specifications/changes.md', 'Change records')], changes: []},
    {id: 'plane', title: 'Artifact Plane', layout: 'in-place', elements: [], changes: []}]};
  // The name of the second change contains version, as change-legacy-conversion does in this repository.
  const worktree = {path: '/w', branch: 'work', changes: [{...open(2), artifact: 'plane', name: 'change-concept-pages', title: 'Concept pages'}, {...open(2), artifact: 'add', name: 'change-version-gates', title: 'Gate releases'}], unitsOfWork: []};
  const item = (artifact, model, title, declaration = null) => ({logicalId: `${artifact}:${model}`, entity: `model:${artifact}:${model}`, title, description: '', artifact, declaration});
  const concepts = [item('add', 'version', 'Version'), item('add', 'change', 'Change'), item('add', 'release', 'Release', 'removed'), item('plane', 'repository-snapshot', 'Repository snapshot')];
  const rows = (filter, list = concepts) => sidebarRows({snapshot, worktree, filter, expanded: new Set(), concepts: list});
  const shown = filter => rows(filter).filter(r => r.kind !== 'heading').map(r => `${r.level}:${r.label}${r.detail ? ` (${r.detail})` : ''}`);
  // The rule of the search box: Enter opens the concept whose title equals the filter, else the first row with a page that matches itself.
  const enter = (filter, list) => enterRow(rows(filter, list).filter(r => r.kind !== 'heading'), filter)?.page;
  const version = {kind: 'concept', artifact: 'add', model: 'version'};
  assert.deepEqual(shown('version'), ['0:Current work', '1:Gate releases (Artifact-Driven Development · Plan)', '0:Artifact-Driven Development', '1:Version (Concept)', '1:Requirements', '2:Version records']);
  // An exact concept title opens the concept, ignoring case and outer spaces, before the change whose name contains version.
  for (const query of ['version', 'Version', 'Version ', '  VERSION']) assert.deepEqual(enter(query), version, query);
  assert.deepEqual(enter('change'), {kind: 'concept', artifact: 'add', model: 'change'});
  // The model id and the logical id match; nothing else matches the logical id.
  assert.deepEqual(shown('plane:repository-snapshot'), ['0:Current work', '0:Artifact Plane', '1:Repository snapshot (Concept)']);
  assert.deepEqual(rows('plane:repository-snapshot').filter(r => r.matched).map(r => r.label), ['Repository snapshot']);
  assert.deepEqual(shown('repository-snapshot'), shown('plane:repository-snapshot'));
  // A query that equals no concept title keeps the 1.24.0 rule: the first matching row in tree order.
  assert.deepEqual(enter('chang'), {kind: 'change', artifact: 'plane', change: 'change-concept-pages'});
  assert.deepEqual(enter('versio'), {kind: 'change', artifact: 'add', change: 'change-version-gates'});
  assert.deepEqual(enter('repository-snapshot'), {kind: 'concept', artifact: 'plane', model: 'repository-snapshot'});
  assert.deepEqual(shown('change').slice(0, 5), ['0:Current work', '1:Concept pages (Artifact Plane · Plan)', '1:Gate releases (Artifact-Driven Development · Plan)', '0:Artifact-Driven Development', '1:Change (Concept)']);
  // A removed declaration has no row and no exact match; without concepts, Enter keeps the 1.24.0 result.
  assert.equal(shown('release').some(r => r.includes('Release')), false);
  assert.deepEqual(enter('version', []), {kind: 'change', artifact: 'add', change: 'change-version-gates'});
  assert.deepEqual(enter('change', []), {kind: 'change', artifact: 'plane', change: 'change-concept-pages'});
  assert.equal(rows('').some(r => r.kind === 'concept'), false);
  assert.deepEqual(rows('version').map(r => r.key), rows('version', []).map(r => r.key).toSpliced(4, 0, 'a:add:concept:add:version'));
});

test('HG4: the stepper marks Implementation not done while a DoD item is unchecked and Version prepared until established', () => {
  const states = change => phaseModel(change).steps.map(s => s.state);
  assert.deepEqual(states(prepared({tasks: [{path: 't.md', checked: 5, unchecked: 1}]})), ['done', 'done', 'done', 'incomplete', 'prepared']);
  assert.deepEqual(states(prepared()), ['done', 'done', 'done', 'done', 'prepared']);
  assert.deepEqual(states(prepared({delivered: true})), ['done', 'done', 'done', 'done', 'done']);
  assert.equal(phaseModel(prepared()).state, 'prepared');
  assert.equal(phaseModel(prepared()).hint, changeStatus(prepared()).next);
  assert.equal(phaseLabel(prepared({delivered: true})), 'Version 1.1.0');
  // An open change: Implementation is current until every DoD item is checked.
  assert.deepEqual(states(open(3, {tasks: [{path: 't.md', checked: 1, unchecked: 1}]})), ['done', 'done', 'done', 'current', 'todo']);
});

test('upstream compares HEAD with the local upstream ref and never fetches', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const remote = await mkdtemp(join(tmpdir(), 'plane-remote-'));t.after(() => rm(remote, {recursive: true, force: true}));
  const commit = message => git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', message);
  assert.equal(await upstreamState(f.root, readerGit), 'none');
  git(remote, 'init', '-q', '--bare');git(f.root, 'remote', 'add', 'origin', remote);git(f.root, 'push', '-q', '-u', 'origin', 'main');
  assert.equal(await upstreamState(f.root, readerGit), 'same');
  commit('local');
  assert.equal(await upstreamState(f.root, readerGit), 'ahead');
  git(f.root, 'push', '-q');git(f.root, 'reset', '-q', '--hard', 'HEAD~1');
  assert.equal(await upstreamState(f.root, readerGit), 'behind');
  commit('other');
  assert.equal(await upstreamState(f.root, readerGit), 'diverged');
  // Only local refs are read: a spy sees one rev-list and no fetch.
  const calls = [];
  await upstreamState(f.root, (root, args) => {calls.push(args[0]);return readerGit(root, args);});
  assert.deepEqual(calls, ['rev-list']);
});

test('HG1/HG2: workflow evidence carries delivered and upstream; the status follows the records and Git', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const remote = await mkdtemp(join(tmpdir(), 'plane-remote-'));t.after(() => rm(remote, {recursive: true, force: true}));
  const auth = 'docs/artifacts/authentication/', task = `${auth}changes/change-login/tasks/01-login.md`;
  const put = async (path, text) => {await mkdir(dirname(join(f.root, path)), {recursive: true});await writeFile(join(f.root, path), text);};
  const commit = message => {git(f.root, 'add', '-A');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
  git(f.root, 'checkout', '-q', '-b', 'change-login');
  await put(`${auth}versions/1.1.0/README.md`, versionRecord('change-login'));
  commit('prepare 1.1.0');
  const read = async () => {const diagnostics = [];const changes = await evidenceFor(f.root, await scanRepository(f.root), readerGit, null, diagnostics);return Object.fromEntries(changes.filter(c => c.artifact === 'authentication').map(c => [c.name, c]));};
  let changes = await read();
  assert.equal(changes['change-initial'].delivered, true);
  assert.equal(changes['change-login'].delivered, false);
  assert.equal(changes['change-login'].version, '1.1.0');
  assert.equal(changes['change-login'].upstream, 'none');
  assert.ok(isCurrent(changes['change-login']));assert.ok(!isCurrent(changes['change-initial']));
  assert.equal(changeStatus(changes['change-login']).name, 'Unchecked items');
  assert.equal(changeStatus(changes['change-initial']).text, 'Delivered 1.0.0');
  await put(task, '---\nid: login\ndepends_on: []\n---\n# Task\n\n## Definition of Done\n\n- [x] Done.\n\n## Evidence\n\nTests passed.\n');
  commit('check the DoD');
  changes = await read();
  assert.equal(changeStatus(changes['change-login'], {branch: 'change-login'}).name, 'Ready for team review');
  git(remote, 'init', '-q', '--bare');git(f.root, 'remote', 'add', 'origin', remote);git(f.root, 'push', '-q', '-u', 'origin', 'change-login');
  changes = await read();
  assert.equal(changes['change-login'].upstream, 'same');
  assert.equal(changeStatus(changes['change-login'], {branch: 'change-login'}).text, 'Waiting for merge');
  // The overview summaries carry delivered, so Current work lists the prepared version before its evidence loads.
  const overview = await queryRepository({path: f.root, section: 'overview'});
  const worktree = overview.data.workflow.worktrees.find(w => w.selected);
  assert.deepEqual(currentChanges(worktree).filter(c => c.artifact === 'authentication').map(c => c.name), ['change-login']);
  assert.equal(worktree.changes.find(c => c.artifact === 'authentication' && c.name === 'change-initial').delivered, true);
});

test('HG4-HG6: the brief of an unestablished version uses the branch difference with named counts that match the PR description', async t => {
  const A = 'docs/artifacts/a/', X = A + 'changes/change-x/';
  const files = impactFiles();
  files.set(A + 'versions/1.0.0/README.md', '---\nsource_change: change-initial\n---\n# A 1.0.0\n');
  files.set(A + 'changes/change-initial/README.md', '# Initial\n\n## Reason and scope\n\nStart A.\n');
  files.set(A + 'requirements/need.md', '# Need\n\n- R1: Members sign in.\n');
  const repo = await impactRepository(files);t.after(repo.cleanup);
  git(repo.root, 'switch', '-q', '-c', 'work');
  await repo.write(X + 'README.md', '# Change x\n\n## Reason and scope\n\nMembers lose sessions after the check.\n');
  await repo.write(X + 'tasks/README.md', '---\ntasks: [01-check.md]\ncompatibility: minor\n---\n# Plan\n');
  await repo.write(X + 'tasks/01-check.md', '---\nid: check\ndepends_on: []\n---\n# Check\n\n## Scope and ownership\n\nOwn src/check.js.\n\n## Definition of Done\n\n- [x] The check passes.\n\n## Evidence\n\nThe check test passed.\n');
  await repo.write(A + 'requirements/need.md', '# Need\n\n- R1: Members sign in.\n- R2: Sessions end on sign-out.\n');
  await repo.write(A + 'specifications/contract.md', files.get(A + 'specifications/contract.md') + '\nA new rule.\n');
  await repo.write(A + 'versions/1.1.0/README.md', '---\nsource_change: change-x\n---\n# A 1.1.0\n');
  await repo.write('src/check.js', "import {helper} from './util.js';\nexport function check(){return helper()+1;}\nexport const unrelated=1;\n");
  repo.commit('prepare 1.1.0');
  const impact = createImpactService({roots: [repo.root], stateDir: repo.stateDir}), review = createReviewService({roots: [repo.root], impactService: impact});
  t.after(() => impact.close());
  const query = operation => review.query({path: repo.root, artifact: 'a', change: 'change-x', operation});
  const b = (await query('brief')).data;
  assert.deepEqual(b.origin, {kind: 'protected-diff'});
  const changed = b.answers.find(a => a.question === 'What changed?');
  const [, n, m, k] = changed.summary.match(/^(\d+) requirement, specification or decision documents?, (\d+) other knowledge files? and (\d+) code and test files?/);
  assert.deepEqual([n, k].map(Number), [2, 1]);
  assert.ok(changed.items.some(i => i.text === `added ${A}versions/1.1.0/README.md`));
  assert.ok(changed.items.some(i => i.text.startsWith('modified src/check.js')));
  // The PR description counts the same difference and names what it counts.
  const {markdown} = (await query('description')).data;
  const knowledge = markdown.match(/- one-artifact: pass\. (\d+) changed knowledge files under docs\/artifacts, all in docs\/artifacts\/a\/\./);
  assert.ok(knowledge, markdown);
  assert.equal(Number(knowledge[1]), Number(n) + Number(m));
  assert.match(markdown, /- code-limit: pass\. \d+ changed code and test lines?;/);
  // An undecided flow names the unit brief's affected_flows and the claim about list.
  const row = b.attention.rows.find(r => r.category === 'Undecided flow or unresolved item' && r.text.startsWith('b:report'));
  assert.match(row.text, /^b:report is reached \(\w+\), and neither the unit brief's affected_flows nor a claim's about list names it\.$/);
  const decide = b.answers.find(a => a.question === 'What needs my decision?');
  assert.ok(decide.items.some(i => i.text === 'Undecided flow b:report: add it to affected_flows in docs/artifacts/units-of-work/outcome/README.md or to the about list of a claim'));
});
