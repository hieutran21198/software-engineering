// specifications/agent-orchestration.md: ACP adapter, Lifecycle events, States and Failures.
// Every test drives the scripted fake agent of test/fixtures/fake-acp-agent.mjs in
// protocol version 1 and 2; no test starts a harness program.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, realpath, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {AcpSessionError, END_GRACE_MS, LAST_MESSAGE_LIMIT, PROTOCOL_VERSION, SIGN_IN_MESSAGE, createAcpSession, lastBytes, mcpServerConfig, planeMcpServer} from '../server/acp-client.js';

const FAKE = fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url));
const ID = '0123456789ab', MCP = {name: 'artifact-plane', command: '/opt/plane/artifact-plane', args: ['mcp']};
const MODELS = [{id: 'm1', name: 'Model one', levels: ['low', 'high']}, {id: 'm2', name: 'Model two'}];
const PROFILE = {model: 'm1', reasoning: 'high', env: {PROFILE_VAR: 'profile value'}};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, ms = 8000) {
 const end = Date.now() + ms;
 while (!(await check())) {if (Date.now() > end) throw Error('The condition did not become true.');await sleep(10);}
}
const refusal = code => error => error instanceof AcpSessionError && error.code === code;

// One fake agent session in a worktree whose path has a space.
async function agent(t, script, {profile = PROFILE, endGraceMs = 300, command} = {}) {
 const dir = await mkdtemp(join(tmpdir(), 'acp-client-')), worktree = join(dir, 'work tree'), log = join(dir, 'agent.log');
 await mkdir(worktree);
 const session = createAcpSession({id: ID, command: command || [process.execPath, FAKE, 'two words', "it's"], cwd: worktree,
  env: {PATH: process.env.PATH, FAKE_ACP_CONFIG: JSON.stringify({log, envNames: ['PROFILE_VAR', 'ARTIFACT_PLANE_LAUNCH'], ...script})}, profile, mcpServer: MCP, endGraceMs});
 const events = [], states = [], lives = [];
 session.on('event', e => events.push(e));session.on('state', s => states.push(s.state));session.on('live', s => lives.push(s));
 t.after(async () => {await session.end();await rm(dir, {recursive: true, force: true});});
 const lines = async () => (await readFile(log, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line));
 const received = async () => (await lines()).filter(e => e.in).map(e => e.in);
 const event = (kind, n = 1) => until(() => events.filter(e => e.kind === kind).length >= n).then(() => events.filter(e => e.kind === kind)[n - 1]);
 const stopped = () => until(async () => (await lines()).some(e => e.stdin === 'end' || e.signal));
 return {session, events, states, lives, worktree, lines, received, event, stopped};
}

for (const version of [1, 2]) {
 const v = `(version ${version})`;
 const server = version === 2 ? {type: 'stdio', ...MCP, env: []} : {...MCP, env: []};
 const setParams = (configId, value) => version === 2 ? {sessionId: 'sess-1', configId, type: 'id', value} : {sessionId: 'sess-1', configId, value};

 test(`the client sends initialize with version 2, declares no file system or terminal capability and answers client methods with method-not-found ${v}`, async t => {
  const a = await agent(t, {version, models: MODELS, clientCalls: ['fs/read_text_file', 'fs/write_text_file', 'terminal/create']});
  assert.deepEqual(await a.session.start(), {harnessSession: 'sess-1', protocolVersion: version, reportedModel: 'm1', resumable: true});
  const [init] = await a.received();
  assert.equal(PROTOCOL_VERSION, 2);
  assert.deepEqual([init.method, init.params.protocolVersion], ['initialize', 2]);
  assert.deepEqual([init.params.capabilities, init.params.clientCapabilities], [{}, {}], 'no fs and no terminal capability');
  assert.deepEqual([init.params.info.name, init.params.clientInfo.name], ['artifact-plane', 'artifact-plane']);
  await until(async () => (await a.lines()).filter(e => e.clientCall).length === 3);
  for (const call of (await a.lines()).filter(e => e.clientCall)) assert.deepEqual(call.response.error, {code: -32601, message: 'Method not found'}, call.clientCall);
  assert.deepEqual([a.session.state, a.session.snapshot().protocolVersion], ['idle', version]);
 });

 test(`session/new gets the worktree as cwd and one stdio MCP server; the agent runs without a shell with ARTIFACT_PLANE_LAUNCH and the profile env ${v}`, async t => {
  const a = await agent(t, {version, models: MODELS});
  await a.session.start();
  const [{start}] = await a.lines(), calls = await a.received();
  assert.equal(start.cwd, await realpath(a.worktree));
  assert.deepEqual(start.argv, ['two words', "it's"], 'arguments reach the program unchanged');
  assert.deepEqual([start.launch, start.env], [ID, {PROFILE_VAR: 'profile value', ARTIFACT_PLANE_LAUNCH: ID}]);
  assert.deepEqual(calls[1], {jsonrpc: '2.0', id: 2, method: 'session/new', params: {cwd: a.worktree, mcpServers: [server]}});
  assert.deepEqual(a.events[0], {kind: 'session:harness-id', harnessSession: 'sess-1'});
  assert.deepEqual(a.states, ['starting', 'idle']);
 });

 test(`an authentication error ends the session with reason error and the sign-in message, and the client never calls the authentication method ${v}`, async t => {
  const a = await agent(t, {version, authMethods: ['agent-login'], newError: {code: -32000, message: 'Authentication required'}});
  await assert.rejects(a.session.start(), error => refusal('sign-in')(error) && error.message === SIGN_IN_MESSAGE);
  assert.equal(SIGN_IN_MESSAGE, 'Sign in with the harness tool in a terminal, then start again.');
  assert.deepEqual(a.events, [{kind: 'session:ended', reason: 'error'}]);
  assert.deepEqual([a.states, a.session.snapshot().error], [['starting', 'ended'], SIGN_IN_MESSAGE]);
  await a.stopped();
  assert.deepEqual((await a.received()).map(m => m.method), ['initialize', 'session/new']);
 });

 test(`the client sets the profile model and level through the model and thought_level options and sets no other option ${v}`, async t => {
  const a = await agent(t, {version, models: MODELS, mode: true});
  await a.session.start();
  const sets = (await a.received()).filter(m => m.method === 'session/set_config_option').map(m => m.params);
  assert.deepEqual(sets, [setParams('model', 'm1'), setParams('effort', 'high')], 'configId, and type id in version 2; the mode option stays');
  assert.deepEqual([a.session.reportedModel, a.session.snapshot().model], ['m1', 'm1']);
 });

 test(`a missing option or a refused value keeps the session and records the model as declared ${v}`, async t => {
  const cases = [
   [{version}, {model: 'm2'}],
   [{version, models: MODELS, refuse: ['m2']}, {model: 'm2', reasoning: 'low'}],
   [{version, models: MODELS, refuseLevel: true}, {model: 'm1', reasoning: 'high'}, 'm1'],
   [{version, models: MODELS, configOptions: false, legacyModels: true}, {model: 'm2'}],
  ];
  for (const [script, profile, reported = null] of cases) {
   const a = await agent(t, {...script, turns: [[{chunk: 'Done.'}]]}, {profile});
   await a.session.start();
   assert.deepEqual([a.session.state, a.session.reportedModel, a.session.snapshot().model], ['idle', reported, profile.model], JSON.stringify(script));
   a.session.prompt('Go on');
   await a.event('session:turn-ended');
   assert.equal(a.session.lastMessage, 'Done.', 'the session continues');
   const sets = (await a.received()).filter(m => m.method === 'session/set_config_option').map(m => m.params.configId);
   assert.ok(sets.every(id => id === 'model' || id === 'effort'));
  }
 });

 test(`the client sends one prompt at a time and keeps only the joined agent message of the last turn, at most 64 KiB ${v}`, async t => {
  const turns = [
   [{chunk: 'Hello '}, {thought: 'hidden thought'}, {tool: 't1', kind: 'read'}, {wait: 300}, {chunk: 'world.'}],
   [{chunk: 'x'.repeat(70000)}, {chunk: 'é'.repeat(10)}, {stop: version === 2 ? null : 'max_tokens'}],
   version === 2 ? [{chunk: 'draft', id: 'a1'}, {message: 'final', id: 'a1'}, {chunk: 'second', id: 'a2'}, {stop: '_custom'}] : [{chunk: 'only'}, {stop: '_custom'}],
  ];
  const a = await agent(t, {version, models: MODELS, turns});
  await a.session.start();
  a.session.prompt('Do the task', {source: 'initial'});
  assert.throws(() => a.session.prompt('Again'), refusal('busy'));
  await sleep(150);
  assert.equal(a.session.state, 'working', 'the turn runs after the version 2 prompt response');
  assert.deepEqual(await a.event('session:turn-ended'), {kind: 'session:turn-ended', stopReason: 'end_turn'});
  assert.equal(a.session.lastMessage, 'Hello world.');
  const live = JSON.stringify([a.session.snapshot(), a.lives]);
  for (const hidden of ['hidden thought', 'tool output', 'tool argument', 'Tool title']) assert.ok(!live.includes(hidden), hidden);
  assert.ok(!JSON.stringify(a.events).includes('Hello') && !JSON.stringify(a.events).includes('Do the task'), 'lifecycle events hold no text');
  a.session.prompt('Write a lot');
  // Version 1 ends with the prompt response and its stop reason; version 2 with an idle state_update, and a missing stop reason is end_turn.
  assert.deepEqual(await a.event('session:turn-ended', 2), {kind: 'session:turn-ended', stopReason: version === 2 ? 'end_turn' : 'max_tokens'});
  assert.equal(LAST_MESSAGE_LIMIT, 65536);
  assert.ok(Buffer.byteLength(a.session.lastMessage) <= LAST_MESSAGE_LIMIT && Buffer.byteLength(a.session.lastMessage) > 65000);
  assert.ok(a.session.lastMessage.endsWith('é'.repeat(10)) && a.session.lastMessage.startsWith('x'), 'the newest text stays');
  a.session.prompt('Once more');
  assert.deepEqual(await a.event('session:turn-ended', 3), {kind: 'session:turn-ended', stopReason: 'end_turn'}, 'an unknown stop reason is end_turn');
  assert.equal(a.session.lastMessage, version === 2 ? 'final\n\nsecond' : 'only', 'an agent_message replaces the content of its message');
  assert.deepEqual(a.events.filter(e => e.kind === 'session:prompted').map(e => e.source), ['initial', 'person', 'person']);
  assert.deepEqual(a.states, ['starting', 'idle', 'working', 'idle', 'working', 'idle', 'working', 'idle']);
  assert.deepEqual(a.events.filter(e => e.kind === 'session:output-changed'), [], 'a read tool changes no output');
 });

 test(`a completed edit, delete or move tool call sends one output notice ${v}`, async t => {
  const a = await agent(t, {version, turns: [[{tool: 'e1', kind: 'edit'}, {tool: 'r1', kind: 'read'}, {tool: 'd1', kind: 'delete'}, {tool: 'm1', kind: 'move'}, {tool: 'x1', kind: 'execute'}]]});
  await a.session.start();a.session.prompt('Edit');
  await a.event('session:turn-ended');
  assert.equal(a.events.filter(e => e.kind === 'session:output-changed').length, 3);
  assert.ok(a.events.filter(e => e.kind === 'session:output-changed').every(e => Object.keys(e).length === 1));
 });

 test(`AOA2: a permission request stays pending until the person selects one of its options, and the agent continues ${v}`, async t => {
  const a = await agent(t, {version, turns: [[{chunk: 'Before. '}, {permission: {title: 'Run npm test'}}, {chunk: 'After.'}]]});
  await a.session.start();a.session.prompt('Run the tests');
  assert.deepEqual(await a.event('session:permission-requested'), {kind: 'session:permission-requested', request: 'p1'});
  assert.equal(a.session.state, 'waiting');
  assert.deepEqual(a.session.snapshot().pending, [{request: 'p1', title: 'Run npm test', description: version === 2 ? 'The agent wants to run a command.' : null, toolKind: 'execute', command: null,
   options: [{optionId: 'allow', name: 'Allow once', kind: 'allow_once'}, {optionId: 'reject', name: 'Reject', kind: 'reject_once'}]}]);
  await sleep(400);
  const answers = async () => (await a.received()).filter(m => m.id === 'perm-1' && !m.method);
  assert.deepEqual(await answers(), [], 'no request is answered without a selected option');
  assert.throws(() => a.session.answer('p1', 'always'), refusal('unknown-option'));
  assert.throws(() => a.session.answer('p2', 'allow'), refusal('unknown-request'));
  assert.deepEqual(await answers(), [], 'a refused answer sends nothing');
  a.session.answer('p1', 'allow');
  assert.deepEqual(await a.event('session:permission-answered'), {kind: 'session:permission-answered', request: 'p1', optionKind: 'allow_once'});
  await a.event('session:turn-ended');
  assert.deepEqual(await answers(), [{jsonrpc: '2.0', id: 'perm-1', result: {outcome: {outcome: 'selected', optionId: 'allow'}}}]);
  assert.equal(a.session.lastMessage, 'Before. After.', 'the agent continues after the answer');
  assert.deepEqual(a.states, ['starting', 'idle', 'working', 'waiting', 'working', 'idle']);
  assert.ok(!JSON.stringify(a.events).includes('Run npm test'), 'events hold no permission title');
 });

 test(`cancel sends session/cancel and answers each pending permission request with cancelled ${v}`, async t => {
  const a = await agent(t, {version, turns: [[{permission: {title: 'Delete files'}}, {chunk: 'never'}], [{chunk: 'Long work'}, {wait: 20000}, {chunk: ' never'}]]});
  await a.session.start();
  assert.throws(() => a.session.cancel(), refusal('state'), 'no turn runs');
  a.session.prompt('Clean up');
  await a.event('session:permission-requested');
  a.session.cancel();
  assert.deepEqual(await a.event('session:turn-ended'), {kind: 'session:turn-ended', stopReason: 'cancelled'});
  const calls = await a.received();
  assert.deepEqual(calls.find(m => m.method === 'session/cancel'), {jsonrpc: '2.0', method: 'session/cancel', params: {sessionId: 'sess-1'}});
  assert.deepEqual(calls.find(m => m.id === 'perm-1').result, {outcome: {outcome: 'cancelled'}});
  assert.deepEqual(a.events.find(e => e.kind === 'session:permission-answered'), {kind: 'session:permission-answered', request: 'p1', optionKind: 'cancelled'});
  assert.deepEqual([a.session.state, a.session.snapshot().pending], ['idle', []]);
  a.session.prompt('Work long');
  await until(() => a.lives.some(s => s.state === 'working'));await sleep(100);
  const started = Date.now();a.session.cancel();
  assert.deepEqual(await a.event('session:turn-ended', 2), {kind: 'session:turn-ended', stopReason: 'cancelled'});
  assert.ok(Date.now() - started < 3000);assert.equal(a.session.lastMessage, 'Long work');
 });

 test(`resume uses ${version === 2 ? 'session/resume with replayFrom start' : 'session/load'}, and the last message comes from the replay ${v}`, async t => {
  const history = [{user: 'First request'}, {agent: 'Old answer'}, {tool: 't9', kind: 'edit'}, {user: 'Second request', id: 'u2'}, {agent: 'Last ', id: 'h5'}, {agent: 'answer.', id: 'h5'}];
  const a = await agent(t, {version, models: MODELS, history, turns: [[{chunk: 'New.'}]]});
  assert.deepEqual(await a.session.resume({harnessSession: 'sess-1'}), {method: version === 2 ? 'resume' : 'load', protocolVersion: version, harnessSession: 'sess-1', reportedModel: 'm1'});
  const call = (await a.received()).at(-1), params = {sessionId: 'sess-1', cwd: a.worktree, mcpServers: [server]};
  assert.deepEqual([call.method, call.params], version === 2 ? ['session/resume', {...params, replayFrom: {type: 'start'}}] : ['session/load', params]);
  assert.deepEqual(a.events, [{kind: 'session:resumed', method: version === 2 ? 'resume' : 'load'}], 'a replayed edit sends no output notice');
  assert.deepEqual([a.session.state, a.session.lastMessage], ['idle', 'Last answer.']);
  a.session.prompt('Continue');
  await a.event('session:turn-ended');
  assert.equal(a.session.lastMessage, 'New.');
 });

 test(`an agent exit after start interrupts the session, and resume reattaches the same harness session ${v}`, async t => {
  const a = await agent(t, {version, turns: [[{chunk: 'partial'}, {permission: {title: 'Exit'}}]], history: [{user: 'Go'}, {agent: 'partial'}]});
  await a.session.start();a.session.prompt('Go');
  await a.event('session:permission-requested');
  process.kill((await a.lines())[0].start.pid, 'SIGKILL');
  assert.deepEqual(await a.event('session:interrupted'), {kind: 'session:interrupted', reason: 'process-exit'});
  assert.deepEqual([a.session.state, a.session.snapshot().pending], ['interrupted', []]);
  assert.throws(() => a.session.prompt('Again'), refusal('state'));
  assert.equal((await a.session.resume()).method, version === 2 ? 'resume' : 'load');
  assert.deepEqual([a.session.state, a.session.lastMessage, a.session.harnessSession], ['idle', 'partial', 'sess-1']);
 });

 test(`end closes standard input and stops the process after the grace time ${v}`, async t => {
  assert.equal(END_GRACE_MS, 5000);
  const stubborn = await agent(t, {version, ignoreStdinEnd: true}, {endGraceMs: 400});
  await stubborn.session.start();
  let started = Date.now();await stubborn.session.end();
  const elapsed = Date.now() - started, log = await stubborn.lines();
  assert.ok(elapsed >= 400 && elapsed < 2000, `stopped after ${elapsed} ms`);
  assert.ok(log.findIndex(e => e.stdin === 'end') >= 0 && log.findIndex(e => e.stdin === 'end') < log.findIndex(e => e.signal === 'SIGTERM'), 'standard input closes first, then SIGTERM');
  assert.deepEqual([stubborn.events.at(-1), stubborn.session.state], [{kind: 'session:ended', reason: 'person'}, 'ended']);
  const polite = await agent(t, {version}, {endGraceMs: 2000});
  await polite.session.start();
  started = Date.now();await polite.session.end();
  assert.ok(Date.now() - started < 1500, 'an agent that exits on the end of input is not killed');
  assert.ok(!(await polite.lines()).some(e => e.signal));
 });

 test(`malformed JSON or an exit during start ends the session with reason error ${v}`, async t => {
  const malformedStart = await agent(t, {version, malformedOn: 'initialize'});
  await assert.rejects(malformedStart.session.start(), error => error.message === 'The agent sent malformed JSON.');
  assert.deepEqual([malformedStart.events, malformedStart.session.state], [[{kind: 'session:ended', reason: 'error'}], 'ended']);
  const exit = await agent(t, {version, exitOn: 'session/new'});
  await assert.rejects(exit.session.start(), error => refusal('start')(error) && error.message === 'The agent exited during start.');
  assert.deepEqual(exit.events, [{kind: 'session:ended', reason: 'error'}]);
  const malformedTurn = await agent(t, {version, turns: [[{chunk: 'Hi'}, {malformed: true}, {wait: 20000}]]});
  await malformedTurn.session.start();malformedTurn.session.prompt('Go');
  assert.deepEqual(await malformedTurn.event('session:ended'), {kind: 'session:ended', reason: 'error'});
  assert.deepEqual([malformedTurn.session.state, malformedTurn.session.snapshot().error], ['ended', 'The agent sent malformed JSON.']);
  await malformedTurn.stopped();
 });
}

test('a version 1 agent without loadSession cannot resume, and the session stays interrupted', async t => {
 const a = await agent(t, {version: 1, loadSession: false});
 await assert.rejects(a.session.resume({harnessSession: 'sess-1'}), refusal('resume-unavailable'));
 assert.equal(a.session.state, 'interrupted');
 await a.stopped();
 assert.deepEqual((await a.received()).map(m => m.method), ['initialize'], 'neither session/load nor session/resume');
});

test('a missing program or an unsupported protocol version ends the start with reason error', async t => {
 const missing = await agent(t, {}, {command: ['/nonexistent/acp-agent']});
 await assert.rejects(missing.session.start(), refusal('program-missing'));
 assert.deepEqual(missing.events, [{kind: 'session:ended', reason: 'error'}]);
 const future = await agent(t, {version: 3});
 await assert.rejects(future.session.start(), refusal('version'));
 assert.deepEqual([future.events, future.session.state], [[{kind: 'session:ended', reason: 'error'}], 'ended']);
 await future.stopped();
});

test('the MCP server of a session is the Plane executable with the argument mcp', () => {
 assert.deepEqual(planeMcpServer(), {name: 'artifact-plane', command: process.execPath, args: [fileURLToPath(new URL('../server/app.js', import.meta.url)), 'mcp']});
 assert.deepEqual(mcpServerConfig(1, MCP), {...MCP, env: []});
 assert.deepEqual(mcpServerConfig(2, MCP), {type: 'stdio', ...MCP, env: []});
});

test('the last message keeps the newest 64 KiB at a character boundary', () => {
 assert.equal(lastBytes('short'), 'short');
 const kept = lastBytes('a' + '€'.repeat(30000));
 assert.ok(Buffer.byteLength(kept) <= LAST_MESSAGE_LIMIT && /^€+$/.test(kept));
});
