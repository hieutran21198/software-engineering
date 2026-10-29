// specifications/agent-orchestration.md: Runner, Lifecycle events, States, Recovery, Failures,
// ACP adapter and Terminal adapter; ADR 019. The runner hosts the fake ACP agent
// (test/fixtures/fake-acp-agent.mjs) and the fake herdr (test/fixtures/fake-herdr.mjs); the
// fake programs are first on PATH, so no test starts a harness program, herdr or ttyd. Each
// test uses private state directories and stops every runner that it starts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {chmod, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile} from 'node:fs/promises';
import {connect} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import pkg from '../package.json' with {type: 'json'};
import {recordHarnessId} from '../server/agent-hook.js';
import {createSettingsService} from '../server/agent-settings.js';
import {createAppServer} from '../server/http.js';
import {LONG_PATH_MESSAGE, RESTART_MESSAGE, RunnerClient, RunnerError, START_WAIT_MS, errorStatus, runnerSocket} from '../server/runner-client.js';
import {RuntimeStore} from '../server/runtime-store.js';
import {IDLE_EXIT_MS, METHODS, SessionRunner, newSessionId} from '../server/session-runner.js';
import {shellQuote, terminalCommandLine} from '../server/terminal-adapter.js';
import {git} from './fixtures.js';
import {bind, runtimeFixture} from './runtime-fixtures.js';

const FAKE_ACP = fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url));
const FAKE_HERDR = fileURLToPath(new URL('./fixtures/fake-herdr.mjs', import.meta.url));
const APP = fileURLToPath(new URL('../server/app.js', import.meta.url));
const skip = process.platform === 'win32';
const MODELS = [{id: 'm1', name: 'Model one', levels: ['low', 'high']}];
// Text that must never reach the store.
const MARK = {prompt: 'PROMPT-MARK-5e1', person: 'PERSON-MARK-77a', message: 'MESSAGE-MARK-c03', permission: 'PERMISSION-MARK-9b4', credential: 'CREDENTIAL-MARK-2d8', variable: 'VARIABLE-MARK-f60'};
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function waitFor(check, ms = 8000) {
 for (const end = Date.now() + ms; ; await sleep(20)) {
  const value = await check();
  if (value) return value;
  if (Date.now() > end) throw Error('The condition did not become true.');
 }
}
const alive = pid => {try {process.kill(pid, 0);return true;} catch {return false;}};
const refusal = (code, message) => error => error instanceof RunnerError && error.code === code && (!message || message.test(error.message));

// A Git repository with a change and its tasks, a private state directory, and a directory
// with the fake programs: codex-acp runs the fake ACP agent, herdr the fake herdr, and claude
// is a stub that herdr never runs.
async function setup(t) {
 const repo = await runtimeFixture(), dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-runner-')));
 const bin = join(dir, 'bin'), herdr = join(dir, 'herdr'), logs = join(dir, 'logs');
 await Promise.all([mkdir(bin), mkdir(herdr), mkdir(logs)]);
 const programs = {'codex-acp': `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_ACP)} "$@"`, herdr: `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_HERDR)} herdr "$@"`, claude: 'exit 0', term: 'exit 0'};
 for (const [name, body] of Object.entries(programs)) {await writeFile(join(bin, name), `#!/bin/sh\n${body}\n`);await chmod(join(bin, name), 0o755);}
 const env = {PATH: `${bin}:${process.env.PATH}`, HOME: dir, FAKE_HERDR_DIR: herdr, FAKE_HERDR_SERVER_DELAY_MS: '100', PLANE_TEST_CREDENTIAL: MARK.credential};
 const store = new RuntimeStore({stateDir: repo.stateDir});
 const runners = [], clients = [], pids = [];
 t.after(async () => {
  for (const client of clients) client.close();
  for (const runner of runners) await runner.close();
  for (const pid of pids) if (alive(pid)) {process.kill(pid, 'SIGTERM');await waitFor(() => !alive(pid), 10000).catch(() => process.kill(pid, 'SIGKILL'));}
  store.close();
  await repo.cleanup();await rm(dir, {recursive: true, force: true});
 });
 let logCount = 0;
 const f = {
  ...repo, dir, bin, herdr, env, store,
  // An ACP profile of the catalog with its own fake agent script and log.
  acp(script = {}) {
   const log = join(logs, `agent-${++logCount}.log`);
   return {log, profile: {id: 'codex-fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'm1', reasoning: 'high',
    env: {FAKE_ACP_CONFIG: JSON.stringify({log, models: MODELS, envNames: ['ARTIFACT_PLANE_LAUNCH', 'PLANE_TEST_CREDENTIAL'], ...script}), PLANE_VARIABLE: MARK.variable}}};
  },
  terminal: {id: 'claude-opus-terminal', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus', env: {PLANE_VARIABLE: MARK.variable}},
  // An in-process runner with short intervals.
  async runner(options = {}) {
   const runner = new SessionRunner({stateDir: repo.stateDir, env, harnessPollMs: 50, acpOptions: {endGraceMs: 300}, terminalOptions: {intervalMs: 100},
    mcpServer: {name: 'artifact-plane', command: '/opt/plane/artifact-plane', args: ['mcp']}, ...options});
   runners.push(runner);
   return runner.listen();
  },
  // A client that never starts a runner process unless `start` is given.
  client(options = {}) {
   const client = new RunnerClient({stateDir: repo.stateDir, env: {...process.env, ...env}, start: () => {throw Error('The test starts no runner here.');}, ...options});
   clients.push(client);
   return client;
  },
  // A client that starts `artifact-plane runner` as a detached process.
  processClient: (options = {}) => f.client({start: undefined, ...options}),
  track: pid => pids.push(pid),
  lines: async log => (await readFile(log, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line)),
  agentPid: async log => (await waitFor(async () => (await f.lines(log)).filter(e => e.start).at(-1))).start.pid,
  received: async log => (await f.lines(log)).filter(e => e.in).map(e => e.in),
  session: id => store.session(id),
  attempt: id => store.attempt(id),
  events: id => store.db.prepare("SELECT json FROM events WHERE session=? AND kind LIKE 'session:%' ORDER BY seq").all(id).map(row => JSON.parse(row.json)),
  kinds: id => f.events(id).map(e => e.kind),
  herdrState: () => JSON.parse(readFileSync(join(herdr, 'state.json'), 'utf8')),
  async setHerdr(change) {
   const value = f.herdrState();change(value);
   await writeFile(join(herdr, 'state.tmp'), JSON.stringify(value));await rename(join(herdr, 'state.tmp'), join(herdr, 'state.json'));
  },
  setStatus: (id, status) => f.setHerdr(value => {for (const pane of value.sessions[`plane-${id}`].panes) pane.agent_status = status;}),
  herdrCalls: () => existsSync(join(herdr, 'calls.jsonl')) ? readFileSync(join(herdr, 'calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)).filter(c => c.program === 'herdr') : [],
  bind: async (id, task = 'a.md') => (await bind(store, repo.root, task, id)).attempt,
  start: (client, fields) => client.start({worktree: repo.root, role: 'implementer', artifact: 'demo', change: 'change-live', task: 'a.md', branch: 'main', prompt: `Start ${MARK.prompt}`, ...fields}),
 };
 return f;
}
// The session state and the attempt state.
const states = (f, id) => {const s = f.session(id);return [s.state, s.attempt ? f.attempt(s.attempt).state : null];};

test('a session ID has 12 random lowercase hexadecimal characters', () => {
 const ids = Array.from({length: 2000}, newSessionId);
 for (const id of ids) assert.match(id, /^[0-9a-f]{12}$/);
 assert.equal(new Set(ids).size, ids.length);
});

test('the runner listens on runner.sock with mode 0600, removes a stale socket file and leaves a live runner alone', {skip}, async t => {
 const f = await setup(t), path = runnerSocket(f.stateDir);
 // A process that listened on the socket and was killed leaves a stale socket file.
 const holder = spawn(process.execPath, ['-e', `require('net').createServer().listen(${JSON.stringify(path)}, () => process.stdout.write('ready'))`], {stdio: ['ignore', 'pipe', 'ignore']});
 await new Promise(done => holder.stdout.once('data', done));
 holder.kill('SIGKILL');
 await new Promise(done => holder.once('exit', done));
 assert.ok(statSync(path).isSocket());
 await assert.rejects(new Promise((done, fail) => connect(path).once('connect', done).once('error', fail)), {code: 'ECONNREFUSED'});
 const runner = await f.runner();
 assert.equal(statSync(path).mode & 0o777, 0o600);
 assert.equal(statSync(f.stateDir).mode & 0o777, 0o700);
 const client = f.client();
 assert.equal((await client.ensure()).version, pkg.version);
 // A second runner finds the live one and does not take its socket.
 const second = new SessionRunner({stateDir: f.stateDir, env: f.env});
 await assert.rejects(second.listen(), refusal('running'));
 await second.close();
 assert.equal((await client.call('hello')).pid, process.pid);
 // A state directory path that is too long for a socket gives a clear reason.
 const long = join(f.dir, 'x'.repeat(100));
 await mkdir(long, {mode: 0o700});
 const far = new SessionRunner({stateDir: long, env: f.env});
 await assert.rejects(far.listen(), refusal('unavailable', new RegExp(LONG_PATH_MESSAGE)));
 await far.close();
 await assert.rejects(f.client({stateDir: long}).ensure(), refusal('unavailable', new RegExp(LONG_PATH_MESSAGE)));
 await runner.close();
 assert.equal(existsSync(path), false, 'the runner removes its socket when it stops');
});

test('the server finds the runner, or starts a detached runner and waits up to 3 seconds', {skip}, async t => {
 const f = await setup(t);
 assert.equal(START_WAIT_MS, 3000);
 // Without a runner, a check starts nothing.
 const checker = f.client();
 assert.equal(await checker.check(), null);
 assert.deepEqual(await checker.availability(), {available: true, running: false, version: null, compatible: null, reason: null});
 // The first command starts `artifact-plane runner --state-dir` as a detached process.
 const client = f.processClient(), started = Date.now(), hello = await client.ensure();
 f.track(hello.pid);
 assert.ok(Date.now() - started < START_WAIT_MS, `the runner answered in ${Date.now() - started} ms`);
 assert.deepEqual([hello.version, hello.sessions], [pkg.version, []]);
 assert.notEqual(hello.pid, process.pid);
 const stat = readFileSync(`/proc/${hello.pid}/stat`, 'utf8').split(') ')[1].split(' ');
 assert.equal(Number(stat[3]), hello.pid, 'the runner leads its own session (detached)');
 assert.equal(statSync(runnerSocket(f.stateDir)).mode & 0o777, 0o600);
 // Another server finds the same runner and starts nothing.
 const other = f.client();
 assert.equal((await other.ensure()).pid, hello.pid);
 assert.deepEqual((await other.availability()), {available: true, running: true, version: pkg.version, compatible: true, reason: null});
 // A runner that does not answer within the wait gives 503 and changes nothing.
 const empty = await mkdtemp(join(tmpdir(), 'plane-runner-none-'));
 t.after(() => rm(empty, {recursive: true, force: true}));
 const silent = f.client({stateDir: empty, waitMs: 300, start: () => null});
 const waited = Date.now();
 await assert.rejects(silent.ensure(), refusal('unavailable', /did not start in 3 seconds/));
 assert.ok(Date.now() - waited >= 300);
 assert.equal(errorStatus('unavailable'), 503);
 assert.equal(existsSync(join(empty, 'runtime.sqlite')), false);
});

test('the runner answers each method and pushes events with a sequence number; another version refuses new starts', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), {profile, log} = f.acp({turns: [[{chunk: MARK.message}, {stop: 'end_turn'}], [{permission: {title: MARK.permission}}, {chunk: 'two'}], [{wait: 10000}], [{tool: 't1', kind: 'edit'}]]});
 assert.deepEqual(METHODS, ['hello', 'start', 'prompt', 'answer', 'cancel', 'resume', 'end', 'openTerminal', 'snapshot', 'subscribe', 'unsubscribe']);
 const hello = await client.call('hello');
 assert.deepEqual([hello.version, hello.pid, hello.sessions], [pkg.version, process.pid, []]);
 const id = newSessionId(), {session} = await f.start(client, {session: id, profile});
 assert.deepEqual([session.id, session.profile, session.attempt, session.hosted], [id, {id: 'codex-fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'm1', reasoning: 'high'}, null, true]);
 // subscribe, then snapshot: pushes after the snapshot sequence number belong to later changes.
 const pushed = [], unsubscribe = await client.subscribe(id, message => pushed.push(message));
 await waitFor(() => f.session(id).state === 'idle');
 const snap = await client.snapshot(id);
 assert.deepEqual([snap.session.state, snap.live.lastMessage, snap.live.pending], ['idle', MARK.message, []]);
 assert.ok(Number.isInteger(snap.seq));
 await client.prompt(id, `Second ${MARK.person}`);
 await waitFor(() => pushed.some(m => m.event === 'live' && m.update.pending.length));
 const live = pushed.filter(m => m.event === 'live').at(-1).update;
 assert.equal(live.pending[0].title, MARK.permission, 'the live state holds the request in memory');
 await client.answer(id, live.pending[0].request, 'allow');
 await waitFor(() => f.session(id).state === 'idle');
 await client.prompt(id, 'Third');
 await client.cancel(id);
 await waitFor(() => f.session(id).state === 'idle');
 // Every push has the session and a sequence number that grows by one.
 assert.ok(pushed.length > 5);
 assert.ok(pushed.every(m => m.session === id && ['state', 'live', 'lifecycle'].includes(m.event)));
 assert.deepEqual(pushed.map(m => m.seq), pushed.map((m, i) => pushed[0].seq + i));
 const kinds = pushed.filter(m => m.event === 'lifecycle').map(m => m.update.kind);
 for (const kind of ['session:prompted', 'session:permission-requested', 'session:permission-answered', 'session:turn-ended']) assert.ok(kinds.includes(kind), kind);
 // unsubscribe stops the pushes.
 await unsubscribe();
 const count = pushed.length;
 await client.prompt(id, 'Fourth');
 await waitFor(() => f.session(id).state === 'idle');
 assert.equal(pushed.length, count);
 // Refusals: wrong input, unknown session, a method of the other connection, wrong state.
 await assert.rejects(client.snapshot('nope'), refusal('invalid'));
 await assert.rejects(client.snapshot('0123456789ab'), refusal('unknown-session'));
 await assert.rejects(client.openTerminal(id, ['term']), refusal('state'));
 await assert.rejects(client.answer(id, 'p99', 'allow'), refusal('unknown-request'));
 await assert.rejects(client.call('nope'), refusal('unknown-method'));
 await assert.rejects(client.resume(id), refusal('state', /Only an interrupted session/));
 await assert.rejects(f.start(client, {session: id, profile}), refusal('invalid', /exists/));
 await assert.rejects(f.start(client, {profile: {...profile, env: {ARTIFACT_PLANE_PROMPT: 'x'}}}), refusal('invalid', /reserved/));
 await assert.rejects(f.start(client, {profile: {...profile, args: ['--yolo']}}), refusal('invalid', /skips permission prompts/));
 await assert.rejects(f.start(client, {profile: {id: 'own', harness: 'other', connection: 'acp', signIn: 'harness', model: 'm', command: ['plane-missing-program']}}), refusal('program-missing', /plane-missing-program/));
 await assert.rejects(f.start(client, {profile, worktree: 'relative'}), refusal('invalid'));
 await assert.rejects(f.start(client, {profile, respawnOf: '0123456789ab'}), refusal('unknown-session'));
 assert.deepEqual([errorStatus('invalid'), errorStatus('unknown-session'), errorStatus('state'), errorStatus('program-missing')], [400, 404, 409, 503]);
 // A server of another version refuses new starts and still reaches the running sessions.
 const old = f.client({version: '0.0.1'});
 await assert.rejects(f.start(old, {profile}), refusal('version', new RegExp(RESTART_MESSAGE)));
 assert.equal((await old.snapshot(id)).session.id, id);
 assert.deepEqual(await old.availability(), {available: false, running: true, version: pkg.version, compatible: false, reason: RESTART_MESSAGE});
 assert.equal((await client.end(id)).session.state, 'ended');
 assert.ok((await f.received(log)).some(m => m.method === 'session/new'));
});

test('the runner sets the session and attempt states of the States table for an ACP session', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), id = newSessionId(), attempt = await f.bind(id);
 const {profile} = f.acp({setDelay: 300, turns: [[{stop: 'end_turn'}], [{permission: {title: MARK.permission}}, {stop: 'end_turn'}], [{wait: 10000}], [{stop: 'max_tokens'}], [{stop: 'refusal'}], [{stop: 'error'}], [{stop: 'max_turn_requests'}]]});
 // Start accepted: starting, and the attempt stays unknown until the first prompt.
 const starting = f.start(client, {session: id, profile, attempt});
 await waitFor(() => f.session(id));
 assert.deepEqual(states(f, id), ['starting', 'unknown']);
 await starting;
 await waitFor(() => f.session(id).state === 'idle');
 assert.deepEqual(states(f, id), ['idle', 'validating'], 'turn ended with end_turn');
 assert.equal(f.attempt(attempt).session, 'sess-1', 'the harness session ID replaces the binding session');
 // Permission request, then answer, then end_turn.
 await client.prompt(id, MARK.person);
 await waitFor(() => f.session(id).state === 'waiting');
 assert.deepEqual(states(f, id), ['waiting', 'blocked']);
 const {live} = await client.snapshot(id);
 await client.answer(id, live.pending[0].request, 'allow');
 await waitFor(() => f.kinds(id).filter(k => k === 'session:turn-ended').length === 2);
 await waitFor(() => f.session(id).state === 'idle');
 assert.deepEqual(states(f, id), ['idle', 'validating']);
 // A running turn, then Stop turn: cancelled.
 await client.prompt(id, 'wait');
 assert.deepEqual(states(f, id), ['working', 'processing']);
 await client.cancel(id);
 await waitFor(() => f.session(id).state === 'idle');
 assert.deepEqual(states(f, id), ['idle', 'interrupted']);
 assert.deepEqual([f.session(id).reason, f.events(id).at(-1)], ['cancelled', {...f.events(id).at(-1), kind: 'session:interrupted', reason: 'cancelled'}]);
 for (const [reason, session, attemptState, interruption] of [['max_tokens', 'idle', 'interrupted', 'max-tokens'], ['refusal', 'idle', 'failed', null], ['error', 'idle', 'failed', null], ['max_turn_requests', 'idle', 'interrupted', 'max-turn-requests']]) {
  const ended = f.kinds(id).filter(k => k === 'session:turn-ended').length;
  await client.prompt(id, 'next');
  await waitFor(() => f.kinds(id).filter(k => k === 'session:turn-ended').length === ended + 1 && f.session(id).state === 'idle');
  assert.deepEqual(states(f, id), [session, attemptState], reason);
  const turn = f.events(id).filter(e => e.kind === 'session:turn-ended').at(-1);
  assert.equal(turn.stopReason, reason);
  if (interruption) assert.deepEqual([f.events(id).at(-1).kind, f.events(id).at(-1).reason], ['session:interrupted', interruption]);
 }
 // The person ends the session: the attempt was not validating, so it becomes interrupted.
 await client.end(id);
 assert.deepEqual(states(f, id), ['ended', 'interrupted']);
 assert.deepEqual([f.session(id).reason, typeof f.session(id).endedAt], ['person', 'number']);
 // A validating attempt stays validating when the person ends the session.
 const other = newSessionId(), second = await f.bind(other, 'b.md');
 await f.start(client, {session: other, task: 'b.md', profile: f.acp({turns: [[{stop: 'end_turn'}]]}).profile, attempt: second});
 await waitFor(() => f.session(other).state === 'idle');
 await client.end(other);
 assert.deepEqual(states(f, other), ['ended', 'validating']);
 // The lifecycle event kinds and their fields.
 const events = f.events(id);
 assert.deepEqual(events[0], {...events[0], kind: 'session:started', role: 'implementer', profile: 'codex-fast', harness: 'codex', connection: 'acp', model: 'm1', protocolVersion: 2, attempt, session: id});
 assert.deepEqual(events[1], {...events[1], kind: 'session:harness-id', harnessSession: 'sess-1'});
 assert.deepEqual(events[2], {...events[2], kind: 'session:prompted', source: 'initial'});
 assert.ok(events.some(e => e.kind === 'session:prompted' && e.source === 'person'));
 assert.ok(events.some(e => e.kind === 'session:permission-requested' && e.request === 'p1'));
 assert.ok(events.some(e => e.kind === 'session:permission-answered' && e.request === 'p1' && e.optionKind === 'allow_once'));
 assert.deepEqual(events.at(-1), {...events.at(-1), kind: 'session:ended', reason: 'person'});
 assert.equal(f.session(id).reportedModel, 'm1');
});

test('a failed ACP start ends the session with reason error and shows the sign-in message', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), id = newSessionId(), attempt = await f.bind(id);
 const {session} = await f.start(client, {session: id, attempt, profile: f.acp({newError: {code: -32000, message: 'Authentication required'}}).profile});
 assert.deepEqual([session.state, session.reason, session.error], ['ended', 'error', 'Sign in with the harness tool in a terminal, then start again.']);
 assert.deepEqual(states(f, id), ['ended', 'interrupted']);
 assert.deepEqual(f.kinds(id), ['session:started', 'session:ended']);
});

test('the runner sets the session state from herdr for a terminal session; the hooks update the attempt and a report sets Done (reported)', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), id = newSessionId(), attempt = await f.bind(id);
 const {session} = await f.start(client, {session: id, attempt, profile: f.terminal});
 assert.deepEqual([session.state, session.pane, session.tab, session.harnessSession], ['starting', 'w1:p1', 'w1:t1', null]);
 // The command line carries the initial prompt: the attempt processes.
 assert.deepEqual(states(f, id), ['starting', 'processing']);
 assert.deepEqual(f.kinds(id), ['session:started', 'session:prompted']);
 const pane = f.herdrState().sessions[`plane-${id}`].panes[0];
 assert.deepEqual(pane.env, {ARTIFACT_PLANE_LAUNCH: id, ARTIFACT_PLANE_PROMPT: `Start ${MARK.prompt}`, PLANE_VARIABLE: MARK.variable});
 assert.deepEqual(pane.runs, [terminalCommandLine(f.terminal)]);
 // The SessionStart hook records the harness session ID; the runner copies it and rebinds the attempt.
 recordHarnessId({session_id: 'harness-0001', model: 'claude-opus-5-5'}, f.store, id);
 await waitFor(() => f.session(id).harnessSession === 'harness-0001');
 assert.equal(f.session(id).reportedModel, 'claude-opus-5-5');
 assert.deepEqual([f.attempt(attempt).session, f.attempt(attempt).model], ['harness-0001', 'claude-opus-5-5']);
 // A newer record wins (for example after /clear).
 recordHarnessId({session_id: 'harness-0002', model: 'claude-opus-5-5'}, f.store, id);
 await waitFor(() => f.session(id).harnessSession === 'harness-0002');
 assert.equal(f.attempt(attempt).session, 'harness-0002');
 // The hooks of the harness session update the attempt.
 const hook = (kind, fields = {}) => f.store.observe({session_id: 'harness-0002', hook_event_name: kind, turn_id: 'turn-1', cwd: f.root, ...fields});
 hook('UserPromptSubmit');
 assert.equal(f.attempt(attempt).state, 'processing');
 // herdr status sets only the session state.
 for (const [status, sessionState, kind] of [['working', 'working', 'session:working'], ['blocked', 'waiting', 'session:waiting'], ['unknown', 'waiting', null], ['done', 'idle', 'session:idle']]) {
  const before = f.kinds(id).length;
  await f.setStatus(id, status);
  await waitFor(async () => (await client.snapshot(id)).session.agentStatus === status);
  assert.deepEqual(states(f, id), [sessionState, 'processing'], status);
  assert.deepEqual(f.kinds(id).slice(before), kind ? [kind] : [], status);
 }
 hook('PermissionRequest');
 assert.equal(f.attempt(attempt).state, 'blocked');
 hook('Stop');
 assert.equal(f.attempt(attempt).state, 'validating');
 // `artifact-plane runtime report` still sets Done (reported), and herdr status and the end keep it.
 const reported = JSON.parse(execFileSync(process.execPath, [APP, 'runtime', 'report', '--attempt', attempt, '--state', 'validated', '--root', f.root, '--method', 'suite', '--source', 'evidence.md#checks', '--state-dir', f.stateDir], {encoding: 'utf8'}));
 assert.deepEqual([reported.state, reported.validation.reported, f.attempt(attempt).state], ['done', true, 'done']);
 await f.setStatus(id, 'working');
 await waitFor(() => f.session(id).state === 'working');
 assert.equal(f.attempt(attempt).state, 'done');
 await client.end(id);
 assert.deepEqual(states(f, id), ['ended', 'done']);
 assert.equal(f.herdrState().sessions[`plane-${id}`].running, false, 'end stops the named herdr session');
 assert.deepEqual(f.kinds(id).at(-1), 'session:ended');
});

test('a stopped agent process interrupts the session and the attempt; Resume reattaches the same harness session; Respawn starts a new session with respawnOf (AOA4)', {skip}, async t => {
 for (const version of [1, 2]) {
  const f = await setup(t);
  await f.runner();
  const client = f.client(), id = newSessionId(), attempt = await f.bind(id);
  const {profile, log} = f.acp({version, turns: [[{chunk: 'first answer'}, {stop: 'end_turn'}]], history: [{user: 'earlier prompt'}, {agent: 'replayed answer'}]});
  await f.start(client, {session: id, profile, attempt});
  await waitFor(() => f.session(id).state === 'idle');
  const base = f.session(id).baseRevision;
  assert.equal(base, git(f.root, 'rev-parse', 'HEAD').trim());
  // The agent process stops.
  process.kill(await f.agentPid(log), 'SIGKILL');
  await waitFor(() => f.session(id).state === 'interrupted');
  assert.deepEqual(states(f, id), ['interrupted', 'interrupted'], `version ${version}`);
  assert.deepEqual([f.session(id).reason, f.events(id).at(-1).kind, f.events(id).at(-1).reason], ['process-exit', 'session:interrupted', 'process-exit']);
  await assert.rejects(client.prompt(id, 'x'), refusal('state', /interrupted/));
  // Resume reattaches the same harness session in a new agent process.
  const {session} = await client.resume(id);
  assert.deepEqual([session.state, session.harnessSession, session.id], ['idle', 'sess-1', id]);
  const calls = await f.received(log), reattach = calls.find(m => m.method === (version === 2 ? 'session/resume' : 'session/load'));
  assert.equal(reattach.params.sessionId, 'sess-1', `version ${version}`);
  assert.equal(calls.filter(m => m.method === 'session/new').length, 1, 'no new harness session');
  assert.deepEqual([f.events(id).at(-1).kind, f.events(id).at(-1).method], ['session:resumed', version === 2 ? 'resume' : 'load']);
  assert.equal((await client.snapshot(id)).live.lastMessage, 'replayed answer');
  assert.deepEqual(states(f, id), ['idle', 'unknown']);
  await client.prompt(id, 'continue');
  await waitFor(() => f.session(id).state === 'idle' && f.attempt(attempt).state === 'validating');
  // Respawn: a new session with respawnOf and the base revision of the earlier session.
  process.kill((await f.lines(log)).filter(e => e.start).at(-1).start.pid, 'SIGKILL');
  await waitFor(() => f.session(id).state === 'interrupted');
  git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'later work');
  const next = newSessionId(), respawned = await f.bind(next);
  const other = f.acp({version, turns: [[{stop: 'end_turn'}]]});
  const {session: second} = await f.start(client, {session: next, profile: other.profile, attempt: respawned, respawnOf: id});
  assert.deepEqual([second.respawnOf, second.baseRevision, second.attempt], [id, base, respawned]);
  assert.notEqual(second.baseRevision, git(f.root, 'rev-parse', 'HEAD').trim());
  await waitFor(() => f.session(next).state === 'idle');
  assert.deepEqual(states(f, next), ['idle', 'validating']);
  assert.ok((await f.received(other.log)).some(m => m.method === 'session/new'), 'Respawn starts a new harness session');
  await client.end(next);await client.end(id);
 }
});

test('a terminal session with a missing pane is interrupted; Resume restarts a stopped herdr server or workspace without the prompt; Respawn keeps the base revision', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), id = newSessionId(), attempt = await f.bind(id);
 await f.start(client, {session: id, profile: f.terminal, attempt});
 recordHarnessId({session_id: 'harness-0001'}, f.store, id);
 await waitFor(() => f.session(id).harnessSession === 'harness-0001');
 await f.setStatus(id, 'working');
 await waitFor(() => f.session(id).state === 'working');
 const line = terminalCommandLine(f.terminal, {resume: 'harness-0001'});
 // 1. The named herdr server stopped: the pane is missing.
 await f.setHerdr(value => {Object.assign(value.sessions[`plane-${id}`], {running: false, panes: [], workspaces: []});});
 await waitFor(() => f.session(id).state === 'interrupted');
 assert.deepEqual(states(f, id), ['interrupted', 'interrupted']);
 assert.deepEqual([f.session(id).reason, f.events(id).at(-1).reason], ['pane-missing', 'pane-missing']);
 let mark = f.herdrCalls().length;
 const {session} = await client.resume(id);
 assert.deepEqual([session.state, session.pane], ['starting', 'w1:p1']);
 const command = c => c.argv.slice(2, 4).filter(a => !a.startsWith('-')).join(' ');
 assert.deepEqual(f.herdrCalls().slice(mark).map(command).filter(c => c !== 'pane list'), ['tab create', 'server', 'workspace create', 'pane run']);
 let pane = f.herdrState().sessions[`plane-${id}`].panes[0];
 assert.deepEqual([pane.env, pane.runs], [{ARTIFACT_PLANE_LAUNCH: id, PLANE_VARIABLE: MARK.variable}, [line]]);
 assert.deepEqual([f.events(id).at(-1).kind, f.events(id).at(-1).method], ['session:resumed', 'terminal']);
 assert.deepEqual(states(f, id), ['starting', 'unknown']);
 // 2. The server runs without a workspace.
 await f.setHerdr(value => {Object.assign(value.sessions[`plane-${id}`], {panes: [], workspaces: []});});
 await waitFor(() => f.session(id).state === 'interrupted');
 mark = f.herdrCalls().length;
 await client.resume(id);
 assert.deepEqual(f.herdrCalls().slice(mark).map(command).filter(c => c !== 'pane list'), ['tab create', 'workspace create', 'pane run']);
 pane = f.herdrState().sessions[`plane-${id}`].panes[0];
 assert.deepEqual([pane.env, pane.runs], [{ARTIFACT_PLANE_LAUNCH: id, PLANE_VARIABLE: MARK.variable}, [line]]);
 // The hooks of the resumed harness session update the attempt again.
 f.store.observe({session_id: 'harness-0001', hook_event_name: 'UserPromptSubmit', turn_id: 'turn-2', cwd: f.root});
 assert.equal(f.attempt(attempt).state, 'processing');
 // Open in terminal app.
 assert.equal(typeof (await client.openTerminal(id, ['term', '-e'])).pid, 'number');
 // Respawn after the end.
 await client.end(id);
 git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'later work');
 const next = newSessionId();
 const {session: second} = await f.start(client, {session: next, profile: f.terminal, attempt: await f.bind(next), respawnOf: id});
 assert.deepEqual([second.respawnOf, second.baseRevision], [id, f.session(id).baseRevision]);
 await client.end(next);
});

test('after a server restart the sessions keep running and the new server shows their state (AOA6)', {skip}, async t => {
 const f = await setup(t);
 const first = f.processClient(), hello = await first.ensure();
 f.track(hello.pid);
 const acpId = newSessionId(), termId = newSessionId(), attempt = await f.bind(acpId);
 const {profile, log} = f.acp({turns: [[{permission: {title: MARK.permission}}, {chunk: MARK.message}, {stop: 'end_turn'}]]});
 await f.start(first, {session: acpId, profile, attempt});
 await f.start(first, {session: termId, task: 'b.md', profile: f.terminal});
 await waitFor(() => f.session(acpId).state === 'waiting');
 await f.setStatus(termId, 'working');
 await waitFor(() => f.session(termId).state === 'working');
 const agent = await f.agentPid(log);
 // The server stops: its connection closes. The runner and the agent keep running.
 first.close();
 await sleep(300);
 assert.ok(alive(hello.pid) && alive(agent));
 // A new server finds the same runner, starts nothing and shows the state again.
 const second = f.client(), again = await second.ensure();
 assert.deepEqual([again.pid, again.sessions.sort()], [hello.pid, [acpId, termId].sort()]);
 const acp = await second.snapshot(acpId), term = await second.snapshot(termId);
 assert.deepEqual([acp.session.state, acp.session.hosted, acp.live.pending.length, acp.live.pending[0].title], ['waiting', true, 1, MARK.permission]);
 assert.deepEqual([term.session.state, term.session.agentStatus, term.session.hosted], ['working', 'working', true]);
 assert.deepEqual(states(f, acpId), ['waiting', 'blocked'], 'no runner-lost after a server restart');
 // The session continues through the new server.
 await second.answer(acpId, acp.live.pending[0].request, 'allow');
 await waitFor(() => f.session(acpId).state === 'idle');
 assert.equal((await second.snapshot(acpId)).live.lastMessage, MARK.message);
 assert.deepEqual(states(f, acpId), ['idle', 'validating']);
 await second.end(acpId);await second.end(termId);
});

test('after a runner loss the ACP sessions are interrupted with reason runner-lost and the terminal sessions continue', {skip}, async t => {
 const f = await setup(t);
 const client = f.processClient(), hello = await client.ensure();
 f.track(hello.pid);
 const acpId = newSessionId(), termId = newSessionId(), attempt = await f.bind(acpId);
 const {profile, log} = f.acp({turns: [[{stop: 'end_turn'}]]});
 await f.start(client, {session: acpId, profile, attempt});
 await f.start(client, {session: termId, task: 'b.md', profile: f.terminal});
 await waitFor(() => f.session(acpId).state === 'idle');
 await f.setStatus(termId, 'working');
 await waitFor(() => f.session(termId).state === 'working');
 const lost = [], agent = await f.agentPid(log);
 await client.subscribe(acpId, message => lost.push(message));
 // The runner process stops without a warning.
 process.kill(hello.pid, 'SIGKILL');
 await waitFor(() => !alive(hello.pid));
 // The next server check marks the ACP session; the terminal session stays.
 await waitFor(() => f.session(acpId).state === 'interrupted');
 assert.deepEqual(states(f, acpId), ['interrupted', 'interrupted']);
 assert.deepEqual([f.session(acpId).reason, f.events(acpId).at(-1).kind, f.events(acpId).at(-1).reason], ['runner-lost', 'session:interrupted', 'runner-lost']);
 assert.deepEqual(lost.map(m => m.event), ['runner-lost']);
 assert.equal(f.session(termId).state, 'working');
 assert.equal(f.herdrState().sessions[`plane-${termId}`].panes.length, 1, 'the pane continues in herdr');
 await waitFor(() => !alive(agent));
 // A new runner follows the terminal session again, and the ACP session resumes.
 const next = await client.ensure();
 f.track(next.pid);
 assert.notEqual(next.pid, hello.pid);
 assert.deepEqual(next.sessions, [termId]);
 await f.setStatus(termId, 'blocked');
 await waitFor(() => f.session(termId).state === 'waiting');
 await assert.rejects(client.resume(acpId), refusal('invalid', /Send the profile/));
 const {session} = await client.resume(acpId, {profile});
 assert.deepEqual([session.state, session.harnessSession], ['idle', 'sess-1']);
 assert.equal((await f.received(log)).filter(m => m.method === 'session/resume').length, 1);
 await client.end(acpId);await client.end(termId);
});

test('the runner exits 10 minutes after its last session ends while no server is connected', {skip}, async t => {
 assert.equal(IDLE_EXIT_MS, 10 * 60 * 1000);
 const f = await setup(t), runner = await f.runner({idleMs: 200});
 let idle = 0;
 runner.on('idle', () => idle++);
 await waitFor(() => idle === 1, 2000);
 // A connected server keeps it.
 const client = f.client();
 await client.ensure();
 await sleep(400);
 assert.equal(idle, 1);
 // A running session keeps it after the server disconnects.
 const id = newSessionId();
 await f.start(client, {session: id, profile: f.terminal});
 client.close();
 await sleep(400);
 assert.equal(idle, 1);
 // The session ends: 200 ms later, without a server, the runner is idle.
 const other = f.client();
 await other.end(id);
 other.close();
 const ended = Date.now();
 await waitFor(() => idle === 2, 2000);
 assert.ok(Date.now() - ended >= 150);
});

test('the store creates the sessions table, keeps schema version 1 and opens a store of the current release unchanged', async t => {
 const f = await runtimeFixture();
 t.after(() => f.cleanup());
 // A store of the current release has these four tables only.
 let store = new RuntimeStore({stateDir: f.stateDir});
 const {attempt} = await bind(store, f.root, 'a.md', 'release-session');
 store.observe({session_id: 'release-session', hook_event_name: 'UserPromptSubmit', turn_id: 't', cwd: f.root});
 store.close();
 const path = join(f.stateDir, 'runtime.sqlite'), db = new DatabaseSync(path);
 db.exec('DROP TABLE sessions');
 const tables = () => db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
 const rows = () => ['repositories', 'contexts', 'attempts', 'events'].map(name => db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all());
 assert.deepEqual(tables(), ['attempts', 'contexts', 'events', 'repositories']);
 const before = JSON.stringify(rows());
 // A read-only reader of the new release reads the store without the table.
 const reader = new RuntimeStore({stateDir: f.stateDir, create: false});
 assert.deepEqual([reader.hasSessions(), reader.sessions(), reader.session('0123456789ab')], [false, [], null]);
 assert.equal(reader.query(f.root).attempts[0].id, attempt);
 reader.close();
 // The writer adds the sessions table and changes nothing else.
 store = new RuntimeStore({stateDir: f.stateDir});
 assert.equal(store.query(f.root).attempts[0].state, 'processing');
 store.close();
 assert.deepEqual(tables(), ['attempts', 'contexts', 'events', 'repositories', 'sessions']);
 assert.equal(db.prepare("SELECT sql FROM sqlite_master WHERE name='sessions'").get().sql, 'CREATE TABLE sessions(id TEXT PRIMARY KEY, repository TEXT, attempt TEXT, harnessSession TEXT, json TEXT)');
 assert.equal(Number(db.prepare('PRAGMA user_version').get().user_version), 1);
 assert.equal(JSON.stringify(rows()), before, 'the attempts and events of the release stay unchanged');
 db.close();
});

test('the store holds no message text, prompt, permission title, tool name, tool argument, tool output or credential in the new events and the sessions table', {skip}, async t => {
 const f = await setup(t);
 await f.runner();
 const client = f.client(), id = newSessionId(), termId = newSessionId();
 const {profile} = f.acp({turns: [[{chunk: MARK.message}, {thought: 'THOUGHT-MARK'}, {tool: 'tool-1', kind: 'edit'}, {stop: 'end_turn'}], [{permission: {title: MARK.permission}}, {message: MARK.message, id: 'm2'}, {tool: 'tool-2', kind: 'execute'}, {stop: 'end_turn'}]]});
 await f.start(client, {session: id, profile, attempt: await f.bind(id), prompt: `Initial ${MARK.prompt}`});
 await waitFor(() => f.session(id).state === 'idle');
 await client.prompt(id, `Person ${MARK.person}`);
 await waitFor(() => f.session(id).state === 'waiting');
 await client.answer(id, (await client.snapshot(id)).live.pending[0].request, 'allow');
 await waitFor(() => f.session(id).state === 'idle' && f.kinds(id).filter(k => k === 'session:turn-ended').length === 2);
 assert.equal((await client.snapshot(id)).live.lastMessage, MARK.message, 'the message stays in memory');
 assert.ok(f.kinds(id).includes('session:output-changed'));
 await f.start(client, {session: termId, task: 'b.md', profile: f.terminal, prompt: `Terminal ${MARK.prompt}`});
 recordHarnessId({session_id: 'harness-0001', model: 'claude-opus-5-5'}, f.store, termId);
 await waitFor(() => f.session(termId).harnessSession);
 await client.end(id);await client.end(termId);
 const forbidden = [...Object.values(MARK), 'THOUGHT-MARK', 'Tool title', 'tool argument', 'tool output', 'The agent wants to run a command.', 'Allow once'];
 const sessions = f.store.db.prepare('SELECT * FROM sessions').all(), events = f.store.db.prepare("SELECT * FROM events WHERE kind LIKE 'session:%'").all();
 assert.equal(sessions.length, 2);
 assert.ok(events.length > 10);
 const stored = JSON.stringify([sessions, events]);
 for (const value of forbidden) assert.ok(!stored.includes(value), value);
 // The database files hold none of them either.
 f.store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
 for (const file of ['runtime.sqlite', 'runtime.sqlite-wal']) {
  const path = join(f.stateDir, file);
  if (!existsSync(path)) continue;
  const bytes = readFileSync(path).toString('latin1');
  for (const value of forbidden) assert.ok(!bytes.includes(value), `${file}: ${value}`);
 }
 // The stored profile has only its identity and launch fields.
 assert.deepEqual(Object.keys(f.session(id).profile), ['id', 'harness', 'connection', 'signIn', 'model', 'reasoning']);
 assert.deepEqual(Object.keys(f.session(id)).sort(), ['attempt', 'artifact', 'baseRevision', 'branch', 'change', 'endedAt', 'harnessSession', 'id', 'pane', 'profile', 'reason', 'repository', 'reportedModel', 'respawnOf', 'role', 'startedAt', 'state', 'tab', 'task', 'updatedAt', 'worktree'].sort());
});

test('the settings query reports the runner availability without starting a runner', {skip}, async t => {
 const f = await setup(t), config = join(f.dir, 'config');
 const server = createAppServer({stateDir: f.stateDir, configDir: config});
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 t.after(() => new Promise(done => server.close(done)));
 // The query reads the program versions on PATH; an empty PATH keeps every real program out.
 const query = async () => {
  const path = process.env.PATH;
  process.env.PATH = '';
  try {return (await (await fetch(`http://127.0.0.1:${server.address().port}/api/settings/query`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'})).json()).runner;}
  finally {process.env.PATH = path;}
 };
 assert.deepEqual(await query(), {available: true, running: false, version: null, compatible: null, reason: null});
 assert.equal(existsSync(runnerSocket(f.stateDir)), false);
 await f.runner();
 assert.deepEqual(await query(), {available: true, running: true, version: pkg.version, compatible: true, reason: null});
 // The settings service takes any availability function.
 const service = createSettingsService({configDir: config, stateDir: f.stateDir, env: {PATH: ''}, runner: () => f.client({version: '0.0.1'}).availability()});
 assert.deepEqual((await service.query()).runner, {available: false, running: true, version: pkg.version, compatible: false, reason: RESTART_MESSAGE});
});
