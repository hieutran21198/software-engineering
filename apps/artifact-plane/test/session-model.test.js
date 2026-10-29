// The model of the session pages and dialogs (src/session-model.js) of
// specifications/agent-orchestration.md: Workbench, Start rules, States, Output and Recovery.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLE_TERMINAL as SERVER_ROLE_TERMINAL} from '../server/session-api.js';
import {PLAN_APPROVAL, ROLE_TERMINAL, agentText, ago, diffLines, dodProgress, fileNote, fileTree, headerFacts, launchWarnings, outputSummary, phaseTarget, phoneOrder,
  profileChoices, reasonText, recoveryChoices, respawnBody, respawnProfiles, attemptAgent, sessionGroups, sessionTitle, stateView, taskLabel, waitingSessions, waitingText, worktreeChoices} from '../src/session-model.js';

const NOW = Date.parse('2026-10-29T12:00:00Z');
const CODEX = {id: 'codex-fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'};
const CLAUDE = {id: 'claude-opus', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'};
const session = (fields = {}) => ({id: '0123456789ab', repository: 'r', worktree: '/repo/wt', role: 'implementer', artifact: 'plane', change: 'change-sessions', task: '03-acp-adapter.md',
  branch: 'impl/acp', profile: CODEX, reportedModel: null, harnessSession: 'h-1', state: 'working', reason: null, startedAt: NOW - 4 * 60000, updatedAt: NOW, endedAt: null,
  attempt: {id: 'a-1', state: 'processing'}, agentStatus: null, error: null, hosted: true, relay: null, waitingTool: null, live: null, ...fields});
const task = (n, title, fields = {}) => ({id: `t${n}`, path: `docs/artifacts/plane/changes/change-sessions/tasks/0${n}-${title.toLowerCase().replace(/ /g, '-')}.md`, title, dependsOn: [], checked: 0, unchecked: 2, ...fields});
const snapshot = {
  repository: {path: '/repo'},
  artifacts: [
    {id: 'platform', title: 'Platform', currentVersion: null, dependsOn: [], proposedDependsOn: []},
    {id: 'store', title: 'Store', currentVersion: '1.0.0', dependsOn: [], proposedDependsOn: []},
    {id: 'plane', title: 'Plane', currentVersion: '1.0.0', dependsOn: ['store'], proposedDependsOn: ['store', 'platform']},
  ],
  workflow: {worktrees: [
    {path: '/repo', branch: 'main', availability: 'readable', changes: [{artifact: 'plane', name: 'change-sessions'}, {artifact: 'plane', name: 'change-old', delivered: true}]},
    {path: '/repo/wt', branch: 'impl/acp', availability: 'readable', changes: [{artifact: 'plane', name: 'change-sessions', taskGraph: {tasks: [task(1, 'Session store'), task(3, 'ACP adapter')]}}]},
    {path: '/repo/gone', branch: 'old', availability: 'missing', changes: []},
  ]},
};

test('stateView names each state with a status of the vocabulary and the texts of the mockups', () => {
  const view = fields => {const v = stateView(session(fields));return [v.status, v.text, v.row];};
  assert.deepEqual(view({state: 'starting'}), ['open', 'Starting', 'Starting']);
  assert.deepEqual(view({state: 'working'}), ['open', 'Working', 'Working']);
  assert.deepEqual(view({state: 'waiting', live: {pending: [{request: 'p1'}]}}), ['Incomplete', 'Waiting for you', 'Permission request']);
  assert.deepEqual(view({state: 'waiting', profile: CLAUDE}), ['Incomplete', 'Waiting for you', 'Waiting in the terminal']);
  assert.deepEqual(view({state: 'waiting', profile: CLAUDE, waitingTool: 'Bash'}), ['Incomplete', 'Waiting for you · permission', 'Waiting in the terminal']);
  assert.deepEqual(view({state: 'idle', attempt: {state: 'validating'}}), ['Passed', 'Validating', 'Validating']);
  assert.deepEqual(view({state: 'idle', attempt: null}), ['Unknown', 'Idle', 'Idle']);
  assert.deepEqual(view({state: 'interrupted', reason: 'process-exit'}), ['Failed', 'Interrupted · agent process exited', 'Interrupted']);
  assert.deepEqual(view({state: 'ended', reason: 'person'}), ['Unknown', 'Ended by you', 'Ended by you']);
  assert.deepEqual(view({state: 'ended', reason: 'error'}), ['Failed', 'Ended with an error', 'Ended with an error']);
  for (const reason of ['process-exit', 'runner-lost', 'pane-missing', 'max-tokens', 'max-turn-requests', 'cancelled']) assert.ok(reasonText(session({state: 'interrupted', reason})), reason);
  // Only the states in progress show a spinner in their badge.
  const busy = ['starting', 'working', 'waiting', 'idle', 'interrupted', 'ended'].filter(state => stateView(session({state, reason: 'person'})).busy);
  assert.deepEqual(busy, ['starting', 'working']);
});

test('the waiting count counts the sessions in state waiting', () => {
  const list = [session({state: 'waiting'}), session({state: 'working'}), session({state: 'waiting', profile: CLAUDE}), session({state: 'idle'})];
  assert.equal(waitingSessions(list).length, 2);
  assert.deepEqual([waitingText(1), waitingText(2)], ['1 session needs you', '2 sessions need you']);
});

test('the header, title and task label come from the session and the task graph of the snapshot', () => {
  const s = session();
  assert.equal(taskLabel(s, snapshot), '03 ACP adapter');
  assert.equal(taskLabel(session({task: '07-session-api.md'}), snapshot), '07 session api', 'a task outside the snapshot keeps its file name');
  assert.equal(sessionTitle(s, snapshot), 'Task 03 ACP adapter');
  assert.equal(sessionTitle(session({role: 'coordinator', task: null, profile: CLAUDE, change: 'change-unit-report'}), snapshot), 'Coordinator · change-unit-report');
  assert.equal(sessionTitle(session({role: 'coordinator', task: null, profile: CLAUDE, change: null, artifact: null}), snapshot), 'Coordinator');
  assert.deepEqual(headerFacts(s, NOW), {role: 'Implementer', agent: 'Codex · gpt-5-codex · low', signIn: 'own sign-in', connection: 'ACP', branch: 'impl/acp', started: 'started 4 min ago'});
  assert.equal(agentText(session({reportedModel: 'gpt-5.1-codex'})), 'Codex · gpt-5.1-codex · low', 'the reported model wins');
  assert.deepEqual([ago(NOW - 30000, NOW), ago(NOW - 3 * 3600000, NOW)], ['just now', '3 h ago']);
});

test('sessionGroups keeps the newest session of each task by change and the newest role session of each role and change', () => {
  const newest = session({id: 'a00000000001', task: '03-acp-adapter.md', startedAt: NOW});
  const older = session({id: 'a00000000002', task: '03-acp-adapter.md', startedAt: NOW - 1000, state: 'ended'});
  const first = session({id: 'a00000000003', task: '01-session-store.md'});
  const other = session({id: 'a00000000004', change: 'change-other', task: '01-x.md'});
  const lead = session({id: 'b00000000001', role: 'technical-lead', task: null, profile: CLAUDE});
  const leadOld = session({id: 'b00000000002', role: 'technical-lead', task: null, profile: CLAUDE, state: 'ended'});
  const coordinators = [session({id: 'c00000000001', role: 'coordinator', task: null, change: null, artifact: null, profile: CLAUDE}), session({id: 'c00000000002', role: 'coordinator', task: null, change: null, artifact: null, profile: CLAUDE})];
  const groups = sessionGroups([newest, older, first, other, lead, leadOld, ...coordinators]);
  assert.deepEqual(groups.changes.map(g => [g.key, g.rows.map(r => r.id)]), [['plane/change-sessions', ['a00000000003', 'a00000000001']], ['plane/change-other', ['a00000000004']]]);
  assert.deepEqual(groups.roles.map(r => r.id), ['b00000000001', 'c00000000001', 'c00000000002']);
  // The phone width shows the waiting sessions first, then the running and the stopped ones.
  assert.deepEqual(phoneOrder([session({id: 'x', state: 'ended'}), session({id: 'y', state: 'working'}), session({id: 'z', state: 'waiting'})]).map(s => s.id), ['z', 'y', 'x']);
});

test('the output summary, DoD progress and file tree follow the output reply', () => {
  const output = {base: 'b', commits: [{id: 'a41c9e2', subject: 'Add'}, {id: '7be0f13', subject: 'Map'}], truncated: false,
    files: [{path: 'apps/plane/test/acp.test.js', status: 'A', added: 96, removed: 0, binary: false, committed: false},
      {path: 'apps/plane/server/acp.js', status: 'A', added: 184, removed: 0, binary: false, committed: true},
      {path: 'apps/plane/server/store.js', status: 'M', added: 12, removed: 3, binary: false, committed: true}, {path: 'README.md', status: 'M', added: 1, removed: 1, binary: false, committed: true}],
    dod: {path: 't.md', checked: 2, unchecked: 3, items: [{text: 'a', checked: true}, {text: 'b', checked: true}, {text: 'c', checked: false}, {text: 'd', checked: false}, {text: 'e', checked: false}]}};
  assert.deepEqual(outputSummary(output), {files: 4, added: 293, removed: 4, commits: 2, uncommitted: 1, truncated: false});
  assert.deepEqual(dodProgress(output), {checked: 2, total: 5});
  assert.equal(dodProgress({dod: null}), null);
  assert.deepEqual(fileTree(output.files).map(g => [g.dir, g.files.map(f => f.name)]), [['', ['README.md']], ['apps/plane/server/', ['acp.js', 'store.js']], ['apps/plane/test/', ['acp.test.js']]]);
  assert.deepEqual([fileNote(output.files[0]), fileNote(output.files[2])], ['Added · not committed', 'Modified · committed']);
});

test('diffLines reads hunks, numbers and the no-newline note of a unified Git diff', () => {
  const diff = 'diff --git a/x.js b/x.js\nindex 1..2 100644\n--- a/x.js\n+++ b/x.js\n@@ -1,3 +1,3 @@ export\n one\n-two\n+TWO\n three\n\\ No newline at end of file\n';
  assert.deepEqual(diffLines(diff).map(l => [l.kind, l.text, l.before, l.after]), [
    ['hunk', '@@ -1,3 +1,3 @@ export', null, null], ['equal', 'one', 1, 1], ['remove', 'two', 2, null], ['add', 'TWO', null, 2], ['equal', 'three', 3, 3], ['note', 'No newline at end of file', null, null]]);
  // An untracked file: all lines added; the --- and +++ header lines are not content.
  assert.deepEqual(diffLines('diff --git a/n b/n\nnew file mode 100644\n--- /dev/null\n+++ b/n\n@@ -0,0 +1,2 @@\n+---\n+a\n').map(l => [l.kind, l.text, l.after]), [['hunk', '@@ -0,0 +1,2 @@', null], ['add', '---', 1], ['add', 'a', 2]]);
});

test('launchWarnings names unchecked prerequisite items, upstream artifacts without an established version and the plan approval sentence', () => {
  const tasks = [task(1, 'Session store', {checked: 3, unchecked: 1}), task(2, 'Profiles', {checked: 2, unchecked: 0}), task(3, 'ACP adapter', {dependsOn: ['t1', 't2']})];
  assert.deepEqual(launchWarnings({role: 'implementer', task: tasks[2], tasks, artifact: 'plane', snapshot}), [
    'Prerequisite task 01 Session store has 1 unchecked DoD item.',
    'Upstream artifact Platform has no established version.',
    `${PLAN_APPROVAL} Start only a task of an approved plan.`]);
  assert.deepEqual(launchWarnings({role: 'technical-lead', artifact: 'store', snapshot}), [PLAN_APPROVAL]);
  assert.equal(PLAN_APPROVAL, 'Plane does not record plan approval.');
});

test('profileChoices selects the role default, keeps invalid profiles visible with their reason and refuses ACP profiles for role sessions with the text of rule 5', () => {
  const data = {settings: {version: 1, roleDefaults: {implementer: 'codex-fast', coordinator: 'claude-opus'}, profiles: [CODEX, CLAUDE, {...CODEX, id: 'bypass', args: ['--yolo']}]},
    validity: {profiles: [{valid: true, reasons: []}, {valid: true, reasons: []}, {valid: false, reasons: ['The argument --yolo skips permission prompts.']}]}};
  const implementer = profileChoices(data, 'implementer');
  assert.equal(implementer.selected, 'codex-fast');
  assert.deepEqual(implementer.choices.map(c => [c.id, c.isDefault, c.reason]), [['codex-fast', true, null], ['claude-opus', false, null], ['bypass', false, 'The argument --yolo skips permission prompts.']]);
  assert.deepEqual(implementer.choices[0].chips, ['Codex', 'ACP', 'Own sign-in', 'gpt-5-codex · low']);
  const lead = profileChoices(data, 'technical-lead');
  assert.equal(lead.selected, 'claude-opus', 'without a default, the first profile that can start');
  assert.deepEqual(lead.choices.map(c => [c.id, c.reason]), [['claude-opus', null], ['codex-fast', ROLE_TERMINAL], ['bypass', 'The argument --yolo skips permission prompts.']]);
  assert.equal(ROLE_TERMINAL, SERVER_ROLE_TERMINAL, 'the dialog shows the refusal text of the server');
  assert.deepEqual(profileChoices(null, 'coordinator'), {choices: [], selected: null});
  // Respawn with another profile offers the profiles that can start, without the session profile.
  assert.deepEqual(respawnProfiles(data, session()).map(c => c.id), ['claude-opus']);
});

test('worktreeChoices lists the readable worktrees and marks main and master, and phaseTarget finds the change of a coordinator', () => {
  assert.deepEqual(worktreeChoices(snapshot, '/repo'), [{path: '/repo', label: 'Repository root · main', protected: true}, {path: '/repo/wt', label: 'wt · impl/acp', protected: false}]);
  assert.deepEqual(phaseTarget(session({role: 'technical-lead'}), snapshot), {artifact: 'plane', change: 'change-sessions'});
  // A coordinator without a change: the current change of its worktree when exactly one exists (amendment 4).
  const coordinator = session({role: 'coordinator', change: null, artifact: null, task: null, worktree: '/repo'});
  assert.deepEqual(phaseTarget(coordinator, snapshot), {artifact: 'plane', change: 'change-sessions'});
  const two = {...snapshot, workflow: {worktrees: [{path: '/repo', availability: 'readable', changes: [{artifact: 'plane', name: 'change-a'}, {artifact: 'plane', name: 'change-b'}]}]}};
  assert.equal(phaseTarget(coordinator, two), null);
  assert.equal(phaseTarget({...coordinator, worktree: '/repo/gone'}, snapshot), null);
});

test('recoveryChoices follow the Recovery table, and a respawn keeps the role and change', () => {
  assert.equal(recoveryChoices(session({state: 'working'})), null);
  assert.equal(recoveryChoices(session({state: 'idle'})), null, 'an idle session continues');
  const acp = recoveryChoices(session({state: 'interrupted', live: {protocolVersion: 1, resumable: true}}));
  assert.match(acp.resume, /session loading/);
  assert.equal(recoveryChoices(session({state: 'interrupted', live: {protocolVersion: 2, resumable: false}})).resume, null, 'resume unavailable');
  assert.equal(recoveryChoices(session({state: 'interrupted', harnessSession: null})).resume, null);
  assert.match(recoveryChoices(session({state: 'interrupted', profile: CLAUDE})).resume, /Claude Code opens the same conversation/);
  assert.equal(recoveryChoices(session({state: 'interrupted', profile: {...CLAUDE, harness: 'codex'}})).resume, null, 'other terminal tools only respawn');
  assert.equal(recoveryChoices(session({state: 'ended', live: {resumable: true}})).resume, null, 'an ended session respawns');
  assert.deepEqual(respawnBody(session({state: 'ended'}), 'claude-opus'), {path: '/repo/wt', role: 'implementer', profile: 'claude-opus', artifact: 'plane', change: 'change-sessions', task: '03-acp-adapter.md', respawnOf: '0123456789ab'});
  assert.deepEqual(respawnBody(session({role: 'technical-lead', task: null, state: 'ended'}), 'claude-opus'), {path: '/repo/wt', role: 'technical-lead', profile: 'claude-opus', artifact: 'plane', change: 'change-sessions'}, 'a role session starts without respawnOf');
  assert.deepEqual(respawnBody(session({role: 'coordinator', task: null, change: null, artifact: null, state: 'ended'}), 'claude-opus', 'Again.'), {path: '/repo/wt', role: 'coordinator', profile: 'claude-opus', request: 'Again.'});
});

test('attemptAgent names the harness tool and model of an attempt from its Plane session, else the reported model', () => {
  const sessions = [session({attempt: {id: 'a-1'}})];
  assert.equal(attemptAgent({id: 'a-1'}, sessions), 'Codex · gpt-5-codex · low');
  assert.equal(attemptAgent({id: 'a-2', model: 'claude-opus-5-5'}, sessions), 'claude-opus-5-5');
  assert.equal(attemptAgent({id: 'a-3'}, sessions), null);
});
