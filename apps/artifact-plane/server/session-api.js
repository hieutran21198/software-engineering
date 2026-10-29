// The session API and the orchestrator of artifact-plane specifications/agent-orchestration.md
// (Commands, Start rules, Roles and initial prompts, Output, Recovery, Workbench, Failures) and
// the explicit binding of specifications/codex-execution.md. The session routes of
// server/http.js call this service. It checks the start rules, binds implementer attempts,
// builds the initial prompts and sends the session commands to the session runner
// (server/runner-client.js). The initial prompt and the request reach the runner in memory
// only. The service writes only runtime observation data: the explicit binding of an
// implementer attempt, and the end of an attempt that a refused start or a respawn leaves. It
// never writes a repository file or Git metadata, approves a plan, checks a DoD item, merges
// or writes a version record.
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {ROLES, readProviders, readSettings, settingsPath, validateSettings} from './agent-settings.js';
import {readPrograms} from './provider-catalog.js';
import {git} from './reader.js';
import {readableRoot} from './repository-events.js';
import {RESTART_MESSAGE, RunnerError, errorStatus} from './runner-client.js';
import {FRESHNESS_MS, RuntimeStore, defaultStateDir, observedAttempt, repositoryIdentity, worktreeChanges} from './runtime-store.js';
import {OutputError, readDiff, readOutput} from './session-output.js';
import {newSessionId} from './session-runner.js';

export const REQUEST_LIMIT = 8 * 1024;
export const TEXT_LIMIT = 64 * 1024;
// The refusal of start rule 5 (AOA12).
export const ROLE_TERMINAL = 'Role sessions run in a terminal, where you chat with the harness tool.';
export const STREAM_LIMIT = 16, HEARTBEAT_MS = 15000, OUTPUT_POLL_MS = 1000;
// Session states in which the session continues its attempt.
const ACTIVE = new Set(['starting', 'working', 'waiting', 'idle']);
const SESSION_ID = /^[0-9a-f]{12}$/, NAME = /^[a-z0-9][a-z0-9-]*$/;
// A task path or a branch name that Plane puts in a prompt: no space, quote, backtick or control character.
const PROMPT_NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;
const ROLE_NAMES = {coordinator: 'coordinator', 'product-owner': 'product owner', 'technical-lead': 'technical lead', implementer: 'implementer'};
const START_FIELDS = ['path', 'role', 'profile', 'artifact', 'change', 'task', 'request', 'respawnOf'];
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);

// A refused or failed session command. `status` is 400 (invalid input), 404 (unknown session),
// 409 (refused start, wrong state, base revision not in the repository), 429 (too many streams)
// or 503 (runner, herdr, program or store unavailable). `body` holds more JSON fields of the reply.
export class SessionError extends Error {
 constructor(status, message, body = {}) {super(message);this.status = status;this.body = body;}
}
// The refusal of a start rule (Start rules): status 409 with the rule number.
const refuse = (rule, message) => new SessionError(409, message, {rule});
function failure(error) {
 if (error instanceof SessionError) return error;
 if (error instanceof RunnerError) return new SessionError(errorStatus(error.code), error.message, typeof error.program === 'string' ? {program: error.program} : {});
 if (error instanceof OutputError) return new SessionError(error.status, error.message);
 return error;
}
function fields(body, allowed, message) {
 if (!plain(body) || Object.keys(body).some(key => !allowed.includes(key))) throw new SessionError(400, message);
 return body;
}
const optionalText = value => value === undefined || typeof value === 'string';

// The initial prompt of the contract table (Roles and initial prompts). The placeholders hold
// only names that the start rules validated; the request is the text of the person, unchanged.
// `respawn` is the reason of the earlier session of the task.
export function initialPrompt({role, artifact = null, change = null, task = null, branch = null, request = null, respawn = null}) {
 const selected = `\`${artifact}/${change}\``;
 let prompt;
 if (role === 'coordinator') prompt = 'You are the ADD coordinator for this repository. Load the add-coordinator skill and follow it. ' + (change
  ? `Selected change: ${selected}.`
  : `No change is selected. The person asks: \`${request}\`. Start with discovery, and create a dedicated branch before you write knowledge.`);
 else if (role === 'product-owner') prompt = `You are the ADD product owner. Load the add-product-owner skill and follow it for change ${selected}.`;
 else if (role === 'technical-lead') prompt = `You are the ADD technical lead. Load the add-technical-lead skill and follow it for change ${selected}.`;
 else prompt = `You are an ADD implementer. Load the add-implementer skill and follow it. Your task is \`${task}\` of change ${selected} in this worktree on branch \`${branch}\`. Plane does not record plan approval; check the gates of the skill before you change code.`;
 if (respawn === null) return prompt;
 return `${prompt} An earlier attempt on this task stopped: \`${respawn}\`. Read the task, the branch history, \`git status\` and the change brief before you continue.`;
}

// The branch of a worktree, or null for a detached HEAD.
async function branchOf(root) {
 try {return await git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']) || null;} catch {return null;}
}
const taskFile = (artifact, change, task) => `docs/artifacts/${artifact}/changes/${change}/tasks/${task}`;

export class SessionService {
 #store = null;#locks = new Map();#streams = new Set();#closed = false;
 // `runner` returns the runner client; `settingsFile` returns the path of profiles.json.
 // `roots` are the inspected repositories that the settings file must stay out of.
 constructor({stateDir = defaultStateDir(), roots = [], settingsFile = () => settingsPath(), runner, env = process.env, maxStreams = STREAM_LIMIT, heartbeatMs = HEARTBEAT_MS, outputPollMs = OUTPUT_POLL_MS} = {}) {
  Object.assign(this, {stateDir, roots, settingsFile, runner, env, maxStreams, heartbeatMs, outputPollMs});
 }
 // The runtime store of the server. Without `create`, a missing store gives null, so a query
 // creates no state file (requirement AO18).
 #open(create = false) {
  if (this.#store) return this.#store;
  if (!create && !existsSync(join(this.stateDir, 'runtime.sqlite'))) return null;
  try {return this.#store = new RuntimeStore({stateDir: this.stateDir});}
  catch (error) {throw new SessionError(503, `Session control is unavailable: ${error.message}`);}
 }
 // The session fields for the workbench: the store record or the runner view, the attempt,
 // and the tool name of a waiting terminal session (Workbench). `extra` holds `live`. The
 // browser counts the elapsed time of the attempt from its start.
 #present(store, view, extra = {}) {
  const {attempt: id = null, ...session} = view;
  const result = {agentStatus: null, error: null, hosted: false, relay: null, ...session, attempt: this.#attempt(store, id), waitingTool: null, ...extra};
  if (store && result.state === 'waiting' && result.profile?.connection === 'terminal') result.waitingTool = store.waitingTool(result.id, result.harnessSession);
  return result;
 }
 #attempt(store, id) {
  const stored = id && store ? store.attempt(id) : null;
  if (!stored) return null;
  const {elapsedMs, ...attempt} = observedAttempt(stored);
  return attempt;
 }
 // The stored record of a session ID: 400 for a malformed ID, 404 for an unknown session.
 #record(id) {
  if (typeof id !== 'string' || !SESSION_ID.test(id)) throw new SessionError(400, 'A session ID has 12 lowercase hexadecimal characters.');
  const store = this.#open(), record = store?.session(id);
  if (!record) throw new SessionError(404, 'The session is unknown.');
  return {store, record};
 }
 // The current profile of the settings file and its program names (Validity, start rule 1).
 async #profile(id) {
  const file = readSettings({path: this.settingsFile(), roots: this.roots});
  if (file.refused || file.error) throw refuse(1, `The settings file is unavailable: ${file.error}`);
  const list = Array.isArray(file.settings?.profiles) ? file.settings.profiles : [];
  const index = list.findIndex(p => plain(p) && p.id === id);
  if (index < 0) throw refuse(1, `The profile ${id} does not exist.`);
  const validity = validateSettings(file.settings, {providers: readProviders(this.stateDir)});
  if (validity.errors.length) throw refuse(1, `The settings file is invalid: ${validity.errors[0]}`);
  if (!validity.profiles[index].valid) throw refuse(1, `The profile ${id} is invalid: ${validity.profiles[index].reasons[0]}`);
  const profile = list[index];
  // The runner starts OpenCode as the first of opencode and opencode2 with version 2 or later.
  const programs = profile.harness === 'opencode' ? {opencode: (await readPrograms({env: this.env})).opencode || 'opencode'} : {};
  return {profile, programs};
 }
 async #call(method, ...args) {
  try {return await this.runner()[method](...args);} catch (error) {throw failure(error);}
 }

 // The number of profiles in the settings file, read without the program versions of the
 // settings query. With 0, the workbench shows no session control (requirement AO18).
 #profileCount() {
  const file = readSettings({path: this.settingsFile(), roots: this.roots});
  return !file.refused && Array.isArray(file.settings?.profiles) ? file.settings.profiles.length : 0;
 }
 // POST /api/sessions/query {path}: the sessions of the repository of the worktree, newest
 // first, with their attempts, and `profiles`, the number of profiles of the settings file.
 // The runner view gives the state, `relay` and `live` of each session that has not ended. The
 // query does not start a runner; its server check marks the ACP sessions of a lost runner as
 // interrupted.
 async query(body) {
  fields(body, ['path'], 'Send {path}: an absolute worktree path.');
  if (typeof body.path !== 'string') throw new SessionError(400, 'Send {path}: an absolute worktree path.');
  let root;
  try {root = await readableRoot(body.path);} catch (error) {throw new SessionError(400, error.message);}
  const runner = this.runner();
  try {await runner.check();} catch {/* the stored records stay; a session command shows the reason */}
  const store = this.#open(), repository = store?.repository(root) ?? null;
  const profiles = this.#profileCount();
  if (!repository) return {repository: null, sessions: [], profiles};
  const sessions = await Promise.all(store.sessions({repository: repository.id}).map(async record => {
   if (runner.connected && record.state !== 'ended') {
    try {const {session, live} = await runner.snapshot(record.id);return this.#present(store, session, {live});}
    catch {/* the stored record follows */}
   }
   return this.#present(store, record, {live: null});
  }));
  return {repository: repository.id, sessions, profiles};
 }

 // POST /api/sessions/start: start rules 1 to 8 in order, then the explicit binding of an
 // implementer and the runner start. Returns {session, attempt, existing}.
 async start(body) {
  const message = `Send {${START_FIELDS.join(', ')}} with text values.`;
  fields(body, START_FIELDS, message);
  const {path, role, profile: profileId, artifact, change, task, request, respawnOf} = body;
  if (typeof path !== 'string' || typeof profileId !== 'string' || ![artifact, change, task, request, respawnOf].every(optionalText)) throw new SessionError(400, message);
  if (!ROLES.includes(role)) throw new SessionError(400, `Send one role: ${ROLES.join(', ')}.`);
  for (const [name, value] of Object.entries({artifact, change})) if (value !== undefined && !NAME.test(value)) throw new SessionError(400, `${name} must match [a-z0-9][a-z0-9-]*.`);
  if (task !== undefined && role !== 'implementer') throw new SessionError(400, 'Only an implementer session names a task.');
  // 1. The profile exists and is valid.
  const {profile, programs} = await this.#profile(profileId);
  // 2. `path` is a worktree of the inspected repository.
  let root;
  try {root = await readableRoot(path);} catch (error) {throw refuse(2, `Select a worktree of the repository. ${error.message}`);}
  const branch = await branchOf(root);
  // 3 and 4. The task and the change; the branch of an implementer.
  let unit = null;
  if (role === 'implementer' || artifact !== undefined || change !== undefined) {
   const rule = role === 'implementer' ? 3 : 4;
   if (role === 'implementer' && (!artifact || !change || !task)) throw refuse(3, 'An implementer session names an artifact, a change and a task.');
   if (!artifact || !change) throw refuse(4, `A ${ROLE_NAMES[role]} session names the artifact and the change of a current change.`);
   const current = await worktreeChanges(root), found = current.changes.find(c => c.artifact === artifact && c.name === change);
   if (!found) throw refuse(rule, `The change ${artifact}/${change} is not a current change in this worktree.`);
   if (role === 'implementer') {
    if (found.taskGraph?.state !== 'available') throw refuse(3, `The task graph of ${artifact}/${change} is ${found.taskGraph?.state ?? 'unavailable'}.`);
    if (!found.taskGraph.tasks.some(t => t.path === taskFile(artifact, change, task))) throw refuse(3, `The task ${task} is not a listed task of ${artifact}/${change}.`);
    if (!PROMPT_NAME.test(task)) throw refuse(3, 'Plane puts only task paths of letters, digits, ".", "_", "-" and "/" in a prompt.');
    if (branch === null) throw refuse(3, 'An implementer session needs a branch. The worktree has a detached HEAD.');
    if (branch === 'main' || branch === 'master') throw refuse(3, `An implementer session does not run on ${branch}. Select the worktree of the task branch.`);
    if (!PROMPT_NAME.test(branch)) throw refuse(3, 'Plane puts only branch names of letters, digits, ".", "_", "-" and "/" in a prompt.');
    const units = current.units.filter(u => u.members.some(m => m.artifact === artifact && m.change === change));
    unit = units.length === 1 ? units[0].id : null;
   }
  } else if (role === 'product-owner' || role === 'technical-lead') throw refuse(4, `A ${ROLE_NAMES[role]} session names the artifact and the change of a current change.`);
  // 5. A role session runs in a terminal.
  if (role !== 'implementer' && profile.connection !== 'terminal') throw refuse(5, ROLE_TERMINAL);
  // 6. Only a coordinator takes a request; a coordinator without a change needs one.
  if (request !== undefined && role !== 'coordinator') throw refuse(6, 'Only a coordinator session takes a request.');
  if (role === 'coordinator' && !change && request === undefined) throw refuse(6, 'A coordinator session without a change needs a request.');
  if (request !== undefined && change) throw refuse(6, 'A coordinator session with a selected change takes no request.');
  if (request !== undefined && (!request.trim() || request.includes('\0') || Buffer.byteLength(request) > REQUEST_LIMIT)) throw refuse(6, 'The request must be nonempty text of at most 8 KiB.');
  const context = {path: root, role, profile, programs, artifact: artifact ?? null, change: change ?? null, task: task ?? null, branch, request: request ?? null, respawnOf: respawnOf ?? null, unit};
  if (role !== 'implementer') {
   // 8. A role session has no task, so respawnOf names no session of the same task.
   if (respawnOf !== undefined) throw refuse(8, 'respawnOf names an ended or interrupted session of the same task. Only an implementer session has a task.');
   return this.#launch(context);
  }
  // 7. The orchestrator serializes the starts of one task; an open attempt returns at once.
  let common;
  try {common = repositoryIdentity(root).common;} catch (error) {throw refuse(2, `Select a worktree of the repository. ${error.message}`);}
  return this.#serialize(JSON.stringify([common, artifact, change, task]), () => this.#startTask(context));
 }
 async #serialize(key, work) {
  const run = (this.#locks.get(key) ?? Promise.resolve()).then(work), tail = run.catch(() => {});
  this.#locks.set(key, tail);
  try {return await run;} finally {if (this.#locks.get(key) === tail) this.#locks.delete(key);}
 }
 async #startTask(context) {
  const {path, artifact, change, task, respawnOf} = context, store = this.#open(), repository = store?.repository(path) ?? null;
  if (repository) {
   const open = this.#openAttempt(store, repository.id, artifact, change, task);
   if (open) {
    const session = open.session ? this.#present(store, open.session) : null;
    return {session, attempt: session ? session.attempt : this.#attempt(store, open.attempt?.id), existing: true};
   }
  }
  // 8. respawnOf names an ended or interrupted session of the same task.
  let earlier = null;
  if (respawnOf !== null) {
   earlier = SESSION_ID.test(respawnOf) ? store?.session(respawnOf) : null;
   if (!earlier || earlier.repository !== repository?.id || earlier.role !== 'implementer' || earlier.artifact !== artifact || earlier.change !== change || earlier.task !== task || !['ended', 'interrupted'].includes(earlier.state))
    throw refuse(8, 'respawnOf names an ended or interrupted session of the same task.');
  }
  return this.#launch(context, earlier);
 }
 // The open attempt of a task (start rule 7): the attempt of a session of the task that has not
 // ended or been interrupted, else an attempt without an end whose last observation is at most
 // 10 minutes old (the freshness of specifications/codex-execution.md). Newest first.
 #openAttempt(store, repository, artifact, change, task) {
  const sessions = store.sessions({repository}).filter(s => s.role === 'implementer' && s.artifact === artifact && s.change === change && s.task === task);
  const active = sessions.find(s => ACTIVE.has(s.state));
  if (active) return {session: active, attempt: active.attempt ? store.attempt(active.attempt) : null};
  const now = Date.now(), attempt = store.attempts({repository, artifact, change, path: taskFile(artifact, change, task)})
   .filter(a => !a.endedAt && now - a.updatedAt <= FRESHNESS_MS).sort((a, b) => b.startedAt - a.startedAt)[0];
  return attempt ? {attempt, session: sessions.find(s => s.attempt === attempt.id) ?? null} : null;
 }
 // Binds an implementer attempt to the new Plane session ID and starts the session. The runner
 // replaces the binding session with the harness session ID when it is known.
 async #launch(context, earlier = null) {
  const {path, role, profile, programs, artifact, change, task, branch, request, unit} = context;
  const runner = this.runner();
  // A runner that does not start, or that has another version, refuses before any write.
  try {
   const hello = await runner.ensure();
   if (hello && runner.version && hello.version !== runner.version) throw new RunnerError('version', RESTART_MESSAGE);
  } catch (error) {throw failure(error);}
  const id = newSessionId(), prompt = initialPrompt({role, artifact, change, task, branch, request, respawn: earlier ? (NAME.test(earlier.reason ?? '') ? earlier.reason : earlier.state) : null});
  let attempt = null, store = null;
  if (role === 'implementer') {
   store = this.#open(true);
   try {attempt = (await store.bind({root: path, unit, artifact, change, task, session: id, agent: '', binding: 'explicit'})).attempt;}
   catch (error) {throw refuse(3, `Plane cannot bind the task: ${error.message}`);}
  }
  let result;
  try {
   result = await runner.start({session: id, worktree: path, role, profile, programs, prompt, artifact, change, task, branch, attempt, respawnOf: earlier?.id ?? null});
  } catch (error) {
   // A refused start leaves no open attempt (States: the start fails).
   if (attempt && !store.session(id)) store.endAttempt(attempt, 'interrupted');
   throw failure(error);
  }
  store = this.#open();
  // Respawn: the new binding supersedes the attempt of the earlier session (Recovery).
  if (earlier?.attempt && result.session.state !== 'ended') store.endAttempt(earlier.attempt, 'superseded');
  const session = this.#present(store, result.session);
  return {session, attempt: session.attempt, existing: false};
 }

 // POST /api/sessions/prompt {session, text}: the text of the person to an ACP session.
 async prompt(body) {
  fields(body, ['session', 'text'], 'Send {session, text}.');
  if (typeof body.text !== 'string' || !body.text || Buffer.byteLength(body.text) > TEXT_LIMIT) throw new SessionError(400, 'Send nonempty text of at most 64 KiB.');
  return this.#command(body.session, 'prompt', body.text);
 }
 // POST /api/sessions/permission {session, request, option}: the option that the person selected.
 async permission(body) {
  fields(body, ['session', 'request', 'option'], 'Send {session, request, option}.');
  if (typeof body.request !== 'string' || typeof body.option !== 'string') throw new SessionError(400, 'Send {session, request, option}.');
  return this.#command(body.session, 'answer', body.request, body.option);
 }
 // POST /api/sessions/cancel {session}: stops the current turn of an ACP session.
 async cancel(body) {
  fields(body, ['session'], 'Send {session}.');
  return this.#command(body.session, 'cancel');
 }
 // POST /api/sessions/end {session}: ends the session and its process or pane.
 async end(body) {
  fields(body, ['session'], 'Send {session}.');
  return this.#command(body.session, 'end');
 }
 // POST /api/sessions/resume {session}: reattaches the same harness session with the current
 // settings of the profile ID of the session (Recovery).
 async resume(body) {
  fields(body, ['session'], 'Send {session}.');
  const {record} = this.#record(body.session), stored = record.profile;
  let current;
  try {current = await this.#profile(stored.id);}
  catch (error) {throw error instanceof SessionError && error.status === 409 ? new SessionError(409, `${error.message} Respawn the session with another profile.`) : error;}
  if (current.profile.harness !== stored.harness || current.profile.connection !== stored.connection)
   throw new SessionError(409, `The profile ${stored.id} now names another harness tool or connection. Respawn the session with another profile.`);
  return this.#command(body.session, 'resume', {profile: current.profile, programs: current.programs});
 }
 // POST /api/sessions/open-terminal {session}: shows the pane of a terminal session in a
 // terminal app with `terminal.open` of the settings.
 async openTerminal(body) {
  fields(body, ['session'], 'Send {session}.');
  this.#record(body.session);
  const file = readSettings({path: this.settingsFile(), roots: this.roots});
  await this.#call('openTerminal', body.session, file.refused ? undefined : file.settings?.terminal?.open);
  return {ok: true};
 }
 async #command(id, method, ...args) {
  const {store} = this.#record(id);
  const {session} = await this.#call(method, id, ...args);
  return {session: this.#present(store, session)};
 }

 // POST /api/sessions/output {session}: base revision, commits, changed files and the DoD
 // progress of the task of an implementer, read from Git in the session worktree.
 async output(body) {
  fields(body, ['session'], 'Send {session}.');
  const {record} = this.#record(body.session);
  const task = record.role === 'implementer' && record.task ? taskFile(record.artifact, record.change, record.task) : undefined;
  try {return {session: record.id, ...(await readOutput(record.worktree, record.baseRevision, task))};}
  catch (error) {throw this.#outputFailure(error);}
 }
 // POST /api/sessions/diff {session, path}: the diff of one path of the current changed-file list.
 async diff(body) {
  fields(body, ['session', 'path'], 'Send {session, path}.');
  if (typeof body.path !== 'string') throw new SessionError(400, 'Send {session, path}.');
  const {record} = this.#record(body.session);
  try {return {session: record.id, ...(await readDiff(record.worktree, record.baseRevision, body.path))};}
  catch (error) {throw this.#outputFailure(error);}
 }
 #outputFailure(error) {
  return error instanceof OutputError ? failure(error) : new SessionError(409, 'Plane cannot read the session worktree.');
 }

 // GET /api/sessions/stream?session=: server-sent events of one session. The first event is
 // `snapshot` {session, live}; then `state` {session}, `live` {live}, `output` {} (an ACP edit,
 // delete or move, or a finished tool use that a hook reports for a terminal session) and
 // `runner-lost` {}, after which the stream ends and the browser connects again. The stream
 // follows the lifecycle of /api/repository/events: `retry: 1500`, a heartbeat comment, a
 // client limit, and no resource after the connection closes.
 async subscribe(req, res, headers, id) {
  if (this.#closed) throw new SessionError(503, 'Session streams are unavailable.');
  const {store, record} = this.#record(id);
  if (this.#streams.size >= this.maxStreams) throw new SessionError(429, 'Too many session streams.');
  const stream = {res, ready: false, closed: false, pending: [], seq: null, state: null, harness: record.harnessSession, toolSeq: store.sequence(), timers: [], unsubscribe: null};
  this.#streams.add(stream);
  const cleanup = () => {
   if (stream.closed) return;
   stream.closed = true;this.#streams.delete(stream);
   for (const timer of stream.timers) clearInterval(timer);
   stream.unsubscribe?.().catch(() => {});
  };
  req.on('close', cleanup);res.on('close', cleanup);
  let snapshot = null;
  try {
   const runner = this.runner();
   await runner.check().catch(() => null);
   // A session that has not ended needs the runner, which follows its terminal pane again.
   if (!runner.connected && record.state !== 'ended') await runner.ensure();
   if (runner.connected) {
    stream.unsubscribe = await runner.subscribe(id, message => this.#pushed(stream, message));
    if (stream.closed) {cleanup();stream.unsubscribe().catch(() => {});return;}
    snapshot = await runner.snapshot(id);
   }
  } catch (error) {cleanup();throw failure(error);}
  if (stream.closed || res.destroyed) return cleanup();
  res.writeHead(200, {...headers, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Accel-Buffering': 'no'});
  res.write('retry: 1500\n\n');
  const session = this.#present(store, snapshot?.session ?? store.session(id) ?? record);
  stream.seq = snapshot?.seq ?? null;stream.state = JSON.stringify(session);stream.harness = session.harnessSession;
  this.#send(stream, 'snapshot', {session, live: snapshot?.live ?? null});
  stream.ready = true;
  for (const message of stream.pending.splice(0)) this.#pushed(stream, message);
  const heartbeat = setInterval(() => {if (!stream.closed) res.write(': heartbeat\n\n');}, this.heartbeatMs);
  heartbeat.unref();stream.timers.push(heartbeat);
  if (record.profile?.connection === 'terminal') {
   const poll = setInterval(() => this.#toolUse(stream), this.outputPollMs);
   poll.unref();stream.timers.push(poll);
  }
 }
 #send(stream, event, data) {
  if (!stream.closed) stream.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
 }
 // One pushed runner message: {event, session, seq, update}. Pushes up to the snapshot sequence
 // number belong to the snapshot.
 #pushed(stream, message) {
  if (stream.closed) return;
  if (!stream.ready) return void stream.pending.push(message);
  if (message.event === 'runner-lost') {this.#send(stream, 'runner-lost', {});return void stream.res.end();}
  if (stream.seq !== null && Number.isInteger(message.seq) && message.seq <= stream.seq) return;
  if (message.event === 'state' && plain(message.update)) {
   let session;
   try {session = this.#present(this.#open(), message.update);} catch {return;}
   const json = JSON.stringify(session);
   if (json === stream.state) return;
   stream.state = json;stream.harness = session.harnessSession;
   this.#send(stream, 'state', {session});
  } else if (message.event === 'live') this.#send(stream, 'live', {live: message.update ?? null});
  else if (message.event === 'lifecycle' && message.update?.kind === 'session:output-changed') this.#send(stream, 'output', {});
 }
 // A finished tool use of the harness session of a terminal session, that a hook reports.
 #toolUse(stream) {
  if (stream.closed || !stream.harness) return;
  try {
   const seq = this.#open()?.toolUseAfter(stream.harness, stream.toolSeq);
   if (seq) {stream.toolSeq = seq;this.#send(stream, 'output', {});}
  } catch {/* the next poll reads again */}
 }
 get streamCount() {return this.#streams.size;}

 close() {
  this.#closed = true;
  for (const stream of [...this.#streams]) {stream.res.end();for (const timer of stream.timers) clearInterval(timer);stream.unsubscribe?.().catch(() => {});stream.closed = true;}
  this.#streams.clear();
  this.#store?.close();this.#store = null;
 }
}

export const createSessionService = options => new SessionService(options);
