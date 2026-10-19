// Guidance functions of an agent session (artifact-plane
// specifications/agent-integration.md: Session context, Reserved actions,
// Stop check, Validation).
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile, mkdir, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import pkg from '../package.json' with {type: 'json'};
import {fixtureRepository, inPlaceFixture, versionRecord, git} from './fixtures.js';
import {scanRepository, git as readerGit} from '../server/reader.js';
import {evidenceFor} from '../server/workflow.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';
import {changeStatus, isCurrent} from '../src/work-model.js';
import {worktreeStatus, sessionContext, reservedAction, stopCheck, simpleCommands} from '../server/agent-guidance.js';

const AUTH = 'docs/artifacts/authentication/';
const put = async (root, path, text) => {await mkdir(dirname(join(root, path)), {recursive: true});await writeFile(join(root, path), text);};
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
const temporary = async t => {const dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-guidance-')));t.after(() => rm(dir, {recursive: true, force: true}));return dir;};
// The change status fixture of test/change-status.test.js with a linked worktree that holds another change.
async function fixture(t) {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const root = await realpath(f.root), other = join(await temporary(t), 'other');
  git(root, 'worktree', 'add', '-q', '-b', 'change-other', other);
  await put(other, 'docs/artifacts/tenant/changes/change-other/README.md', '# Other change\n');
  commit(other, 'other change');
  return {root, other};
}
const expected = async (root, branch) => {
  const changes = await evidenceFor(root, await scanRepository(root), readerGit, null, []);
  return changes.filter(isCurrent).map(c => {const {name, text, next, family} = changeStatus(c, {branch});return [`${c.artifact}/${c.name}`, {name, text, next, family}];});
};
const statuses = record => record.changes.map(c => [`${c.artifact}/${c.change}`, c.status]);

test('AI3: worktreeStatus equals changeStatus on the change status fixture and reads only the worktree of cwd', async t => {
  const {root, other} = await fixture(t);
  git(root, 'checkout', '-q', '-b', 'change-login');
  const check = async () => {
    const calls = [], spy = (dir, args, raw) => {calls.push([dir, args]);return readerGit(dir, args, raw);};
    const record = await worktreeStatus(join(root, 'docs/artifacts'), {git: spy});
    assert.deepEqual(statuses(record), await expected(root, 'change-login'));
    assert.ok(record.changes.every(c => c.change !== 'change-other'), 'the change of the other worktree is not read');
    assert.ok(calls.every(([dir]) => dir.startsWith(root) && !dir.startsWith(other)), JSON.stringify(calls.map(c => c[0])));
    assert.ok(calls.every(([, args]) => args[0] !== 'worktree'), 'no worktree list');
    return record;
  };
  let record = await check();
  assert.equal(record.changes.find(c => c.change === 'change-login').status.name, 'In progress');
  await put(root, `${AUTH}versions/1.1.0/README.md`, versionRecord('change-login'));
  commit(root, 'prepare 1.1.0');
  record = await check();
  assert.deepEqual({...record, changes: undefined, text: undefined}, {repository: root, worktree: root, branch: 'change-login', changes: undefined, text: undefined});
  assert.deepEqual(record.changes, [{artifact: 'authentication', change: 'change-login', title: 'Change', tier: 'medium', unit: null,
    status: {name: 'Unchecked items', text: 'Unchecked items', next: 'Check or explain 1 unchecked DoD item before team review.', family: 'waiting'},
    version: '1.1.0', unchecked: [{task: '01-login.md', count: 1}]}]);
  assert.equal(record.text, sessionContext(record));
  await put(root, `${AUTH}changes/change-login/tasks/01-login.md`, '---\nid: login\ndepends_on: []\n---\n# Task\n\n## Definition of Done\n\n- [x] Done.\n\n## Evidence\n\nTests passed.\n');
  commit(root, 'check the DoD');
  record = await check();
  assert.equal(record.changes[0].status.name, 'Ready for team review');
  assert.deepEqual(record.changes[0].unchecked, []);
  const remote = await temporary(t);
  git(remote, 'init', '-q', '--bare');git(root, 'remote', 'add', 'origin', remote);git(root, 'push', '-q', '-u', 'origin', 'change-login');
  record = await check();
  assert.equal(record.changes[0].status.name, 'Waiting for merge');
  // The linked worktree: its own change, the repository is the main worktree.
  const linked = await worktreeStatus(other);
  assert.equal(linked.worktree, other);assert.equal(linked.repository, root);assert.equal(linked.branch, 'change-other');
  assert.ok(linked.changes.some(c => c.change === 'change-other'));
  assert.deepEqual(statuses(linked), await expected(other, 'change-other'));
});

test('AI3: worktreeStatus names the member unit and returns null outside an ADD repository', async t => {
  const {root} = await fixture(t);
  await put(root, 'docs/artifacts/units-of-work/login/README.md', '---\nunit_of_work: login\nchanges:\n  - artifact: authentication\n    change: change-login\nacceptance:\n  - id: signs-in\n    criterion: A member signs in.\n---\n# Login\n');
  commit(root, 'unit');
  assert.equal((await worktreeStatus(root)).changes.find(c => c.change === 'change-login').unit, 'login');
  const plain = await temporary(t);
  assert.equal(await worktreeStatus(plain), null);
  git(plain, 'init', '-q', '-b', 'main');
  assert.equal(await worktreeStatus(plain), null);
  assert.equal(await worktreeStatus(''), null);
});

const change = (name, extra = {}) => ({artifact: 'plane', change: name, title: name, tier: 'medium', unit: null,
  status: {name: 'In progress', text: 'Implementation', next: 'Complete the Definition of Done items and record evidence.', family: 'active'}, version: null, unchecked: [], ...extra});
const status = changes => ({repository: '/r', worktree: '/r/wt', branch: 'impl', changes});

test('AI3: sessionContext writes the Session context format', () => {
  const text = sessionContext(status([
    change('change-a', {unit: 'outcome', unchecked: [{task: '01-a.md', count: 2}, {task: '02-b.md', count: 1}]}),
    change('change-b', {tier: 'small', version: '1.2.0', status: {name: 'Ready for team review', text: 'Ready for team review', next: 'Push branch impl and open a pull request with the PR description. The Plane never pushes.', family: 'waiting'}}),
  ]), {version: '9.9.9'});
  assert.equal(text, [
    'Artifact Plane 9.9.9: ADD state of /r/wt on branch impl.',
    '- plane/change-a (tier medium, unit outcome): Implementation. Next: Complete the Definition of Done items and record evidence.',
    '  Unchecked DoD items: 01-a.md 2; 02-b.md 1',
    '- plane/change-b (tier small): Ready for team review. Next: Push branch impl and open a pull request with the PR description. The Plane never pushes.',
    'ADD reserves for people: the merge of a pull request, and commits and pushes to main or master.',
    'MCP: get_change_status and check_records give this state and the record checks.',
  ].join('\n'));
  assert.equal(sessionContext(status([])).split('\n')[1], 'No current change in this worktree.');
  assert.match(sessionContext(status([])), new RegExp(`^Artifact Plane ${pkg.version.replaceAll('.', '\\.')}: `));
  assert.equal(sessionContext(null), '');
});

test('AI3: sessionContext keeps at most 4,000 characters and removes task lines from the end', () => {
  const unchecked = Array.from({length: 40}, (_, i) => ({task: `${String(i).padStart(2, '0')}-a-long-task-file-name.md`, count: 1}));
  const changes = Array.from({length: 6}, (_, i) => change(`change-${i}`, {unchecked}));
  const full = sessionContext(status(changes));
  assert.ok(full.length <= 4000, String(full.length));
  const lines = full.split('\n');
  assert.equal(lines.filter(l => l.startsWith('- ')).length, 6, 'every change line stays');
  const taskLines = lines.filter(l => l.startsWith('  Unchecked DoD items:'));
  assert.ok(taskLines.length > 0 && taskLines.length < 6);
  // Task lines go from the end: the first changes keep theirs.
  assert.equal(lines[2], taskLines[0]);
  assert.equal(lines.at(-3), 'More in get_change_status.');
  const small = sessionContext(status(changes.slice(0, 1)));
  assert.ok(!small.includes('More in get_change_status.'));
  // Without task lines a text that is still too long drops change lines from the end.
  const many = sessionContext(status(Array.from({length: 80}, (_, i) => change(`change-${i}`))));
  assert.ok(many.length <= 4000);assert.ok(many.includes('- plane/change-0 '));assert.ok(!many.includes('- plane/change-79 '));
  assert.ok(many.includes('More in get_change_status.'));
});

test('simpleCommands splits outside quotes and reads shell quoting', () => {
  assert.deepEqual(simpleCommands('git add . && git commit -m "a; b" || echo \'x | y\'\ngh pr merge 1 & ls|wc -l; a\\ b'),
    [['git', 'add', '.'], ['git', 'commit', '-m', 'a; b'], ['echo', 'x | y'], ['gh', 'pr', 'merge', '1'], ['ls'], ['wc', '-l'], ['a b']]);
  assert.deepEqual(simpleCommands('echo "a \\"q\\" \\$x \\n" 2>&1 | tee log'), [['echo', 'a "q" $x \\n', '2>&1'], ['tee', 'log']]);
  assert.deepEqual(simpleCommands("git commit -m 'it'\"'\"'s'"), [['git', 'commit', '-m', "it's"]]);
  assert.deepEqual(simpleCommands('git \\\ncommit'), [['git', 'commit']]);
});

test('AIA2: reservedAction passes the test table of the specification', async t => {
  const {root, other: wt} = await fixture(t);
  const table = [
    [root, 'git commit -m x', 'commit'],
    [wt, 'git commit -m x', null],
    [wt, `git -C ${root} commit -m x`, 'commit'],
    [root, `git -C ${wt} commit -m x`, null],
    [join(root, 'docs'), 'git -C .. commit -m x', 'commit'],
    [wt, 'git push origin HEAD:main', 'push'],
    [root, 'git push', 'push'],
    [root, 'git push origin', 'push'],
    [wt, 'git push', null],
    [wt, 'git push -u origin change-other', null],
    [wt, 'git push origin main', 'push'],
    [wt, 'git push origin +main', 'push'],
    [wt, 'git push origin refs/heads/master', 'push'],
    [wt, 'git push --force-with-lease -o ci.skip origin change-other:refs/heads/main', 'push'],
    [wt, 'gh pr merge 44', 'merge'],
    [root, 'echo "git commit"', null],
    [wt, "echo 'gh pr merge 1'", null],
    [root, 'git log --grep commit', null],
    [root, 'git add . && git commit -m x', 'commit'],
    [root, 'git status; git log', null],
    [wt, 'git commit -m "x && git push origin main"', null],
    [wt, 'FOO=1 git -c user.name=x --no-pager push origin main', 'push'],
    [root, 'git commit -m x 2>&1 | tee log', 'commit'],
    [root, 'git\\ commit', null],
    [wt, 'npm test\ngit push origin main', 'push'],
    // Amended rows: HEAD, --all and --mirror, cd, the command basename and shell scripts.
    [root, 'git push origin HEAD', 'push'],
    [root, 'git push origin +HEAD', 'push'],
    [wt, 'git push origin HEAD', null],
    [wt, 'git push --all origin', 'push'],
    [wt, 'git push --mirror', 'push'],
    [wt, `cd ${root} && git commit -m x`, 'commit'],
    [root, `cd ${wt} && git commit -m x`, null],
    [wt, `cd ${root}; cd ${wt}; git commit -m x`, null],
    [join(root, 'docs'), 'cd .. && git commit -m x', 'commit'],
    [wt, `cd ${root} && gh pr merge 3`, 'merge'],
    [root, '/usr/bin/git commit -m x', 'commit'],
    [wt, '/usr/local/bin/gh pr merge 1', 'merge'],
    [root, 'bash -lc "git commit -m x"', 'commit'],
    [root, 'sh -c \'echo "git commit"\'', null],
    [wt, `zsh -c "cd ${root} && git commit -m x"`, 'commit'],
    [wt, `bash -c "cd ${root}" && git commit -m x`, null],
    [root, 'bash -l script.sh', null],
    [root, '(git commit -m x)', null],
    [root, 'echo $(git commit -m x)', null],
  ];
  for (const [cwd, command, action] of table)
    assert.equal((await reservedAction({cwd, tool_input: {command}}))?.action ?? null, action, `${cwd === root ? 'main' : 'branch'}: ${command}`);
  assert.equal((await reservedAction({cwd: root, tool_input: {command: ['git', 'commit', '-m', 'x']}}))?.action, 'commit');
  // The Codex form of a command: a shell with -lc and the script.
  assert.equal((await reservedAction({cwd: root, tool_input: {command: ['bash', '-lc', 'git commit -m x']}}))?.action, 'commit');
  assert.equal(await reservedAction({cwd: wt, tool_input: {command: ['bash', '-lc', 'git commit -m x']}}), null);
  assert.equal((await reservedAction({cwd: wt, tool_input: {command: 'git push --all origin'}})).reason, 'ADD reserves pushes to main or master for people (AGENTS.md). Work on a change branch and stop for team review.');
  assert.deepEqual(await reservedAction({cwd: root, tool_input: {command: 'git commit -m x'}}),
    {action: 'commit', reason: 'ADD reserves commits to main for people (AGENTS.md). Work on a change branch and stop for team review.'});
  assert.equal((await reservedAction({cwd: wt, tool_input: {command: 'gh pr merge 44'}})).reason, 'ADD reserves the merge of a pull request for people (AGENTS.md). Work on a change branch and stop for team review.');
  assert.equal((await reservedAction({cwd: wt, tool_input: {command: 'git push origin HEAD:main'}})).reason, 'ADD reserves pushes to main for people (AGENTS.md). Work on a change branch and stop for team review.');
  for (const input of [{cwd: root}, {cwd: root, tool_input: {file_path: 'git commit'}}, {tool_input: {command: 'gh pr merge 1'}}, {}, null])
    assert.equal(await reservedAction(input), null);
});

test('AIA2: reservedAction returns null outside an ADD repository', async t => {
  const plain = await temporary(t);
  git(plain, 'init', '-q', '-b', 'main');
  git(plain, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'start');
  for (const command of ['git commit -m x', 'git push origin main', 'git push', 'gh pr merge 44'])
    assert.equal(await reservedAction({cwd: plain, tool_input: {command}}), null, command);
  const missing = join(plain, 'missing');
  assert.equal(await reservedAction({cwd: missing, tool_input: {command: 'git commit -m x'}}), null);
  // An ADD repository named by -C from a plain directory is checked.
  const {root} = await fixture(t);
  assert.equal((await reservedAction({cwd: plain, tool_input: {command: `git -C ${root} commit -m x`}}))?.action, 'commit');
});

test('AI4: stopCheck fails only for error diagnostics of a current change and lists at most ten', async t => {
  const {root} = await fixture(t);
  const calls = [];
  const diagnostic = (i, severity = 'error') => ({code: `code-${i}`, message: `Message ${i}.`, severity});
  const stub = diagnostics => async (path, options) => {calls.push([path, options.change]);return {diagnostics};};
  assert.equal(await stopCheck({cwd: root, stop_hook_active: true}, {validate: stub([diagnostic(1)])}), null);
  assert.deepEqual(calls, [], 'no validation in an active stop sequence');
  const current = (await worktreeStatus(root)).changes.map(c => `${c.artifact}/${c.change}`);
  assert.ok(current.length && !current.includes('tenant/change-initial'));
  const result = await stopCheck({cwd: root, stop_hook_active: false}, {validate: stub([...Array.from({length: 12}, (_, i) => diagnostic(i)), diagnostic(99, 'warning')])});
  assert.deepEqual(calls, current.map(change => [root, change]), 'one run for each current change');
  const lines = result.reason.split('\n');
  assert.equal(lines.length, 11);
  assert.equal(lines[0], `${current[0]}: code-0 Message 0.`);
  assert.equal(lines.at(-1), 'Fix the records, or say why they stay, before you stop.');
  assert.ok(!result.reason.includes('code-99'));
  assert.equal(await stopCheck({cwd: root}, {validate: stub([diagnostic(1, 'warning'), diagnostic(2, 'info')])}), null);
  const plain = await temporary(t);
  assert.equal(await stopCheck({cwd: plain}, {validate: stub([diagnostic(1)])}), null);
  // The real validator: the check fails exactly when a current change has an error.
  const errors = [];
  for (const change of current) errors.push(...(await validateKnowledge(root, {change})).diagnostics.filter(d => d.severity === 'error'));
  const real = await stopCheck({cwd: root});
  assert.equal(real === null, errors.length === 0);
});

test('validateKnowledge with a change scope reports the errors of a unit brief whose metadata cannot be parsed', async t => {
  const {root} = await fixture(t);
  const broken = 'docs/artifacts/units-of-work/broken/README.md', other = 'docs/artifacts/units-of-work/other/README.md';
  await put(root, broken, '---\nunit_of_work: broken\nflow_assessment: The flow is new: context at start.\n  More text.\n---\n# Broken\n');
  await put(root, other, '---\nunit_of_work: other\nchanges:\n  - artifact: tenant\n    change: change-initial\n---\n# Other\n');
  commit(root, 'unit briefs');
  const scoped = await validateKnowledge(root, {change: 'authentication/change-login'});
  const paths = scoped.diagnostics.filter(d => d.severity === 'error').map(d => [d.path, d.code]);
  assert.ok(paths.some(([path, code]) => path === broken && code === 'invalid-unit'), JSON.stringify(paths));
  assert.ok(!paths.some(([path]) => path === other), 'a parsed brief of another change stays out of scope');
  assert.equal(scoped.ok, false);
  // The stop check fails on that error.
  assert.match((await stopCheck({cwd: root})).reason, /^authentication\/change-login: invalid-unit /m);
});
