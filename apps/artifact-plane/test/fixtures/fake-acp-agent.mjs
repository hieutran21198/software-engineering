// A scripted ACP agent for the tests of server/acp-client.js and server/provider-check.js.
// It speaks protocol version 1 or 2 with the message shapes of agentclientprotocol.com
// and runs no model. The script is the JSON in FAKE_ACP_CONFIG, or the file that
// FAKE_ACP_CONFIG_FILE names. The agent appends each received message and each event
// to `log`, one JSON object for each line.
//
// Script fields:
//   version        The protocol version of the initialize response (default 2).
//   loadSession    Version 1: offer session/load (default true).
//   close          Version 1: offer session/close (default true).
//   authMethods    Sign-in method IDs.
//   newError       The error of session/new, for example {code: -32000, message}.
//   resumeError    The error of session/resume and session/load.
//   models         [{id, name?, levels?}]: the `model` option; `levels` adds a `thought_level` option.
//                  The first model is the current model of a new agent process.
//   grouped        Put the model values in one group.
//   mode           Add a `mode` option that offers `bypass`.
//   configOptions  false: no config options.
//   legacyModels   Version 1: add the older `models` field.
//   refuse         Model values that session/set_config_option refuses with -32602.
//   refuseLevel    Refuse every level.
//   stale          {model: delay or null}: the reply names the previous model; a
//                  config_option_update with the requested model follows after the delay,
//                  comes before the reply for a negative delay, or never comes for null.
//   setDelay       Milliseconds before each session/set_config_option reply.
//   clientCalls    Client methods that the agent calls after session/new.
//   exitOn         A method that makes the agent exit with code 3.
//   malformedOn    A method that the agent answers with a line that is not JSON.
//   turns          One step list for each prompt (the last list repeats). Steps:
//                  {chunk, id?}, {message, id}, {thought}, {tool, kind}, {permission: {title}},
//                  {wait}, {malformed: true}, {exit}, {stop: reason or null}.
//   history        Replay entries {user, id?}, {agent, id?} or {tool, kind}.
//   ignoreStdinEnd Keep running after standard input ends.
//   envNames       Variables whose values the start entry logs.
import {appendFileSync, readFileSync, statSync} from 'node:fs';

const config = JSON.parse(process.env.FAKE_ACP_CONFIG_FILE ? readFileSync(process.env.FAKE_ACP_CONFIG_FILE, 'utf8') : process.env.FAKE_ACP_CONFIG || '{}');
const v = config.version ?? 2, key = v >= 2 ? 'configId' : 'id', NO_REPLY = Symbol('no reply');
if (process.argv[2] === '--version') {console.log('fake-acp 1.0.0');process.exit(0);}
const log = entry => {if (config.log) appendFileSync(config.log, JSON.stringify(entry) + '\n');};
log({start: {pid: process.pid, cwd: process.cwd(), cwdMode: statSync('.').mode & 0o777, argv: process.argv.slice(2), launch: process.env.ARTIFACT_PLANE_LAUNCH ?? null,
 env: Object.fromEntries((config.envNames || []).map(name => [name, process.env[name] ?? null]))}});

const write = msg => process.stdout.write(JSON.stringify({jsonrpc: '2.0', ...msg}) + '\n');
const update = (sessionId, value) => write({method: 'session/update', params: {sessionId, update: value}});
let requests = 0;
const waiting = new Map();
const ask = (method, params, id = ++requests) => new Promise(resolve => {waiting.set(id, resolve);write({id, method, params});});

// Config options with the levels of the current model.
const models = config.models;
let current = models?.[0]?.id, level = null;
function configOptions(model = current) {
 if (!models || config.configOptions === false) return undefined;
 const options = [], values = models.map(m => ({value: m.id, name: m.name ?? m.id}));
 if (config.mode) options.push({[key]: 'mode', name: 'Mode', category: 'mode', type: 'select', currentValue: 'ask', options: [{value: 'ask', name: 'Ask'}, {value: 'bypass', name: 'Bypass'}]});
 options.push({[key]: 'model', name: 'Model', category: 'model', type: 'select', currentValue: model, options: config.grouped ? [{group: 'all', name: 'All', options: values}] : values});
 const levels = models.find(m => m.id === model)?.levels;
 if (levels) options.push({[key]: 'effort', name: 'Effort', category: 'thought_level', type: 'select', currentValue: level ?? levels[0], options: levels.map(l => ({value: l, name: l}))});
 return options;
}
const invalid = message => ({code: -32602, message: `Invalid params: ${message}`});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function replay(sessionId) {
 for (const [index, entry] of (config.history || []).entries()) {
  const messageId = v >= 2 || entry.id ? {messageId: entry.id ?? `history-${index}`} : {};
  if (entry.user) update(sessionId, {sessionUpdate: 'user_message_chunk', ...messageId, content: {type: 'text', text: entry.user}});
  if (entry.agent) update(sessionId, {sessionUpdate: 'agent_message_chunk', ...messageId, content: {type: 'text', text: entry.agent}});
  if (entry.tool) update(sessionId, {sessionUpdate: 'tool_call', toolCallId: entry.tool, title: 'Replayed tool', kind: entry.kind ?? 'edit', status: 'completed'});
 }
}

let turns = 0, permissions = 0, cancelled = false, wake = null;
const pause = ms => new Promise(resolve => {const timer = setTimeout(resolve, ms);wake = () => {clearTimeout(timer);resolve();};});
async function runTurn(params, id) {
 const steps = config.turns?.[turns] ?? config.turns?.at(-1) ?? [], n = ++turns, sid = params.sessionId;
 cancelled = false;
 if (v >= 2) {
  write({id, result: {messageId: `user-${n}`}});
  update(sid, {sessionUpdate: 'user_message', messageId: `user-${n}`, content: params.prompt});
  update(sid, {sessionUpdate: 'state_update', state: 'running'});
 }
 let stop = 'end_turn';
 for (const step of steps) {
  if (cancelled) break;
  const messageId = v >= 2 || step.id ? {messageId: step.id ?? `agent-${n}`} : {};
  if (step.chunk !== undefined) update(sid, {sessionUpdate: 'agent_message_chunk', ...messageId, content: {type: 'text', text: step.chunk}});
  else if (step.message !== undefined) update(sid, {sessionUpdate: 'agent_message', ...messageId, content: [{type: 'text', text: step.message}]});
  else if (step.thought !== undefined) update(sid, {sessionUpdate: 'agent_thought_chunk', ...messageId, content: {type: 'text', text: step.thought}});
  else if (step.tool) {
   update(sid, {sessionUpdate: 'tool_call', toolCallId: step.tool, title: 'Tool title', kind: step.kind ?? 'read', status: 'pending', rawInput: {argument: 'tool argument'}});
   update(sid, {sessionUpdate: 'tool_call_update', toolCallId: step.tool, status: 'completed', content: [{type: 'content', content: {type: 'text', text: 'tool output'}}]});
  } else if (step.permission) {
   const options = step.permission.options ?? [{optionId: 'allow', name: 'Allow once', kind: 'allow_once'}, {optionId: 'reject', name: 'Reject', kind: 'reject_once'}];
   const toolCall = {toolCallId: `call-${n}`, title: step.permission.title, kind: 'execute', status: 'pending'};
   if (v >= 2) update(sid, {sessionUpdate: 'state_update', state: 'requires_action'});
   const response = await ask('session/request_permission', v >= 2
    ? {sessionId: sid, title: step.permission.title, description: 'The agent wants to run a command.', subject: {type: 'tool_call', toolCall}, options}
    : {sessionId: sid, toolCall, options}, `perm-${++permissions}`);
   log({permission: response});
   if (response.result?.outcome?.outcome === 'cancelled') cancelled = true;
   else if (v >= 2) update(sid, {sessionUpdate: 'state_update', state: 'running'});
  } else if (step.wait) await pause(step.wait);
  else if (step.malformed) process.stdout.write('{"jsonrpc": "2.0", not json\n');
  else if (step.exit !== undefined) process.exit(step.exit);
  else if (Object.hasOwn(step, 'stop')) {stop = step.stop;break;}
 }
 if (cancelled) stop = 'cancelled';
 if (v >= 2) update(sid, {sessionUpdate: 'state_update', state: 'idle', ...(stop === null ? {} : {stopReason: stop})});
 else write({id, result: stop === null ? {} : {stopReason: stop}});
}

const handlers = {
 initialize() {
  const authMethods = (config.authMethods || []).map(id => ({[v >= 2 ? 'methodId' : 'id']: id, name: id, description: `Run ${id} in a terminal.`}));
  if (v >= 2) return {protocolVersion: v, info: {name: 'fake-acp', version: '1.0.0'}, capabilities: {session: {prompt: {}, mcp: {stdio: {}}}}, authMethods};
  return {protocolVersion: v, agentCapabilities: {loadSession: config.loadSession ?? true, sessionCapabilities: config.close === false ? {} : {close: {}, resume: {}}}, authMethods, agentInfo: {name: 'fake-acp', version: '1.0.0'}};
 },
 'session/new'(params) {
  if (config.newError) throw config.newError;
  const servers = params.mcpServers ?? [];
  if (!servers.every(s => v >= 2 ? s.type === 'stdio' : s.type === undefined && Array.isArray(s.env))) throw invalid('mcpServers');
  const result = {sessionId: 'sess-1'}, options = configOptions();
  if (options) result.configOptions = options;
  if (config.legacyModels) result.models = {currentModelId: current, availableModels: models.map(m => ({modelId: m.id, name: m.name ?? m.id}))};
  setImmediate(async () => {for (const method of config.clientCalls || []) log({clientCall: method, response: await ask(method, {sessionId: 'sess-1'})});});
  return result;
 },
 async 'session/set_config_option'(params) {
  if (v >= 2 ? params.type !== 'id' : Object.hasOwn(params, 'type')) throw invalid('type');
  if (config.setDelay) await sleep(config.setDelay);
  if (params.configId === 'model') {
   if (config.refuse?.includes(params.value) || !models.some(m => m.id === params.value)) throw invalid(`model not found: ${params.value}`);
   const previous = current;
   current = params.value;level = null;
   if (config.stale && Object.hasOwn(config.stale, params.value)) {
    const delay = config.stale[params.value];
    const send = () => update(params.sessionId, {sessionUpdate: 'config_option_update', configOptions: configOptions()});
    if (delay !== null && delay < 0) send();
    else if (delay !== null) setTimeout(send, delay);
    return {configOptions: configOptions(previous)};
   }
   return {configOptions: configOptions()};
  }
  if (params.configId === 'effort') {
   if (config.refuseLevel || !models.find(m => m.id === current)?.levels?.includes(params.value)) throw invalid(`effort ${params.value}`);
   level = params.value;
   return {configOptions: configOptions()};
  }
  throw invalid(`config option ${params.configId}`);
 },
 'session/prompt'(params, id) {runTurn(params, id);return NO_REPLY;},
 'session/load'(params) {
  if (v >= 2) throw {code: -32601, message: 'Method not found'};
  if (config.resumeError) throw config.resumeError;
  replay(params.sessionId);
  return {configOptions: configOptions()};
 },
 'session/resume'(params) {
  if (config.resumeError) throw config.resumeError;
  if (params.replayFrom?.type === 'start') replay(params.sessionId);
  return {configOptions: configOptions()};
 },
 'session/close'() {return {};},
};

async function receive(msg) {
 log({in: msg});
 if (msg.method === undefined) {const resolve = waiting.get(msg.id);waiting.delete(msg.id);resolve?.(msg);return;}
 if (msg.id === undefined) {if (msg.method === 'session/cancel') {cancelled = true;wake?.();}return;}
 if (config.exitOn === msg.method) process.exit(3);
 if (config.malformedOn === msg.method) return void process.stdout.write('this is not json\n');
 const handler = handlers[msg.method];
 if (!handler) return write({id: msg.id, error: {code: -32601, message: 'Method not found'}});
 try {const result = await handler(msg.params ?? {}, msg.id);if (result !== NO_REPLY) write({id: msg.id, result});}
 catch (error) {write({id: msg.id, error});}
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
 buffer += chunk;
 for (let end; (end = buffer.indexOf('\n')) >= 0;) {const line = buffer.slice(0, end);buffer = buffer.slice(end + 1);if (line.trim()) receive(JSON.parse(line));}
});
process.stdin.on('end', () => {log({stdin: 'end'});if (!config.ignoreStdinEnd) process.exit(0);});
process.on('SIGTERM', () => {log({signal: 'SIGTERM'});process.exit(0);});
if (config.ignoreStdinEnd) setInterval(() => {}, 1000);
