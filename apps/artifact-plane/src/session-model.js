// The model of the session pages and dialogs of artifact-plane specifications/agent-orchestration.md
// (Workbench, Start rules, States, Output, Recovery, Embedded terminal). Plain functions over
// the replies of the session routes, the settings query and the repository snapshot.
import {CATALOG, ROLE_TERMINAL} from './launch-catalog.js';
import {ROLE_LABELS, ROLE_SESSIONS, harnessLabel, profileName, roleDefaultsOf} from './agent-settings-model.js';
import {isCurrent} from './work-model.js';

export {ROLE_LABELS, ROLE_TERMINAL};
export const PLAN_APPROVAL = 'Plane does not record plan approval.';
export const UNSEEN_WAIT = 'Plane cannot see when this agent waits.';
export const ON_COMPUTER = 'Open this session on a computer';
const ACTIVE = new Set(['starting', 'working', 'waiting', 'idle']);
export const isActive = session => ACTIVE.has(session.state);
export const isRole = session => ROLE_SESSIONS.includes(session.role);
export const isTerminal = session => session.profile?.connection === 'terminal';

// The reasons of `session:interrupted` and `session:ended` (Lifecycle events) as text.
const INTERRUPTED = {'process-exit': 'agent process exited', 'runner-lost': 'session runner stopped', 'pane-missing': 'terminal pane closed',
  'max-tokens': 'token limit reached', 'max-turn-requests': 'turn request limit reached', cancelled: 'turn cancelled'};
export const reasonText = session => session.state === 'interrupted' ? INTERRUPTED[session.reason] || null
  : session.state === 'ended' ? (session.reason === 'error' ? 'ended with an error' : 'ended by you') : null;

// The state of a session as a status name of the vocabulary (src/glossary.js) and texts:
// `text` for the session page, `row` for a row of the Sessions page.
export function stateView(session) {
  switch (session.state) {
    case 'starting': return {status: 'open', text: 'Starting', row: 'Starting'};
    case 'working': return {status: 'open', text: 'Working', row: 'Working'};
    case 'waiting':
      if (isTerminal(session)) return {status: 'Incomplete', text: session.waitingTool ? 'Waiting for you · permission' : 'Waiting for you', row: 'Waiting in the terminal'};
      return {status: 'Incomplete', text: 'Waiting for you', row: session.live?.pending?.length ? 'Permission request' : 'Waiting for you'};
    case 'idle':
      if (session.attempt?.state === 'validating') return {status: 'Passed', text: 'Validating', row: 'Validating'};
      if (session.attempt?.state === 'done') return {status: 'Passed', text: 'Done (reported)', row: 'Done (reported)'};
      return {status: 'Unknown', text: 'Idle', row: 'Idle'};
    case 'interrupted': {
      const reason = reasonText(session);
      return {status: 'Failed', text: reason ? `Interrupted · ${reason}` : 'Interrupted', row: 'Interrupted'};
    }
    case 'ended': return session.reason === 'error' ? {status: 'Failed', text: 'Ended with an error', row: 'Ended with an error'} : {status: 'Unknown', text: 'Ended by you', row: 'Ended by you'};
    default: return {status: 'Unknown', text: 'Unknown', row: 'Unknown'};
  }
}

// The sessions that wait for the person (Workbench: the top bar count).
export const waitingSessions = sessions => sessions.filter(s => s.state === 'waiting');
export const waitingText = n => `${n} ${n === 1 ? 'session needs' : 'sessions need'} you`;

// "just now", "4 min ago", "2 h ago" or the date of a time in milliseconds.
export function ago(ms, now = Date.now()) {
  const seconds = (now - ms) / 1000;
  if (!Number.isFinite(seconds)) return 'at an unknown time';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `on ${new Date(ms).toLocaleDateString()}`;
}
// "4 min", "2 h" or "3 d": the time since a start.
export function duration(ms, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - ms) / 60000));
  return minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 1440)} d`;
}

// The model of a session: the reported model when known, else the profile model, then the level.
export const modelOf = session => [session.reportedModel || session.profile?.model, session.profile?.reasoning].filter(Boolean).join(' · ');
// "Codex · gpt-5-codex · low": the harness tool and the model.
export const agentText = session => [harnessLabel(session.profile?.harness), modelOf(session)].filter(Boolean).join(' · ');
const SIGN_IN = {plan: 'plan sign-in', 'api-key': 'API key', harness: 'own sign-in'};
// The header line of a session page: role, harness tool, model, sign-in, connection, branch and start.
export function headerFacts(session, now = Date.now()) {
  return {
    role: ROLE_LABELS[session.role] || session.role,
    agent: agentText(session),
    signIn: SIGN_IN[session.profile?.signIn] || null,
    connection: session.profile?.connection === 'acp' ? 'ACP' : 'terminal',
    branch: session.branch || null,
    started: `started ${ago(session.startedAt, now)}`,
  };
}

const taskFile = session => `docs/artifacts/${session.artifact}/changes/${session.change}/tasks/${session.task}`;
const number = path => path.split('/').at(-1).match(/^(\d+)-/)?.[1] || null;
// The listed task of an implementer session in any worktree of the snapshot, or null.
export function sessionTask(session, snapshot) {
  if (!session.task) return null;
  const path = taskFile(session);
  for (const worktree of snapshot?.workflow?.worktrees || [])
    for (const change of worktree.changes || []) {
      const task = (change.taskGraph?.tasks || []).find(t => t.path === path);
      if (task) return task;
    }
  return null;
}
// "03 ACP adapter": the task number and title, or the file name without the snapshot task.
export function taskLabel(session, snapshot) {
  const task = sessionTask(session, snapshot), id = number(session.task || '');
  if (task?.title) return [id, task.title].filter(Boolean).join(' ');
  return (session.task || '').replace(/\.md$/, '').replace(/^(\d+)-/, '$1 ').replace(/-/g, ' ');
}
// The title of a session page: "Task 03 ACP adapter" or "Coordinator · change-unit-report".
export function sessionTitle(session, snapshot) {
  if (session.role === 'implementer') return `Task ${taskLabel(session, snapshot)}`;
  return [ROLE_LABELS[session.role] || session.role, session.change].filter(Boolean).join(' · ');
}

// The groups of the Sessions page: the newest session of each implementation task, grouped by
// change, and the newest role session of each role and change (a coordinator without a change
// keeps each session). Sessions come newest first (the query order).
export function sessionGroups(sessions) {
  const changes = new Map(), roles = new Map();
  for (const session of sessions) {
    if (session.role === 'implementer') {
      const key = `${session.artifact}/${session.change}`;
      if (!changes.has(key)) changes.set(key, {key, artifact: session.artifact, change: session.change, rows: new Map()});
      const rows = changes.get(key).rows;
      if (!rows.has(session.task)) rows.set(session.task, session);
    } else {
      const key = session.change ? `${session.role}:${session.artifact}/${session.change}` : session.id;
      if (!roles.has(key)) roles.set(key, session);
    }
  }
  const byTask = (a, b) => (a.task || '').localeCompare(b.task || '', undefined, {numeric: true});
  return {
    changes: [...changes.values()].map(g => ({...g, rows: [...g.rows.values()].sort(byTask)})),
    roles: [...roles.values()],
  };
}
// The order of the phone width: the waiting sessions first, then the running and the stopped ones.
export function phoneOrder(rows) {
  const rank = s => s.state === 'waiting' ? 0 : isActive(s) ? 1 : 2;
  return [...rows].sort((a, b) => rank(a) - rank(b) || b.startedAt - a.startedAt);
}

// The output summary of a session: changed files, added and removed lines, commits and
// uncommitted files (Output).
export function outputSummary(output) {
  if (!output) return null;
  const files = output.files || [];
  return {files: files.length, added: files.reduce((n, f) => n + (f.added || 0), 0), removed: files.reduce((n, f) => n + (f.removed || 0), 0),
    commits: (output.commits || []).length, uncommitted: files.filter(f => !f.committed).length, truncated: Boolean(output.truncated)};
}
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
// The DoD progress of the task of an implementer session: {checked, total} or null.
export function dodProgress(output) {
  const dod = output?.dod;
  if (!dod || !Array.isArray(dod.items)) return null;
  return {checked: dod.items.filter(i => i.checked).length, total: dod.items.length};
}

// The changed files as a tree: one group for each directory, in path order. `name` is the
// path inside the directory.
export function fileTree(files) {
  const groups = new Map();
  for (const file of [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) {
    const at = file.path.lastIndexOf('/'), dir = at < 0 ? '' : file.path.slice(0, at + 1);
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push({...file, name: file.path.slice(at + 1)});
  }
  return [...groups].map(([dir, list]) => ({dir, files: list}));
}
const STATUS_TEXT = {A: 'Added', M: 'Modified', D: 'Deleted', R: 'Renamed'};
// "Added · not committed": the status of a changed file.
export const fileNote = file => `${STATUS_TEXT[file.status] || 'Modified'} · ${file.committed ? 'committed' : 'not committed'}`;

// The lines of a unified Git diff: hunk headers and lines with their numbers before and after.
// The file header lines (diff, index, ---, +++, mode) are left out.
export function diffLines(text) {
  const result = [];let before = 0, after = 0, inHunk = false;
  for (const line of (text || '').split('\n')) {
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {before = Number(hunk[1]);after = Number(hunk[2]);inHunk = true;result.push({kind: 'hunk', text: line, before: null, after: null});continue;}
    if (!inHunk) continue;
    if (line.startsWith('+')) result.push({kind: 'add', text: line.slice(1), before: null, after: after++});
    else if (line.startsWith('-')) result.push({kind: 'remove', text: line.slice(1), before: before++, after: null});
    else if (line.startsWith(' ')) result.push({kind: 'equal', text: line.slice(1), before: before++, after: after++});
    else if (line.startsWith('\\')) result.push({kind: 'note', text: line.slice(2), before: null, after: null});
    else if (line.startsWith('diff ')) inHunk = false;
  }
  return result;
}

// The warnings of the start rules that the launch dialog shows (Start rules): unchecked DoD
// items of the prerequisite tasks, upstream artifacts without an established version, and the
// plan approval sentence. They are facts that the person confirms, not gates of Plane.
export function launchWarnings({role, task = null, tasks = [], artifact = null, snapshot = null}) {
  const warnings = [];
  if (role === 'implementer' && task) {
    for (const id of task.dependsOn || []) {
      const prerequisite = tasks.find(t => t.id === id);
      if (prerequisite?.unchecked > 0) warnings.push(`Prerequisite task ${[number(prerequisite.path), prerequisite.title].filter(Boolean).join(' ')} has ${plural(prerequisite.unchecked, 'unchecked DoD item')}.`);
    }
  }
  const owner = snapshot?.artifacts?.find(a => a.id === artifact);
  if (owner) for (const id of [...new Set([...(owner.dependsOn || []), ...(owner.proposedDependsOn || [])])]) {
    const upstream = snapshot.artifacts.find(a => a.id === id);
    if (!upstream?.currentVersion) warnings.push(`Upstream artifact ${upstream?.title || id} has no established version.`);
  }
  warnings.push(role === 'implementer' ? `${PLAN_APPROVAL} Start only a task of an approved plan.` : PLAN_APPROVAL);
  return warnings;
}

// The profiles of the launch dialog for a role: each profile with its chips, its default mark,
// and the reason why it cannot start (invalid, or an ACP profile for a role session; Validity,
// start rule 5). `selected` is the role default when it can start, else the first that can.
export function profileChoices(data, role) {
  const settings = data?.settings, validity = data?.validity, defaults = roleDefaultsOf(settings), list = Array.isArray(settings?.profiles) ? settings.profiles : [];
  const choices = list.map((profile, index) => ({profile, index})).filter(({profile}) => profile && typeof profile === 'object').map(({profile, index}) => {
    const check = validity?.profiles?.[index];
    const reason = check && !check.valid ? check.reasons.join(' ') : ROLE_SESSIONS.includes(role) && profile.connection !== 'terminal' ? ROLE_TERMINAL : null;
    return {id: profile.id, name: profileName(profile), profile, isDefault: defaults[role] === profile.id, reason,
      chips: [harnessLabel(profile.harness), profile.connection === 'acp' ? 'ACP' : 'Terminal', {plan: 'Plan sign-in', 'api-key': 'API key', harness: 'Own sign-in'}[profile.signIn] || profile.signIn,
        [profile.model, profile.reasoning].filter(Boolean).join(' · ')].filter(Boolean)};
  });
  const usable = choices.filter(c => !c.reason);
  // A role session runs in a terminal; it lists the terminal profiles first.
  const ordered = ROLE_SESSIONS.includes(role) ? [...usable, ...choices.filter(c => c.reason)] : choices;
  return {choices: ordered, selected: (usable.find(c => c.isDefault) || usable[0])?.id || null};
}

// The readable worktrees of the repository for the worktree select of the launch dialogs. The
// snapshot lists the changes of the selected worktree only, so the server checks that the change
// is current in the chosen worktree (start rules 3 and 4). `root` is the repository root checkout.
export function worktreeChoices(snapshot, root) {
  return (snapshot?.workflow?.worktrees || []).filter(w => w.availability === 'readable').map(w => ({path: w.path, label: worktreeLabel(w, root), protected: !w.branch || w.detached || ['main', 'master'].includes(w.branch)}));
}
export function worktreeLabel(worktree, root) {
  const branch = worktree.detached ? 'detached HEAD' : worktree.branch || 'no branch';
  const where = worktree.path === root ? 'Repository root' : root && worktree.path.startsWith(root + '/') ? worktree.path.slice(root.length + 1) : worktree.path;
  return `${where} · ${branch}`;
}

// The change whose phases a session page shows: the change of the session, or for a
// coordinator without a change the current change of its worktree when exactly one exists.
export function phaseTarget(session, snapshot) {
  if (session.change) return {artifact: session.artifact, change: session.change};
  if (session.role !== 'coordinator') return null;
  const worktree = (snapshot?.workflow?.worktrees || []).find(w => w.path === session.worktree);
  const current = (worktree?.changes || []).filter(isCurrent);
  return current.length === 1 ? {artifact: current[0].artifact, change: current[0].name} : null;
}

// The choices of the Recovery table for a session, or null while it runs. `resume` is the
// text of Resume when it is available.
export function recoveryChoices(session) {
  if (!['interrupted', 'ended'].includes(session.state)) return null;
  const harness = harnessLabel(session.profile?.harness);
  let resume = null;
  if (session.state === 'interrupted' && session.harnessSession) {
    if (isTerminal(session)) {
      if (CATALOG[session.profile.harness]?.terminal?.resume) resume = `${harness} opens the same conversation again in a new terminal pane, and the session continues.`;
    } else if (session.live?.resumable !== false) {
      const version = session.live?.protocolVersion;
      resume = version === 1 ? `${harness} offers session loading. The agent replays its history, and the attempt continues.`
        : version === 2 ? `${harness} offers session resume. The agent replays its history, and the attempt continues.`
        : `Plane starts the agent again and asks it to resume the same session. When the agent cannot resume, respawn it.`;
    }
  }
  return {resume, respawn: session.role === 'implementer' ? 'A new session and attempt start from the task, its branch and the change brief.'
    : session.change ? `A new ${(ROLE_LABELS[session.role] || session.role).toLowerCase()} session starts for the same change.`
    : 'A new coordinator session starts. Plane keeps no copy of your request, so write it again.'};
}
// The start body of a respawn (Recovery): an implementer names the earlier session; a role
// session starts with the same role and change, without respawnOf.
export function respawnBody(session, profile, request = undefined) {
  const body = {path: session.worktree, role: session.role, profile};
  if (session.change) Object.assign(body, {artifact: session.artifact, change: session.change});
  if (session.role === 'implementer') Object.assign(body, {task: session.task, respawnOf: session.id});
  else if (!session.change && request !== undefined) body.request = request;
  return body;
}
// The profiles that a respawn with another profile offers: the profiles that can start for the
// role, without the profile of the session.
export function respawnProfiles(data, session) {
  return profileChoices(data, session.role).choices.filter(c => !c.reason && c.id !== session.profile?.id);
}

// The harness tool and model of an attempt in the task runtime details: from the Plane session
// that holds the attempt, else the model that a hook reported.
export function attemptAgent(attempt, sessions = []) {
  const session = sessions.find(s => s.attempt?.id === attempt.id);
  if (session) return agentText(session);
  return attempt.model || null;
}
