// specifications/agent-orchestration.md: Commands, Start rules, Roles and initial prompts,
// Lifecycle events, Output, Recovery, Workbench and Failures; specifications/codex-execution.md
// for the binding. Most tests inject a fake runner client into the HTTP server. The last tests
// use a real session runner that hosts the fake ACP agent (test/fixtures/fake-acp-agent.mjs)
// and the fake herdr (test/fixtures/fake-herdr.mjs). No test starts a harness program, herdr
// or ttyd, and each test stops the runner and the processes that it starts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {chmod, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile} from 'node:fs/promises';
import {request as httpRequest} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import pkg from '../package.json' with {type: 'json'};
import {recordHarnessId} from '../server/agent-hook.js';
import {createAppServer} from '../server/http.js';
import {RunnerClient, RunnerError} from '../server/runner-client.js';
import {RuntimeStore} from '../server/runtime-store.js';
import {ROLE_TERMINAL, createSessionService, initialPrompt} from '../server/session-api.js';
import {METHODS, RELAY_METHODS, SessionRunner} from '../server/session-runner.js';
import {shellQuote} from '../server/terminal-adapter.js';
import {fingerprint, git} from './fixtures.js';
import {runtimeFixture} from './runtime-fixtures.js';

const skip = process.platform === 'win32';
const FAKE_ACP = fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url));
const FAKE_HERDR = fileURLToPath(new URL('./fixtures/fake-herdr.mjs', import.meta.url));
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function waitFor(check, ms = 8000) {
 for (const end = Date.now() + ms; ; await sleep(20)) {
  const value = await check();
  if (value) return value;
  if (Date.now() > end) throw Error('The condition did not become true.');
 }
}
const CLAUDE = {id: 'claude-terminal', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'};
const CODEX_ACP = {id: 'codex-acp', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'};
const CODEX_TERMINAL = {id: 'codex-terminal', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-5-codex'};
const BYPASS = {id: 'bypass', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-5-codex', args: ['--yolo']};
const SETTINGS = {version: 1, terminal: {open: ['ghostty', '-e']}, profiles: [CLAUDE, CODEX_ACP, CODEX_TERMINAL, BYPASS]};
// The routes of the Commands table, without the relay route.
const ROUTES = ['query', 'start', 'prompt', 'permission', 'cancel', 'resume', 'end', 'open-terminal', 'output', 'diff'].map(name => `/api/sessions/${name}`);
const LIVE = 'demo/change-live';
const prompts = {
 coordinator: request => `You are the ADD coordinator for this repository. Load the add-coordinator skill and follow it. No change is selected. The person asks: \`${request}\`. Start with discovery, and create a dedicated branch before you write knowledge.`,
 coordinatorChange: `You are the ADD coordinator for this repository. Load the add-coordinator skill and follow it. Selected change: \`${LIVE}\`.`,
 productOwner: `You are the ADD product owner. Load the add-product-owner skill and follow it for change \`${LIVE}\`.`,
 technicalLead: `You are the ADD technical lead. Load the add-technical-lead skill and follow it for change \`${LIVE}\`.`,
 implementer: (task, branch) => `You are an ADD implementer. Load the add-implementer skill and follow it. Your task is \`${task}\` of change \`${LIVE}\` in this worktree on branch \`${branch}\`. Plane does not record plan approval; check the gates of the skill before you change code.`,
 respawn: reason => ` An earlier attempt on this task stopped: \`${reason}\`. Read the task, the branch history, \`git status\` and the change brief before you continue.`,
};

// A runner client that records the calls and writes the session records as the runner does.
class FakeRunner {
 constructor(store) {
  Object.assign(this, {store, version: pkg.version, helloVersion: pkg.version, connected: false, unavailable: false, fail: null, delayMs: 0});
  this.calls = [];this.listeners = new Map();this.seqs = new Map();this.views = new Map();this.lives = new Map();
 }
 get starts() {return this.calls.filter(([method]) => method === 'start').map(([, params]) => params);}
 hello() {return {version: this.helloVersion, sessions: []};}
 async ensure() {
  if (this.unavailable) throw new RunnerError('unavailable', 'The session runner did not start in 3 seconds.');
  this.connected = true;
  return this.hello();
 }
 async check() {return this.connected ? this.hello() : null;}
 async availability() {return {available: true, running: this.connected, version: this.connected ? this.helloVersion : null, compatible: true, reason: null};}
 view(id) {
  const {attempt, ...record} = this.store.session(id);
  return {...record, attempt, agentStatus: null, error: null, hosted: true, relay: record.profile.connection === 'terminal' ? {available: false, reason: 'The program ttyd is missing.'} : null, ...this.views.get(id)};
 }
 async start(params) {
  this.calls.push(['start', params]);
  if (this.fail) throw this.fail;
  await sleep(this.delayMs);
  const {session: id, worktree, role, profile, artifact, change, task, branch, attempt, respawnOf} = params, now = Date.now();
  const record = {id, repository: this.store.repository(worktree, true).id, worktree, role, artifact, change, task, branch,
   profile: {id: profile.id, harness: profile.harness, connection: profile.connection, signIn: profile.signIn, model: profile.model, reasoning: profile.reasoning ?? null},
   reportedModel: null, harnessSession: null, pane: null, tab: null, baseRevision: git(worktree, 'rev-parse', 'HEAD'), state: 'starting', reason: null, startedAt: now, updatedAt: now, endedAt: null, respawnOf};
  this.store.recordSession({...record, attempt}, {change: {state: 'unknown'}});
  return {session: this.view(id)};
 }
 #command(method, id, ...args) {
  this.calls.push([method, id, ...args]);
  if (this.fail) throw this.fail;
  if (!this.store.session(id)) throw new RunnerError('unknown-session', 'The session is unknown.');
  return {session: this.view(id)};
 }
 async prompt(id, text) {return this.#command('prompt', id, text);}
 async answer(id, request, option) {return this.#command('answer', id, request, option);}
 async cancel(id) {return this.#command('cancel', id);}
 async resume(id, extra) {return this.#command('resume', id, extra);}
 async end(id) {
  const result = this.#command('end', id), {attempt, ...record} = this.store.session(id);
  this.store.recordSession({...record, attempt, state: 'ended', reason: 'person', endedAt: Date.now()}, {events: [{kind: 'session:ended', reason: 'person'}], change: {end: true}});
  return {...result, session: this.view(id)};
 }
 async openTerminal(id, open) {this.#command('openTerminal', id, open);return {pid: null};}
 async snapshot(id) {return {seq: this.seqs.get(id) ?? 0, session: this.view(id), live: this.lives.get(id) ?? null};}
 async subscribe(id, listener) {
  this.calls.push(['subscribe', id]);
  let set = this.listeners.get(id);
  if (!set) this.listeners.set(id, set = new Set());
  set.add(listener);
  return async () => {set.delete(listener);if (!set.size) this.listeners.delete(id);};
 }
 push(id, event, update, seq) {
  const next = seq ?? (this.seqs.get(id) ?? 0) + 1;
  if (seq === undefined) this.seqs.set(id, next);
  for (const listener of this.listeners.get(id) ?? []) listener({event, session: id, seq: event === 'runner-lost' ? null : next, update});
 }
 close() {}
}

// A repository with the change demo/change-live (tasks a.md, b.md and join.md of the unit
// live), a linked worktree on branch task-a, a private settings file and a server with the
// fake runner client.
async function setup(t, {settings = SETTINGS, service = {}} = {}) {
 const repo = await runtimeFixture(), dir = await realpath(await mkdtemp(join(tmpdir(), 'ap-')));
 const worktree = join(dir, 'wt'), config = join(dir, 'config');
 git(repo.root, 'worktree', 'add', '-qb', 'task-a', worktree);
 await mkdir(config, {mode: 0o700});
 await writeFile(join(config, 'profiles.json'), JSON.stringify(settings), {mode: 0o600});
 const store = new RuntimeStore({stateDir: repo.stateDir}), runner = new FakeRunner(store);
 const sessionService = Object.keys(service).length ? createSessionService({stateDir: repo.stateDir, settingsFile: () => join(config, 'profiles.json'), runner: () => runner, ...service}) : undefined;
 const server = createAppServer({stateDir: repo.stateDir, configDir: config, runnerClient: runner, sessionService});
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 t.after(async () => {
  sessionService?.close();
  await new Promise(done => server.close(done));
  store.close();
  await repo.cleanup();await rm(dir, {recursive: true, force: true});
 });
 const port = server.address().port, base = `http://127.0.0.1:${port}`;
 const post = async (path, body, headers = {}) => {
  const response = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
  return {status: response.status, body: await response.json()};
 };
 const f = {
  ...repo, dir, worktree, config, store, runner, server, port, base, post,
  root: await realpath(repo.root),
  start: body => post('/api/sessions/start', body),
  implementer: (fields = {}) => post('/api/sessions/start', {path: worktree, role: 'implementer', profile: 'codex-acp', artifact: 'demo', change: 'change-live', task: 'a.md', ...fields}),
  saveSettings: value => writeFile(join(config, 'profiles.json'), JSON.stringify(value), {mode: 0o600}),
  attempts: () => store.db.prepare('SELECT json FROM attempts').all().map(row => JSON.parse(row.json)),
 };
 return f;
}
// The HTTP status of a request with headers that fetch cannot set, such as Host.
function raw(base, path, {method = 'POST', headers = {}, body = '{}'} = {}) {
 return new Promise((resolve, reject) => {
  const req = httpRequest(base + path, {method, headers: {'Content-Type': 'application/json', ...headers}}, res => {res.resume();resolve(res.statusCode);});
  req.on('error', reject);req.end(method === 'GET' ? undefined : body);
 });
}
// A server-sent event stream: `events` collects {event, data}; `close` ends the connection.
function openStream(base, id, headers = {}) {
 return new Promise((resolve, reject) => {
  const req = httpRequest(`${base}/api/sessions/stream?session=${id}`, {headers}, res => {
   const events = [];let buffer = '', text = '';
   res.setEncoding('utf8');
   const ended = new Promise(done => res.on('end', done).on('close', done));
   res.on('data', chunk => {
    text += chunk;buffer += chunk;
    for (let end; (end = buffer.indexOf('\n\n')) >= 0;) {
     const lines = buffer.slice(0, end).split('\n');buffer = buffer.slice(end + 2);
     const event = lines.find(l => l.startsWith('event: '))?.slice(7), data = lines.find(l => l.startsWith('data: '))?.slice(6);
     if (event) events.push({event, data: JSON.parse(data)});
    }
   });
   resolve({status: res.statusCode, headers: res.headers, events, ended, text: () => text, close: () => req.destroy(), of: name => events.filter(e => e.event === name)});
  });
  req.on('error', reject);req.end();
 });
}
const refused = (response, rule, message) => {
 assert.equal(response.status, 409, JSON.stringify(response.body));
 assert.equal(response.body.rule, rule, JSON.stringify(response.body));
 if (message) assert.match(response.body.error, message);
};

test('the orchestrator checks start rules 1 to 8 in order and refuses with the first failed rule', {skip}, async t => {
 const f = await setup(t), detached = join(f.dir, 'detached'), odd = join(f.dir, 'odd'), plain = join(f.dir, 'plain');
 git(f.root, 'worktree', 'add', '-q', '--detach', detached);
 git(f.root, 'worktree', 'add', '-qb', 'odd`name', odd);
 await mkdir(plain);
 const coordinator = {path: f.worktree, role: 'coordinator', profile: 'claude-terminal'};
 const role = (name, fields = {}) => f.start({path: f.worktree, role: name, profile: 'claude-terminal', artifact: 'demo', change: 'change-live', ...fields});
 // Rule 1: the profile exists and is valid. It comes before rule 2.
 refused(await f.implementer({profile: 'missing', path: '/nonexistent'}), 1, /The profile missing does not exist/);
 refused(await f.implementer({profile: 'bypass'}), 1, /The profile bypass is invalid: --yolo skips permission prompts/);
 // Rule 2: path is a worktree of the repository. It comes before rule 3.
 for (const path of ['/nonexistent/plane', plain, join(f.worktree, 'docs'), 'relative']) refused(await f.implementer({path, task: undefined}), 2, /Select a worktree of the repository/);
 // Rule 3: an implementer names a listed task of a current change, on a branch that is not main, master or detached.
 refused(await f.implementer({task: undefined}), 3, /names an artifact, a change and a task/);
 refused(await f.implementer({change: 'change-other'}), 3, /demo\/change-other is not a current change in this worktree/);
 refused(await f.implementer({task: 'missing.md'}), 3, /The task missing.md is not a listed task of demo\/change-live/);
 refused(await f.implementer({task: 'README.md'}), 3, /not a listed task/);
 refused(await f.implementer({path: f.root}), 3, /does not run on main/);
 refused(await f.implementer({path: detached}), 3, /detached HEAD/);
 refused(await f.implementer({path: odd}), 3, /branch names of letters, digits/);
 // Rule 4: a product owner or technical lead names a current change; a coordinator can name one.
 refused(await role('product-owner', {change: undefined, profile: 'codex-acp'}), 4, /A product owner session names the artifact and the change/);
 refused(await role('technical-lead', {change: 'change-other'}), 4, /not a current change/);
 refused(await f.start({...coordinator, artifact: 'demo', request: 'x'}), 4, /A coordinator session names the artifact and the change/);
 // Rule 5: a role session needs a terminal profile, with the exact message (AOA12).
 for (const name of ['coordinator', 'product-owner', 'technical-lead']) {
  const response = await role(name, {profile: 'codex-acp'});
  refused(response, 5);
  assert.equal(response.body.error, ROLE_TERMINAL);
  assert.equal(response.body.error, 'Role sessions run in a terminal, where you chat with the harness tool.');
 }
 // Rule 6: only a coordinator takes a request of at most 8 KiB; a coordinator without a change needs one.
 refused(await role('product-owner', {request: 'x'}), 6, /Only a coordinator session takes a request/);
 refused(await f.implementer({request: 'x'}), 6, /Only a coordinator session takes a request/);
 refused(await f.start(coordinator), 6, /without a change needs a request/);
 for (const request of ['', '  \n', 'a\0b', 'x'.repeat(8193)]) refused(await f.start({...coordinator, request}), 6, /nonempty text of at most 8 KiB/);
 refused(await role('coordinator', {request: 'x'}), 6, /with a selected change takes no request/);
 // Rule 8: respawnOf names an ended or interrupted session of the same task.
 refused(await role('product-owner', {respawnOf: '0123456789ab'}), 8, /ended or interrupted session of the same task/);
 refused(await f.implementer({respawnOf: '0123456789ab'}), 8, /ended or interrupted session of the same task/);
 refused(await f.implementer({respawnOf: 'not-an-id'}), 8);
 const other = (await f.implementer({task: 'b.md'})).body.session;
 refused(await f.implementer({respawnOf: other.id}), 8, /same task/);
 await f.post('/api/sessions/end', {session: other.id});
 refused(await f.implementer({respawnOf: other.id}), 8, /same task/);
 // A refused start writes nothing and starts nothing: only the start of b.md reached the runner.
 assert.deepEqual(f.runner.starts.map(p => p.task), ['b.md']);
 assert.equal(f.attempts().length, 1);
 // Malformed input is 400.
 for (const body of [{...coordinator, request: 'x', extra: 1}, {...coordinator, role: 'boss'}, {...coordinator, profile: 3}, {...coordinator, artifact: 'Demo', change: 'change-live'}, {...coordinator, task: 'a.md', request: 'x'}, [], 'null'])
  assert.equal((await f.start(body)).status, 400, JSON.stringify(body));
 // Starts that pass every rule.
 assert.equal((await f.start({...coordinator, request: 'Plan a feature.'})).status, 200);
 assert.equal((await role('product-owner')).status, 200);
 assert.equal((await role('technical-lead')).status, 200);
 assert.equal((await role('coordinator')).status, 200);
});

test('the initial prompt of each role matches the contract table and holds only validated names', {skip}, async t => {
 const f = await setup(t), request = 'Add a `login` page; keep "quotes", $HOME and\nnew lines unchanged.';
 const coordinator = await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', request});
 assert.equal(coordinator.status, 200);
 await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', artifact: 'demo', change: 'change-live'});
 await f.start({path: f.worktree, role: 'product-owner', profile: 'claude-terminal', artifact: 'demo', change: 'change-live'});
 await f.start({path: f.worktree, role: 'technical-lead', profile: 'codex-terminal', artifact: 'demo', change: 'change-live'});
 await f.implementer();
 const starts = f.runner.starts;
 assert.deepEqual(starts.map(p => p.prompt), [prompts.coordinator(request), prompts.coordinatorChange, prompts.productOwner, prompts.technicalLead, prompts.implementer('a.md', 'task-a')]);
 // The runner gets the worktree, the role, the full profile and the validated names.
 assert.deepEqual(starts.map(p => [p.worktree, p.role, p.profile.id, p.artifact, p.change, p.task, p.branch]), [
  [f.worktree, 'coordinator', 'claude-terminal', null, null, null, 'task-a'],
  [f.worktree, 'coordinator', 'claude-terminal', 'demo', 'change-live', null, 'task-a'],
  [f.worktree, 'product-owner', 'claude-terminal', 'demo', 'change-live', null, 'task-a'],
  [f.worktree, 'technical-lead', 'codex-terminal', 'demo', 'change-live', null, 'task-a'],
  [f.worktree, 'implementer', 'codex-acp', 'demo', 'change-live', 'a.md', 'task-a']]);
 assert.deepEqual(starts[1].profile, CLAUDE);
 for (const params of starts) assert.match(params.session, /^[0-9a-f]{12}$/);
 assert.equal(initialPrompt({role: 'implementer', artifact: 'demo', change: 'change-live', task: 'a.md', branch: 'task-a', respawn: 'pane-missing'}), prompts.implementer('a.md', 'task-a') + prompts.respawn('pane-missing'));
 // Plane passes the request to the agent and stores no copy (AOA11 with the fake runner).
 const bytes = ['runtime.sqlite', 'runtime.sqlite-wal'].map(name => existsSync(join(f.stateDir, name)) ? readFileSync(join(f.stateDir, name)).toString('latin1') : '').join('');
 assert.ok(!bytes.includes('login'));
});

test('an implementer start binds an explicit attempt to the Plane session ID; a respawn adds its sentence and supersedes the earlier attempt', {skip}, async t => {
 const f = await setup(t);
 const first = await f.implementer();
 assert.equal(first.status, 200);
 const {session, attempt, existing} = first.body;
 assert.equal(existing, false);
 assert.equal(session.attempt.id, attempt.id);
 assert.deepEqual([attempt.binding, attempt.session, attempt.agent, attempt.artifact, attempt.change, attempt.path, attempt.sourceWorktree], ['explicit', session.id, '', 'demo', 'change-live', 'docs/artifacts/demo/changes/change-live/tasks/a.md', f.worktree]);
 assert.equal(f.runner.starts[0].attempt, attempt.id);
 // The binding has the context of the unit that holds the change.
 assert.equal(JSON.parse(f.store.db.prepare('SELECT json FROM contexts WHERE id=?').get(attempt.context).json).unit, 'live');
 // The agent process stops: the session and the attempt are interrupted.
 const stored = f.store.session(session.id);
 f.store.recordSession({...stored, state: 'interrupted', reason: 'process-exit'}, {events: [{kind: 'session:interrupted', reason: 'process-exit'}], change: {state: 'interrupted'}});
 // Respawn with another profile: the respawn sentence names the reason; the new binding supersedes the earlier attempt.
 const respawn = await f.implementer({profile: 'codex-terminal', respawnOf: session.id});
 assert.equal(respawn.status, 200);
 const params = f.runner.starts[1];
 assert.equal(params.prompt, prompts.implementer('a.md', 'task-a') + prompts.respawn('process-exit'));
 assert.deepEqual([params.respawnOf, params.profile.id, respawn.body.existing], [session.id, 'codex-terminal', false]);
 assert.equal(f.store.attempt(attempt.id).state, 'superseded');
 assert.deepEqual([respawn.body.attempt.binding, respawn.body.attempt.session, respawn.body.attempt.state], ['explicit', respawn.body.session.id, 'unknown']);
 // An ended session can respawn too; its reason names why it stopped.
 await f.post('/api/sessions/end', {session: respawn.body.session.id});
 const again = await f.implementer({respawnOf: respawn.body.session.id});
 assert.equal(f.runner.starts[2].prompt, prompts.implementer('a.md', 'task-a') + prompts.respawn('person'));
 assert.equal(f.store.attempt(respawn.body.attempt.id).state, 'superseded');
 // respawnOf of a session that runs returns that session (rule 7 comes first).
 const running = await f.implementer({respawnOf: again.body.session.id});
 assert.deepEqual([running.status, running.body.existing, running.body.session.id], [200, true, again.body.session.id]);
});

test('a start for a task with an open attempt returns that attempt with existing: true; concurrent starts create one session (AOA5)', {skip}, async t => {
 const f = await setup(t);
 f.runner.delayMs = 200;
 const responses = await Promise.all([f.implementer(), f.implementer({profile: 'codex-terminal'}), f.implementer(), f.implementer({task: 'b.md'})]);
 assert.ok(responses.every(r => r.status === 200), JSON.stringify(responses.map(r => r.body)));
 // The requests reach the lock of the task in any order: the first creates the session.
 const a = responses.slice(0, 3).map(r => r.body), b = responses[3].body, a1 = a.find(r => !r.existing);
 assert.deepEqual(f.runner.starts.map(p => p.task).sort(), ['a.md', 'b.md'], 'one session for each task');
 assert.deepEqual([a.filter(r => r.existing).length, b.existing], [2, false]);
 assert.deepEqual(a.map(r => [r.session.id, r.attempt.id]), a.map(() => [a1.session.id, a1.attempt.id]));
 assert.equal(f.attempts().filter(attempt => attempt.path.endsWith('/a.md')).length, 1);
 // A later start returns it too, also from another worktree of the repository.
 const other = join(f.dir, 'other');
 git(f.root, 'worktree', 'add', '-qb', 'task-a2', other);
 const later = await f.implementer({path: other});
 assert.deepEqual([later.body.existing, later.body.session.id], [true, a1.session.id]);
 // An idle session after a turn keeps its attempt open, although the attempt validates.
 const idle = f.store.session(a1.session.id);
 f.store.recordSession({...idle, state: 'idle'}, {events: [{kind: 'session:turn-ended', stopReason: 'end_turn'}], change: {state: 'validating'}});
 assert.equal((await f.implementer()).body.existing, true);
 // After the session ends, a new start creates a new session.
 await f.post('/api/sessions/end', {session: a1.session.id});
 const next = await f.implementer();
 assert.deepEqual([next.body.existing, f.runner.starts.length], [false, 3]);
 assert.notEqual(next.body.session.id, a1.session.id);
 // An open attempt of a harness session that Plane did not start returns without a session.
 const bound = await f.store.bind({root: f.worktree, unit: 'live', artifact: 'demo', change: 'change-live', task: 'join.md', session: 'harness-x'});
 f.store.observe({session_id: 'harness-x', hook_event_name: 'UserPromptSubmit', turn_id: 't1', cwd: f.worktree});
 const hook = await f.implementer({task: 'join.md'});
 assert.deepEqual([hook.status, hook.body.existing, hook.body.session, hook.body.attempt.id, hook.body.attempt.state], [200, true, null, bound.attempt, 'processing']);
 // After 10 minutes without an observation, the attempt is no longer open.
 const stale = f.store.attempt(bound.attempt);
 f.store.saveAttempt({...stale, updatedAt: Date.now() - 11 * 60 * 1000});
 assert.equal((await f.implementer({task: 'join.md'})).body.existing, false);
});

test('a refused runner start returns its status and leaves no open attempt', {skip}, async t => {
 const f = await setup(t);
 // The runner does not start: 503, and nothing changes.
 f.runner.unavailable = true;
 const unavailable = await f.implementer();
 assert.deepEqual([unavailable.status, unavailable.body.error], [503, 'The session runner did not start in 3 seconds.']);
 assert.deepEqual([f.attempts().length, f.runner.starts.length], [0, 0]);
 f.runner.unavailable = false;
 // A runner of another version: 409 with "Restart the session runner", and nothing changes.
 f.runner.helloVersion = '0.0.1';
 const version = await f.implementer();
 assert.deepEqual([version.status, version.body.error, f.attempts().length], [409, 'Restart the session runner', 0]);
 f.runner.helloVersion = pkg.version;
 // A missing program: 503 with the program name; the attempt of the refused start is interrupted.
 f.runner.fail = new RunnerError('program-missing', 'The program codex-acp is missing.', {program: 'codex-acp'});
 const missing = await f.implementer();
 assert.deepEqual([missing.status, missing.body.error, missing.body.program], [503, 'The program codex-acp is missing.', 'codex-acp']);
 assert.deepEqual(f.attempts().map(a => [a.state, Boolean(a.endedAt)]), [['interrupted', true]]);
 f.runner.fail = null;
 const next = await f.implementer();
 assert.deepEqual([next.status, next.body.existing], [200, false]);
});

test('the session commands reach the runner; unknown sessions are 404 and the current profile resumes a session', {skip}, async t => {
 const f = await setup(t);
 const acp = (await f.implementer()).body.session.id;
 const terminal = (await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', request: 'Plan.'})).body.session.id;
 const ok = async (path, body) => {const r = await f.post(path, body);assert.equal(r.status, 200, `${path}: ${JSON.stringify(r.body)}`);return r.body;};
 assert.equal((await ok('/api/sessions/prompt', {session: acp, text: 'Continue.'})).session.id, acp);
 await ok('/api/sessions/permission', {session: acp, request: 'p1', option: 'allow'});
 await ok('/api/sessions/cancel', {session: acp});
 assert.deepEqual(await ok('/api/sessions/open-terminal', {session: terminal}), {ok: true});
 // A prompt body can hold 64 KiB; other bodies 16 KiB.
 const long = 'x'.repeat(40000);
 await ok('/api/sessions/prompt', {session: acp, text: long});
 assert.equal((await f.post('/api/sessions/prompt', {session: acp, text: 'x'.repeat(70000)})).status, 413);
 assert.equal((await f.post('/api/sessions/cancel', {session: acp, text: long})).status, 413);
 assert.deepEqual(f.runner.calls.filter(([m]) => !['start', 'subscribe'].includes(m)).map(([m, ...args]) => [m, ...args.map(a => a === long ? 'long' : a)]), [
  ['prompt', acp, 'Continue.'], ['answer', acp, 'p1', 'allow'], ['cancel', acp], ['openTerminal', terminal, ['ghostty', '-e']], ['prompt', acp, 'long']]);
 // Resume uses the current settings of the profile ID of the session.
 await f.saveSettings({...SETTINGS, profiles: [CLAUDE, {...CODEX_ACP, model: 'gpt-6', env: {PLANE_MODE: 'x'}}]});
 await ok('/api/sessions/resume', {session: acp});
 assert.deepEqual(f.runner.calls.at(-1), ['resume', acp, {profile: {...CODEX_ACP, model: 'gpt-6', env: {PLANE_MODE: 'x'}}, programs: {}}]);
 await f.saveSettings({...SETTINGS, profiles: [CLAUDE, {...CODEX_ACP, connection: 'terminal', reasoning: undefined}]});
 const changed = await f.post('/api/sessions/resume', {session: acp});
 assert.deepEqual([changed.status, /another harness tool or connection/.test(changed.body.error)], [409, true]);
 await f.saveSettings({...SETTINGS, profiles: [CLAUDE]});
 const deleted = await f.post('/api/sessions/resume', {session: acp});
 assert.deepEqual([deleted.status, /The profile codex-acp does not exist. Respawn the session with another profile./.test(deleted.body.error)], [409, true]);
 await ok('/api/sessions/end', {session: acp});
 // A runner refusal keeps its status: 409 for a wrong state, 400 for an unknown request.
 f.runner.fail = new RunnerError('state', 'This method needs an ACP session.');
 assert.deepEqual(await f.post('/api/sessions/prompt', {session: terminal, text: 'x'}), {status: 409, body: {error: 'This method needs an ACP session.'}});
 f.runner.fail = new RunnerError('unknown-request', 'The permission request is unknown.');
 assert.equal((await f.post('/api/sessions/permission', {session: acp, request: 'p9', option: 'allow'})).status, 400);
 f.runner.fail = null;
 // Unknown and malformed sessions, and malformed bodies.
 for (const path of ROUTES.filter(p => !p.endsWith('/query') && !p.endsWith('/start'))) {
  const extra = path.endsWith('/prompt') ? {text: 'x'} : path.endsWith('/permission') ? {request: 'p', option: 'o'} : path.endsWith('/diff') ? {path: 'a.txt'} : {};
  assert.equal((await f.post(path, {session: '0123456789ab', ...extra})).status, 404, path);
  assert.equal((await f.post(path, {session: 'nope', ...extra})).status, 400, path);
  assert.equal((await f.post(path, {session: acp, ...extra, other: 1})).status, 400, path);
 }
 assert.equal((await f.post('/api/sessions/prompt', {session: acp, text: ''})).status, 400);
 assert.equal((await f.post('/api/sessions/permission', {session: acp, request: 1, option: 'allow'})).status, 400);
});

test('the query merges the store records with the runner views and names the tool of a waiting terminal session', {skip}, async t => {
 const f = await setup(t);
 // Without a store, the query creates no state file.
 const fresh = await mkdtemp(join(tmpdir(), 'ap-'));
 t.after(() => rm(fresh, {recursive: true, force: true}));
 const empty = createSessionService({stateDir: join(fresh, 'state'), settingsFile: () => join(f.config, 'profiles.json'), runner: () => new FakeRunner(null)});
 // `profiles` counts the profiles of the settings file without the program versions (AO18).
 assert.deepEqual(await empty.query({path: f.worktree}), {repository: null, sessions: [], profiles: SETTINGS.profiles.length});
 assert.equal(existsSync(join(fresh, 'state')), false);
 empty.close();
 for (const [content, mode, count] of [[null, 0o600, 0], ['{', 0o600, 0], [JSON.stringify({version: 1}), 0o600, 0], [JSON.stringify(SETTINGS), 0o666, 0]]) {
  const config = join(fresh, 'config'), file = join(config, 'profiles.json');
  await rm(config, {recursive: true, force: true});await mkdir(config, {mode: 0o700});
  if (content !== null) {await writeFile(file, content);await chmod(file, mode);}
  const service = createSessionService({stateDir: join(fresh, 'state'), settingsFile: () => file, runner: () => new FakeRunner(null)});
  assert.equal((await service.query({path: f.worktree})).profiles, count, `${content} ${mode.toString(8)}`);
  service.close();
 }
 const acp = (await f.implementer()).body.session;
 const terminal = (await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', request: 'Plan.'})).body.session;
 // Without a runner, the query returns the stored records and starts no runner.
 f.runner.connected = false;
 let query = await f.post('/api/sessions/query', {path: f.root});
 assert.equal(query.status, 200);
 assert.deepEqual(query.body.sessions.map(s => [s.id, s.state, s.hosted, s.relay, s.live, s.attempt?.id ?? null]), [[terminal.id, 'starting', false, null, null, null], [acp.id, 'starting', false, null, null, acp.attempt.id]]);
 assert.equal(f.runner.calls.filter(([m]) => m === 'start').length, 2);
 // With a runner, the runner view gives the state, relay and live.
 f.runner.connected = true;
 f.runner.views.set(acp.id, {state: 'waiting'});
 f.runner.lives.set(acp.id, {lastMessage: 'Done.', pending: [{request: 'p1', title: 'Edit', options: []}]});
 query = await f.post('/api/sessions/query', {path: f.worktree});
 const [qTerminal, qAcp] = query.body.sessions;
 assert.deepEqual([qAcp.state, qAcp.live.lastMessage, qAcp.waitingTool, qTerminal.relay, qTerminal.hosted], ['waiting', 'Done.', null, {available: false, reason: 'The program ttyd is missing.'}, true]);
 assert.equal(qAcp.attempt.binding, 'explicit');
 // A waiting terminal session: the tool of the newest PermissionRequest of its harness session
 // after the previous state change of the session (fourth amendment). The hook runs before
 // herdr reports `blocked`.
 const stored = f.store.session(terminal.id);
 f.store.recordSession({...stored, harnessSession: 'h-1'}, {});
 const hook = (session, tool, kind = 'PermissionRequest') => f.store.observe({session_id: session, hook_event_name: kind, turn_id: 't1', cwd: f.worktree, tool_name: tool});
 const toolOf = async () => (await f.post('/api/sessions/query', {path: f.worktree})).body.sessions.find(s => s.id === terminal.id).waitingTool;
 hook('h-1', 'Glob');
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'working'}, {events: [{kind: 'session:working'}]});
 hook('h-1', 'Read');
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'waiting'}, {events: [{kind: 'session:waiting'}]});
 f.runner.views.delete(terminal.id);
 assert.equal(await toolOf(), 'Read', 'a request after the previous state change and before the session became waiting');
 hook('h-1', 'Bash');hook('h-2', 'Write');
 assert.equal(await toolOf(), 'Bash');
 hook('h-1', 'Edit');
 assert.equal(await toolOf(), 'Edit');
 // A later wait needs a request after the state change before it.
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'working'}, {events: [{kind: 'session:working'}]});
 assert.equal(await toolOf(), null, 'no tool name for a session that does not wait');
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'waiting'}, {events: [{kind: 'session:waiting'}]});
 assert.equal(await toolOf(), null, 'the requests before the previous state change do not count');
 // Other events of the session are not state changes: an output notice keeps the bound.
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'working'}, {events: [{kind: 'session:working'}]});
 hook('h-1', 'WebFetch');
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'working'}, {events: [{kind: 'session:output-changed'}]});
 f.store.recordSession({...stored, harnessSession: 'h-1', state: 'waiting'}, {events: [{kind: 'session:waiting'}]});
 assert.equal(await toolOf(), 'WebFetch');
 // Input errors.
 for (const body of [{}, {path: 3}, {path: f.worktree, other: 1}, {path: '/nonexistent'}, {path: join(f.worktree, 'docs')}]) assert.equal((await f.post('/api/sessions/query', body)).status, 400, JSON.stringify(body));
});

test('the output and diff routes read the session worktree with the output reader', {skip}, async t => {
 const f = await setup(t);
 const {session} = (await f.implementer()).body;
 const coordinator = (await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', request: 'Plan.'})).body.session;
 await writeFile(join(f.worktree, 'feature.txt'), 'one\ntwo\n');
 git(f.worktree, 'add', 'feature.txt');
 git(f.worktree, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Add the feature');
 await writeFile(join(f.worktree, 'notes.txt'), 'draft\n');
 const output = await f.post('/api/sessions/output', {session: session.id});
 assert.equal(output.status, 200);
 assert.equal(output.body.session, session.id);
 assert.equal(output.body.base, session.baseRevision);
 assert.deepEqual(output.body.commits.map(c => c.subject), ['Add the feature']);
 assert.deepEqual(output.body.files.map(file => [file.path, file.status, file.added, file.committed]), [['feature.txt', 'A', 2, true], ['notes.txt', 'A', 1, false]]);
 assert.deepEqual([output.body.dod.path, output.body.dod.checked, output.body.dod.unchecked], ['docs/artifacts/demo/changes/change-live/tasks/a.md', 0, 1]);
 assert.equal((await f.post('/api/sessions/output', {session: coordinator.id})).body.dod, null, 'a role session has no task');
 const diff = await f.post('/api/sessions/diff', {session: session.id, path: 'notes.txt'});
 assert.deepEqual([diff.status, diff.body.status, diff.body.committed], [200, 'A', false]);
 assert.match(diff.body.diff, /\+draft/);
 // The diff route refuses a path that is not in the current changed-file list.
 for (const path of ['docs/artifacts/demo/README.md', '../outside.txt', 'missing.txt']) assert.equal((await f.post('/api/sessions/diff', {session: session.id, path})).status, 400, path);
 assert.equal((await f.post('/api/sessions/diff', {session: session.id, path: 3})).status, 400);
 // A base revision that is no longer in the repository: 409.
 const stored = f.store.session(session.id);
 f.store.recordSession({...stored, baseRevision: 'f'.repeat(40)}, {});
 for (const path of ['/api/sessions/output', '/api/sessions/diff']) {
  const response = await f.post(path, path.endsWith('diff') ? {session: session.id, path: 'notes.txt'} : {session: session.id});
  assert.deepEqual([response.status, response.body.error], [409, 'The base revision is not in the repository.'], path);
 }
 // A removed worktree: 409.
 f.store.recordSession({...stored, worktree: join(f.dir, 'gone')}, {});
 assert.equal((await f.post('/api/sessions/output', {session: session.id})).status, 409);
});

test('the stream sends the snapshot, the state changes, the live state and the output notices, and keeps nothing after it closes', {skip}, async t => {
 const f = await setup(t, {service: {outputPollMs: 30, heartbeatMs: 50, maxStreams: 2}});
 const acp = (await f.implementer()).body.session;
 const terminal = (await f.start({path: f.worktree, role: 'coordinator', profile: 'claude-terminal', request: 'Plan.'})).body.session;
 f.runner.lives.set(acp.id, {lastMessage: 'Hello.', pending: []});
 f.runner.seqs.set(acp.id, 4);
 const stream = await openStream(f.base, acp.id);
 assert.deepEqual([stream.status, stream.headers['content-type'], stream.headers['cache-control']], [200, 'text/event-stream; charset=utf-8', 'no-store']);
 await waitFor(() => stream.of('snapshot').length);
 const snapshot = stream.of('snapshot')[0].data;
 assert.deepEqual([snapshot.session.id, snapshot.session.attempt.id, snapshot.live.lastMessage], [acp.id, acp.attempt.id, 'Hello.']);
 assert.match(stream.text(), /^retry: 1500\n\n/);
 // A push up to the snapshot sequence number belongs to the snapshot.
 f.runner.push(acp.id, 'live', {lastMessage: 'old'}, 4);
 // State changes, without repeats; the live state; an ACP edit as an output notice.
 f.runner.views.set(acp.id, {state: 'working'});
 f.runner.push(acp.id, 'state', f.runner.view(acp.id));
 f.runner.push(acp.id, 'state', f.runner.view(acp.id));
 f.runner.push(acp.id, 'live', {lastMessage: 'Next.', pending: []});
 f.runner.push(acp.id, 'lifecycle', {kind: 'session:prompted', source: 'person'});
 f.runner.push(acp.id, 'lifecycle', {kind: 'session:output-changed'});
 await waitFor(() => stream.of('output').length);
 assert.deepEqual(stream.events.map(e => e.event), ['snapshot', 'state', 'live', 'output']);
 assert.deepEqual([stream.of('state')[0].data.session.state, stream.of('live')[0].data.live.lastMessage], ['working', 'Next.']);
 await waitFor(() => /: heartbeat\n\n/.test(stream.text()));
 // A terminal session: a finished tool use that a hook reports for its harness session is an output notice.
 const stored = f.store.session(terminal.id);
 f.store.recordSession({...stored, harnessSession: 'h-7'}, {});
 const second = await openStream(f.base, terminal.id);
 await waitFor(() => second.of('snapshot').length);
 assert.equal(second.of('snapshot')[0].data.session.harnessSession, 'h-7');
 f.store.observe({session_id: 'h-7', hook_event_name: 'PostToolUse', turn_id: 't1', cwd: f.worktree, tool_name: 'Edit'});
 await waitFor(() => second.of('output').length);
 // The client limit.
 const third = await openStream(f.base, terminal.id);
 assert.equal(third.status, 429);
 // A closed stream keeps no subscription and no timer.
 stream.close();second.close();
 await waitFor(() => f.server.sessions().streamCount === 0 && f.runner.listeners.size === 0);
 // A runner loss ends the stream; the browser connects again.
 const fourth = await openStream(f.base, acp.id);
 await waitFor(() => fourth.of('snapshot').length);
 f.runner.push(acp.id, 'runner-lost', null);
 await fourth.ended;
 assert.equal(fourth.events.at(-1).event, 'runner-lost');
 await waitFor(() => f.server.sessions().streamCount === 0);
 // Errors before the stream starts are JSON.
 const status = async (path, options) => raw(f.base, path, {method: 'GET', ...options});
 assert.equal(await status('/api/sessions/stream?session=0123456789ab'), 404);
 for (const query of ['', '?session=nope', `?session=${acp.id}&session=${acp.id}`, `?session=${acp.id}&x=1`]) assert.equal(await status(`/api/sessions/stream${query}`), 400, query);
 assert.equal(await raw(f.base, `/api/sessions/stream?session=${acp.id}`), 405);
 // An ended session without a runner: the stored state, and no runner start.
 await f.post('/api/sessions/end', {session: acp.id});
 f.runner.connected = false;
 const ensures = f.runner.calls.length;
 const ended = await openStream(f.base, acp.id);
 await waitFor(() => ended.of('snapshot').length);
 assert.deepEqual([ended.of('snapshot')[0].data.session.state, ended.of('snapshot')[0].data.live, f.runner.connected, f.runner.calls.length], ['ended', null, false, ensures]);
 ended.close();
 await waitFor(() => f.server.sessions().streamCount === 0);
});

test('every session route refuses a foreign Host and a foreign Origin, another content type, a large body, bad JSON and another method', {skip}, async t => {
 const f = await setup(t);
 const acp = (await f.implementer()).body.session.id;
 const {port, base} = f;
 for (const path of ROUTES) {
  assert.equal(await raw(base, path, {headers: {Host: 'foreign.example'}}), 403, path);
  assert.equal(await raw(base, path, {headers: {Host: `localhost:${port}`}}), 403, path);
  assert.equal(await raw(base, path, {headers: {Origin: 'https://foreign.example'}}), 403, path);
  assert.equal(await raw(base, path, {headers: {Origin: `http://localhost:${port}`}}), 403, path);
  assert.equal(await raw(base, path, {headers: {'Sec-Fetch-Site': 'cross-site'}}), 403, path);
  assert.equal(await raw(base, path, {headers: {'Content-Type': 'text/plain'}}), 415, path);
  assert.equal(await raw(base, path, {body: '{'}), 400, path);
  assert.equal(await raw(base, path, {body: JSON.stringify({session: acp, text: 'x'.repeat(70000)})}), 413, path);
  assert.equal(await raw(base, path, {method: 'GET'}), 405, path);
 }
 const stream = `/api/sessions/stream?session=${acp}`;
 for (const headers of [{Host: 'foreign.example'}, {Host: `localhost:${port}`}, {Origin: 'https://foreign.example'}, {'Sec-Fetch-Site': 'cross-site'}]) assert.equal(await raw(base, stream, {method: 'GET', headers}), 403, JSON.stringify(headers));
 assert.equal(await raw(base, stream, {method: 'GET', headers: {Origin: `http://127.0.0.1:${port}`}}), 200);
 // The refused requests reached no runner method.
 assert.deepEqual(f.runner.calls.map(([m]) => m), ['start', 'subscribe']);
});

test('no session route approves a plan, checks a DoD item, merges or writes a version record', {skip}, async t => {
 const f = await setup(t);
 // The routes are those of the Commands table; other names under /api/sessions are no routes.
 for (const name of ['approve', 'approval', 'report', 'validate', 'merge', 'establish', 'version', 'dod', 'check', 'bind']) assert.equal(await raw(f.base, `/api/sessions/${name}`), 405, name);
 // The runner offers no such method.
 assert.deepEqual([...METHODS, ...RELAY_METHODS].filter(m => /approv|report|valid|merge|establish|version|dod|bind/i.test(m)), []);
 // The service has only the command methods of the table.
 const service = f.server.sessions(), methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service)).filter(m => m !== 'constructor');
 assert.deepEqual(methods.sort(), ['cancel', 'close', 'diff', 'end', 'openTerminal', 'output', 'permission', 'prompt', 'query', 'resume', 'start', 'streamCount', 'subscribe'].sort());
});

// A real session runner with the fake ACP agent, the fake herdr and a stub claude.
async function realSetup(t) {
 const repo = await runtimeFixture(), dir = await realpath(await mkdtemp(join(tmpdir(), 'ap-')));
 const bin = join(dir, 'bin'), herdr = join(dir, 'herdr'), logs = join(dir, 'logs'), config = join(dir, 'config'), worktree = join(dir, 'wt');
 await Promise.all([mkdir(bin), mkdir(herdr), mkdir(logs), mkdir(config, {mode: 0o700})]);
 git(repo.root, 'worktree', 'add', '-qb', 'task-a', worktree);
 const programs = {'codex-acp': `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_ACP)} "$@"`, herdr: `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_HERDR)} herdr "$@"`, claude: 'exit 0'};
 for (const [name, body] of Object.entries(programs)) {await writeFile(join(bin, name), `#!/bin/sh\n${body}\n`);await chmod(join(bin, name), 0o755);}
 const env = {PATH: `${bin}:${process.env.PATH}`, HOME: dir, FAKE_HERDR_DIR: herdr, FAKE_HERDR_SERVER_DELAY_MS: '100'};
 const runner = new SessionRunner({stateDir: repo.stateDir, env, harnessPollMs: 50, acpOptions: {endGraceMs: 300}, terminalOptions: {intervalMs: 100},
  mcpServer: {name: 'artifact-plane', command: '/opt/plane/artifact-plane', args: ['mcp']}});
 await runner.listen();
 const client = new RunnerClient({stateDir: repo.stateDir, env: {...process.env, ...env}, start: () => {throw Error('The test starts no runner here.');}});
 const server = createAppServer({stateDir: repo.stateDir, configDir: config, runnerClient: client});
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 t.after(async () => {
  await new Promise(done => server.close(done));
  client.close();await runner.close();
  await repo.cleanup();await rm(dir, {recursive: true, force: true});
 });
 const base = `http://127.0.0.1:${server.address().port}`;
 const post = async (path, body) => {
  const response = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  return {status: response.status, body: await response.json()};
 };
 return {...repo, root: await realpath(repo.root), dir, logs, herdr, config, worktree, runner, client, server, base, post,
  herdrState: () => JSON.parse(readFileSync(join(herdr, 'state.json'), 'utf8')),
  lines: async log => (await readFile(log, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line)),
  // The bytes of the runtime store files.
  storeBytes: () => ['runtime.sqlite', 'runtime.sqlite-wal', 'runtime.sqlite-shm'].map(name => existsSync(join(repo.stateDir, name)) ? readFileSync(join(repo.stateDir, name)).toString('latin1') : '').join('')};
}

test('with a real runner: a coordinator start keeps no request text, an implementer start binds and replaces the binding session, and no start, end or failure changes the repository (AOA5, AOA11)', {skip}, async t => {
 const f = await realSetup(t), log = join(f.logs, 'agent.log'), failLog = join(f.logs, 'fail.log');
 const MARK = 'REQUEST-MARK-4c7e1', MODELS = [{id: 'm1', name: 'Model one', levels: ['low', 'high']}];
 const agent = (script, file) => ({FAKE_ACP_CONFIG: JSON.stringify({log: file, models: MODELS, ...script})});
 await writeFile(join(f.config, 'profiles.json'), JSON.stringify({version: 1, profiles: [
  CLAUDE,
  {id: 'codex-fake', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'm1', reasoning: 'high', env: agent({turns: [[{chunk: 'Working on it.'}, {stop: 'end_turn'}], [{chunk: 'Second.'}, {tool: 't2', kind: 'edit'}, {stop: 'end_turn'}]]}, log)},
  {id: 'codex-signin', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'm1', env: agent({newError: {code: -32000, message: 'Authentication required'}}, failLog)},
 ]}), {mode: 0o600});
 const before = {root: await fingerprint(f.root), worktree: await fingerprint(f.worktree)};
 // A coordinator start: the agent receives the request; the store holds no copy (AOA11).
 const request = `Start ADD work ${MARK} with "quotes" and $HOME.`;
 const coordinator = await f.post('/api/sessions/start', {path: f.root, role: 'coordinator', profile: 'claude-terminal', request});
 assert.equal(coordinator.status, 200, JSON.stringify(coordinator.body));
 const role = coordinator.body.session;
 assert.deepEqual([role.role, role.profile.connection, role.worktree, role.attempt, coordinator.body.existing], ['coordinator', 'terminal', f.root, null, false]);
 const pane = f.herdrState().sessions[`plane-${role.id}`].panes[0];
 assert.equal(pane.env.ARTIFACT_PLANE_PROMPT, prompts.coordinator(request));
 assert.ok(!f.storeBytes().includes(MARK), 'the runtime store holds no request text');
 // An implementer start in the task worktree: an explicit binding with the Plane session ID,
 // replaced by the harness session ID of the agent.
 const started = await f.post('/api/sessions/start', {path: f.worktree, role: 'implementer', profile: 'codex-fake', artifact: 'demo', change: 'change-live', task: 'a.md'});
 assert.equal(started.status, 200, JSON.stringify(started.body));
 const {session, attempt} = started.body;
 assert.equal(attempt.binding, 'explicit');
 assert.ok(session.harnessSession, 'the agent reported its session ID');
 const store = new RuntimeStore({stateDir: f.stateDir});
 t.after(() => store.close());
 assert.equal(store.attempt(attempt.id).session, session.harnessSession);
 assert.equal(JSON.parse(store.db.prepare("SELECT json FROM events WHERE attempt=? AND kind='bind'").get(attempt.id).json).session, session.id, 'the binding session was the Plane session ID');
 // The agent received the initial prompt of the contract table.
 await waitFor(async () => (await f.lines(log)).some(e => e.in?.method === 'session/prompt'));
 assert.equal((await f.lines(log)).find(e => e.in?.method === 'session/prompt').in.params.prompt[0].text, prompts.implementer('a.md', 'task-a'));
 // A second start for the task returns the session (AOA5).
 const second = await f.post('/api/sessions/start', {path: f.worktree, role: 'implementer', profile: 'codex-fake', artifact: 'demo', change: 'change-live', task: 'a.md'});
 assert.deepEqual([second.status, second.body.existing, second.body.session.id, second.body.attempt.id], [200, true, session.id, attempt.id]);
 // The stream and the query show the live state and the output notice.
 const stream = await openStream(f.base, session.id);
 t.after(() => stream.close());
 await waitFor(() => stream.of('snapshot').length);
 await waitFor(async () => store.session(session.id).state === 'idle');
 const query = await f.post('/api/sessions/query', {path: f.root});
 const listed = query.body.sessions.find(s => s.id === session.id);
 assert.deepEqual([query.body.sessions.length, listed.live.lastMessage, listed.attempt.id, listed.hosted], [2, 'Working on it.', attempt.id, true]);
 assert.equal(query.body.sessions.find(s => s.id === role.id).relay.available !== undefined, true);
 const prompted = await f.post('/api/sessions/prompt', {session: session.id, text: 'Continue.'});
 assert.equal(prompted.status, 200);
 await waitFor(() => stream.of('live').some(e => e.data.live?.lastMessage === 'Second.'));
 assert.ok(stream.of('state').some(e => e.data.session.state === 'working'));
 assert.equal(stream.of('output').length, 1, 'the second turn edited a file');
 // A failed start: the session ends with reason error and the attempt is interrupted.
 const failed = await f.post('/api/sessions/start', {path: f.worktree, role: 'implementer', profile: 'codex-signin', artifact: 'demo', change: 'change-live', task: 'b.md'});
 assert.deepEqual([failed.status, failed.body.session.state, failed.body.session.reason, failed.body.session.error], [200, 'ended', 'error', 'Sign in with the harness tool in a terminal, then start again.']);
 assert.equal(store.attempt(failed.body.attempt.id).state, 'interrupted');
 // End the sessions.
 for (const id of [session.id, role.id]) assert.equal((await f.post('/api/sessions/end', {session: id})).body.session.state, 'ended');
 assert.deepEqual([f.herdrState().sessions[`plane-${role.id}`], existsSync(join(f.herdr, 'sessions', `plane-${role.id}`))], [undefined, false], 'end stops and deletes the named herdr session');
 // No repository file and no Git metadata changed; Plane reported no result and no approval.
 assert.deepEqual(await fingerprint(f.root), before.root);
 assert.deepEqual(await fingerprint(f.worktree), before.worktree);
 assert.deepEqual(store.db.prepare("SELECT kind FROM events WHERE kind LIKE 'report:%'").all(), []);
 assert.ok(store.db.prepare('SELECT json FROM attempts').all().every(row => JSON.parse(row.json).state !== 'done'));
 assert.ok(!f.storeBytes().includes(MARK), 'the runtime store holds no request text after the end');
});

test('with a real runner: a PermissionRequest hook observation before herdr reports blocked names the tool of the waiting terminal session (fourth amendment)', {skip}, async t => {
 const f = await realSetup(t);
 await writeFile(join(f.config, 'profiles.json'), JSON.stringify({version: 1, profiles: [CLAUDE]}), {mode: 0o600});
 const started = await f.post('/api/sessions/start', {path: f.root, role: 'coordinator', profile: 'claude-terminal', request: 'Plan the report.'});
 assert.equal(started.status, 200, JSON.stringify(started.body));
 const id = started.body.session.id, store = new RuntimeStore({stateDir: f.stateDir});
 t.after(() => store.close());
 const setStatus = async status => {
  const value = f.herdrState();
  for (const pane of value.sessions[`plane-${id}`].panes) pane.agent_status = status;
  await writeFile(join(f.herdr, 'state.tmp'), JSON.stringify(value));await rename(join(f.herdr, 'state.tmp'), join(f.herdr, 'state.json'));
 };
 const view = async () => (await f.post('/api/sessions/query', {path: f.root})).body.sessions.find(s => s.id === id);
 const hook = tool => store.observe({session_id: 'harness-7f3c', hook_event_name: 'PermissionRequest', turn_id: 't1', cwd: f.root, tool_name: tool});
 // The SessionStart hook gives the harness session ID; the runner copies it.
 recordHarnessId({session_id: 'harness-7f3c', model: 'opus'}, store, id);
 await waitFor(async () => (await view()).harnessSession === 'harness-7f3c');
 await setStatus('working');
 await waitFor(async () => (await view()).state === 'working');
 const stream = await openStream(f.base, id);
 t.after(() => stream.close());
 await waitFor(() => stream.of('snapshot').length);
 // Claude Code runs the PermissionRequest hook, then herdr reports blocked.
 hook('Bash');
 await setStatus('blocked');
 await waitFor(async () => (await view()).state === 'waiting');
 assert.equal((await view()).waitingTool, 'Bash');
 await waitFor(() => stream.of('state').some(e => e.data.session.state === 'waiting'));
 assert.equal(stream.of('state').find(e => e.data.session.state === 'waiting').data.session.waitingTool, 'Bash', 'the stream names the tool');
 // The next turn: the earlier request does not name a later wait.
 await setStatus('working');
 await waitFor(async () => (await view()).state === 'working');
 assert.equal((await view()).waitingTool, null);
 await setStatus('blocked');
 await waitFor(async () => (await view()).state === 'waiting');
 assert.equal((await view()).waitingTool, null, 'without a new request, the notice has the general text');
 hook('Edit');
 assert.equal((await view()).waitingTool, 'Edit');
 assert.equal((await f.post('/api/sessions/end', {session: id})).body.session.state, 'ended');
});
