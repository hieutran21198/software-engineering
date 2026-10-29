// The session runner of artifact-plane specifications/agent-orchestration.md (Runner, Lifecycle
// events, States, Recovery, Failures; ADR 019). One runner process for each state directory hosts
// the ACP adapter (server/acp-client.js) and the terminal adapter (server/terminal-adapter.js) of
// each session. It keeps the live state (the last agent message and the pending permission
// requests) in memory only, and writes the sessions, their lifecycle events and the attempt
// states to the runtime store. An event and a session record never hold message text, a prompt,
// a permission title, a tool name, a tool argument, tool output or a credential.
//
// The server talks to the runner through `runner.sock` (server/runner-client.js): requests
// {id, method, params}, responses {id, result} or {id, error: {code, message}}, and pushed
// {event, session, seq, update} objects, one JSON object on each line. `seq` counts the pushes
// of one session in this runner process.
import {randomBytes} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {accessSync, chmodSync, constants, unlinkSync} from 'node:fs';
import {connect, createServer} from 'node:net';
import {isAbsolute, resolve} from 'node:path';
import {AcpSession, planeMcpServer} from './acp-client.js';
import {ROLES, validateSettings} from './agent-settings.js';
import {findProgram, profileCommand} from './provider-catalog.js';
import {LONG_PATH_MESSAGE, RUNNER_VERSION, RunnerError, readMessages, runnerSocket, socketPathFits, writeMessage} from './runner-client.js';
import {RuntimeStore, defaultStateDir} from './runtime-store.js';
import {readBase} from './session-output.js';
import {TerminalSession} from './terminal-adapter.js';
import {TerminalRelays} from './terminal-relay.js';

export const IDLE_EXIT_MS = 10 * 60 * 1000;
// The copy interval of the harness session ID that the SessionStart hook records.
export const HARNESS_ID_POLL_MS = 2000;
export const PROMPT_LIMIT = 64 * 1024;
// A client that does not read its pushed events loses its connection.
const OUTPUT_LIMIT = 64 * 1024 * 1024;
export const METHODS = ['hello', 'start', 'prompt', 'answer', 'cancel', 'resume', 'end', 'openTerminal', 'snapshot', 'subscribe', 'unsubscribe'];
// The methods of the embedded terminal relay (Embedded terminal; server/terminal-relay.js).
export const RELAY_METHODS = ['relay', 'relayViewers'];
const SESSION_ID = /^[0-9a-f]{12}$/, REVISION = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/, NAME = /^[a-z0-9][a-z0-9-]*$/, PROGRAM = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CONTROL = /[\x00-\x1f\x7f]/;
// The attempt state after a turn and the interruption reason of the turn (States, Lifecycle events).
const TURN_ATTEMPT = {end_turn: 'validating', cancelled: 'interrupted', max_tokens: 'interrupted', max_turn_requests: 'interrupted', refusal: 'failed', error: 'failed'};
const TURN_REASON = {cancelled: 'cancelled', max_tokens: 'max-tokens', max_turn_requests: 'max-turn-requests'};
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v, max = 512) => typeof v === 'string' && v.length > 0 && v.length <= max && !CONTROL.test(v);

// A Plane session ID: 12 random lowercase hexadecimal characters.
export const newSessionId = () => randomBytes(6).toString('hex');

function executable(name, env, cwd) {
 if (!name.includes('/')) return Boolean(findProgram(name, env));
 try {accessSync(isAbsolute(name) ? name : resolve(cwd, name), constants.X_OK);return true;} catch {return false;}
}
// The error object of a response. Adapter codes stay; `missing-program` is `program-missing`.
function errorBody(error) {
 const code = typeof error?.code === 'string' && /^[a-z][a-z-]*$/.test(error.code) ? (error.code === 'missing-program' ? 'program-missing' : error.code) : 'internal';
 const body = {code, message: typeof error?.message === 'string' && error.message ? error.message : 'The session runner failed.'};
 for (const key of ['program', 'herdrCode', 'session']) if (typeof error?.[key] === 'string') body[key] = error[key];
 return body;
}
function send(client, message) {
 if (client.socket.destroyed) return;
 if (client.socket.writableLength > OUTPUT_LIMIT) return void client.socket.destroy();
 writeMessage(client.socket, message);
}
// True when a process accepts connections on the socket path.
function answers(path) {
 return new Promise(done => {
  const socket = connect(path), finish = value => {socket.destroy();done(value);};
  socket.once('connect', () => finish(true));
  socket.once('error', error => finish(error.code !== 'ECONNREFUSED' && error.code !== 'ENOENT'));
  socket.setTimeout(1000, () => finish(true));
 });
}
// Listens on the socket with mode 0600. A stale socket file without a listener is removed;
// a socket with a listener belongs to another runner.
async function listenSocket(server, path) {
 if (!socketPathFits(path)) throw new RunnerError('unavailable', LONG_PATH_MESSAGE);
 for (let attempt = 0; ; attempt++) {
  try {
   await new Promise((done, fail) => {
    server.once('error', fail);
    const mask = process.umask(0o177);
    try {server.listen(path, () => {server.off('error', fail);done();});} finally {process.umask(mask);}
   });
   chmodSync(path, 0o600);
   return;
  } catch (error) {
   if (error.code !== 'EADDRINUSE' || attempt) throw error;
   if (await answers(path)) throw new RunnerError('running', `A session runner already listens on ${path}.`);
   try {unlinkSync(path);} catch (e) {if (e.code !== 'ENOENT') throw e;}
  }
 }
}

// One session of the runner: the stored record, the attempt ID, the full profile (memory
// only, because it can hold variables), the adapter and the relays of the runner.
class Host {
 constructor(record, {attempt = null, profile = null, programs = {}, started = true, relays = null} = {}) {
  Object.assign(this, {record, attempt, profile, programs, started, relays});
  this.adapter = null;this.agentStatus = null;this.error = null;this.seq = 0;this.resuming = false;this.subscribers = new Set();
 }
 get acp() {return this.record.profile.connection === 'acp';}
 // The runner hosts a running agent process or a followed herdr pane.
 get running() {return Boolean(this.adapter) && !['interrupted', 'ended'].includes(this.record.state);}
 // The session fields with the attempt, the herdr status, the last error message, `hosted`, and
 // `relay`: {available, reason} of the embedded terminal of a running terminal session, else null.
 view() {
  const relay = !this.acp && this.running && this.relays ? this.relays.status(this.record.id) : null;
  return {...this.record, attempt: this.attempt, agentStatus: this.agentStatus, error: this.error, hosted: this.running, relay};
 }
 // The live state of an ACP session: memory only.
 live() {
  if (!this.acp || !this.adapter) return null;
  const {lastMessage, pending, protocolVersion, resumable} = this.adapter.snapshot();
  return {lastMessage, pending, protocolVersion, resumable};
 }
}

// The runner of one state directory. Events: `idle` (no session runs and no server is
// connected since idleMs), `session-ended` (session ID) and `store-error`. `methods` maps a
// protocol method to its handler (params, client): METHODS and RELAY_METHODS. `relayOptions`
// holds the stop and start times of the terminal relay (server/terminal-relay.js).
export class SessionRunner extends EventEmitter {
 constructor({stateDir = defaultStateDir(), env = process.env, idleMs = IDLE_EXIT_MS, harnessPollMs = HARNESS_ID_POLL_MS, acpOptions = {}, terminalOptions = {}, relayOptions = {}, mcpServer = planeMcpServer()} = {}) {
  super();
  this.stateDir = resolve(stateDir);
  this.store = new RuntimeStore({stateDir: this.stateDir});
  this.path = runnerSocket(this.stateDir);
  Object.assign(this, {env, idleMs, harnessPollMs, acpOptions, terminalOptions});
  // The MCP server of an agent uses the state directory of this runner.
  this.mcpServer = {...mcpServer, args: [...(mcpServer.args || []), '--state-dir', this.stateDir]};
  this.hosts = new Map();this.clients = new Set();this.startedAt = Date.now();this.harnessSeq = 0;this.closing = false;
  this.idleTimer = null;this.harnessTimer = null;
  this.methods = Object.fromEntries([...METHODS, ...RELAY_METHODS].map(name => [name, (params, client) => this[name](params, client)]));
  this.server = createServer(socket => this.#accept(socket));
  // A change of the relay availability reaches the subscribers as a new session state.
  this.relays = new TerminalRelays({stateDir: this.stateDir, env, ...relayOptions, onChange: id => {
   const host = this.hosts.get(id);
   if (host && !this.closing) this.#push(host, 'state', host.view());
  }});
  // The runner stops ttyd when the session ends (Relay stop).
  this.on('session-ended', id => {this.relays.stop(id);});
 }

 // Listens on runner.sock, then follows the terminal sessions that ran when the runner stopped.
 async listen() {
  await listenSocket(this.server, this.path);
  for (const record of this.store.sessions({connection: 'terminal', active: true})) this.#load(record).adapter.watch();
  this.#copyHarnessIds();
  this.harnessTimer = setInterval(() => this.#copyHarnessIds(), this.harnessPollMs);
  this.harnessTimer.unref();
  this.#checkIdle();
  return this;
 }
 // Stops listening and removes the socket. Running agent processes stop and terminal sessions
 // continue in herdr; the server check then marks the ACP sessions runner-lost.
 close() {
  if (this.closed) return this.closed;
  this.closing = true;
  clearInterval(this.harnessTimer);clearTimeout(this.idleTimer);
  return this.closed = (async () => {
   for (const client of this.clients) client.socket.destroy();
   await new Promise(done => this.server.close(() => done()));
   const stops = [this.relays.close()];
   for (const host of this.hosts.values()) {
    if (host.adapter instanceof TerminalSession) host.adapter.stopWatching();
    else if (host.running) stops.push(host.adapter.end().catch(() => {}));
   }
   await Promise.all(stops);
   this.store.close();
  })();
 }

 #accept(socket) {
  const client = {socket, sessions: new Set()};
  this.clients.add(client);
  this.#checkIdle();
  socket.on('error', () => {});
  socket.on('close', () => {
   this.clients.delete(client);
   for (const id of client.sessions) this.hosts.get(id)?.subscribers.delete(client);
   this.relays.dropClient(client);
   this.#checkIdle();
  });
  readMessages(socket, message => this.#request(client, message));
 }
 async #request(client, message) {
  const id = plain(message) && (typeof message.id === 'number' || typeof message.id === 'string') ? message.id : null;
  try {
   if (id === null || typeof message.method !== 'string' || (message.params !== undefined && !plain(message.params))) throw new RunnerError('invalid', 'Send {id, method, params} as one JSON object on each line.');
   if (!Object.hasOwn(this.methods, message.method)) throw new RunnerError('unknown-method', `The runner has no method ${message.method}.`);
   if (this.closing) throw new RunnerError('unavailable', 'The session runner stops.');
   send(client, {id, result: await this.methods[message.method](message.params ?? {}, client)});
  } catch (error) {send(client, {id, error: errorBody(error)});}
 }
 #push(host, event, update) {
  host.seq++;
  for (const client of host.subscribers) send(client, {event, session: host.record.id, seq: host.seq, update});
 }
 // Writes the session with its events and the attempt change, then pushes the new state.
 #write(host, events = [], change = null) {
  host.record.updatedAt = Date.now();
  try {this.store.recordSession({...host.record, attempt: host.attempt}, {events, change});}
  catch (error) {this.emit('store-error', error);}
  this.#push(host, 'state', host.view());
  for (const event of events) this.#push(host, 'lifecycle', event);
 }
 // The runner exits idleMs after its last session ends while no server is connected.
 #checkIdle() {
  if (this.closing) return;
  const busy = () => this.clients.size > 0 || [...this.hosts.values()].some(host => host.running);
  if (busy()) {clearTimeout(this.idleTimer);this.idleTimer = null;return;}
  if (this.idleTimer) return;
  this.idleTimer = setTimeout(() => {this.idleTimer = null;if (!this.closing && !busy()) this.emit('idle');}, this.idleMs);
  this.idleTimer.unref();
 }
 // The host of a session ID: in memory, or loaded from the store. A host without an adapter
 // reads its record again, because a server check can mark it runner-lost.
 #host(id) {
  if (typeof id !== 'string' || !SESSION_ID.test(id)) throw new RunnerError('invalid', 'A session ID has 12 lowercase hexadecimal characters.');
  const host = this.hosts.get(id);
  if (host?.adapter) return host;
  const stored = this.store.session(id);
  if (!stored) {if (host) return host;throw new RunnerError('unknown-session', 'The session is unknown.', {session: id});}
  if (!host) return this.#load(stored);
  const {attempt, ...record} = stored;
  return Object.assign(host, {record, attempt});
 }
 // A host for a stored session. A terminal session that has not ended gets its adapter with
 // the stored pane, tab and state; an ACP session of an earlier runner has no adapter.
 #load({attempt, ...record}) {
  const host = new Host(record, {attempt, relays: this.relays});
  if (!host.acp && record.state !== 'ended') host.adapter = this.#terminalAdapter(host);
  this.hosts.set(record.id, host);
  return host;
 }
 #started(host) {
  if (host.started) return;
  host.started = true;
  const {role, profile} = host.record, protocolVersion = host.adapter?.protocolVersion;
  this.#write(host, [{kind: 'session:started', role, profile: profile.id, harness: profile.harness, connection: profile.connection, model: profile.model, ...(Number.isInteger(protocolVersion) ? {protocolVersion} : {})}]);
 }
 // Ends the session: the person ended it, or it failed (reason `error`). The attempt stays
 // when it is validating, otherwise it becomes interrupted (States).
 #finish(host, reason, error = null) {
  if (host.record.state === 'ended') return;
  this.#started(host);
  Object.assign(host.record, {state: 'ended', reason, endedAt: Date.now()});
  if (error) host.error = error;
  if (host.adapter instanceof TerminalSession) host.adapter.stopWatching();
  this.#write(host, [{kind: 'session:ended', reason}], {end: true});
  this.emit('session-ended', host.record.id);
  this.#checkIdle();
 }

 // ACP adapter.
 #acpAdapter(host) {
  const {profile, programs, record} = host;
  const acp = new AcpSession({id: record.id, command: profileCommand(profile, {programs}), cwd: record.worktree, env: this.env,
   profile: {model: profile.model, reasoning: profile.reasoning, env: profile.env}, mcpServer: this.mcpServer, ...this.acpOptions});
  acp.on('event', event => this.#acpEvent(host, acp, event));
  acp.on('state', ({state}) => this.#acpState(host, acp, state));
  acp.on('live', () => {
   if (this.closing || host.adapter !== acp) return;
   if (acp.reportedModel && acp.reportedModel !== host.record.reportedModel) {host.record.reportedModel = acp.reportedModel;this.#write(host, [], {model: acp.reportedModel});}
   this.#push(host, 'live', host.live());
  });
  return acp;
 }
 #acpState(host, acp, state) {
  if (this.closing || host.adapter !== acp || state === 'ended') return;
  const value = state === 'new' ? 'starting' : state;
  if (value === host.record.state) return;
  host.record.state = value;
  this.#write(host);
  this.#checkIdle();
 }
 // One lifecycle event of the ACP adapter with the attempt state of the States table.
 #acpEvent(host, acp, {kind, ...fields}) {
  if (this.closing || host.adapter !== acp) return;
  this.#started(host);
  const {record} = host, change = {}, events = [{kind, ...fields}];
  switch (kind) {
   case 'session:harness-id': record.harnessSession = fields.harnessSession;change.session = fields.harnessSession;break;
   case 'session:prompted': case 'session:permission-answered': change.state = 'processing';break;
   case 'session:permission-requested': change.state = 'blocked';break;
   case 'session:turn-ended': {
    change.state = TURN_ATTEMPT[fields.stopReason] ?? 'validating';
    const reason = TURN_REASON[fields.stopReason];
    // The session stays idle; the interrupted attempt gets its reason.
    if (reason) {record.reason = reason;events.push({kind: 'session:interrupted', reason});}
    break;
   }
   case 'session:interrupted': record.reason = fields.reason;host.error = acp.error;change.state = 'interrupted';break;
   case 'session:resumed': host.error = null;change.state = 'unknown';break;
   case 'session:ended': return this.#finish(host, fields.reason, acp.error);
  }
  if (acp.reportedModel && acp.reportedModel !== record.reportedModel) {record.reportedModel = acp.reportedModel;change.model = acp.reportedModel;}
  this.#write(host, events, change);
  this.#checkIdle();
 }

 // Terminal adapter.
 #terminalAdapter(host, label) {
  const {record} = host;
  const terminal = new TerminalSession({id: record.id, worktree: record.worktree, label, profile: host.profile ?? record.profile, programs: host.programs, env: this.env,
   pane: record.pane, tab: record.tab, state: record.state, onUpdate: update => this.#terminalUpdate(host, terminal, update), ...this.terminalOptions});
  return terminal;
 }
 // herdr status sets only the session state; the hooks also update the attempt (States). A
 // missing pane interrupts the session and the attempt.
 #terminalUpdate(host, terminal, {state, agentStatus, reason}) {
  if (this.closing || host.adapter !== terminal || host.record.state === 'ended') return;
  host.agentStatus = agentStatus;
  if (state === 'interrupted') {
   Object.assign(host.record, {state, reason});
   this.#write(host, [{kind: 'session:interrupted', reason}], {state: 'interrupted'});
   this.#checkIdle();
  } else if (state !== host.record.state) {
   host.record.state = state;
   this.#write(host, [{kind: `session:${state}`}]);
  } else this.#push(host, 'state', host.view());
 }
 // Copies the newest harness session ID that the SessionStart hook recorded for a terminal
 // session into the sessions table, and replaces the binding session of its attempt.
 #copyHarnessIds() {
  let rows;
  try {rows = this.store.harnessIds(this.harnessSeq);} catch {return;}
  for (const {seq, session, harnessSession, model} of rows) {
   this.harnessSeq = seq;
   const host = this.hosts.get(session);
   if (!host || host.acp || host.record.state === 'ended' || !text(harnessSession, 160)) continue;
   const change = {};
   if (harnessSession !== host.record.harnessSession) {host.record.harnessSession = harnessSession;change.session = harnessSession;}
   if (text(model, 160) && model !== host.record.reportedModel) {host.record.reportedModel = model;change.model = model;}
   if (Object.keys(change).length) this.#write(host, [], change);
  }
 }

 // Methods of the protocol.
 hello() {
  return {version: RUNNER_VERSION, pid: process.pid, startedAt: this.startedAt, now: Date.now(), sessions: [...this.hosts.values()].filter(host => host.adapter).map(host => host.record.id)};
 }
 #profile(profile, programs, worktree) {
  if (!plain(programs) || !Object.values(programs).every(name => typeof name === 'string' && PROGRAM.test(name))) throw new RunnerError('invalid', 'programs maps catalog program names to program names.');
  const check = validateSettings({version: 1, profiles: [profile]}, {programs}).profiles[0];
  if (!check?.valid) throw new RunnerError('invalid', check?.reasons[0] ?? 'Send a valid profile.');
  const missing = [...(profile.connection === 'terminal' ? ['herdr'] : []), check.command[0]].find(name => !executable(name, this.env, worktree));
  if (missing) throw new RunnerError('program-missing', `The program ${missing} is missing.`, {program: missing});
 }
 // Starts a session. Params: worktree, role, profile (the full profile of the settings),
 // prompt (the initial prompt, memory only), and optional session (a new ID), programs (the
 // program names of the settings query, for example {opencode: 'opencode2'}), artifact,
 // change, task, branch, attempt (the explicit binding of an implementer), respawnOf,
 // baseRevision and label. A refusal writes nothing. After the record is written, a failed
 // adapter start ends the session with reason `error`, and the result shows it.
 async start(params) {
  const {session: id = newSessionId(), worktree, role, profile, programs = {}, prompt, artifact = null, change = null, task = null, branch = null, attempt = null, respawnOf = null, baseRevision = null, label = null} = params;
  const invalid = message => {throw new RunnerError('invalid', message);};
  if (typeof id !== 'string' || !SESSION_ID.test(id)) invalid('A session ID has 12 lowercase hexadecimal characters.');
  if (this.hosts.has(id) || this.store.session(id)) invalid('The session ID exists.');
  if (typeof worktree !== 'string' || !isAbsolute(worktree)) invalid('Send the absolute worktree path.');
  if (!ROLES.includes(role)) invalid(`Send one role: ${ROLES.join(', ')}.`);
  if (typeof prompt !== 'string' || !prompt || prompt.includes('\0') || Buffer.byteLength(prompt) > PROMPT_LIMIT) invalid('Send an initial prompt of at most 64 KiB.');
  for (const [name, value] of Object.entries({artifact, change})) if (value !== null && !(typeof value === 'string' && NAME.test(value))) invalid(`${name} must match [a-z0-9][a-z0-9-]*.`);
  for (const [name, value] of Object.entries({task, branch})) if (value !== null && !text(value)) invalid(`${name} must be text.`);
  if (label !== null && !(text(label, 160) && !label.startsWith('-'))) invalid('label must be text.');
  if (baseRevision !== null && !(typeof baseRevision === 'string' && REVISION.test(baseRevision))) invalid('baseRevision must be a commit ID.');
  if (attempt !== null && !(typeof attempt === 'string' && this.store.attempt(attempt))) invalid('The attempt is unknown.');
  const earlier = respawnOf === null ? null : typeof respawnOf === 'string' && SESSION_ID.test(respawnOf) ? this.store.session(respawnOf) : null;
  if (respawnOf !== null && !earlier) throw new RunnerError('unknown-session', 'The earlier session of the respawn is unknown.', {session: String(respawnOf)});
  if (!plain(profile)) invalid('Send the profile.');
  this.#profile(profile, programs, worktree);
  let repository, base;
  try {
   repository = this.store.repository(worktree, true).id;
   // A respawn keeps the base revision of the earlier session.
   base = baseRevision ?? earlier?.baseRevision ?? await readBase(worktree);
  } catch (error) {throw new RunnerError('invalid', error.message);}
  if (this.hosts.has(id)) invalid('The session ID exists.');
  const now = Date.now(), {id: profileId, harness, connection, signIn, model, reasoning = null} = profile;
  const record = {id, repository, worktree, role, artifact, change, task, branch, profile: {id: profileId, harness, connection, signIn, model, reasoning},
   reportedModel: null, harnessSession: null, pane: null, tab: null, baseRevision: base, state: 'starting', reason: null, startedAt: now, updatedAt: now, endedAt: null, respawnOf};
  const host = new Host(record, {attempt, profile, programs, started: false, relays: this.relays});
  // The adapter checks its own arguments before the record exists.
  host.adapter = connection === 'acp' ? this.#acpAdapter(host) : this.#terminalAdapter(host, label ?? [role, task ?? change].filter(Boolean).join(' '));
  this.hosts.set(id, host);
  this.#write(host, [], {state: 'unknown'});
  this.#checkIdle();
  if (connection === 'acp') {
   const acp = host.adapter;
   try {await acp.start();} catch (error) {host.error = error.message;}
   this.#started(host);
   if (acp.state === 'idle') try {acp.prompt(prompt, {source: 'initial'});} catch (error) {host.error = error.message;}
  } else {
   const terminal = host.adapter;
   try {
    const {pane, tab} = await terminal.start(prompt);
    Object.assign(record, {pane, tab});
    this.#started(host);
    // The initial prompt is the last argument of the command (Prompt sent).
    this.#write(host, [{kind: 'session:prompted', source: 'initial'}], {state: 'processing'});
    if (!this.closing && record.state !== 'ended') terminal.watch();
   } catch (error) {this.#finish(host, 'error', error.message);}
  }
  return {session: host.view()};
 }
 #acpHost(id) {
  const host = this.#host(id);
  if (!host.acp) throw new RunnerError('state', 'This method needs an ACP session.');
  if (!host.running) throw new RunnerError('state', host.record.state === 'ended' ? 'The session has ended.' : 'The session is interrupted. Resume or respawn it.');
  return host;
 }
 // Sends the text of the person to an ACP session.
 prompt({session, text: value}) {
  const host = this.#acpHost(session);
  if (typeof value !== 'string' || Buffer.byteLength(value) > PROMPT_LIMIT) throw new RunnerError('invalid', 'Send a prompt of at most 64 KiB.');
  host.adapter.prompt(value, {source: 'person'});
  return {session: host.view()};
 }
 // Sends the option that the person selected for a pending permission request.
 answer({session, request, option}) {
  const host = this.#acpHost(session);
  if (typeof request !== 'string' || typeof option !== 'string') throw new RunnerError('invalid', 'Send the request and the option.');
  host.adapter.answer(request, option);
  return {session: host.view()};
 }
 // Stops the current turn of an ACP session.
 cancel({session}) {
  const host = this.#acpHost(session);
  host.adapter.cancel();
  return {session: host.view()};
 }
 // Reattaches the same harness session of an interrupted session: ACP resume or load in a
 // new agent process, or a new herdr tab with the resume command. After a runner restart,
 // the params carry the current `profile` and `programs`, because the store keeps no
 // profile variables or arguments. The attempt becomes `unknown` until the next prompt.
 async resume({session, profile, programs}) {
  const host = this.#host(session), {record} = host;
  if (record.state !== 'interrupted') throw new RunnerError('state', 'Only an interrupted session can resume.');
  if (host.resuming) throw new RunnerError('busy', 'The session resumes.');
  if (profile !== undefined) {
   if (!plain(profile) || profile.harness !== record.profile.harness || profile.connection !== record.profile.connection) throw new RunnerError('invalid', 'Send a profile with the harness tool and the connection of the session.');
   this.#profile(profile, programs ?? host.programs, record.worktree);
   Object.assign(host, {profile, programs: programs ?? host.programs});
  }
  if (!host.profile) throw new RunnerError('invalid', 'Send the profile of the session to resume it.');
  host.resuming = true;
  try {
   if (host.acp) {
    if (!(host.adapter instanceof AcpSession) || host.adapter.state !== 'interrupted' || profile !== undefined) host.adapter = this.#acpAdapter(host);
    try {await host.adapter.resume({harnessSession: record.harnessSession ?? undefined});}
    catch (error) {host.error = error.message;throw error;}
   } else {
    const terminal = host.adapter = this.#terminalAdapter(host);
    const {pane, tab} = await terminal.resume(record.harnessSession);
    Object.assign(record, {pane, tab, state: 'starting'});
    host.agentStatus = null;host.error = null;
    this.#write(host, [{kind: 'session:resumed', method: 'terminal'}], {state: 'unknown'});
    if (!this.closing) terminal.watch();
   }
  } finally {host.resuming = false;}
  this.#checkIdle();
  return {session: host.view()};
 }
 // Ends the session and its agent process or named herdr session.
 async end({session}) {
  const host = this.#host(session);
  if (host.record.state !== 'ended') {
   if (host.adapter instanceof AcpSession) await host.adapter.end();
   else if (host.adapter) await host.adapter.end();
   this.#finish(host, 'person');
  }
  return {session: host.view()};
 }
 // Shows the pane of a terminal session in a terminal app: `open` is terminal.open of the settings.
 openTerminal({session, open}) {
  const host = this.#host(session);
  if (host.acp || !host.adapter) throw new RunnerError('state', host.acp ? 'This method needs a terminal session.' : 'The session has ended.');
  return host.adapter.openTerminal(open);
 }
 // {seq, session, live}.
 snapshot({session}) {
  const host = this.#host(session);
  return {seq: host.seq, session: host.view(), live: host.live()};
 }
 subscribe({session}, client) {
  const host = this.#host(session);
  host.subscribers.add(client);client.sessions.add(host.record.id);
  return {seq: host.seq};
 }
 unsubscribe({session}, client) {
  this.hosts.get(session)?.subscribers.delete(client);client.sessions.delete(session);
  return {};
 }

 // Embedded terminal. {socket}: the relay socket of a running terminal session. The first
 // view starts ttyd; without ttyd, or when it does not start, the error has code `relay` and
 // the reason, and the session continues in herdr.
 async relay({session}) {
  const host = this.#host(session);
  if (host.acp) throw new RunnerError('not-terminal', 'The session has no terminal.', {session});
  if (!host.running) throw new RunnerError('state', host.record.state === 'ended' ? 'The session has ended.' : 'The session is interrupted. Resume or respawn it.');
  return {socket: await this.relays.ensure(host.record.id)};
 }
 // The number of open relay WebSockets of the calling server for one session. The runner
 // stops ttyd 10 minutes after the last viewer of every server disconnects.
 relayViewers({session, count}, client) {
  if (typeof session !== 'string' || !SESSION_ID.test(session) || !Number.isInteger(count) || count < 0) throw new RunnerError('invalid', 'Send the session ID and the number of its open terminal viewers.');
  this.relays.viewers(session, client, count);
  return {};
 }
}

export const createRunner = options => new SessionRunner(options);

// The `runner` command: listens until it is idle, SIGTERM or SIGINT.
export async function runRunner(args = []) {
 let stateDir = null;
 for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--state-dir' && stateDir === null && isAbsolute(args[i + 1] ?? '')) stateDir = resolve(args[i + 1]);
  else throw Error('Use runner [--state-dir /absolute/private/state].');
 }
 const runner = new SessionRunner({stateDir: stateDir ?? defaultStateDir()});
 const stop = () => runner.close().finally(() => process.exit(0));
 runner.on('idle', stop);
 process.once('SIGTERM', stop);process.once('SIGINT', stop);
 try {await runner.listen();}
 catch (error) {await runner.close();throw error;}
}
