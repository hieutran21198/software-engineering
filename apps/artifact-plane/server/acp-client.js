// The ACP adapter of artifact-plane specifications/agent-orchestration.md (ACP adapter,
// Lifecycle events, States, Failures; ADR 018). An AcpConnection talks JSON-RPC 2.0, one
// object for each line, with one ACP agent child process that runs without a shell. An
// AcpSession drives one agent session over it for the runner and keeps the live state
// (the last agent message and the pending permission requests) in memory only.
// Message shapes: agentclientprotocol.com, protocol versions 1 and 2.
import {spawn} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {isSea} from 'node:sea';
import {fileURLToPath} from 'node:url';
import pkg from '../package.json' with {type: 'json'};

export const PROTOCOL_VERSION = 2;
export const LAST_MESSAGE_LIMIT = 64 * 1024;
// End closes standard input, then stops the process after this time.
export const END_GRACE_MS = 5000;
const KILL_GRACE_MS = 2000;
// A line longer than this without a line end is malformed.
const LINE_LIMIT = 16 * 1024 * 1024;
// ACP error code of an authentication error.
export const AUTH_REQUIRED = -32000;
export const METHOD_NOT_FOUND = -32601;
export const SIGN_IN_MESSAGE = 'Sign in with the harness tool in a terminal, then start again.';
const STOP_REASONS = new Set(['end_turn', 'max_tokens', 'max_turn_requests', 'refusal', 'cancelled', 'error']);
// A completed tool call of these kinds changes the output of the session.
const OUTPUT_KINDS = new Set(['edit', 'delete', 'move']);
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' && v.length > 0;

// A JSON-RPC error response of the agent.
export class RpcError extends Error {
 constructor(error) {super(text(error?.message) ? error.message : 'The agent returned an error.');this.code = error?.code;this.data = error?.data;}
}
// A request that cannot complete because the agent process ended. `info` holds the
// spawn error, or the exit code and signal.
export class AcpClosedError extends Error {
 constructor(info) {super(info?.error?.code === 'ENOENT' ? 'The agent program is missing.' : 'The agent process ended.');this.info = info;}
}
// A refused session command or a failed start or resume. `code` is one of `state`,
// `busy`, `invalid`, `unknown-request`, `unknown-option`, `version`, `sign-in`,
// `program-missing`, `start`, `resume`, `resume-unavailable` or `ended`.
export class AcpSessionError extends Error {
 constructor(code, message) {super(message);this.code = code;}
}

// The Plane executable with the argument `mcp`: the single executable application,
// or Node with server/app.js of a source checkout, as the hook and workbench starts do.
export function planeMcpServer() {
 return {name: 'artifact-plane', command: process.execPath, args: [...(isSea() ? [] : [fileURLToPath(new URL('./app.js', import.meta.url))]), 'mcp']};
}
// The stdio MCP server entry of session/new: version 2 adds the `type` discriminator.
export function mcpServerConfig(protocolVersion, server) {
 const entry = {name: server.name, command: server.command, args: [...(server.args || [])], env: [...(server.env || [])]};
 return protocolVersion >= 2 ? {type: 'stdio', ...entry} : entry;
}
// The initialize parameters: version 2 names `info` and `capabilities`, version 1
// `clientInfo` and `clientCapabilities`. Both declare no file system and no terminal.
export function initializeParams() {
 const info = {name: 'artifact-plane', title: 'Artifact Plane', version: pkg.version};
 return {protocolVersion: PROTOCOL_VERSION, info, capabilities: {}, clientInfo: info, clientCapabilities: {}};
}
// The negotiated version and the offered methods. Version 2 offers session/resume and
// session/close always; version 1 offers session/load with `loadSession` and
// session/close with `sessionCapabilities.close`.
export function negotiate(result) {
 const version = result?.protocolVersion;
 if (version !== 1 && version !== 2) throw new AcpSessionError('version', `The agent speaks ACP version ${JSON.stringify(version ?? null)}. Plane supports versions 1 and 2.`);
 const signInMethods = (Array.isArray(result.authMethods) ? result.authMethods : []).map(m => m?.methodId ?? m?.id).filter(text);
 if (version === 2) return {protocolVersion: 2, resume: 'resume', close: true, signInMethods};
 const caps = plain(result.agentCapabilities) ? result.agentCapabilities : {};
 return {protocolVersion: 1, resume: caps.loadSession === true ? 'load' : null, close: plain(caps.sessionCapabilities) && Boolean(caps.sessionCapabilities.close), signInMethods};
}
const optionId = option => option.configId ?? option.id;
// The config option of a category (`model`, `thought_level`), or null.
export const findOption = (configOptions, category) => (Array.isArray(configOptions) && configOptions.find(o => plain(o) && o.category === category && text(optionId(o)))) || null;
// The values of a select option as {value, name}; grouped values are flattened.
export function optionValues(option) {
 return (Array.isArray(option?.options) ? option.options : []).flatMap(o => Array.isArray(o?.options) ? o.options : [o])
  .filter(o => plain(o) && text(o.value)).map(o => ({value: o.value, name: text(o.name) ? o.name : o.value}));
}
// session/set_config_option parameters; version 2 adds `type: "id"`.
export const setOptionParams = (protocolVersion, sessionId, option, value) =>
 protocolVersion >= 2 ? {sessionId, configId: optionId(option), type: 'id', value} : {sessionId, configId: optionId(option), value};
// The last `limit` bytes of the UTF-8 text, cut at a character boundary.
export function lastBytes(value, limit = LAST_MESSAGE_LIMIT) {
 const bytes = Buffer.from(value, 'utf8');
 if (bytes.length <= limit) return value;
 let start = bytes.length - limit;
 while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) start++;
 return bytes.subarray(start).toString('utf8');
}
const blockText = block => block?.type === 'text' && typeof block.text === 'string' ? block.text : '';

// The JSON-RPC connection with one agent process. Events: `request` (a call of the
// agent), `notification` (method, params), `malformed` and `close` ({error} or {code, signal}).
export class AcpConnection extends EventEmitter {
 #pending = new Map();#next = 1;#buffer = '';#timers = [];#resolveDone;
 constructor(command, {cwd, env}) {
  super();
  this.closed = false;this.exited = false;this.broken = false;
  this.done = new Promise(resolve => {this.#resolveDone = resolve;});
  const child = this.child = spawn(command[0], command.slice(1), {cwd, env, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true});
  child.stdin.on('error', () => {});
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => this.#read(chunk));
  child.on('exit', () => {this.exited = true;});
  child.on('error', error => {if (child.pid === undefined) this.exited = true;this.#finish({error});});
  child.on('close', (code, signal) => this.#finish({code, signal}));
 }
 #read(chunk) {
  if (this.broken) return;
  this.#buffer += chunk;
  for (let end; (end = this.#buffer.indexOf('\n')) >= 0;) {
   const line = this.#buffer.slice(0, end).trim();
   this.#buffer = this.#buffer.slice(end + 1);
   if (line && !this.#handle(line)) return;
  }
  if (this.#buffer.length > LINE_LIMIT) this.#malformed();
 }
 #handle(line) {
  let msg;
  try {msg = JSON.parse(line);} catch {return this.#malformed();}
  if (!plain(msg)) return this.#malformed();
  if (typeof msg.method === 'string') {
   if (Object.hasOwn(msg, 'id')) this.emit('request', msg);
   else this.emit('notification', msg.method, msg.params);
  } else if (Object.hasOwn(msg, 'id') && (Object.hasOwn(msg, 'result') || Object.hasOwn(msg, 'error'))) {
   const pending = this.#pending.get(msg.id);
   if (pending) {this.#pending.delete(msg.id);if (Object.hasOwn(msg, 'error')) pending.reject(new RpcError(msg.error));else pending.resolve(msg.result);}
  } else return this.#malformed();
  return true;
 }
 #malformed() {this.broken = true;this.emit('malformed');return false;}
 #write(msg) {if (!this.closed && this.child.stdin.writable) this.child.stdin.write(JSON.stringify({jsonrpc: '2.0', ...msg}) + '\n');}
 request(method, params) {
  if (this.closed || this.broken) return Promise.reject(new AcpClosedError(this.closeInfo));
  const id = this.#next++;
  return new Promise((resolve, reject) => {this.#pending.set(id, {resolve, reject});this.#write({id, method, params});});
 }
 notify(method, params) {this.#write({method, params});}
 respond(id, result) {this.#write({id, result});}
 fail(id, code, message) {this.#write({id, error: {code, message}});}
 // Closes standard input, then sends SIGTERM after graceMs and SIGKILL 2 seconds later.
 stop(graceMs) {
  this.child.stdin.end();
  if (!this.exited && !this.#timers.length) {
   const kill = signal => () => {if (!this.exited) this.child.kill(signal);};
   this.#timers.push(setTimeout(kill('SIGTERM'), graceMs), setTimeout(kill('SIGKILL'), graceMs + KILL_GRACE_MS));
  }
  return this.done;
 }
 #finish(info) {
  if (this.closed) return;
  this.closed = true;this.closeInfo = info;
  for (const timer of this.#timers) clearTimeout(timer);
  for (const {reject} of this.#pending.values()) reject(new AcpClosedError(info));
  this.#pending.clear();
  this.emit('close', info);
  this.#resolveDone(info);
 }
}

// The joined agent messages of one turn. Chunks append to their message, an
// `agent_message` replaces its content; messages are kept in order of first report.
// Only the newest text that can reach the 64 KiB limit stays in memory.
class MessageText {
 #parts = new Map();#size = 0;
 append(id, value) {if (value) this.#set(id, (this.#parts.get(id) ?? '') + value);}
 replace(id, value) {this.#set(id, value);}
 clear() {this.#parts.clear();this.#size = 0;}
 #set(id, value) {
  this.#size += value.length - (this.#parts.get(id)?.length ?? 0);
  this.#parts.set(id, value);
  if (this.#size <= 2 * LAST_MESSAGE_LIMIT) return;
  // A character has at least one byte, so LAST_MESSAGE_LIMIT characters hold the byte tail.
  for (const [key, part] of this.#parts) if (part.length > LAST_MESSAGE_LIMIT) this.#parts.set(key, part.slice(-LAST_MESSAGE_LIMIT));
  this.#size = [...this.#parts.values()].reduce((sum, part) => sum + part.length, 0);
  for (const [key, part] of this.#parts) {
   if (this.#parts.size === 1 || this.#size - part.length < LAST_MESSAGE_LIMIT) break;
   this.#parts.delete(key);this.#size -= part.length;
  }
 }
 text() {return lastBytes([...this.#parts.values()].filter(Boolean).join('\n\n'));}
}

// One ACP agent session. Options: `id` (the Plane session ID), `command` (the profile
// command as an argument list), `cwd` (the worktree), `env` (the base environment),
// `profile` ({model, reasoning, env}), `mcpServer` and `endGraceMs`.
// Events: `event` with a lifecycle event {kind, ...fields} that holds no message text;
// `state` with {state}; `live` with the snapshot after a change of the live state.
export class AcpSession extends EventEmitter {
 #conn = null;#pending = new Map();#permissions = 0;#turn = null;#tools = new Map();#replay = null;#options = null;#modelReported = false;#opening = false;
 constructor({id, command, cwd, env = process.env, profile = {}, mcpServer = planeMcpServer(), endGraceMs = END_GRACE_MS}) {
  super();
  Object.assign(this, {id, command, cwd, env, profile, mcpServer, endGraceMs});
  this.state = 'new';this.protocolVersion = null;this.harnessSession = null;this.reportedModel = null;this.resumable = null;this.lastMessage = null;this.error = null;
 }
 // The live state: memory only. A pending request shows {request, title, description,
 // toolKind, command, options: [{optionId, name, kind}]}.
 snapshot() {
  return {state: this.state, protocolVersion: this.protocolVersion, harnessSession: this.harnessSession, model: this.profile.model ?? null, reportedModel: this.reportedModel,
   resumable: this.resumable, lastMessage: this.lastMessage, error: this.error, pending: [...this.#pending.values()].map(p => p.view)};
 }
 #event(kind, fields = {}) {this.emit('event', {kind, ...fields});}
 #live() {this.emit('live', this.snapshot());}
 #setState(state) {if (this.state !== state) {this.state = state;this.emit('state', {state});}}
 #settle() {if (['idle', 'working', 'waiting'].includes(this.state)) this.#setState(this.#pending.size ? 'waiting' : this.#turn ? 'working' : 'idle');}

 // Starts the agent, initializes it, opens the session in the worktree with the Plane
 // MCP server and selects the profile model and level. Resolves with
 // {harnessSession, protocolVersion, reportedModel, resumable}; rejects with an AcpSessionError
 // after the session ended with reason `error`.
 async start() {
  if (this.state !== 'new') throw new AcpSessionError('state', 'The session has already started.');
  this.#setState('starting');
  try {
   await this.#open();
   let result;
   try {result = await this.#conn.request('session/new', {cwd: this.cwd, mcpServers: [mcpServerConfig(this.protocolVersion, this.mcpServer)]});}
   catch (error) {throw error instanceof RpcError && error.code === AUTH_REQUIRED ? new AcpSessionError('sign-in', SIGN_IN_MESSAGE) : error;}
   if (!text(result?.sessionId)) throw new AcpSessionError('start', 'The agent returned no session ID.');
   this.harnessSession = result.sessionId;
   this.#event('session:harness-id', {harnessSession: this.harnessSession});
   this.#options = Array.isArray(result.configOptions) ? result.configOptions : null;
   await this.#selectOptions();
   this.#setState('idle');this.#live();
   return {harnessSession: this.harnessSession, protocolVersion: this.protocolVersion, reportedModel: this.reportedModel, resumable: this.resumable};
  } catch (error) {
   throw this.#failure(error, 'start', 'The agent exited during start.', message => {this.#end('error', message);this.#conn?.stop(0);});
  } finally {this.#opening = false;}
 }
 async #open() {
  // The config options belong to the agent process.
  this.#opening = true;this.#options = null;
  const conn = this.#conn = new AcpConnection(this.command, {cwd: this.cwd, env: {...this.env, ...this.profile.env, ARTIFACT_PLANE_LAUNCH: this.id}});
  conn.on('request', msg => this.#onRequest(conn, msg));
  conn.on('notification', (method, params) => {if (conn === this.#conn) this.#onUpdate(method, params);});
  conn.on('malformed', () => {if (conn === this.#conn) {this.#end('error', 'The agent sent malformed JSON.');conn.stop(0);}});
  conn.on('close', () => {if (conn === this.#conn) this.#onClose();});
  const agent = negotiate(await conn.request('initialize', initializeParams()));
  this.protocolVersion = agent.protocolVersion;this.resumable = Boolean(agent.resume);
  return agent;
 }
 // An AcpSessionError for a failed start or resume; `settle` receives the message unless
 // the session already ended.
 #failure(error, code, exitMessage, settle) {
  let failure = error instanceof AcpSessionError ? error
   : error instanceof RpcError ? new AcpSessionError(code, `The agent refused the session: ${error.message.slice(0, 500)}`)
   : error?.info?.error?.code === 'ENOENT' ? new AcpSessionError('program-missing', `${this.command[0]} is not on PATH.`)
   : new AcpSessionError(code, exitMessage);
  if (this.state === 'ended') failure = new AcpSessionError(this.error ? failure.code : 'ended', this.error ?? 'The session ended.');
  else settle(failure.message);
  return failure;
 }
 // Sets the profile model, then the level, through their options, at start and after a
 // resume. A missing option or a refused value keeps the session; the model then stays
 // declared, not reported.
 async #selectOptions() {
  this.#modelReported = false;
  const model = findOption(this.#options, 'model');
  if (model && text(this.profile.model)) this.#modelReported = await this.#setOption(model, this.profile.model);
  const level = findOption(this.#options, 'thought_level');
  if (level && text(this.profile.reasoning)) await this.#setOption(level, this.profile.reasoning);
  this.#reportModel();
 }
 async #setOption(option, value) {
  try {
   const result = await this.#conn.request('session/set_config_option', setOptionParams(this.protocolVersion, this.harnessSession, option, value));
   if (Array.isArray(result?.configOptions)) this.#options = result.configOptions;
   return true;
  } catch (error) {if (error instanceof RpcError) return false;throw error;}
 }
 #reportModel() {
  const model = this.#modelReported ? findOption(this.#options, 'model')?.currentValue : null, reported = text(model) ? model : null;
  if (reported === this.reportedModel) return false;
  this.reportedModel = reported;return true;
 }

 // Sends the text of the person, or the initial prompt with source `initial`. The turn
 // ends with the prompt response in version 1 and with an idle state_update in version 2.
 prompt(value, {source = 'person'} = {}) {
  if (this.#turn) throw new AcpSessionError('busy', 'A turn runs. Wait for it to end, or stop it.');
  if (this.state !== 'idle') throw new AcpSessionError('state', 'The session does not take a prompt now.');
  if (!text(value)) throw new AcpSessionError('invalid', 'Send a prompt with text.');
  const turn = this.#turn = {messages: new MessageText()};
  this.#tools.clear();
  this.#setState('working');
  this.#event('session:prompted', {source});
  this.#conn.request('session/prompt', {sessionId: this.harnessSession, prompt: [{type: 'text', text: value}]}).then(
   result => {if (this.protocolVersion === 1) this.#endTurn(turn, result?.stopReason);},
   // Version 1 reports a failed turn, version 2 a prompt that was not inserted. An ended process interrupts the session instead.
   error => {if (error instanceof RpcError) this.#endTurn(turn, 'error');});
 }
 #endTurn(turn, reason) {
  if (this.#turn !== turn) return;
  this.#turn = null;this.#tools.clear();
  this.lastMessage = turn.messages.text();
  this.#event('session:turn-ended', {stopReason: STOP_REASONS.has(reason) ? reason : 'end_turn'});
  this.#settle();this.#live();
 }
 #onUpdate(method, params) {
  const update = params?.update;
  if (method !== 'session/update' || !plain(update)) return;
  const messages = this.#replay?.messages ?? this.#turn?.messages, id = update.messageId ?? null;
  switch (update.sessionUpdate) {
   case 'agent_message_chunk': messages?.append(id, blockText(update.content));break;
   case 'agent_message': if (Object.hasOwn(update, 'content')) messages?.replace(id, Array.isArray(update.content) ? update.content.map(blockText).join('') : '');break;
   // The last message of a replay is the agent text after the last user message.
   case 'user_message_chunk': case 'user_message': this.#replay?.messages.clear();break;
   case 'tool_call': case 'tool_call_update': this.#onTool(update);break;
   case 'config_option_update':
    if (Array.isArray(update.configOptions)) {this.#options = update.configOptions;if (this.#reportModel() && !this.#opening) this.#live();}
    break;
   case 'state_update': if (update.state === 'idle' && this.protocolVersion >= 2 && this.#turn && !this.#replay) this.#endTurn(this.#turn, update.stopReason);break;
  }
 }
 #onTool(update) {
  if (this.#replay || !text(update.toolCallId)) return;
  if (text(update.kind)) this.#tools.set(update.toolCallId, update.kind);
  if (update.status === 'completed' && OUTPUT_KINDS.has(this.#tools.get(update.toolCallId))) {
   this.#tools.delete(update.toolCallId);
   this.#event('session:output-changed');
  }
 }
 // The client answers every client method with method-not-found, except a permission
 // request, which stays pending until the person selects one of its options.
 #onRequest(conn, msg) {
  if (conn !== this.#conn || msg.method !== 'session/request_permission' || this.state === 'ended') return conn.fail(msg.id, METHOD_NOT_FOUND, 'Method not found');
  const params = plain(msg.params) ? msg.params : {}, tool = params.subject?.toolCall ?? params.toolCall ?? {}, request = `p${++this.#permissions}`;
  const options = (Array.isArray(params.options) ? params.options : []).filter(o => plain(o) && text(o.optionId))
   .map(o => ({optionId: o.optionId, name: text(o.name) ? o.name : o.optionId, kind: text(o.kind) ? o.kind : null}));
  const view = {request, title: [params.title, tool.title].find(text) ?? 'The agent asks for permission.', description: text(params.description) ? params.description : null,
   toolKind: text(tool.kind) ? tool.kind : null, command: params.subject?.type === 'command' && text(params.subject.command) ? params.subject.command : null, options};
  this.#pending.set(request, {id: msg.id, conn, view});
  this.#event('session:permission-requested', {request});
  this.#settle();this.#live();
 }
 // Sends the option that the person selected for a pending permission request.
 answer(request, optionId) {
  const pending = this.#pending.get(request);
  if (!pending) throw new AcpSessionError('unknown-request', 'The permission request is not pending.');
  const option = pending.view.options.find(o => o.optionId === optionId);
  if (!option) throw new AcpSessionError('unknown-option', 'Select one of the options of the request.');
  this.#pending.delete(request);
  pending.conn.respond(pending.id, {outcome: {outcome: 'selected', optionId}});
  this.#event('session:permission-answered', {request, optionKind: option.kind});
  this.#settle();this.#live();
 }
 // Sends session/cancel and answers each pending permission request with `cancelled`.
 // The agent ends the turn with the stop reason `cancelled`.
 cancel() {
  if (!this.#turn && !this.#pending.size) throw new AcpSessionError('state', 'No turn runs.');
  this.#conn.notify('session/cancel', {sessionId: this.harnessSession});
  for (const [request, pending] of this.#pending) {
   pending.conn.respond(pending.id, {outcome: {outcome: 'cancelled'}});
   this.#event('session:permission-answered', {request, optionKind: 'cancelled'});
  }
  this.#pending.clear();
  this.#settle();this.#live();
 }

 // Reattaches the harness session in a new agent process: session/resume with a replay
 // from the start in version 2, session/load in version 1 when the agent offers it. The
 // last message comes from the replay. Then it sets the profile model and level again,
 // because an agent can resume with its own default model. Resolves with {method,
 // protocolVersion, harnessSession, reportedModel}. A failure leaves the session interrupted.
 async resume({harnessSession = this.harnessSession} = {}) {
  if (this.state !== 'new' && this.state !== 'interrupted') throw new AcpSessionError('state', 'Only an interrupted session can resume.');
  if (!text(harnessSession)) throw new AcpSessionError('state', 'The session has no harness session ID.');
  this.harnessSession = harnessSession;this.error = null;
  try {
   const agent = await this.#open();
   if (!agent.resume) throw new AcpSessionError('resume-unavailable', 'This agent cannot resume the session. Respawn the task.');
   this.#replay = {messages: new MessageText()};
   const params = {sessionId: harnessSession, cwd: this.cwd, mcpServers: [mcpServerConfig(agent.protocolVersion, this.mcpServer)]};
   let result;
   try {result = await this.#conn.request(agent.resume === 'resume' ? 'session/resume' : 'session/load', agent.resume === 'resume' ? {...params, replayFrom: {type: 'start'}} : params);}
   catch (error) {throw error instanceof RpcError && error.code === AUTH_REQUIRED ? new AcpSessionError('sign-in', SIGN_IN_MESSAGE) : error;}
   this.lastMessage = this.#replay.messages.text();
   if (Array.isArray(result?.configOptions)) this.#options = result.configOptions;
   await this.#selectOptions();
   this.#setState('idle');
   this.#event('session:resumed', {method: agent.resume});
   this.#live();
   return {method: agent.resume, protocolVersion: this.protocolVersion, harnessSession, reportedModel: this.reportedModel};
  } catch (error) {
   throw this.#failure(error, 'resume', 'The agent exited during resume.', message => {this.error = message;this.#conn?.stop(0);this.#setState('interrupted');this.#live();});
  } finally {this.#replay = null;this.#opening = false;}
 }
 #onClose() {
  if (this.state === 'ended' || this.#opening) return;
  this.#turn = null;this.#pending.clear();
  this.#setState('interrupted');
  this.#event('session:interrupted', {reason: 'process-exit'});
  this.#live();
 }
 #end(reason, message = null) {
  if (this.state === 'ended') return;
  this.#turn = null;this.#pending.clear();this.error = message;
  this.#setState('ended');
  this.#event('session:ended', {reason});
  this.#live();
 }
 // Ends the session: closes standard input, then stops the process after 5 seconds.
 // Resolves when the process has stopped.
 async end() {
  this.#end('person');
  if (this.#conn) await this.#conn.stop(this.endGraceMs);
 }
}

export const createAcpSession = options => new AcpSession(options);
