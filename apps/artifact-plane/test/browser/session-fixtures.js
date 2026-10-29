// Session fixtures for browser tests (specifications/agent-orchestration.md: Workbench, Commands,
// States, Embedded terminal, Output). Each fixture starts a server in the test process with an
// injected fake runner client, a private state directory, a settings file outside the repository
// and a stub relay page on a UNIX socket. The fake runner writes the session records and
// lifecycle events to the runtime store as the runner does, and pushes stream events. No test
// starts a harness program, the session runner, herdr or ttyd.
import {mkdir, mkdtemp, realpath, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import pkg from '../../package.json' with {type: 'json'};
import {createSettingsService} from '../../server/agent-settings.js';
import {createAppServer} from '../../server/http.js';
import {RunnerError} from '../../server/runner-client.js';
import {RuntimeStore} from '../../server/runtime-store.js';
import {createSessionService} from '../../server/session-api.js';
import {fixtureRepository, git, identity, versionRecord} from '../fixtures.js';
import {writeSettingsFile} from './settings-fixtures.js';

export const PROFILES = {
  codex: {id: 'codex-fast', label: 'Codex fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'},
  gemini: {id: 'gemini-flash', label: 'Gemini Flash', harness: 'gemini-cli', connection: 'acp', signIn: 'harness', model: 'gemini-2.5-flash'},
  sonnet: {id: 'claude-sonnet-api', label: 'Claude Sonnet (API key)', harness: 'claude-code', connection: 'acp', signIn: 'api-key', model: 'sonnet'},
  opus: {id: 'claude-opus-terminal', label: 'Claude Opus (terminal)', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'},
  codexTerminal: {id: 'codex-frontier-terminal', label: 'Codex frontier (terminal)', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-5', reasoning: 'high'},
};
export const SETTINGS = {version: 1, terminal: {open: ['ghostty', '-e']},
  roleDefaults: {coordinator: 'claude-opus-terminal', 'product-owner': 'claude-opus-terminal', 'technical-lead': 'claude-opus-terminal', implementer: 'codex-fast'},
  profiles: [PROFILES.codex, PROFILES.gemini, PROFILES.sonnet, PROFILES.opus, PROFILES.codexTerminal]};

const selfChecked = (title, anchor, body) => `---\nself_check:\n  result: passed\n  source: ${anchor}\n---\n# ${title}\n\n${body}\n\n## Self-check\n\nThe document is complete.\n`;
const task = (id, title, dependsOn, items) => `---\nid: ${id}\ndepends_on: [${dependsOn.join(', ')}]\n---\n# ${title}\n\n## Definition of Done\n\n${items.map(([done, text]) => `- [${done ? 'x' : ' '}] ${text}`).join('\n')}\n\n## Evidence\n\nNone yet.\n`;
const plane = 'docs/artifacts/plane/', change = `${plane}changes/change-sessions/`, reports = 'docs/artifacts/reports/';
// A repository with two in-place artifacts. Plane depends on Platform, which has no established
// version. The change plane/change-sessions is in its Implementation phase with four tasks;
// reports/change-unit-report is in its Requirement phase.
export function sessionRepository() {
  return new Map([
    ['docs/artifacts/platform/README.md', identity('Platform', null)],
    [`${plane}README.md`, identity('Artifact Plane', '1.0.0', ['platform'])],
    [`${plane}versions/1.0.0/README.md`, versionRecord('change-initial')],
    [`${plane}changes/change-initial/README.md`, '# Initial\n\nThe first version.\n'],
    [`${plane}changes/change-initial/tasks/README.md`, '---\ntasks: []\n---\n# Plan\n'],
    [`${plane}requirements/sessions.md`, selfChecked('Agent session requirements', `${plane}requirements/sessions.md#self-check`, '- S1: A person starts an agent session from the workbench.')],
    [`${plane}specifications/sessions.md`, selfChecked('Agent session contract', `${plane}specifications/sessions.md#self-check`, 'The runner hosts the adapters.')],
    [`${change}README.md`, '# Run ADD sessions across harness tools\n\nReason and scope.\n'],
    [`${change}tasks/README.md`, `---\ntasks: [01-session-store.md, 02-launch-profiles.md, 03-acp-adapter.md, 04-terminal-adapter.md]\nself_check:\n  result: passed\n  source: ${change}tasks/README.md#plan-self-check\n---\n# Plan\n\n## Plan self-check\n\nEvery task has a DoD.\n`],
    [`${change}tasks/01-session-store.md`, task('session-store', 'Session store', [], [[1, 'Create the sessions table.'], [1, 'Keep schema version 1.'], [1, 'Store no message text.'], [0, 'Record the evidence.']])],
    [`${change}tasks/02-launch-profiles.md`, task('launch-profiles', 'Launch profiles', [], [[1, 'Read the settings file.'], [1, 'Validate the profiles.'], [0, 'Refuse bypass options.'], [0, 'Record the evidence.']])],
    [`${change}tasks/03-acp-adapter.md`, task('acp-adapter', 'ACP adapter', ['session-store', 'launch-profiles'], [[1, 'Implement the JSON-RPC client with version negotiation.'], [1, 'Map session updates to lifecycle events without message text.'],
      [0, 'Keep permission requests pending until the person answers.'], [0, 'Support session/load and session/resume.'], [0, 'Run the adapter tests and record evidence.']])],
    [`${change}tasks/04-terminal-adapter.md`, task('terminal-adapter', 'Terminal adapter', ['session-store'], [[1, 'Start a herdr pane.'], [0, 'Follow the herdr status.'], [0, 'Stop the pane.'], [0, 'Record the evidence.']])],
    [`${reports}README.md`, identity('Reports', null)],
    [`${reports}changes/change-unit-report/README.md`, '# Unit progress report\n\nReason and scope.\n'],
    [`${reports}changes/change-unit-report/tasks/README.md`, '---\ntasks: []\n---\n# Plan\n'],
    ['apps/plane/server/runtime-store.js', 'export class RuntimeStore {\n  constructor() {}\n  close() {}\n}\n'],
  ]);
}

// The page of the stub relay: a dark terminal with a text field that takes the keys.
const terminalPage = text => `<!doctype html><html><head><meta charset="utf-8"><title>Terminal</title><style>
html,body{margin:0;height:100%;background:#16181c;color:#d7dae0;font:13px/20px "IBM Plex Mono",ui-monospace,monospace}
pre{margin:0;padding:12px 16px;white-space:pre-wrap}.dim{color:#8a9099}.you{color:#8ab4ff}.ok{color:#7fd19b}.box{display:block;border:1px solid #e3b866;padding:8px 12px;margin:8px 0}
textarea{position:absolute;left:-9999px;width:1px;height:1px}</style></head><body><pre>${text}</pre><textarea aria-label="Terminal input"></textarea></body></html>`;
export const TERMINAL_TEXT = `<span class="dim">Claude Code · opus · ~/reports</span>

<span class="you">› Export the progress of one unit of work as a PDF for the customer.</span>

● I read the unit and its changes. Three questions before I write the Requirement:
  1. One unit, or several units in one report?
  2. Do you hide branch names and commit IDs from the customer?
  3. Is a browser print enough, or do you need a downloaded file?

<span class="you">› 1. One unit. 2. Yes. 3. A downloaded file.</span>

● <span class="ok">Created</span> branch claude/unit-report and change reports/change-unit-report.
● Requirements UR1–UR6 are written and their self-check passed. Shall I continue with the Specification?

<span class="you">› </span>`;
export const PERMISSION_TEXT = `<span class="dim">Claude Code · opus · ~/reports</span>

● Requirements UR1–UR6 are written. I commit the Requirement phase.
<span class="box"><b>Bash command</b>
  git add docs/artifacts &amp;&amp; git commit -m "Requirement: unit progress report"
<span class="dim">  Commit the Requirement phase</span>
Do you want to proceed?
<span class="ok">❯ 1. Yes</span>
  2. Yes, and don't ask again for git commit commands in this project
  3. No, and tell Claude what to do differently <span class="dim">(esc)</span></span>`;

// A runner client that records the calls, writes the session records and lifecycle events to
// the store as the runner does (States), keeps the live state of ACP sessions in memory and
// pushes stream events. `update` changes a session as the runner would after a signal.
export class FakeRunner {
  constructor(store, relaySocket) {
    Object.assign(this, {store, relaySocket, version: pkg.version, connected: false, fail: null});
    this.calls = [];this.listeners = new Map();this.seqs = new Map();this.extra = new Map();this.lives = new Map();
  }
  hello() {return {version: this.version, sessions: []};}
  async ensure() {this.connected = true;return this.hello();}
  async check() {return this.connected ? this.hello() : null;}
  async availability() {return {available: true, running: this.connected, version: this.version, compatible: true, reason: null};}
  view(id) {
    const {attempt, ...record} = this.store.session(id), running = !['interrupted', 'ended'].includes(record.state);
    return {...record, attempt, agentStatus: null, error: null, hosted: running, relay: record.profile.connection === 'terminal' && running ? {available: true, reason: null} : null, ...this.extra.get(id)};
  }
  live(id) {return this.store.session(id)?.profile.connection === 'acp' ? {lastMessage: null, pending: [], protocolVersion: 1, resumable: true, ...this.lives.get(id)} : null;}
  push(id, event, update) {
    const seq = (this.seqs.get(id) ?? 0) + 1;this.seqs.set(id, seq);
    for (const listener of this.listeners.get(id) ?? []) listener({event, session: id, seq, update});
  }
  // Changes a session: `record` fields (state, reason, harnessSession, …) with lifecycle
  // `events` and the attempt `change`, the view fields `extra` (agentStatus, relay, error) and
  // the live state `live` of an ACP session.
  update(id, {record = {}, events = [], change = null, extra, live} = {}) {
    const {attempt, ...stored} = this.store.session(id), now = Date.now();
    const next = {...stored, ...record, updatedAt: now, ...(['ended'].includes(record.state) ? {endedAt: now} : {})};
    this.store.recordSession({...next, attempt}, {events, change});
    if (extra) this.extra.set(id, {...this.extra.get(id), ...extra});
    if (live) {this.lives.set(id, {...this.lives.get(id), ...live});this.push(id, 'live', this.live(id));}
    this.push(id, 'state', this.view(id));
    for (const event of events) if (event.kind === 'session:output-changed') this.push(id, 'lifecycle', {kind: 'session:output-changed'});
    return this.view(id);
  }
  async start(params) {
    this.calls.push(['start', params]);
    if (this.fail) throw this.fail;
    const {session: id, worktree, role, profile, artifact, change, task, branch, attempt, respawnOf} = params, now = Date.now();
    const record = {id, repository: this.store.repository(worktree, true).id, worktree, role, artifact, change, task, branch,
      profile: {id: profile.id, harness: profile.harness, connection: profile.connection, signIn: profile.signIn, model: profile.model, reasoning: profile.reasoning ?? null},
      reportedModel: null, harnessSession: null, pane: null, tab: null, baseRevision: git(worktree, 'rev-parse', 'HEAD'), state: 'starting', reason: null, startedAt: now, updatedAt: now, endedAt: null, respawnOf};
    this.store.recordSession({...record, attempt}, {events: [{kind: 'session:started', role, profile: profile.id, harness: profile.harness, connection: profile.connection, model: profile.model}], change: {state: 'unknown'}});
    return {session: this.view(id)};
  }
  #command(method, id, ...args) {
    this.calls.push([method, id, ...args]);
    if (this.fail) throw this.fail;
    if (!this.store.session(id)) throw new RunnerError('unknown-session', 'The session is unknown.');
  }
  async prompt(id, text) {this.#command('prompt', id, text);return {session: this.update(id, {record: {state: 'working'}, events: [{kind: 'session:prompted', source: 'person'}], change: {state: 'processing'}})};}
  async answer(id, request, option) {
    this.#command('answer', id, request, option);
    const pending = (this.lives.get(id)?.pending || []).filter(p => p.request !== request);
    return {session: this.update(id, {record: {state: pending.length ? 'waiting' : 'working'}, events: [{kind: 'session:permission-answered', request, optionKind: 'allow_once'}], change: {state: 'processing'}, live: {pending}})};
  }
  async cancel(id) {this.#command('cancel', id);return {session: this.update(id, {record: {state: 'idle', reason: 'cancelled'}, events: [{kind: 'session:turn-ended', stopReason: 'cancelled'}], change: {state: 'interrupted'}, live: {pending: []}})};}
  async resume(id, extra) {this.#command('resume', id, extra);return {session: this.update(id, {record: {state: 'working', reason: null}, events: [{kind: 'session:resumed', method: 'load'}], change: {state: 'processing'}})};}
  async end(id) {this.#command('end', id);return {session: this.update(id, {record: {state: 'ended', reason: 'person'}, events: [{kind: 'session:ended', reason: 'person'}], change: {end: true}})};}
  async openTerminal(id, open) {this.#command('openTerminal', id, open);return {pid: null};}
  async snapshot(id) {return {seq: this.seqs.get(id) ?? 0, session: this.view(id), live: this.live(id)};}
  async subscribe(id, listener) {
    let set = this.listeners.get(id);
    if (!set) this.listeners.set(id, set = new Set());
    set.add(listener);
    return async () => {set.delete(listener);};
  }
  async call(method, params) {
    this.calls.push([method, params]);
    if (method === 'relayViewers') return {};
    if (method !== 'relay') throw new RunnerError('unknown-method', 'Unknown method.');
    const session = this.store.session(params.session);
    if (!session || session.profile.connection !== 'terminal') throw new RunnerError('unknown-session', 'The session is unknown.');
    if (this.extra.get(params.session)?.relay?.available === false) throw new RunnerError('relay', this.extra.get(params.session).relay.reason);
    return {socket: this.relaySocket};
  }
  close() {}
}

// A server with the fake runner client, a repository with a task worktree, the settings file
// and the stub relay. `relay.text` is the content of the terminal page.
export async function sessionServer({settings = SETTINGS} = {}) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'ap-'))), state = join(dir, 'state'), config = join(dir, 'config'), bin = join(dir, 'bin');
  await mkdir(state, {mode: 0o700});await mkdir(bin);
  const repository = await fixtureRepository(sessionRepository()), root = await realpath(repository.root), worktree = join(dir, 'acp');
  git(root, 'worktree', 'add', '-qb', 'impl/acp-adapter', worktree);
  const file = join(config, 'profiles.json');
  if (settings !== null) await writeSettingsFile(file, settings);
  const relay = {text: TERMINAL_TEXT, requests: []}, relaySocket = join(dir, 'r.sock');
  const relayServer = createServer((req, res) => {relay.requests.push(req.url);res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});res.end(terminalPage(relay.text));});
  await new Promise(done => relayServer.listen(relaySocket, done));
  const store = new RuntimeStore({stateDir: state}), runner = new FakeRunner(store, relaySocket);
  const settingsService = createSettingsService({configDir: config, stateDir: state, env: {PATH: bin}});
  const sessionService = createSessionService({stateDir: state, settingsFile: () => file, runner: () => runner, env: {PATH: bin}});
  const server = createAppServer({stateDir: state, configDir: config, settingsService, sessionService, runnerClient: runner});
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body) => {
    const response = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    return {status: response.status, body: await response.json()};
  };
  return {
    base, dir, root, worktree, state, config, file, store, runner, relay, post,
    start: async body => {const reply = await post('/api/sessions/start', body);if (reply.status !== 200) throw Error(JSON.stringify(reply.body));return reply.body.session;},
    // A PermissionRequest hook observation of a harness session (specifications/codex-execution.md).
    hook: (harnessSession, tool, kind = 'PermissionRequest') => store.observe({session_id: harnessSession, hook_event_name: kind, turn_id: 't1', cwd: root, tool_name: tool}),
    // Another worktree of the repository on a new branch.
    addWorktree: (name, branch) => {const path = join(dir, name);git(root, 'worktree', 'add', '-qb', branch, path);return path;},
    commit: (path, message, where = worktree) => {git(where, 'add', path);git(where, '-c', 'user.name=Agent', '-c', 'user.email=agent@example.invalid', 'commit', '-qm', message);},
    write: (path, text, where = worktree) => mkdir(join(where, path, '..'), {recursive: true}).then(() => writeFile(join(where, path), text)),
    close: async () => {
      sessionService.close();server.closeAllConnections();await new Promise(done => server.close(done));
      await new Promise(done => relayServer.close(done));store.close();
      await repository.cleanup();await rm(dir, {recursive: true, force: true});
    },
  };
}
