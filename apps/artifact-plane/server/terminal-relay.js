// The terminal relay of artifact-plane specifications/agent-orchestration.md (Embedded terminal,
// Failures; ADR 021). The runner side (`TerminalRelays`) runs one ttyd process for each viewed
// terminal session on the private socket <state>/relay/<session ID>.sock. The server side
// (`forwardRelayRequest`, `forwardRelayUpgrade`) forwards the ttyd pages and the WebSocket of
// `/api/sessions/terminal/<session ID>/…` to that socket after the loopback, Host and Origin
// checks of server/http.js. Plane forwards the bytes unchanged, stores none of them and writes
// nothing to the relay by itself (requirement AO7).
import {spawn} from 'node:child_process';
import {chmodSync, mkdirSync, rmSync} from 'node:fs';
import {request} from 'node:http';
import {connect} from 'node:net';
import {join} from 'node:path';
import {findProgram} from './provider-catalog.js';
import {LONG_PATH_MESSAGE, RunnerError, socketPathFits} from './runner-client.js';
import {herdrSession} from './terminal-adapter.js';

// The runner stops ttyd this long after the last viewer disconnects (Relay stop).
export const RELAY_IDLE_MS = 10 * 60 * 1000;
// The time that ttyd has to listen on its socket after the start.
export const RELAY_START_MS = 5000;
// The time between SIGTERM and SIGKILL when ttyd stops.
const STOP_GRACE_MS = 5000;
const PROBE_INTERVAL_MS = 50;
export const RELAY_PREFIX = '/api/sessions/terminal/';
export const MISSING_TTYD = 'The program ttyd is missing.';
export const RELAY_SILENT = 'The terminal relay did not answer.';
const SESSION_ID = /^[0-9a-f]{12}$/;
const delay = ms => new Promise(done => setTimeout(done, ms));

export const relayBasePath = id => `${RELAY_PREFIX}${id}`;
export const relaySocket = (stateDir, id) => join(stateDir, 'relay', `${id}.sock`);
// The ttyd arguments of the contract (Embedded terminal, step 1).
export const ttydArguments = (id, socket) => ['--writable', '--check-origin', '--base-path', relayBasePath(id), '--interface', socket, 'herdr', 'session', 'attach', herdrSession(id)];
// The session ID of a relay path: undefined outside the relay route, null for a malformed ID.
export function relayRoute(pathname) {
 if (!pathname.startsWith(RELAY_PREFIX)) return undefined;
 const id = pathname.slice(RELAY_PREFIX.length).split('/')[0];
 return SESSION_ID.test(id) ? id : null;
}

// True when a process accepts connections on the socket. The probe writes no byte.
function listening(path) {
 return new Promise(done => {
  const socket = connect(path);
  socket.once('connect', () => {socket.destroy();done(true);});
  socket.once('error', () => done(false));
 });
}
// Removes a relay socket file; a failure leaves the file, and the next start removes it.
function removeSocket(path) {
 try {rmSync(path, {force: true});} catch {/* the next start removes it */}
}
// Sends SIGTERM, then SIGKILL after the grace time; resolves when the process has exited.
function terminate(child) {
 return new Promise(done => {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return done();
  const timer = setTimeout(() => child.kill('SIGKILL'), STOP_GRACE_MS);
  child.once('exit', () => {clearTimeout(timer);done();});
  child.kill('SIGTERM');
 });
}

// The ttyd processes of one runner. A relay stays in memory with its process, its stop
// timer, the open WebSocket count of each server connection (`client`) and the reason of the
// last failed start. `onChange(id)` runs when the availability of a session changes.
export class TerminalRelays {
 #relays = new Map();
 constructor({stateDir, env = process.env, idleMs = RELAY_IDLE_MS, startMs = RELAY_START_MS, onChange = () => {}}) {
  Object.assign(this, {stateDir, env, idleMs, startMs, onChange});
 }
 #entry(id) {
  let relay = this.#relays.get(id);
  if (!relay) this.#relays.set(id, relay = {id, socket: relaySocket(this.stateDir, id), child: null, starting: null, stopping: null, timer: null, viewers: new Map(), reason: null});
  return relay;
 }
 // {available, reason}: the relay is unavailable without ttyd on PATH, with a socket path of
 // 104 bytes or more, or after a failed start until a later start succeeds.
 status(id) {
  const reason = !findProgram('ttyd', this.env) ? MISSING_TTYD : !socketPathFits(relaySocket(this.stateDir, id)) ? LONG_PATH_MESSAGE : this.#relays.get(id)?.reason ?? null;
  return {available: !reason, reason};
 }
 // The socket of a running ttyd for the session; the first view starts ttyd. A failure is a
 // RunnerError with code `relay` and the reason. Without a viewer, the stop timer starts again.
 async ensure(id) {
  const relay = this.#entry(id);
  await relay.stopping;
  if (!relay.child) relay.starting ??= this.#start(relay).finally(() => {relay.starting = null;});
  await relay.starting;
  this.#arm(relay);
  return relay.socket;
 }
 #failed(relay, reason) {
  relay.reason = reason;
  this.onChange(relay.id);
  return new RunnerError('relay', reason);
 }
 async #start(relay) {
  const {id, socket} = relay, program = findProgram('ttyd', this.env);
  if (!program) throw new RunnerError('relay', MISSING_TTYD);
  if (!socketPathFits(socket)) throw new RunnerError('relay', LONG_PATH_MESSAGE);
  // ttyd creates the socket with mode 0660, so the directory keeps other users out.
  const dir = join(this.stateDir, 'relay');
  mkdirSync(dir, {recursive: true, mode: 0o700});
  chmodSync(dir, 0o700);
  removeSocket(socket);
  // No shell: the program path and the argument list go to the system directly.
  const child = spawn(program, ttydArguments(id, socket), {env: this.env, stdio: 'ignore', windowsHide: true});
  let ended = null;
  const gone = reason => {
   ended ??= reason;
   if (relay.child !== child) return;
   relay.child = null;clearTimeout(relay.timer);relay.timer = null;
   removeSocket(socket);
  };
  child.on('error', error => gone(`ttyd did not start (${error.code ?? error.message}).`));
  child.once('exit', (code, signal) => gone(`ttyd exited with ${signal ? `signal ${signal}` : `status ${code}`} before it listened.`));
  relay.child = child;
  for (const deadline = Date.now() + this.startMs; !(await listening(socket));) {
   // A stop of the runner is not a failed start; an exit or a spawn error is.
   if (relay.child !== child) throw ended && !child.killed ? this.#failed(relay, ended) : new RunnerError('relay', 'The terminal relay stopped.');
   if (Date.now() >= deadline) {
    relay.child = null;
    await terminate(child);
    removeSocket(socket);
    throw this.#failed(relay, `ttyd did not listen in ${this.startMs / 1000} seconds.`);
   }
   await delay(PROBE_INTERVAL_MS);
  }
  if (relay.child !== child) throw new RunnerError('relay', 'The terminal relay stopped.');
  if (relay.reason) {relay.reason = null;this.onChange(id);}
 }
 // The stop timer runs while ttyd runs without a viewer.
 #arm(relay) {
  clearTimeout(relay.timer);relay.timer = null;
  if (!relay.child || relay.viewers.size) return;
  relay.timer = setTimeout(() => {relay.timer = null;this.stop(relay.id);}, this.idleMs);
  relay.timer.unref?.();
 }
 // The number of open relay WebSockets of one server connection.
 viewers(id, client, count) {
  const relay = this.#relays.get(id);
  if (!relay) return;
  if (count > 0) relay.viewers.set(client, count);
  else relay.viewers.delete(client);
  this.#arm(relay);
 }
 // A closed server connection has no viewers.
 dropClient(client) {
  for (const relay of this.#relays.values()) if (relay.viewers.delete(client)) this.#arm(relay);
 }
 // Stops the ttyd of the session and removes its socket.
 stop(id) {
  const relay = this.#relays.get(id);
  if (!relay) return Promise.resolve();
  clearTimeout(relay.timer);relay.timer = null;
  const child = relay.child;
  if (!child) return relay.stopping ?? Promise.resolve();
  relay.child = null;
  return relay.stopping = terminate(child).then(() => {removeSocket(relay.socket);relay.stopping = null;});
 }
 close() {return Promise.all([...this.#relays.keys()].map(id => this.stop(id)));}
}

// The headers that a forward does not pass on: the connection of each side is its own.
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer']);
const endToEnd = headers => Object.fromEntries(Object.entries(headers).filter(([name]) => !HOP.has(name.toLowerCase())));
const lower = headers => Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));

// Forwards one HTTP request to the relay socket with its headers (Host and Origin included)
// and body unchanged, and returns the reply with `headers` (the relay security headers) in
// place of the same reply headers. It rejects when the relay does not answer before the reply.
export function forwardRelayRequest(req, res, socketPath, headers) {
 return new Promise((done, fail) => {
  const upstream = request({socketPath, method: req.method, path: req.url, headers: endToEnd(req.headers), agent: false});
  upstream.on('response', reply => {
   res.writeHead(reply.statusCode, {...lower(endToEnd(reply.headers)), ...lower(headers)});
   reply.pipe(res);
  });
  upstream.on('error', error => {
   if (!res.headersSent) return fail(error);
   res.destroy();done();
  });
  res.on('close', () => {upstream.destroy();done();});
  req.pipe(upstream);
 });
}

// Forwards a WebSocket upgrade: the request head with the received header lines, the bytes
// that came with it, then the bytes of each side unchanged. `open` runs when the relay
// connection opens, and `close` runs once when either side closes. It rejects when the relay
// socket does not accept the connection.
export function forwardRelayUpgrade(req, socket, head, socketPath, {open = () => {}, close = () => {}} = {}) {
 return new Promise((done, fail) => {
  const upstream = connect(socketPath);
  upstream.once('error', fail);
  upstream.once('connect', () => {
   upstream.off('error', fail);
   upstream.on('error', () => socket.destroy());
   if (socket.destroyed) {upstream.destroy();return done(false);}
   const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
   for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
   upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
   if (head.length) upstream.write(head);
   // The end of either side ends the viewer: the other side gets the remaining bytes, then both close.
   let closed = false;
   const end = () => {if (closed) return;closed = true;socket.destroy();upstream.destroy();close();};
   socket.once('close', end);upstream.once('close', end);
   socket.once('end', () => upstream.end(end));upstream.once('end', () => socket.end(end));
   open();
   socket.pipe(upstream, {end: false});upstream.pipe(socket, {end: false});
   done(true);
  });
 });
}
