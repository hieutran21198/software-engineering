// The workbench step of the session start hook (artifact-plane
// specifications/ui-discovery.md: Workbench step, Lines). It finds a Plane server
// at the port, or starts `serve` as a detached process, and gives one line with the
// workbench address. It never opens a browser and never stops a server.
import {request} from 'node:http';
import {spawn} from 'node:child_process';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {isSea} from 'node:sea';
import {fileURLToPath} from 'node:url';
import {git as readerGit} from './reader.js';
import {addRoot} from './agent-guidance.js';

export const DEFAULT_PORT = 4310;
export const TIMING = {probe: 500, interval: 200, wait: 3000};
const delay = ms => new Promise(done => setTimeout(done, ms));

// The line for the person in one state. An invalid port value stays as it was given.
export function workbenchLine(state, port, root) {
  const address = `http://127.0.0.1:${port}/?repository=${encodeURIComponent(root)}`;
  const command = port === DEFAULT_PORT ? 'artifact-plane serve' : `PORT=${port} artifact-plane serve`;
  return {
    ready: `Artifact Plane workbench: ${address}`,
    starting: `Artifact Plane workbench is starting: ${address}`,
    off: `Artifact Plane workbench: run ${command}, then open ${address}`,
    unavailable: `Artifact Plane workbench is not available at port ${port}. Run ${command} to see why, or set ARTIFACT_PLANE_PORT to another port.`,
  }[state];
}

// GET /api/plane at the port: 'plane', 'free' (connection refused) or 'other'.
export function probe(port, {timeout = TIMING.probe} = {}) {
  return new Promise(done => {
    let finished = false, timer = null, req = null;
    const finish = result => {if (finished) return;finished = true;clearTimeout(timer);req?.destroy();done(result);};
    timer = setTimeout(finish, timeout, 'other');
    req = request({host: '127.0.0.1', port, path: '/api/plane', agent: false, headers: {accept: 'application/json'}}, res => {
      const chunks = [];let size = 0;
      res.on('data', chunk => {size += chunk.length;if (size > 4096) finish('other');else chunks.push(chunk);});
      res.on('end', () => {
        let body = null;
        try {body = JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {/* not a Plane answer */}
        finish(res.statusCode === 200 && body?.name === 'artifact-plane' ? 'plane' : 'other');
      });
      res.on('error', () => finish('other'));
    });
    req.on('error', error => finish(error.code === 'ECONNREFUSED' ? 'free' : 'other'));
    req.end();
  });
}

// Starts `serve` of this program as a detached process with PORT=port and returns the child.
export function startServe(port, env = process.env) {
  const program = isSea() ? [] : [fileURLToPath(new URL('./app.js', import.meta.url))];
  const child = spawn(process.execPath, [...program, 'serve'], {detached: true, stdio: 'ignore', windowsHide: true, cwd: homedir(), env: {...env, PORT: String(port)}});
  child.on('error', () => {});
  child.unref();
  return child;
}

// {state, port, line} for the repository of cwd, or null outside an ADD repository.
// The port comes from ARTIFACT_PLANE_PORT only, never from PORT. Tests replace the
// probe, the start, the environment and the clock.
export async function workbenchStep(cwd, {env = process.env, probe: check = probe, start = startServe, now = Date.now, sleep = delay, git = readerGit, timing = TIMING} = {}) {
  if (typeof cwd !== 'string' || !cwd) return null;
  const root = await addRoot(resolve(cwd), git);
  if (!root) return null;
  const value = env.ARTIFACT_PLANE_PORT || DEFAULT_PORT, number = Number(value);
  const valid = Number.isInteger(number) && number >= 1 && number <= 65535, port = valid ? number : value;
  const result = state => ({state, port, line: workbenchLine(state, port, root)});
  // An invalid value is a failed start.
  if (!valid) return result('unavailable');
  const first = await check(port, {timeout: timing.probe});
  if (first === 'plane') return result('ready');
  if (first !== 'free') return result('unavailable');
  if (env.ARTIFACT_PLANE_AUTOSTART === '0') return result('off');
  let child, exited = false;
  try {child = start(port, env);} catch {return result('unavailable');}
  child.once('exit', () => {exited = true;});
  child.once('error', () => {exited = true;});
  const deadline = now() + timing.wait;
  for (;;) {
    await sleep(timing.interval);
    // A process that exits can lose the port to a server of another session.
    if (exited) return result(await check(port, {timeout: timing.probe}) === 'plane' ? 'ready' : 'unavailable');
    if (await check(port, {timeout: timing.probe}) === 'plane') return result('ready');
    if (!exited && now() >= deadline) return result('starting');
  }
}
