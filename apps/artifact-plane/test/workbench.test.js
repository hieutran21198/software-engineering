// The workbench step (artifact-plane specifications/ui-discovery.md: Workbench step,
// Lines). Fake probes, starts and clocks cover the states; one test starts a real
// `serve` process with a private state directory and stops it. No test opens a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {mkdtemp, rm, writeFile, realpath, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppServer} from '../server/http.js';
import {workbenchStep, workbenchLine, probe, startServe} from '../server/workbench.js';
import {runtimeFixture} from './runtime-fixtures.js';
import {git} from './fixtures.js';

const temporary = async t => {const dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-workbench-')));t.after(() => rm(dir, {recursive: true, force: true}));return dir;};
async function addRepository(t) {const f = await runtimeFixture();t.after(f.cleanup);return realpath(f.root);}
const listen = async (t, server) => {await new Promise(done => server.listen(0, '127.0.0.1', done));t.after(() => new Promise(done => {server.closeAllConnections?.();server.close(done);}));return server.address().port;};
// A port with no listener: a closed listener of the system.
const freePort = async () => {const server = createServer();await new Promise(done => server.listen(0, '127.0.0.1', done));const {port} = server.address();await new Promise(done => server.close(done));return port;};
const address = (port, root) => `http://127.0.0.1:${port}/?repository=${encodeURIComponent(root)}`;
// A fake clock: each sleep moves the time forward at once.
function clock() {const c = {time: 0, sleeps: []};c.now = () => c.time;c.sleep = async ms => {c.sleeps.push(ms);c.time += ms;};return c;}
// A fake start that records each call and returns a child that a test can make exit.
function starts() {const calls = [];const start = (port, env) => {const child = new EventEmitter();calls.push({port, env, child});return child;};return {calls, start};}
// A fake probe that answers from a list and records the ports; the last answer repeats.
function answers(...list) {const ports = [];const check = async port => {ports.push(port);return list.length > 1 ? list.shift() : list[0];};return {ports, check};}

test('Lines: the four states have the texts of the contract, and port 4310 gives the short command', () => {
  const root = '/work/my repo';
  assert.equal(workbenchLine('ready', 4310, root), 'Artifact Plane workbench: http://127.0.0.1:4310/?repository=%2Fwork%2Fmy%20repo');
  assert.equal(workbenchLine('starting', 4310, root), 'Artifact Plane workbench is starting: http://127.0.0.1:4310/?repository=%2Fwork%2Fmy%20repo');
  assert.equal(workbenchLine('off', 4310, root), 'Artifact Plane workbench: run artifact-plane serve, then open http://127.0.0.1:4310/?repository=%2Fwork%2Fmy%20repo');
  assert.equal(workbenchLine('unavailable', 4310, root), 'Artifact Plane workbench is not available at port 4310. Run artifact-plane serve to see why, or set ARTIFACT_PLANE_PORT to another port.');
  assert.equal(workbenchLine('off', 4399, root), 'Artifact Plane workbench: run PORT=4399 artifact-plane serve, then open http://127.0.0.1:4399/?repository=%2Fwork%2Fmy%20repo');
});

test('UDA1: with a free port the step starts one detached serve process with PORT set, and gives the ready line once the probe answers', async t => {
  const root = await addRepository(t), port = await freePort(), stateDir = await temporary(t);
  assert.equal((await stat(stateDir)).mode & 0o777, 0o700);
  const children = [];
  t.after(async () => {
    for (const child of children) {
      try {process.kill(child.pid, 'SIGTERM');} catch {/* already ended */}
      for (const deadline = Date.now() + 5000; Date.now() < deadline && await probe(child.port) !== 'free';) await new Promise(done => setTimeout(done, 50));
    }
  });
  // PORT of the harness does not select the port; the started server gets PORT=port.
  const env = {...process.env, PORT: String(await freePort()), ARTIFACT_PLANE_PORT: String(port), ARTIFACT_PLANE_STATE_DIR: stateDir};
  const start = (p, e) => {const child = startServe(p, e);children.push(Object.assign(child, {port: p}));return child;};
  const result = await workbenchStep(join(root, 'docs/artifacts'), {env, start});
  assert.deepEqual(result, {state: 'ready', port, line: `Artifact Plane workbench: ${address(port, root)}`});
  assert.equal(children.length, 1);
  const [child] = children;
  assert.equal(child.spawnargs.at(-1), 'serve');
  // A detached process leads its own process group.
  if (process.platform !== 'win32') assert.equal(Number(execFileSync('ps', ['-o', 'pgid=', '-p', String(child.pid)], {encoding: 'utf8'}).trim()), child.pid);
  assert.equal(await probe(port), 'plane');
  assert.equal(await probe(Number(env.PORT)), 'free');
  // A second session finds the server and starts nothing.
  const again = starts();
  assert.equal((await workbenchStep(root, {env, start: again.start})).state, 'ready');
  assert.equal(again.calls.length, 0);
});

test('UDA2: with a Plane server at the port the step gives the ready line and starts no process', async t => {
  const root = await addRepository(t), port = await listen(t, createAppServer()), {calls, start} = starts();
  assert.equal(await probe(port), 'plane');
  assert.deepEqual(await workbenchStep(root, {env: {ARTIFACT_PLANE_PORT: String(port)}, start}), {state: 'ready', port, line: `Artifact Plane workbench: ${address(port, root)}`});
  assert.deepEqual(calls, []);
});

test('UDA3: with another HTTP server at the port the step gives the unavailable line without an address and starts no process', async t => {
  const root = await addRepository(t), {calls, start} = starts();
  const servers = [
    (req, res) => {res.writeHead(200, {'Content-Type': 'text/html'});res.end('<title>Artifact Plane</title>');},
    (req, res) => {res.writeHead(200, {'Content-Type': 'application/json'});res.end('{"name":"other-program"}');},
    (req, res) => {res.writeHead(404);res.end();},
    () => {/* never answers */},
  ];
  for (const handler of servers) {
    const port = await listen(t, createServer(handler));
    const started = Date.now();
    const result = await workbenchStep(root, {env: {ARTIFACT_PLANE_PORT: String(port)}, start});
    assert.ok(Date.now() - started < 1500, `${Date.now() - started} ms`);
    assert.deepEqual(result, {state: 'unavailable', port, line: `Artifact Plane workbench is not available at port ${port}. Run PORT=${port} artifact-plane serve to see why, or set ARTIFACT_PLANE_PORT to another port.`});
    assert.ok(!result.line.includes('http://'));
  }
  assert.deepEqual(calls, []);
});

test('UDA5: with ARTIFACT_PLANE_AUTOSTART=0 and a free port the step gives the off line with the start command and starts no process', async t => {
  const root = await addRepository(t), port = await freePort(), {calls, start} = starts();
  assert.equal(await probe(port), 'free');
  const result = await workbenchStep(root, {env: {ARTIFACT_PLANE_PORT: String(port), ARTIFACT_PLANE_AUTOSTART: '0'}, start});
  assert.deepEqual(result, {state: 'off', port, line: `Artifact Plane workbench: run PORT=${port} artifact-plane serve, then open ${address(port, root)}`});
  assert.deepEqual(calls, []);
  // Another value of the variable keeps the start.
  const other = answers('free', 'plane');
  assert.equal((await workbenchStep(root, {env: {ARTIFACT_PLANE_AUTOSTART: '1'}, probe: other.check, start, ...clock()})).state, 'ready');
  assert.equal(calls.length, 1);
});

test('Workbench step: a started process that exits gives ready when a Plane then answers, else unavailable', async t => {
  const root = await addRepository(t);
  for (const [final, state] of [['plane', 'ready'], ['free', 'unavailable'], ['other', 'unavailable']]) {
    const {calls, start} = starts(), c = clock(), ports = [];let probes = 0;
    // The second poll sees the exit of the child, and the next probe is the final one.
    const check = async port => {ports.push(port);probes++;if (probes === 2) calls[0].child.emit('exit', 1);return probes <= 2 ? 'free' : final;};
    const result = await workbenchStep(root, {env: {}, probe: check, start, now: c.now, sleep: c.sleep});
    assert.equal(result.state, state, final);
    assert.equal(calls.length, 1);
    assert.equal(probes, 3);
    assert.deepEqual(ports, [4310, 4310, 4310]);
  }
  // A child that cannot be spawned emits error; a start that throws is a failed start.
  const failing = {start: () => {const child = new EventEmitter();setImmediate(() => child.emit('error', Error('spawn ENOENT')));return child;}};
  assert.equal((await workbenchStep(root, {env: {}, probe: answers('free').check, start: failing.start})).state, 'unavailable');
  assert.equal((await workbenchStep(root, {env: {}, probe: answers('free').check, start: () => {throw Error('EAGAIN');}})).state, 'unavailable');
});

test('Workbench step: a process that runs past 3 seconds without an answer gives the starting line; polls are 200 ms apart', async t => {
  const root = await addRepository(t), {calls, start} = starts(), c = clock(), {ports, check} = answers('free', 'other');
  const result = await workbenchStep(root, {env: {}, probe: check, start, now: c.now, sleep: c.sleep});
  assert.deepEqual(result, {state: 'starting', port: 4310, line: `Artifact Plane workbench is starting: ${address(4310, root)}`});
  assert.equal(calls.length, 1);
  assert.ok(c.sleeps.every(ms => ms === 200));
  assert.equal(c.time, 3000);
  assert.equal(ports.length, 1 + 15);
  // An answer in the window gives ready.
  const late = answers('free', 'other', 'other', 'plane'), d = clock();
  assert.equal((await workbenchStep(root, {env: {}, probe: late.check, start: starts().start, now: d.now, sleep: d.sleep})).state, 'ready');
  assert.equal(d.time, 600);
});

test('Workbench step: PORT is never read; ARTIFACT_PLANE_PORT selects the port; an invalid value is a failed start (claim hook-port-variable)', async t => {
  const root = await addRepository(t);
  const harness = answers('plane');
  assert.equal((await workbenchStep(root, {env: {PORT: '3000'}, probe: harness.check})).line, `Artifact Plane workbench: ${address(4310, root)}`);
  assert.deepEqual(harness.ports, [4310]);
  const chosen = answers('free'), {calls, start} = starts();
  assert.deepEqual(await workbenchStep(root, {env: {PORT: '3000', ARTIFACT_PLANE_PORT: '4399', ARTIFACT_PLANE_AUTOSTART: '0'}, probe: chosen.check, start}),
    {state: 'off', port: 4399, line: `Artifact Plane workbench: run PORT=4399 artifact-plane serve, then open ${address(4399, root)}`});
  assert.deepEqual(chosen.ports, [4399]);
  // The real start gives the port to the child as PORT; the fake records it.
  const started = answers('free', 'plane'), c = clock();
  await workbenchStep(root, {env: {PORT: '3000', ARTIFACT_PLANE_PORT: '4399'}, probe: started.check, start, now: c.now, sleep: c.sleep});
  assert.deepEqual(calls.map(call => call.port), [4399]);
  for (const value of ['0', '65536', '43.5', 'abc', '-1']) {
    const none = answers('plane');
    assert.deepEqual(await workbenchStep(root, {env: {ARTIFACT_PLANE_PORT: value}, probe: none.check, start}),
      {state: 'unavailable', port: value, line: `Artifact Plane workbench is not available at port ${value}. Run PORT=${value} artifact-plane serve to see why, or set ARTIFACT_PLANE_PORT to another port.`}, value);
    assert.deepEqual(none.ports, [], value);
  }
  assert.equal(calls.length, 1);
});

test('UDA6: outside an ADD repository the step gives no line, probes nothing and starts no process', async t => {
  const plain = await temporary(t), {calls, start} = starts(), {ports, check} = answers('free');
  git(plain, 'init', '-q', '-b', 'main');await writeFile(join(plain, 'file.txt'), 'x');
  for (const cwd of [plain, join(plain, 'missing'), tmpdir(), '', undefined]) assert.equal(await workbenchStep(cwd, {env: {}, probe: check, start}), null, String(cwd));
  assert.deepEqual([calls, ports], [[], []]);
});
