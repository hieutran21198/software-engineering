// specifications/agent-orchestration.md: Provider check, Model and effort lists. Every test
// uses temporary state and configuration directories and the scripted fake agent of
// test/fixtures/fake-acp-agent.mjs behind catalog program names on an injected PATH.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {API_KEY_SIGN_IN, CHECK_LIMIT_MS, CHECK_MODELS, ProviderCheckError, SIGN_IN_REQUIRED, STALE_WAIT_MS, checkProvider} from '../server/provider-check.js';
import {SettingsError, createSettingsService, providersPath, readProviders} from '../server/agent-settings.js';

const FAKE = fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url));
const SECRET = 'sk-test-secret-value';
const levelsFor = i => i % 2 ? ['low', 'medium', 'high'] : ['low', 'high', `only-m${i}`];

async function setup(t) {
 const dir = await mkdtemp(join(tmpdir(), 'provider-check-')), bin = join(dir, 'bin'), state = join(dir, 'state');
 t.after(() => rm(dir, {recursive: true, force: true}));
 await mkdir(bin);await mkdir(state, {mode: 0o700});
 const env = {PATH: bin, OPENAI_API_KEY: SECRET};
 // A catalog program name on PATH that prints its version and otherwise runs the fake agent.
 async function program(name, version, script) {
  const config = join(dir, `${name}.json`), log = join(dir, `${name}.log`);
  await writeFile(config, JSON.stringify({log, ...script}));
  await writeFile(join(bin, name), `#!/bin/sh\nif [ "$1" = --version ]; then echo "${name} ${version}"; exit 0; fi\nFAKE_ACP_CONFIG_FILE='${config}' exec '${process.execPath}' '${FAKE}' "$@"\n`);
  await chmod(join(bin, name), 0o755);
  const lines = async () => (await readFile(log, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line));
  return {command: [join(bin, name)], lines, received: async () => (await lines()).filter(e => e.in).map(e => e.in), config};
 }
 const leftovers = async () => (await readdir(state)).filter(name => name.startsWith('provider-check-'));
 return {dir, bin, state, env, program, leftovers};
}
const methods = async agent => (await agent.received()).map(m => m.method).filter(Boolean);

test('the check runs in a new private directory, sends no prompt, reads the levels of up to 200 models and closes the session (version 2)', async t => {
 const f = await setup(t);
 const models = Array.from({length: 205}, (_, i) => ({id: `m${i}`, name: `Model ${i}`, levels: i === 4 ? undefined : levelsFor(i)}));
 const agent = await f.program('codex-acp', '2.3.0', {version: 2, authMethods: ['chat-gpt', 'api-key'], models, mode: true, refuse: ['m3'], stale: {m1: 50, m2: null, m5: -1}});
 const started = Date.now();
 const result = await checkProvider({harness: 'codex', command: agent.command, stateDir: f.state, env: f.env});
 assert.deepEqual([result.protocolVersion, result.signInMethods, result.state, result.message], [2, ['chat-gpt', 'api-key'], undefined, undefined]);
 const by = Object.fromEntries(result.models.map(m => [m.id, m]));
 assert.equal(result.models.length, 204, 'the refused model is left out');assert.equal(by.m3, undefined);
 assert.deepEqual(by.m0, {id: 'm0', name: 'Model 0', levels: levelsFor(0)});
 assert.deepEqual(by.m1.levels, levelsFor(1), 'a stale reply waits for the config_option_update of the requested model');
 assert.equal(by.m2.levels, null, 'without a matching update the levels are not checked');
 assert.deepEqual(by.m4.levels, [], 'a model without a thought_level option has no levels');
 assert.deepEqual(by.m5.levels, levelsFor(5), 'an update before the stale reply counts');
 assert.deepEqual(by.m199.levels, levelsFor(199));
 assert.deepEqual(result.models.slice(-5).map(m => [m.id, m.levels]), [['m200', null], ['m201', null], ['m202', null], ['m203', null], ['m204', null]], 'models past 200 are not checked');
 assert.ok(Date.now() - started >= STALE_WAIT_MS, 'the check waited 2 seconds for the stale model');
 const [{start}] = await agent.lines(), calls = await agent.received(), names = await methods(agent);
 assert.ok(start.cwd.startsWith(join(f.state, 'provider-check-')), start.cwd);
 assert.equal(start.cwdMode, 0o700);
 assert.deepEqual(calls.find(m => m.method === 'session/new').params, {cwd: start.cwd, mcpServers: []});
 assert.deepEqual([names[0], names[1], names.at(-1)], ['initialize', 'session/new', 'session/close']);
 assert.equal(names.filter(n => n === 'session/set_config_option').length, CHECK_MODELS);
 assert.ok(calls.filter(m => m.method === 'session/set_config_option').every(m => m.params.configId === 'model' && m.params.type === 'id'), 'only the model option, with type id');
 for (const forbidden of ['session/prompt', 'authenticate', 'auth/login']) assert.ok(!names.includes(forbidden), forbidden);
 assert.deepEqual(await f.leftovers(), [], 'the check removes its directory');
 assert.deepEqual([CHECK_MODELS, CHECK_LIMIT_MS, STALE_WAIT_MS], [200, 120000, 2000]);
});

test('a version 1 agent with config options gets the version 1 call shape, grouped values and session/close when it offers close', async t => {
 const f = await setup(t);
 const agent = await f.program('opencode2', '2.2.0', {version: 1, authMethods: ['opencode-login'], grouped: true, models: [{id: 'openai/gpt-6', name: 'GPT-6', levels: ['none', 'high', 'default']}, {id: 'opencode/free'}]});
 const result = await checkProvider({harness: 'opencode', command: [...agent.command, 'acp'], stateDir: f.state, env: f.env});
 assert.deepEqual(result, {protocolVersion: 1, signInMethods: ['opencode-login'], models: [{id: 'openai/gpt-6', name: 'GPT-6', levels: ['none', 'high', 'default']}, {id: 'opencode/free', name: 'opencode/free', levels: []}]});
 const calls = await agent.received();
 assert.deepEqual(calls.filter(m => m.method === 'session/set_config_option').map(m => m.params), [{sessionId: 'sess-1', configId: 'model', value: 'openai/gpt-6'}, {sessionId: 'sess-1', configId: 'model', value: 'opencode/free'}]);
 assert.equal((await methods(agent)).at(-1), 'session/close');
 assert.deepEqual((await agent.lines())[0].start.argv, ['acp']);
});

test('a version 1 agent without config options gives its legacy model list and no effort levels; no close without the offer', async t => {
 const f = await setup(t);
 const agent = await f.program('gemini', '0.66.0', {version: 1, close: false, configOptions: false, legacyModels: true, models: [{id: 'gemini-3.8-flash', name: 'Flash'}, {id: 'gemini-3.8-pro'}]});
 const result = await checkProvider({harness: 'gemini-cli', command: agent.command, stateDir: f.state, env: f.env});
 assert.deepEqual(result.models, [{id: 'gemini-3.8-flash', name: 'Flash', levels: []}, {id: 'gemini-3.8-pro', name: 'gemini-3.8-pro', levels: []}]);
 assert.deepEqual(await methods(agent), ['initialize', 'session/new'], 'no set_config_option and no session/close');
 assert.deepEqual(await f.leftovers(), []);
});

test('the time limit leaves the remaining models not checked', async t => {
 const f = await setup(t);
 const agent = await f.program('cmd', '1.88.0', {version: 1, setDelay: 100, models: Array.from({length: 10}, (_, i) => ({id: `m${i}`, levels: ['low']}))});
 const result = await checkProvider({harness: 'command-code', command: agent.command, stateDir: f.state, env: f.env, limitMs: 450});
 const checked = result.models.filter(m => m.levels !== null).length;
 assert.equal(result.models.length, 10);
 assert.ok(checked >= 1 && checked <= 5, `${checked} models checked`);
 assert.ok(result.models.slice(checked).every(m => m.levels === null), 'the models after the limit have levels null');
 assert.deepEqual(await f.leftovers(), []);
});

test('an authentication error gives the state Sign-in required, and the Claude plan refusal gives Needs an API key sign-in', async t => {
 const f = await setup(t);
 const gemini = await f.program('gemini', '0.66.0', {version: 1, authMethods: ['oauth-personal', 'gemini-api-key'], newError: {code: -32000, message: 'Gemini API key is missing or not configured.'}});
 assert.deepEqual(await checkProvider({harness: 'gemini-cli', command: gemini.command, stateDir: f.state, env: f.env}),
  {protocolVersion: 1, signInMethods: ['oauth-personal', 'gemini-api-key'], models: [], state: SIGN_IN_REQUIRED, message: 'Gemini API key is missing or not configured.'});
 const plan = 'Authentication required: This integration does not support using claude.ai subscriptions.';
 const claude = await f.program('claude-agent-acp', '0.99.0', {version: 2, newError: {code: -32000, message: plan, data: {reason: 'claude_subscription_not_supported'}}});
 assert.deepEqual(await checkProvider({harness: 'claude-code', command: [...claude.command, '--hide-claude-auth'], stateDir: f.state, env: f.env}),
  {protocolVersion: 2, signInMethods: [], models: [], state: API_KEY_SIGN_IN, message: plan});
 assert.deepEqual([SIGN_IN_REQUIRED, API_KEY_SIGN_IN], ['Sign-in required', 'Needs an API key sign-in']);
 for (const agent of [gemini, claude]) assert.deepEqual(await methods(agent), ['initialize', 'session/new'], 'no authentication call and no prompt');
 assert.deepEqual(await f.leftovers(), []);
});

test('malformed JSON or an exit fails the check and removes its directory', async t => {
 const f = await setup(t);
 const malformed = await f.program('codex-acp', '2.3.0', {version: 2, malformedOn: 'session/new'});
 await assert.rejects(checkProvider({harness: 'codex', command: malformed.command, stateDir: f.state, env: f.env}), error => error instanceof ProviderCheckError && error.message === 'The agent sent malformed JSON.');
 const exit = await f.program('cmd', '1.88.0', {version: 1, exitOn: 'initialize'});
 await assert.rejects(checkProvider({harness: 'command-code', command: exit.command, stateDir: f.state, env: f.env}), error => error instanceof ProviderCheckError && error.message === 'The agent exited during the check.');
 assert.deepEqual(await f.leftovers(), []);
});

test('the settings check writes providers.json with mode 0600 and no credential, keeps other checks, and a changed program version marks the result stale', async t => {
 const f = await setup(t), config = join(f.dir, 'config');
 const service = createSettingsService({configDir: config, stateDir: f.state, env: f.env, checkLimits: {staleWaitMs: 100}});
 await f.program('codex-acp', '2.3.0', {version: 2, authMethods: ['api-key'], models: [{id: 'gpt-6', name: 'GPT-6', levels: ['low', 'high']}, {id: 'gpt-6-mini'}]});
 const before = Date.now(), codex = await service.check({harness: 'codex'});
 assert.deepEqual(codex, {harness: 'codex', stale: false, check: {program: 'codex-acp', programVersion: '2.3.0', checkedAt: codex.check.checkedAt, protocolVersion: 2, signInMethods: ['api-key'],
  models: [{id: 'gpt-6', name: 'GPT-6', levels: ['low', 'high']}, {id: 'gpt-6-mini', name: 'gpt-6-mini', levels: []}]}});
 assert.ok(Date.parse(codex.check.checkedAt) >= before - 1000);
 const file = providersPath(f.state), bytes = await readFile(file, 'utf8');
 assert.equal((await stat(file)).mode & 0o777, 0o600);
 assert.deepEqual(JSON.parse(bytes), {version: 1, providers: {codex: codex.check}});
 assert.ok(!bytes.includes(SECRET), 'the result holds no credential');
 assert.deepEqual(await readdir(f.state), ['providers.json'], 'no temporary file and no check directory remain');
 // OpenCode 2 under the name opencode2; the codex check stays.
 const opencode = await f.program('opencode2', '2.2.0', {version: 1, models: [{id: 'openai/gpt-6', levels: ['high']}]});
 assert.equal((await service.check({harness: 'opencode'})).check.program, 'opencode2');
 assert.deepEqual((await opencode.lines())[0].start.argv, ['acp']);
 assert.deepEqual(Object.keys(readProviders(f.state)), ['codex', 'opencode']);
 // The Claude ACP agent gets --hide-claude-auth.
 const claude = await f.program('claude-agent-acp', '0.99.0', {version: 2, newError: {code: -32000, message: 'This integration does not support using claude.ai subscriptions.'}});
 assert.equal((await service.check({harness: 'claude-code'})).check.state, API_KEY_SIGN_IN);
 assert.deepEqual((await claude.lines())[0].start.argv, ['--hide-claude-auth']);
 // Query: the check is current, then stale after a new program version.
 const query = async () => Object.fromEntries((await service.query()).providers.map(p => [p.harness, p]));
 let providers = await query();
 assert.deepEqual([providers.codex.check, providers.codex.stale, providers.codex.lists.acp.models], [codex.check, false, codex.check.models]);
 await f.program('codex-acp', '2.4.0', {version: 2});
 providers = await query();
 assert.equal(providers.codex.stale, true, 'a changed program version marks the result stale');
});

test('the settings check refuses an unknown harness, returns 503 for a missing program and 502 for a failed check without a write', async t => {
 const f = await setup(t);
 const service = createSettingsService({configDir: join(f.dir, 'config'), stateDir: f.state, env: f.env});
 const refusal = (status, message) => error => error instanceof SettingsError && error.status === status && (!message || message.test(error.message));
 for (const body of [{}, {harness: 'other'}, {harness: 'codex', extra: 1}, null, []]) await assert.rejects(service.check(body), refusal(400), JSON.stringify(body));
 await assert.rejects(service.check({harness: 'gemini-cli'}), refusal(503, /^gemini is not on PATH\.$/));
 await assert.rejects(service.check({harness: 'opencode'}), refusal(503, /^opencode is not on PATH\.$/));
 await f.program('codex-acp', '2.3.0', {version: 2, malformedOn: 'initialize'});
 await assert.rejects(service.check({harness: 'codex'}), refusal(502, /malformed JSON/));
 assert.deepEqual(await readdir(f.state), [], 'a failed check writes nothing');
});
