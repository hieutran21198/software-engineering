// The terminal adapter of artifact-plane specifications/agent-orchestration.md (Terminal
// adapter, States; ADR 018). One terminal session has its own named herdr session
// `plane-<session ID>`. The adapter runs the herdr CLI without a shell and with limits on
// time and output. After `pane run` types the start command line, it sends no text and no
// keys to the pane: it reads `pane list`, attaches a client, creates a resume tab, or stops
// the named session. The runner hosts one TerminalSession object for each session.
import {execFile, spawn} from 'node:child_process';
import {accessSync, constants} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';
import {CATALOG, findProgram, profileCommand} from './provider-catalog.js';

export const STATUS_INTERVAL_MS = 2000;
export const SERVER_WAIT_MS = 5000;
// The limits of one herdr CLI call. They are not in the contract.
export const HERDR_LIMIT_MS = 10000;
export const HERDR_OUTPUT_LIMIT = 1024 * 1024;
export const LAUNCH_VARIABLE = 'ARTIFACT_PLANE_LAUNCH';
export const PROMPT_VARIABLE = 'ARTIFACT_PLANE_PROMPT';
const PROMPT_REFERENCE = `"$${PROMPT_VARIABLE}"`;
const SESSION_ID = /^[0-9a-f]{12}$/;
const HERDR_ID = /^[A-Za-z0-9][A-Za-z0-9:_.-]*$/;
const HARNESS_SESSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const CONTROL = /[\x00-\x1f\x7f]/;
const WAIT_STEP_MS = 100;

// code: missing-program (with `program`), herdr (herdr reported `herdrCode`), timeout,
// output-limit, malformed, exit (nonzero status without a herdr error), server-start,
// resume-unavailable, no-terminal-app or invalid. `command` names the herdr command.
export class TerminalError extends Error {
 constructor(code, message, details = {}) {super(message);this.code = code;Object.assign(this, details);}
}

export const herdrSession = id => {
 if (!SESSION_ID.test(id)) throw new TerminalError('invalid', 'A Plane session ID has 12 lowercase hexadecimal characters.');
 return `plane-${id}`;
};
// One argument quoted for a POSIX shell.
export const shellQuote = value => `'${String(value).replaceAll("'", "'\\''")}'`;

// The command line that `pane run` types: the profile command with each argument quoted,
// then the prompt reference in the form of the Initial prompt column, or, with `resume`
// (a harness session ID), the resume arguments of the catalog. It never holds the prompt text.
export function terminalCommandLine(profile, {programs = {}, resume} = {}) {
 const entry = profile.harness === 'other' ? null : CATALOG[profile.harness]?.terminal;
 const command = profileCommand(profile, {programs});
 if (resume !== undefined) {
  if (!entry?.resume) throw new TerminalError('resume-unavailable', 'This harness tool in a terminal cannot resume. Respawn the session.');
  if (typeof resume !== 'string' || !HARNESS_SESSION.test(resume)) throw new TerminalError('invalid', 'The harness session ID is missing or not valid.');
  return [...command, ...entry.resume.map(part => part.replace('{session}', () => resume))].map(shellQuote).join(' ');
 }
 const prompt = entry?.prompt === '--prompt' ? [shellQuote('--prompt'), PROMPT_REFERENCE] : [PROMPT_REFERENCE];
 return [...command.map(shellQuote), ...prompt].join(' ');
}

// The session state after one herdr `agent_status` (States). `done` and `idle` give `idle`
// only after work: after herdr reported `working` or `blocked` for the pane, or after a
// resume. `unknown` and other values keep the state.
export function terminalState(state, agentStatus, worked) {
 if (agentStatus === 'working') return 'working';
 if (agentStatus === 'blocked') return 'waiting';
 if ((agentStatus === 'done' || agentStatus === 'idle') && worked) return 'idle';
 return state;
}

// The herdr command of an argument list, for example `pane list`.
const commandName = args => (args[0] === '--session' ? args.slice(2) : args).slice(0, 2).filter(a => !a.startsWith('-')).join(' ');
const parse = text => {try {const value = JSON.parse(text);return value && typeof value === 'object' && !Array.isArray(value) ? value : null;} catch {return null;}};
const herdrFailure = (value, command, exitCode) => value?.error && typeof value.error === 'object'
 ? new TerminalError('herdr', String(value.error.message || value.error.code || 'herdr refused the command.'), {herdrCode: String(value.error.code || ''), command, exitCode}) : null;
function executable(name, env, cwd) {
 if (!name.includes('/')) return findProgram(name, env);
 const path = isAbsolute(name) ? name : resolve(cwd || '.', name);
 try {accessSync(path, constants.X_OK);return path;} catch {return null;}
}
function requireProgram(name, env, cwd) {
 const path = executable(name, env, cwd);
 if (!path) throw new TerminalError('missing-program', `The program ${name} is missing.`, {program: name});
 return path;
}
function detached(path, args, env) {
 const child = spawn(path, args, {detached: true, stdio: 'ignore', env, windowsHide: true});
 child.on('error', () => {});
 child.unref();
 return child;
}
const delay = ms => new Promise(done => setTimeout(done, ms));

// One herdr CLI call without a shell. It returns the parsed JSON object of the standard
// output, or null when the output is empty or not JSON and `result` is false. A herdr
// error object (on either stream), a nonzero status, the time limit and the output limit
// become a TerminalError. With `result`, the output must be an object with a `result` object.
export async function runHerdr(args, {env = process.env, timeoutMs = HERDR_LIMIT_MS, maxBuffer = HERDR_OUTPUT_LIMIT, result = false} = {}) {
 const program = requireProgram('herdr', env), command = commandName(args);
 return new Promise((done, fail) => {
  const child = execFile(program, args, {env, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer, windowsHide: true}, (error, stdout, stderr) => {
   const out = parse(String(stdout).trim()), err = parse(String(stderr).trim()), exitCode = typeof error?.code === 'number' ? error.code : error ? null : 0;
   if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') return fail(new TerminalError('output-limit', `herdr ${command} wrote more than ${maxBuffer} bytes.`, {command}));
   if (error?.killed) return fail(new TerminalError('timeout', `herdr ${command} did not finish in ${timeoutMs} ms.`, {command}));
   const refused = herdrFailure(err, command, exitCode) || herdrFailure(out, command, exitCode);
   if (refused) return fail(refused);
   if (error) return fail(new TerminalError('exit', `herdr ${command} exited with ${error.signal ? `signal ${error.signal}` : `status ${exitCode}`}.`, {command, exitCode}));
   if (result && !(out?.result && typeof out.result === 'object')) return fail(new TerminalError('malformed', `herdr ${command} returned no JSON result.`, {command}));
   done(out);
  });
  child.stdin?.end();
 });
}

// One terminal session in its named herdr session. `pane`, `tab` and `state` restore a
// session after a runner restart. `onUpdate({session, state, agentStatus, reason?})` runs
// when the status poll changes the state or the herdr agent status; `onError(error)` runs
// when a poll fails and the state stays.
export class TerminalSession {
 constructor({id, worktree, label, profile, programs = {}, env = process.env, pane = null, tab = null, state = 'starting', agentStatus = null,
  onUpdate = () => {}, onError = () => {}, intervalMs = STATUS_INTERVAL_MS, timeoutMs = HERDR_LIMIT_MS, serverWaitMs = SERVER_WAIT_MS}) {
  this.name = herdrSession(id);
  if (profile?.connection !== 'terminal') throw new TerminalError('invalid', 'The profile does not use the terminal connection.');
  if (typeof worktree !== 'string' || !isAbsolute(worktree)) throw new TerminalError('invalid', 'The worktree path must be absolute.');
  label ??= this.name;
  if (typeof label !== 'string' || !label || label.startsWith('-') || CONTROL.test(label)) throw new TerminalError('invalid', 'The pane label is not valid.');
  for (const name of Object.keys(profile.env || {}))
   if (name === LAUNCH_VARIABLE || name === PROMPT_VARIABLE) throw new TerminalError('invalid', `The profile variable ${name} is reserved for Plane.`);
  Object.assign(this, {id, worktree, label, profile, programs, env, pane, tab, state, agentStatus, onUpdate, onError, intervalMs, timeoutMs, serverWaitMs});
  this.worked = ['working', 'waiting', 'idle'].includes(state);
  this.timer = null;this.polling = false;
 }
 herdr(args, options = {}) {return runHerdr(['--session', this.name, ...args], {env: this.env, timeoutMs: this.timeoutMs, ...options});}
 // The arguments of `workspace create` and `tab create`: the worktree, the label, the
 // launch variable, the prompt variable at start, the profile variables and --no-focus.
 paneArguments(prompt = null) {
  const variables = [[LAUNCH_VARIABLE, this.id], ...(prompt === null ? [] : [[PROMPT_VARIABLE, prompt]]), ...Object.entries(this.profile.env || {})];
  return ['--cwd', this.worktree, '--label', this.label, ...variables.flatMap(([name, value]) => ['--env', `${name}=${value}`]), '--no-focus'];
 }
 // Reads the pane and tab IDs of a `workspace create` or `tab create` result.
 static created(output, command) {
  const pane = output.result.root_pane?.pane_id, tab = output.result.tab?.tab_id;
  if (!HERDR_ID.test(pane ?? '') || !HERDR_ID.test(tab ?? '')) throw new TerminalError('malformed', `herdr ${command} returned no pane and tab ID.`, {command});
  return {pane, tab};
 }
 // Waits until `pane list` no longer returns server_not_running: until a result or
 // another herdr error. A call that fails without a herdr answer does not end the wait.
 async waitForServer() {
  for (const deadline = Date.now() + this.serverWaitMs; ;) {
   const left = deadline - Date.now();
   if (left <= 0) throw new TerminalError('server-start', `The herdr server did not start in ${Math.round(this.serverWaitMs / 1000)} seconds.`, {command: 'server'});
   try {await this.herdr(['pane', 'list'], {timeoutMs: Math.min(this.timeoutMs, left)});return;}
   catch (error) {if (error.code === 'herdr' && error.herdrCode !== 'server_not_running') return;}
   await delay(Math.min(WAIT_STEP_MS, Math.max(0, deadline - Date.now())));
  }
 }
 // Starts the named server as a detached process and waits for it (Start, step 1).
 async startServer() {
  detached(requireProgram('herdr', this.env), ['--session', this.name, 'server'], this.env);
  await this.waitForServer();
 }
 // Runs `workspace create` with the pane arguments; `prompt` null leaves out ARTIFACT_PLANE_PROMPT.
 async createWorkspace(prompt) {
  return TerminalSession.created(await this.herdr(['workspace', 'create', ...this.paneArguments(prompt)], {result: true}), 'workspace create');
 }
 // Start: a detached `server`, `workspace create` and `pane run` with the command line.
 // A failure before the command runs stops the named session again.
 async start(prompt) {
  if (typeof prompt !== 'string' || !prompt || prompt.includes('\0')) throw new TerminalError('invalid', 'The initial prompt is empty or not valid.');
  const commandLine = terminalCommandLine(this.profile, {programs: this.programs});
  requireProgram('herdr', this.env);
  requireProgram(profileCommand(this.profile, {programs: this.programs})[0], this.env, this.worktree);
  try {
   await this.startServer();
   const created = await this.createWorkspace(prompt);
   await this.herdr(['pane', 'run', created.pane, commandLine]);
   Object.assign(this, created, {state: 'starting', worked: false});
   return {...created, commandLine};
  } catch (error) {
   await this.herdr(['server', 'stop']).catch(() => {});
   throw error;
  }
 }
 // One status read. It returns the update that it sent, or null.
 async poll() {
  const pane = this.pane, current = () => pane === this.pane && !['interrupted', 'ended'].includes(this.state);
  if (!pane || !current()) return null;
  let agentStatus;
  try {
   const output = await this.herdr(['pane', 'list'], {result: true});
   if (!Array.isArray(output.result.panes)) throw new TerminalError('malformed', 'herdr pane list returned no pane list.', {command: 'pane list'});
   const found = output.result.panes.find(p => p?.pane_id === pane);
   agentStatus = found ? (typeof found.agent_status === 'string' ? found.agent_status : 'unknown') : null;
  } catch (error) {
   // A stopped named session has no pane.
   if (error.herdrCode !== 'server_not_running') {if (current()) this.onError(error);return null;}
   agentStatus = null;
  }
  // An end or a resume during the read makes the read obsolete.
  if (!current()) return null;
  if (agentStatus === null) {
   this.stopWatching();
   Object.assign(this, {state: 'interrupted', agentStatus: null});
   return this.send({session: this.id, state: 'interrupted', agentStatus: null, reason: 'pane-missing'});
  }
  if (agentStatus === 'working' || agentStatus === 'blocked') this.worked = true;
  const state = terminalState(this.state, agentStatus, this.worked);
  if (state === this.state && agentStatus === this.agentStatus) return null;
  Object.assign(this, {state, agentStatus});
  return this.send({session: this.id, state, agentStatus});
 }
 send(update) {try {this.onUpdate(update);} catch {/* the runner handles its own errors */}return update;}
 // Reads the status every intervalMs until stopWatching, end or a missing pane.
 watch() {
  if (this.timer) return this;
  this.timer = setInterval(async () => {
   if (this.polling) return;
   this.polling = true;
   try {await this.poll();} finally {this.polling = false;}
  }, this.intervalMs);
  this.timer.unref?.();
  return this;
 }
 stopWatching() {clearInterval(this.timer);this.timer = null;}
 // Open in terminal app: the terminal.open arguments plus `herdr session attach`, detached, without a shell.
 openTerminal(open) {
  if (!Array.isArray(open) || !open.length || !open.every(a => typeof a === 'string' && a && !a.includes('\0')))
   throw new TerminalError('no-terminal-app', 'Set terminal.open in the agent settings to open a terminal app.');
  const program = requireProgram(open[0], this.env);
  const child = detached(program, [...open.slice(1), 'herdr', 'session', 'attach', this.name], this.env);
  return {pid: child.pid ?? null};
 }
 // Resume of a claude-code session: `tab create` in the same named session, then the
 // profile command plus the resume arguments with the harness session ID. When the named
 // server does not run or has no workspace, the resume starts them as the start does,
 // without ARTIFACT_PLANE_PROMPT (Resume, step 6). A failure stops a server that it started.
 async resume(harnessSession) {
  const commandLine = terminalCommandLine(this.profile, {programs: this.programs, resume: harnessSession ?? ''});
  requireProgram(profileCommand(this.profile, {programs: this.programs})[0], this.env, this.worktree);
  let created, started = false;
  try {
   try {created = TerminalSession.created(await this.herdr(['tab', 'create', ...this.paneArguments()], {result: true}), 'tab create');}
   catch (error) {
    if (error.code !== 'herdr' || !['server_not_running', 'workspace_not_found'].includes(error.herdrCode)) throw error;
    if (error.herdrCode === 'server_not_running') {started = true;await this.startServer();}
    created = await this.createWorkspace(null);
   }
   await this.herdr(['pane', 'run', created.pane, commandLine]);
  } catch (error) {
   if (started) await this.herdr(['server', 'stop']).catch(() => {});
   throw error;
  }
  // The resumed harness session did work before, so `idle` maps to idle.
  Object.assign(this, created, {state: 'starting', agentStatus: null, worked: true});
  return {...created, commandLine};
 }
 // End: `server stop` of the named session. It returns false when no server ran.
 async end() {
  this.stopWatching();
  const state = this.state;this.state = 'ended';
  try {await this.herdr(['server', 'stop']);return true;}
  catch (error) {if (error.herdrCode === 'server_not_running') return false;this.state = state;throw error;}
 }
}
