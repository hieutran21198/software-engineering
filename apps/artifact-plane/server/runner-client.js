// The server side of the session runner of artifact-plane specifications/agent-orchestration.md
// (Runner, Failures; ADR 019). The client finds the runner through `runner.sock` in the runtime
// state directory. When no runner answers, it starts `artifact-plane runner` as a detached
// process with the same state directory and waits up to 3 seconds, as the workbench step starts
// `serve` (server/workbench.js). Each new connection, and each probe without a runner, is a
// server check: it marks the ACP sessions that no runner hosts as interrupted with reason
// `runner-lost`. Terminal sessions continue in herdr.
//
// Messages are JSON objects, one on each line: requests {id, method, params}, responses
// {id, result} or {id, error: {code, message, ...}}, and pushed {event, session, seq, update}.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {connect} from 'node:net';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {isSea} from 'node:sea';
import {fileURLToPath} from 'node:url';
import pkg from '../package.json' with {type: 'json'};
import {RuntimeStore, defaultStateDir} from './runtime-store.js';

export const RUNNER_VERSION = pkg.version;
export const SOCKET_NAME = 'runner.sock';
export const START_WAIT_MS = 3000;
export const START_INTERVAL_MS = 100;
// A longer line without a line end closes the connection. A live push holds up to 64 KiB of
// the last message and the pending permission requests of the agent.
export const LINE_LIMIT = 16 * 1024 * 1024;
export const RESTART_MESSAGE = 'Restart the session runner';
// The answer limit of one call in milliseconds. A start and a resume wait for the agent.
export const CALL_LIMITS = {start: 120000, resume: 120000, end: 30000, other: 15000};
export const runnerSocket = (stateDir = defaultStateDir()) => join(stateDir, SOCKET_NAME);
// A UNIX socket path has fewer than 104 bytes on every supported system (Embedded terminal, step 1).
export const SOCKET_PATH_LIMIT = 104;
export const LONG_PATH_MESSAGE = 'The state directory path is too long for a socket.';
export const socketPathFits = path => Buffer.byteLength(path) < SOCKET_PATH_LIMIT;
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const delay = ms => new Promise(done => setTimeout(done, ms));

// A refused or failed runner call. `code` is one of: invalid, unknown-method, unknown-session,
// state, busy, unknown-request, unknown-option, program-missing (with `program`),
// resume-unavailable, no-terminal-app, sign-in, start, resume, herdr (with `herdrCode`),
// server-start, timeout, version (a different runner version), running (another runner
// listens), unavailable (no runner in 3 seconds), runner-lost, store or internal.
export class RunnerError extends Error {
 constructor(code, message, details = {}) {super(message);this.code = code;Object.assign(this, details);}
}
// The HTTP status of a runner error code (Commands): 400 invalid input, 404 unknown session,
// 409 refused or wrong state, 503 runner, herdr or program unavailable.
export const ERROR_STATUS = {
 invalid: 400, 'unknown-method': 400, 'unknown-request': 400, 'unknown-option': 400, 'no-terminal-app': 400,
 'unknown-session': 404,
 state: 409, busy: 409, ended: 409, version: 409, 'resume-unavailable': 409,
};
export const errorStatus = code => ERROR_STATUS[code] ?? 503;

// Reads one JSON value from each line of the socket and gives it to onMessage; text that
// is not JSON gives undefined. A line over the limit closes the socket.
export function readMessages(socket, onMessage, limit = LINE_LIMIT) {
 let buffer = '';
 socket.setEncoding('utf8');
 socket.on('data', chunk => {
  buffer += chunk;
  for (let end; (end = buffer.indexOf('\n')) >= 0;) {
   const line = buffer.slice(0, end);
   buffer = buffer.slice(end + 1);
   if (!line.trim()) continue;
   let message;
   try {message = JSON.parse(line);} catch {message = undefined;}
   onMessage(message);
  }
  if (buffer.length > limit) socket.destroy();
 });
}
export const writeMessage = (socket, message) => socket.write(JSON.stringify(message) + '\n');

// Starts `runner` of this program as a detached process and returns the child.
export function startRunner(stateDir, env = process.env) {
 const program = isSea() ? [] : [fileURLToPath(new URL('./app.js', import.meta.url))];
 const child = spawn(process.execPath, [...program, 'runner', '--state-dir', stateDir], {detached: true, stdio: 'ignore', windowsHide: true, cwd: homedir(), env});
 child.on('error', () => {});
 child.unref();
 return child;
}

// One connection of the server to the runner. Tests replace the start, the environment,
// the version and the limits. The `session-api` routes use start, prompt, answer, cancel,
// resume, end, openTerminal, snapshot and subscribe; `call` reaches any runner method.
export class RunnerClient {
 #socket = null;#hello = null;#pending = new Map();#next = 1;#connecting = null;#listeners = new Map();#closed = false;
 constructor({stateDir = defaultStateDir(), env = process.env, version = RUNNER_VERSION, start = startRunner, waitMs = START_WAIT_MS, intervalMs = START_INTERVAL_MS, limits = CALL_LIMITS} = {}) {
  Object.assign(this, {stateDir, env, version, startProcess: start, waitMs, intervalMs, limits});
  this.path = runnerSocket(stateDir);
 }
 // The hello result of the connected runner: {version, pid, startedAt, now, sessions}, or null.
 get hello() {return this.#hello;}
 get connected() {return Boolean(this.#socket);}

 // Connects to the runner and returns its hello result. Without a runner, it starts one and
 // waits up to 3 seconds; with `start: false`, it returns null instead.
 async ensure({start = true} = {}) {
  if (!socketPathFits(this.path)) throw new RunnerError('unavailable', LONG_PATH_MESSAGE);
  for (;;) {
   if (this.#closed) throw new RunnerError('unavailable', 'The runner client is closed.');
   if (this.#socket) return this.#hello;
   if (!this.#connecting) {
    const promise = this.#connect(start).finally(() => {this.#connecting = null;});
    this.#connecting = {start, promise};
   }
   const attempt = this.#connecting, hello = await attempt.promise;
   if (hello || !start || attempt.start) return hello;
  }
 }
 // The server check without a start: it connects when a runner answers.
 check() {return this.ensure({start: false});}
 async #connect(start) {
  let probedAt = Date.now(), hello = await this.#attach();
  if (!hello && start) {
   const child = this.startProcess(this.stateDir, this.env);
   let exited = false;
   child?.once?.('exit', () => {exited = true;});
   for (const deadline = Date.now() + this.waitMs; !hello && Date.now() < deadline && !exited;) {
    await delay(this.intervalMs);
    hello = await this.#attach();
   }
   // A runner that exits at once can lose the socket to a runner of another server.
   if (!hello && exited) hello = await this.#attach();
   if (!hello) throw new RunnerError('unavailable', 'The session runner did not start in 3 seconds.');
  }
  if (!hello) probedAt = Date.now();
  // A session that changed after the hello (or the probe) has a live runner.
  this.#reconcile(hello?.sessions ?? [], hello?.now ?? probedAt);
  return hello;
 }
 // Opens a connection and sends hello. It returns null when no runner listens.
 #attach() {
  return new Promise((resolve, reject) => {
   const socket = connect(this.path);
   socket.once('error', error => {
    if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED') resolve(null);
    else reject(new RunnerError('unavailable', `The session runner socket cannot be reached (${error.code}).`));
   });
   socket.once('connect', () => {
    socket.removeAllListeners('error');
    socket.on('error', () => {});
    socket.on('close', () => this.#lost(socket));
    readMessages(socket, message => this.#receive(message));
    this.#request('hello', {}, socket).then(hello => {
     if (this.#closed || !plain(hello) || typeof hello.version !== 'string' || !Array.isArray(hello.sessions)) {socket.destroy();return reject(new RunnerError('unavailable', 'The session runner did not answer hello.'));}
     this.#socket = socket;this.#hello = hello;resolve(hello);
    }, error => {socket.destroy();reject(error);});
   });
  });
 }
 // Marks the ACP sessions that the runner does not host as runner-lost, in the store.
 #reconcile(hosted, before) {
  if (!existsSync(join(this.stateDir, 'runtime.sqlite'))) return [];
  let store;
  try {store = new RuntimeStore({stateDir: this.stateDir});}
  catch (error) {throw new RunnerError('store', error.message);}
  try {return store.markRunnerLost(hosted, before);} finally {store.close();}
 }
 #lost(socket) {
  for (const [id, pending] of this.#pending) if (pending.socket === socket) {
   this.#pending.delete(id);clearTimeout(pending.timer);
   pending.reject(new RunnerError('runner-lost', 'The session runner stopped.'));
  }
  if (socket !== this.#socket) return;
  this.#socket = null;this.#hello = null;
  const listeners = [...this.#listeners];
  this.#listeners.clear();
  for (const [session, set] of listeners) for (const listener of set) try {listener({event: 'runner-lost', session, seq: null, update: null});} catch {/* the listener handles its own errors */}
  // The next server check comes at once: no runner hosts the ACP sessions now.
  if (!this.#closed) this.check().catch(() => {});
 }
 #receive(message) {
  if (!plain(message)) return;
  if (typeof message.event === 'string') {
   for (const listener of this.#listeners.get(message.session) ?? []) try {listener(message);} catch {/* the listener handles its own errors */}
   return;
  }
  const pending = this.#pending.get(message.id);
  if (!pending) return;
  this.#pending.delete(message.id);clearTimeout(pending.timer);
  if (plain(message.error)) {
   const {code, message: text, ...details} = message.error;
   pending.reject(new RunnerError(typeof code === 'string' ? code : 'internal', typeof text === 'string' ? text : 'The session runner failed.', details));
  } else pending.resolve(message.result);
 }
 #request(method, params, socket = this.#socket) {
  if (!socket || socket.destroyed) return Promise.reject(new RunnerError('runner-lost', 'The session runner stopped.'));
  const id = this.#next++, limit = this.limits[method] ?? this.limits.other;
  return new Promise((resolve, reject) => {
   const timer = setTimeout(() => {this.#pending.delete(id);reject(new RunnerError('timeout', `The session runner did not answer ${method} in ${limit / 1000} seconds.`));}, limit);
   timer.unref?.();
   this.#pending.set(id, {resolve, reject, timer, socket});
   writeMessage(socket, {id, method, params});
  });
 }
 // Calls a runner method. A runner of another version refuses a new start with
 // "Restart the session runner"; the other methods still reach its sessions.
 async call(method, params = {}) {
  const hello = await this.ensure();
  if (method === 'start' && hello.version !== this.version) throw new RunnerError('version', RESTART_MESSAGE, {runnerVersion: hello.version});
  return this.#request(method, params);
 }
 // The runner availability of the settings query. It does not start a runner: without
 // one, the server starts it on the next session command.
 async availability() {
  try {
   const hello = await this.check();
   if (!hello) return {available: true, running: false, version: null, compatible: null, reason: null};
   const compatible = hello.version === this.version;
   return {available: compatible, running: true, version: hello.version, compatible, reason: compatible ? null : RESTART_MESSAGE};
  } catch (error) {return {available: false, running: false, version: null, compatible: null, reason: error.message};}
 }
 // {session}: the session fields with `attempt`, `agentStatus`, `error` and `hosted`.
 start(params) {return this.call('start', params);}
 prompt(session, text) {return this.call('prompt', {session, text});}
 answer(session, request, option) {return this.call('answer', {session, request, option});}
 cancel(session) {return this.call('cancel', {session});}
 // `extra` holds the current `profile` and `programs` when the runner restarted since the start.
 resume(session, extra = {}) {return this.call('resume', {session, ...extra});}
 end(session) {return this.call('end', {session});}
 openTerminal(session, open) {return this.call('openTerminal', {session, open});}
 // {seq, session, live}: live holds the last message and the pending requests of an ACP session.
 snapshot(session) {return this.call('snapshot', {session});}
 // Calls listener with each pushed {event, session, seq, update} of the session: `state`
 // (the session), `live` (the live state) and `lifecycle` (one lifecycle event). After a
 // runner loss, the listener gets {event: 'runner-lost'} and no more events. A stream
 // subscribes first, then reads the snapshot and skips pushes with seq <= snapshot.seq.
 // It returns the function that unsubscribes.
 async subscribe(session, listener) {
  await this.ensure();
  let set = this.#listeners.get(session);
  const first = !set;
  if (first) this.#listeners.set(session, set = new Set());
  set.add(listener);
  if (first) try {await this.#request('subscribe', {session});}
  catch (error) {set.delete(listener);if (!set.size && this.#listeners.get(session) === set) this.#listeners.delete(session);throw error;}
  return async () => {
   if (!set.delete(listener) || set.size || this.#listeners.get(session) !== set) return;
   this.#listeners.delete(session);
   await this.#request('unsubscribe', {session}).catch(() => {});
  };
 }
 // Closes the connection. The runner and its sessions continue.
 close() {
  this.#closed = true;
  const socket = this.#socket;
  this.#socket = null;this.#hello = null;this.#listeners.clear();
  for (const [id, pending] of this.#pending) {this.#pending.delete(id);clearTimeout(pending.timer);pending.reject(new RunnerError('unavailable', 'The runner client is closed.'));}
  socket?.destroy();
 }
}

export const createRunnerClient = options => new RunnerClient(options);
