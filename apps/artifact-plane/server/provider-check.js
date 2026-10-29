// The provider check of artifact-plane specifications/agent-orchestration.md (Provider
// check, Model and effort lists). It starts the ACP program of a provider in a new
// private directory under the runtime state directory, reads the sign-in state, the
// models and the effort levels of each model, sends no prompt, and removes the directory.
// The settings service writes the result to providers.json.
import {EventEmitter} from 'node:events';
import {mkdirSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {API_KEY_SIGN_IN, SIGN_IN_REQUIRED} from '../src/launch-catalog.js';
import {AUTH_REQUIRED, AcpConnection, END_GRACE_MS, METHOD_NOT_FOUND, RpcError, findOption, initializeParams, negotiate, optionValues, setOptionParams} from './acp-client.js';

// The check reads the levels of at most CHECK_MODELS models within CHECK_LIMIT_MS.
export const CHECK_LIMIT_MS = 120000, CHECK_MODELS = 200;
// After a reply that names another model, the check waits this long for a config_option_update.
export const STALE_WAIT_MS = 2000;
const CLOSE_WAIT_MS = 5000;
export {API_KEY_SIGN_IN, SIGN_IN_REQUIRED};
const REFUSED = Symbol('refused');
const text = v => typeof v === 'string' && v.length > 0;

// A check that did not complete. The settings service writes no result for it.
export class ProviderCheckError extends Error {}

class Timeout extends Error {}
// The promise, or a Timeout rejection at the time `until`.
function within(promise, until) {
 let timer;
 return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Timeout()), Math.max(0, until - Date.now()));})]).finally(() => clearTimeout(timer));
}
const modelValue = configOptions => findOption(configOptions, 'model')?.currentValue;
// The effort levels of the current model: the values of the `thought_level` option, or none.
const levelsOf = configOptions => optionValues(findOption(configOptions, 'thought_level')).map(v => v.value);
// The Claude ACP agent refuses a Claude plan sign-in (claim claude-acp-plan-sign-in).
const planRefusal = (harness, error) => harness === 'claude-code' && (error.data?.reason === 'claude_subscription_not_supported' || /claude\.ai subscriptions/i.test(error.message));

// Checks one ACP program. `command` is its argument list. Resolves with {protocolVersion,
// signInMethods, models: [{id, name, levels}], state?, message?}: `levels: []` is a model
// without effort levels, `levels: null` is not checked, and a refused model is left out.
// Rejects with a ProviderCheckError when the agent fails, exits early or sends malformed JSON.
export async function checkProvider({harness, command, stateDir, env = process.env, limitMs = CHECK_LIMIT_MS, maxModels = CHECK_MODELS, staleWaitMs = STALE_WAIT_MS, endGraceMs = END_GRACE_MS}) {
 mkdirSync(stateDir, {recursive: true, mode: 0o700});
 const dir = mkdtempSync(join(stateDir, 'provider-check-')), deadline = Date.now() + limitMs, updates = new EventEmitter();
 let conn, malformed = false;
 try {
  conn = new AcpConnection(command, {cwd: dir, env});
  conn.on('request', msg => conn.fail(msg.id, METHOD_NOT_FOUND, 'Method not found'));
  conn.on('malformed', () => {malformed = true;conn.stop(0);});
  conn.on('notification', (method, params) => {
   const update = params?.update;
   if (method === 'session/update' && update?.sessionUpdate === 'config_option_update' && Array.isArray(update.configOptions)) updates.emit('options', update.configOptions);
  });
  const agent = negotiate(await within(conn.request('initialize', initializeParams()), deadline));
  const result = {protocolVersion: agent.protocolVersion, signInMethods: agent.signInMethods, models: []};
  let session;
  try {session = await within(conn.request('session/new', {cwd: dir, mcpServers: []}), deadline);}
  catch (error) {
   if (!(error instanceof RpcError && error.code === AUTH_REQUIRED)) throw error;
   return {...result, state: planRefusal(harness, error) ? API_KEY_SIGN_IN : SIGN_IN_REQUIRED, message: error.message};
  }
  if (!text(session?.sessionId)) throw new ProviderCheckError('The agent returned no session ID.');
  const model = findOption(session.configOptions, 'model');
  if (!model) {
   // A version 1 agent without config options lists its models in the older `models` field.
   const legacy = session.models?.availableModels;
   result.models = (Array.isArray(legacy) ? legacy : []).filter(m => text(m?.modelId)).map(m => ({id: m.modelId, name: text(m.name) ? m.name : m.modelId, levels: []}));
  } else {
   const readLevels = async value => {
    let update = null;
    const seen = options => {if (modelValue(options) === value) update = options;};
    updates.on('options', seen);
    try {
     const reply = await within(conn.request('session/set_config_option', setOptionParams(agent.protocolVersion, session.sessionId, model, value)), deadline);
     if (modelValue(reply?.configOptions) === value) return levelsOf(reply.configOptions);
     // A reply can still name the previous model; a later config_option_update names the requested one.
     if (!update) await new Promise(resolve => {
      const timer = setTimeout(resolve, Math.max(0, Math.min(staleWaitMs, deadline - Date.now())));
      updates.on('options', function wake(options) {if (modelValue(options) === value) {clearTimeout(timer);updates.off('options', wake);resolve();}});
     });
     return update ? levelsOf(update) : null;
    } catch (error) {
     return error instanceof RpcError ? REFUSED : null;
    } finally {updates.removeAllListeners('options');}
   };
   for (const [index, {value, name}] of optionValues(model).entries()) {
    const levels = index < maxModels && Date.now() < deadline && !conn.closed ? await readLevels(value) : null;
    if (levels !== REFUSED) result.models.push({id: value, name, levels});
   }
  }
  if (malformed) throw new ProviderCheckError('The agent sent malformed JSON.');
  if (agent.close && !conn.closed) await within(conn.request('session/close', {sessionId: session.sessionId}), Date.now() + CLOSE_WAIT_MS).catch(() => {});
  return result;
 } catch (error) {
  if (error instanceof ProviderCheckError) throw error;
  throw new ProviderCheckError(malformed ? 'The agent sent malformed JSON.'
   : error instanceof RpcError ? `The agent refused the check: ${error.message.slice(0, 500)}`
   : error instanceof Timeout ? 'The agent did not answer within the check limit.'
   : error?.info?.error?.code === 'ENOENT' ? `${command[0]} is not on PATH.`
   : error?.info ? 'The agent exited during the check.' : error.message);
 } finally {
  if (conn) await conn.stop(endGraceMs);
  rmSync(dir, {recursive: true, force: true});
 }
}
