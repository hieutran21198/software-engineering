// specifications/agent-orchestration.md: Embedded terminal, Commands (the terminal route),
// Runner and Failures; ADR 021. An in-process runner hosts terminal sessions in the fake herdr
// (test/fixtures/fake-herdr.mjs) and starts the fake ttyd (test/fixtures/fake-ttyd.mjs) for
// the relay; the Plane server forwards to it. PATH holds only the fake programs, so no test
// starts ttyd, herdr or a harness program. Each test uses private state directories under
// os.tmpdir() and stops every process that it starts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {chmod, mkdir, mkdtemp, realpath, rm, writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAppServer} from '../server/http.js';
import {LONG_PATH_MESSAGE, RunnerClient, RunnerError, errorStatus, runnerSocket} from '../server/runner-client.js';
import {METHODS, RELAY_METHODS, SessionRunner, newSessionId} from '../server/session-runner.js';
import {shellQuote} from '../server/terminal-adapter.js';
import {MISSING_TTYD, relayRoute, relaySocket, ttydArguments} from '../server/terminal-relay.js';
import {PAGE, SERVER_BYTES} from './fixtures/fake-ttyd.mjs';
import {runtimeFixture} from './runtime-fixtures.js';

const FAKE_HERDR = fileURLToPath(new URL('./fixtures/fake-herdr.mjs', import.meta.url));
const FAKE_TTYD = fileURLToPath(new URL('./fixtures/fake-ttyd.mjs', import.meta.url));
const FAKE_ACP = fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url));
const skip = process.platform === 'win32';
const TERMINAL = {id: 'claude-opus-terminal', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus'};
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function waitFor(check, ms = 8000) {
 for (const end = Date.now() + ms; ; await sleep(20)) {
  const value = await check();
  if (value) return value;
  if (Date.now() > end) throw Error('The condition did not become true.');
 }
}
const alive = pid => {try {process.kill(pid, 0);return true;} catch {return false;}};

// A repository, a private state directory whose name holds a space and `$HOME` (a shell would
// split or expand it), the fake programs, an in-process runner, a runner client that never
// starts a runner process, and a Plane server with that client.
async function setup(t, {ttyd = true, state = 'st $HOME', relayOptions = {}} = {}) {
 const repo = await runtimeFixture(), dir = await realpath(await mkdtemp(join(tmpdir(), 'ap-')));
 const bin = join(dir, 'bin'), ttydBin = join(dir, 'tb'), herdr = join(dir, 'herdr'), ttydDir = join(dir, 'ttyd'), stateDir = join(dir, state);
 await Promise.all([mkdir(bin), mkdir(ttydBin), mkdir(herdr), mkdir(ttydDir), mkdir(stateDir, {recursive: true, mode: 0o700})]);
 const programs = {[join(bin, 'herdr')]: `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_HERDR)} herdr "$@"`, [join(bin, 'claude')]: 'exit 0',
  [join(bin, 'codex-acp')]: `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_ACP)} "$@"`, [join(ttydBin, 'ttyd')]: `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE_TTYD)} "$@"`};
 for (const [path, body] of Object.entries(programs)) {await writeFile(path, `#!/bin/sh\n${body}\n`);await chmod(path, 0o755);}
 const env = {PATH: ttyd ? `${bin}:${ttydBin}` : bin, HOME: dir, FAKE_HERDR_DIR: herdr, FAKE_HERDR_SERVER_DELAY_MS: '50', FAKE_TTYD_DIR: ttydDir};
 const runner = new SessionRunner({stateDir, env, harnessPollMs: 50, terminalOptions: {intervalMs: 100}, relayOptions,
  mcpServer: {name: 'artifact-plane', command: '/opt/plane/artifact-plane', args: ['mcp']}});
 await runner.listen();
 const clients = [];
 const client = () => {
  const c = new RunnerClient({stateDir, env: {...process.env, ...env}, start: () => {throw Error('The test starts no runner process.');}});
  clients.push(c);
  return c;
 };
 const runnerClient = client(), server = createAppServer({runnerClient});
 await new Promise(done => server.listen(0, '127.0.0.1', done));
 const port = server.address().port, host = `127.0.0.1:${port}`;
 const f = {
  repo, dir, stateDir, ttydDir, herdr, env, runner, runnerClient, server, port, host, origin: `http://${host}`, client,
  calls: () => existsSync(join(ttydDir, 'calls.jsonl')) ? readFileSync(join(ttydDir, 'calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [],
  starts: () => f.calls().filter(c => c.event === 'start'),
  forwarded: () => f.calls().filter(c => c.event === 'http' || c.event === 'upgrade'),
  wsBytes: n => existsSync(join(ttydDir, `ws-${n}.bin`)) ? readFileSync(join(ttydDir, `ws-${n}.bin`)) : Buffer.alloc(0),
  herdrRunning: id => JSON.parse(readFileSync(join(herdr, 'state.json'), 'utf8')).sessions[`plane-${id}`]?.running === true,
  // A terminal session that runs in the fake herdr.
  async terminal() {
   const id = newSessionId();
   await runnerClient.start({session: id, worktree: repo.root, role: 'coordinator', prompt: 'Start the work.', profile: TERMINAL});
   await waitFor(() => f.herdrRunning(id));
   return id;
  },
  view: async id => (await runnerClient.snapshot(id)).session,
  // A GET through the Plane server: {status, headers, body}.
  get(path, headers = {}, method = 'GET') {
   return new Promise((done, fail) => {
    const req = request({host: '127.0.0.1', port, path, method, headers}, res => {
     const chunks = [];
     res.on('data', chunk => chunks.push(chunk));
     res.on('end', () => done({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
    });
    req.on('error', fail);req.end();
   });
  },
  // A WebSocket upgrade through the Plane server: {status, socket, head, headers} after 101,
  // {status, body} after another reply, or {error}.
  upgrade(path, headers = {Origin: f.origin}) {
   return new Promise(done => {
    const req = request({host: '127.0.0.1', port, path, headers: {Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13',
     'Sec-WebSocket-Key': randomBytes(16).toString('base64'), 'Sec-WebSocket-Protocol': 'tty', ...headers}});
    req.on('upgrade', (res, socket, head) => {sockets.push(socket);done({status: res.statusCode, headers: res.headers, socket, head});});
    req.on('response', res => {const chunks = [];res.on('data', c => chunks.push(c));res.on('end', () => done({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()}));});
    req.on('error', error => done({error}));
    req.end();
   });
  },
  // Closes the server, the clients and the runner; then no fake ttyd may run.
  close() {
   return f.closed ??= (async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(done => server.close(done));
    for (const c of clients) c.close();
    await runner.close();
    return f.starts().map(s => s.pid).filter(alive);
   })();
  },
 };
 const sockets = [];
 t.after(async () => {
  for (const pid of await f.close().catch(() => [])) process.kill(pid, 'SIGKILL');
  await repo.cleanup();await rm(dir, {recursive: true, force: true});
 });
 return f;
}

test('the relay helpers hold the contract arguments and the relay route', () => {
 const id = '0123456789ab', socket = relaySocket('/s', id);
 assert.equal(socket, '/s/relay/0123456789ab.sock');
 assert.deepEqual(ttydArguments(id, socket), ['--writable', '--check-origin', '--base-path', '/api/sessions/terminal/0123456789ab', '--interface', socket, 'herdr', 'session', 'attach', 'plane-0123456789ab']);
 assert.equal(relayRoute('/api/sessions/terminal/0123456789ab'), id);
 assert.equal(relayRoute('/api/sessions/terminal/0123456789ab/ws'), id);
 assert.equal(relayRoute('/api/sessions/terminal/0123456789AB/'), null);
 assert.equal(relayRoute('/api/sessions/terminal/'), null);
 assert.equal(relayRoute('/api/sessions/stream'), undefined);
 assert.deepEqual(RELAY_METHODS, ['relay', 'relayViewers']);
 assert.equal(METHODS.includes('relay'), false, 'the contract methods stay unchanged');
 assert.deepEqual([errorStatus('not-terminal'), errorStatus('unknown-session'), errorStatus('state'), errorStatus('relay')], [404, 404, 409, 503]);
});

test('the first view starts ttyd with the contract arguments without a shell, in a 0700 relay directory, and the server forwards its pages with frame-ancestors self', {skip}, async t => {
 const f = await setup(t);
 const id = await f.terminal(), relayDir = join(f.stateDir, 'relay'), socket = relaySocket(f.stateDir, id);
 // A relay directory with a wider mode becomes 0700.
 await mkdir(relayDir, {mode: 0o755});
 await chmod(relayDir, 0o755);
 assert.deepEqual((await f.view(id)).relay, {available: true, reason: null});
 assert.deepEqual(f.starts(), [], 'a terminal session starts no relay before the first view');
 const page = await f.get(`/api/sessions/terminal/${id}/`);
 assert.equal(page.status, 200);
 assert.equal(page.body.toString(), PAGE);
 assert.equal(page.headers['content-type'], 'text/html');
 assert.equal(page.headers['content-security-policy'], "frame-ancestors 'self'");
 // The exact argument list: the state directory path with a space and `$HOME` arrives unchanged.
 const [start] = f.starts();
 assert.deepEqual(start.argv, ['--writable', '--check-origin', '--base-path', `/api/sessions/terminal/${id}`, '--interface', socket, 'herdr', 'session', 'attach', `plane-${id}`]);
 assert.ok(socket.includes(' $HOME/relay/'));
 assert.equal(statSync(relayDir).mode & 0o777, 0o700);
 assert.ok(statSync(socket).isSocket());
 assert.equal(statSync(socket).mode & 0o777, 0o660, 'the fake gives the socket the mode of ttyd');
 // ttyd answers the base path without a slash, and the token; the same ttyd serves every view.
 const redirect = await f.get(`/api/sessions/terminal/${id}`);
 assert.deepEqual([redirect.status, redirect.headers.location, redirect.headers['content-security-policy']], [302, `/api/sessions/terminal/${id}/`, "frame-ancestors 'self'"]);
 const token = await f.get(`/api/sessions/terminal/${id}/token?x=1`);
 assert.deepEqual([token.status, token.body.toString()], [404, '']);
 const token2 = await f.get(`/api/sessions/terminal/${id}/token`);
 assert.deepEqual([token2.status, JSON.parse(token2.body)], [200, {token: ''}]);
 assert.equal(f.starts().length, 1);
 // ttyd received exactly these requests, with the Host of the workbench unchanged.
 const forwarded = f.forwarded();
 assert.deepEqual(forwarded.map(c => [c.method, c.url]), [['GET', `/api/sessions/terminal/${id}/`], ['GET', `/api/sessions/terminal/${id}`], ['GET', `/api/sessions/terminal/${id}/token?x=1`], ['GET', `/api/sessions/terminal/${id}/token`]]);
 assert.ok(forwarded.every(c => c.headers.host === f.host));
 // Other responses keep frame-ancestors 'none'; the workbench policy frames its own origin.
 const identity = await f.get('/api/plane');
 assert.match(identity.headers['content-security-policy'], /; frame-src 'self';/);
 assert.match(identity.headers['content-security-policy'], /frame-ancestors 'none'$/);
 assert.equal((await f.get('/missing.js')).headers['content-security-policy'], identity.headers['content-security-policy']);
 // Only GET reaches the relay.
 for (const method of ['POST', 'HEAD', 'PUT']) assert.equal((await f.get(`/api/sessions/terminal/${id}/`, {}, method)).status, 405, method);
 assert.equal(f.forwarded().length, 4);
 assert.deepEqual(await f.close(), [], 'no ttyd runs after the runner closes');
 assert.equal(existsSync(socket), false, 'the runner removes the relay socket');
});

test('the server refuses a foreign Host or Origin before it forwards, and gives 404 for an unknown or ACP session', {skip}, async t => {
 const f = await setup(t);
 const id = await f.terminal(), path = `/api/sessions/terminal/${id}/`, ws = `/api/sessions/terminal/${id}/ws`;
 // HTTP: a foreign Host, a localhost Host, a foreign Origin and a cross-site fetch.
 for (const headers of [{Host: 'foreign.example'}, {Host: `localhost:${f.port}`}, {Origin: 'http://foreign.example'}, {Origin: `http://localhost:${f.port}`}, {'Sec-Fetch-Site': 'cross-site'}]) {
  const reply = await f.get(path, headers);
  assert.equal(reply.status, 403, JSON.stringify(headers));
  assert.match(reply.headers['content-security-policy'], /frame-ancestors 'none'$/);
 }
 // WebSocket: no Origin, a foreign Origin, an Origin of another port, a foreign Host, a cross-site fetch.
 for (const headers of [{}, {Origin: 'http://foreign.example'}, {Origin: 'http://127.0.0.1:9'}, {Origin: `http://localhost:${f.port}`, Host: `localhost:${f.port}`}, {Host: 'foreign.example', Origin: 'http://foreign.example'}, {Origin: f.origin, 'Sec-Fetch-Site': 'cross-site'}]) {
  const reply = await f.upgrade(ws, headers);
  assert.equal(reply.status, 403, JSON.stringify(headers));
  assert.deepEqual(JSON.parse(reply.body), {error: 'Use the local application origin.'});
 }
 assert.deepEqual(f.starts(), [], 'no refused request starts the relay');
 assert.deepEqual(f.forwarded(), [], 'no refused request reaches the relay');
 // A WebSocket upgrade of another path has no route.
 assert.equal((await f.upgrade('/api/runtime/events')).status, 404);
 // An unknown session, a malformed session ID and an ACP session get 404.
 const acp = newSessionId(), log = join(f.dir, 'agent.log');
 await f.runnerClient.start({session: acp, worktree: f.repo.root, role: 'implementer', artifact: 'demo', change: 'change-live', task: 'a.md', prompt: 'Start.',
  profile: {id: 'codex-fast', harness: 'codex', connection: 'acp', signIn: 'harness', model: 'm1', env: {FAKE_ACP_CONFIG: JSON.stringify({log, models: [{id: 'm1', name: 'Model one', levels: ['low']}]})}}});
 assert.equal((await f.view(acp)).relay, null, 'an ACP session has no relay');
 for (const [session, error] of [['0123456789ab', 'The session is unknown.'], ['0123456789AB', 'The session is unknown.'], [acp, 'The session has no terminal.']]) {
  const page = await f.get(`/api/sessions/terminal/${session}/`);
  assert.deepEqual([page.status, JSON.parse(page.body).error, page.headers['content-security-policy']], [404, error, "frame-ancestors 'self'"], session);
  const socket = await f.upgrade(`/api/sessions/terminal/${session}/ws`);
  assert.deepEqual([socket.status, JSON.parse(socket.body).error], [404, error], session);
 }
 // The matching Origin and Host reach the relay, and ttyd accepts them.
 const accepted = await f.upgrade(ws);
 assert.deepEqual([accepted.status, accepted.headers['sec-websocket-protocol']], [101, 'tty']);
 assert.deepEqual(f.forwarded().map(c => [c.event, c.url, c.accepted]), [['upgrade', `/api/sessions/terminal/${id}/ws`, true]]);
 // An ended session has no terminal: 409.
 await f.runnerClient.end(id);
 const ended = await f.get(path);
 assert.deepEqual([ended.status, JSON.parse(ended.body).error], [409, 'The session has ended.']);
 assert.equal((await f.view(id)).relay, null);
 assert.deepEqual(await f.close(), []);
});

test('the server forwards the WebSocket bytes unchanged in both directions and writes nothing to the relay by itself', {skip}, async t => {
 const f = await setup(t);
 const id = await f.terminal();
 const reply = await f.upgrade(`/api/sessions/terminal/${id}/ws`, {Origin: f.origin, 'X-Extra': 'kept as sent'});
 assert.equal(reply.status, 101);
 // The client receives exactly the bytes of the relay after its 101 reply.
 const received = [reply.head];
 reply.socket.on('data', chunk => received.push(chunk));
 await waitFor(() => Buffer.concat(received).length >= SERVER_BYTES.length);
 // The relay receives the Host and Origin of the browser and the other header lines unchanged.
 const [upgrade] = f.forwarded();
 assert.deepEqual([upgrade.headers.host, upgrade.headers.origin, upgrade.headers['x-extra'], upgrade.headers['sec-websocket-protocol']], [f.host, f.origin, 'kept as sent', 'tty']);
 // Before the person types, Plane sends nothing: no initial frame, no key, no ping.
 await sleep(400);
 assert.equal(f.wsBytes(1).length, 0);
 // Typed keys as masked frames, the ttyd resize message and arbitrary binary bytes.
 const mask = randomBytes(4), payload = Buffer.from('0ls -la\r'), frame = Buffer.concat([Buffer.from([0x82, 0x80 | payload.length]), mask, Buffer.from(payload.map((b, i) => b ^ mask[i % 4]))]);
 const sent = [frame, Buffer.from('{"AuthToken":"","columns":120,"rows":40}'), randomBytes(70000), Buffer.from([0, 255, 13, 10, 0])];
 for (const chunk of sent) {reply.socket.write(chunk);await sleep(10);}
 const all = Buffer.concat(sent);
 await waitFor(() => f.wsBytes(1).length >= all.length);
 await sleep(300);
 assert.ok(f.wsBytes(1).equals(all), 'the relay receives exactly the bytes that the client sent, and nothing else');
 assert.ok(Buffer.concat(received).equals(SERVER_BYTES), 'the client receives exactly the bytes that the relay sent');
 assert.deepEqual(await f.close(), []);
});

test('the runner stops ttyd 10 minutes (here 400 ms) after the last viewer disconnects, and when the session ends', {skip}, async t => {
 const f = await setup(t, {relayOptions: {idleMs: 400}});
 const id = await f.terminal(), socket = relaySocket(f.stateDir, id), ws = `/api/sessions/terminal/${id}/ws`;
 // One viewer keeps ttyd beyond the stop time.
 const first = await f.upgrade(ws);
 assert.equal(first.status, 101);
 const [one] = f.starts();
 await sleep(900);
 assert.ok(alive(one.pid), 'a viewer keeps ttyd');
 // A second server connection reports a viewer and disconnects: the runner forgets its count.
 const other = f.client();
 await other.relayViewers(id, 1);
 other.close();
 // The last viewer disconnects: ttyd stops after the stop time, and its socket is removed.
 const closedAt = Date.now();
 first.socket.destroy();
 await waitFor(() => !alive(one.pid), 5000);
 const stoppedAfter = Date.now() - closedAt;
 assert.ok(stoppedAfter >= 350, `ttyd stopped after ${stoppedAfter} ms`);
 assert.equal(f.calls().filter(c => c.event === 'signal').length, 1);
 assert.equal(existsSync(socket), false);
 assert.deepEqual((await f.view(id)).relay, {available: true, reason: null}, 'the next view starts ttyd again');
 // A viewer of another server connection keeps ttyd until that connection closes.
 assert.equal((await f.get(`/api/sessions/terminal/${id}/`)).status, 200);
 const two = f.starts()[1];
 const third = f.client();
 await third.relayViewers(id, 1);
 await sleep(900);
 assert.ok(alive(two.pid), 'a viewer of another server keeps ttyd');
 third.close();
 await waitFor(() => !alive(two.pid), 5000);
 // The session end stops ttyd at once, while a viewer is connected.
 const viewer = await f.upgrade(ws);
 assert.equal(viewer.status, 101);
 const three = f.starts()[2];
 assert.ok(alive(three.pid));
 // The viewer reads its socket, so it sees the end of the relay connection.
 let closed = false;
 viewer.socket.on('close', () => {closed = true;}).resume();
 const endedAt = Date.now();
 await f.runnerClient.end(id);
 await waitFor(() => !alive(three.pid) && closed, 5000);
 assert.ok(Date.now() - endedAt < 2000, 'the end does not wait for the stop time');
 assert.equal(existsSync(socket), false);
 assert.deepEqual(await f.close(), []);
});

test('without ttyd, or when ttyd does not start, the session reports the relay as unavailable with the reason and continues in herdr', {skip}, async t => {
 // No ttyd on PATH.
 const none = await setup(t, {ttyd: false});
 const id = await none.terminal();
 assert.deepEqual((await none.view(id)).relay, {available: false, reason: MISSING_TTYD});
 const missing = await none.get(`/api/sessions/terminal/${id}/`);
 assert.deepEqual([missing.status, JSON.parse(missing.body).error, missing.headers['content-security-policy']], [503, MISSING_TTYD, "frame-ancestors 'self'"]);
 const missingWs = await none.upgrade(`/api/sessions/terminal/${id}/ws`);
 assert.deepEqual([missingWs.status, JSON.parse(missingWs.body).error], [503, MISSING_TTYD]);
 assert.equal(existsSync(join(none.stateDir, 'relay')), false);
 const kept = await none.view(id);
 assert.deepEqual([kept.state, kept.hosted, none.herdrRunning(id)], ['starting', true, true], 'the session continues in herdr');
 assert.deepEqual(await none.close(), []);

 // ttyd exits at the start, then starts after the fault is gone.
 const f = await setup(t, {relayOptions: {startMs: 400}});
 const sid = await f.terminal(), pushes = [];
 const watcher = f.client();
 await watcher.subscribe(sid, message => pushes.push(message));
 await writeFile(join(f.ttydDir, 'fault'), 'exit');
 const exited = await f.get(`/api/sessions/terminal/${sid}/`);
 const reason = 'ttyd exited with status 1 before it listened.';
 assert.deepEqual([exited.status, JSON.parse(exited.body).error], [503, reason]);
 assert.deepEqual((await f.view(sid)).relay, {available: false, reason});
 await waitFor(() => pushes.some(m => m.event === 'state' && m.update.relay?.reason === reason));
 const after = await f.view(sid);
 assert.deepEqual([after.state, after.hosted, f.herdrRunning(sid)], ['starting', true, true], 'the session continues in herdr');
 // ttyd does not listen in the start time: the runner stops it.
 await writeFile(join(f.ttydDir, 'fault'), 'hang');
 const hung = await f.get(`/api/sessions/terminal/${sid}/`);
 assert.deepEqual([hung.status, JSON.parse(hung.body).error], [503, 'ttyd did not listen in 0.4 seconds.']);
 assert.equal(alive(f.starts()[1].pid), false, 'the runner stops a ttyd that does not listen');
 assert.deepEqual((await f.view(sid)).relay, {available: false, reason: 'ttyd did not listen in 0.4 seconds.'});
 // A later view starts ttyd again; the relay is available.
 await rm(join(f.ttydDir, 'fault'));
 assert.equal((await f.get(`/api/sessions/terminal/${sid}/`)).status, 200);
 assert.deepEqual((await f.view(sid)).relay, {available: true, reason: null});
 await waitFor(() => pushes.some(m => m.event === 'state' && m.update.relay?.available === true));
 assert.deepEqual(await f.close(), []);

 // A state directory path for which runner.sock fits and the relay socket does not.
 const base = await realpath(tmpdir());
 const long = await setup(t, {state: 'x'.repeat(Math.max(1, 85 - base.length - 12))});
 const lid = await long.terminal();
 const socket = relaySocket(long.stateDir, lid);
 assert.ok(Buffer.byteLength(runnerSocket(long.stateDir)) < 104 && Buffer.byteLength(socket) >= 104, `${runnerSocket(long.stateDir)} and ${socket}`);
 assert.deepEqual((await long.view(lid)).relay, {available: false, reason: LONG_PATH_MESSAGE});
 const far = await long.get(`/api/sessions/terminal/${lid}/`);
 assert.deepEqual([far.status, JSON.parse(far.body).error], [503, LONG_PATH_MESSAGE]);
 assert.deepEqual(long.starts(), []);
 assert.ok(long.herdrRunning(lid));
 assert.deepEqual(await long.close(), []);
});

test('the runner refuses relay calls with wrong input', {skip}, async t => {
 const f = await setup(t);
 const refusal = code => error => error instanceof RunnerError && error.code === code;
 await assert.rejects(f.runnerClient.relay('nope'), refusal('invalid'));
 await assert.rejects(f.runnerClient.relay('0123456789ab'), refusal('unknown-session'));
 for (const count of [-1, 1.5, '1', undefined]) await assert.rejects(f.runnerClient.call('relayViewers', {session: '0123456789ab', count}), refusal('invalid'), String(count));
 await assert.rejects(f.runnerClient.relayViewers('x', 1), refusal('invalid'));
 // A count for a session without a relay changes nothing.
 assert.deepEqual(await f.runnerClient.relayViewers('0123456789ab', 2), {});
 assert.deepEqual(await f.close(), []);
});
