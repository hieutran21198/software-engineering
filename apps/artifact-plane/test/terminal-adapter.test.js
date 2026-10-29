// specifications/agent-orchestration.md: Terminal adapter, Roles and initial prompts, States,
// Failures; ADR 018. A fake herdr (test/fixtures/fake-herdr.mjs) and fake harness and
// terminal programs are the only programs on the injected PATH, so no test starts the
// real herdr, a terminal app or a harness program.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chmod, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {profileCommand} from '../server/provider-catalog.js';
import {HERDR_LIMIT_MS, SERVER_WAIT_MS, STATUS_INTERVAL_MS, TerminalError, TerminalSession, herdrSession, runHerdr, shellQuote, terminalCommandLine, terminalState} from '../server/terminal-adapter.js';

const FAKE = fileURLToPath(new URL('./fixtures/fake-herdr.mjs', import.meta.url));
const ID = '0a1b2c3d4e5f', NAME = `plane-${ID}`;
const PROMPT = `You are an ADD implementer. PROMPT-TEXT-91c2 it's "quoted" $HOME \`date\` $(touch pwned)\nsecond line`;
const CLAUDE = {id: 'claude-opus-terminal', harness: 'claude-code', connection: 'terminal', signIn: 'plan', model: 'opus', reasoning: 'high', env: {PLANE_TEST_FLAG: 'on'}};
const CODEX = {id: 'codex-terminal', harness: 'codex', connection: 'terminal', signIn: 'harness', model: 'gpt-5-codex', reasoning: 'low'};
const OPENCODE = {id: 'opencode-terminal', harness: 'opencode', connection: 'terminal', signIn: 'harness', model: 'openai/gpt-6', reasoning: 'high'};
const OTHER = {id: 'other', harness: 'other', connection: 'terminal', signIn: 'harness', model: 'm', command: ['tool', '--flag', "it's"]};
const skip = process.platform === 'win32';

// A private directory with the fake programs on PATH. A harness program prints its
// arguments, separated by NUL, so that the shell check can compare them.
async function fixture(t, {programs = ['herdr', 'term', 'claude', 'codex', 'opencode2', 'tool'], env = {}} = {}) {
 const dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-terminal-'))), bin = join(dir, 'bin'), state = join(dir, 'herdr'), worktree = join(dir, 'worktree');
 t.after(() => rm(dir, {recursive: true, force: true}));
 await Promise.all([mkdir(bin), mkdir(state), mkdir(worktree)]);
 for (const name of programs) {
  const body = ['herdr', 'term'].includes(name) ? `exec ${shellQuote(process.execPath)} ${shellQuote(FAKE)} ${name} "$@"` : `printf '%s\\0' "$@"`;
  await writeFile(join(bin, name), `#!/bin/sh\n${body}\n`);await chmod(join(bin, name), 0o755);
 }
 const environment = {PATH: bin, HOME: dir, FAKE_HERDR_DIR: state, FAKE_HERDR_SERVER_DELAY_MS: '300', ...env};
 const calls = async () => existsSync(join(state, 'calls.jsonl')) ? (await readFile(join(state, 'calls.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line)) : [];
 const herdrCalls = async () => (await calls()).filter(c => c.program === 'herdr');
 const readState = async () => JSON.parse(await readFile(join(state, 'state.json'), 'utf8'));
 // Writes the state as the fake does: a temporary file, then a rename.
 const setState = async change => {const value = await readState();change(value);await writeFile(join(state, 'state.tmp'), JSON.stringify(value));await rename(join(state, 'state.tmp'), join(state, 'state.json'));};
 const setPanes = change => setState(value => change(value.sessions[NAME].panes));
 const session = (options = {}) => new TerminalSession({id: ID, worktree, label: 'implementer terminal-adapter', profile: CLAUDE, env: environment, ...options});
 return {dir, bin, worktree, env: environment, calls, herdrCalls, readState, setState, setPanes, session};
}
// The herdr command of a recorded call, for example `pane list`.
const command = call => call.argv.slice(2).slice(0, 2).filter(a => !a.startsWith('-')).join(' ');
const waitFor = async (check, ms = 5000) => {
 for (const deadline = Date.now() + ms; Date.now() < deadline; await new Promise(done => setTimeout(done, 25))) {const value = await check();if (value) return value;}
 throw Error('Timed out');
};
const refusal = (code, extra = {}) => error => error instanceof TerminalError && error.code === code && Object.entries(extra).every(([key, value]) => error[key] === value);
// The arguments that the shell gives the harness program for one command line.
const shellArguments = (line, f) => execFileSync('/bin/sh', ['-c', line], {cwd: f.worktree, env: {PATH: f.bin, ARTIFACT_PLANE_PROMPT: PROMPT}, encoding: 'utf8'}).split('\0').slice(0, -1);

test('the command line quotes each profile argument, adds "$ARTIFACT_PLANE_PROMPT" in the form of the Initial prompt column and holds no prompt text', {skip}, async t => {
 const f = await fixture(t), extra = {args: ["it's", '$(touch pwned)', '; rm -rf x', '']};
 const cases = [
  [CLAUDE, {}, `'claude' '--model' 'opus' '--effort' 'high' "$ARTIFACT_PLANE_PROMPT"`],
  [CODEX, {}, `'codex' '--model' 'gpt-5-codex' '-c' 'model_reasoning_effort=low' "$ARTIFACT_PLANE_PROMPT"`],
  [OPENCODE, {opencode: 'opencode2'}, `'opencode2' 'mini' '--model' 'openai/gpt-6#high' '--prompt' "$ARTIFACT_PLANE_PROMPT"`],
  [OTHER, {}, `'tool' '--flag' 'it'\\''s' "$ARTIFACT_PLANE_PROMPT"`],
  [{...CLAUDE, ...extra}, {}, `'claude' '--model' 'opus' '--effort' 'high' 'it'\\''s' '$(touch pwned)' '; rm -rf x' '' "$ARTIFACT_PLANE_PROMPT"`],
 ];
 for (const [profile, programs, expected] of cases) {
  const line = terminalCommandLine(profile, {programs});
  assert.equal(line, expected);
  assert.ok(!line.includes('PROMPT-TEXT') && !line.includes(PROMPT), 'no prompt text');
  // The shell gives the program the profile command arguments and the prompt, unchanged.
  const prompt = profile.harness === 'opencode' ? ['--prompt', PROMPT] : [PROMPT];
  assert.deepEqual(shellArguments(line, f), [...profileCommand(profile, {programs}).slice(1), ...prompt], profile.id);
 }
 assert.equal(existsSync(join(f.worktree, 'pwned')), false);
 // A resume line has the catalog resume arguments and no prompt.
 const resume = terminalCommandLine(CLAUDE, {resume: '5f0c2a1e-7b7d-4c55-9a51-0d6c1f0e6a77'});
 assert.equal(resume, `'claude' '--model' 'opus' '--effort' 'high' '--resume' '5f0c2a1e-7b7d-4c55-9a51-0d6c1f0e6a77'`);
 assert.deepEqual(shellArguments(resume, f), ['--model', 'opus', '--effort', 'high', '--resume', '5f0c2a1e-7b7d-4c55-9a51-0d6c1f0e6a77']);
 for (const profile of [CODEX, OPENCODE, OTHER, {...CLAUDE, harness: 'command-code'}, {...CLAUDE, harness: 'gemini-cli', reasoning: undefined}])
  assert.throws(() => terminalCommandLine(profile, {resume: 'abc'}), refusal('resume-unavailable'), profile.harness);
 for (const id of ['', '--dangerously-skip-permissions', 'a b', 'x'.repeat(129), 7])
  assert.throws(() => terminalCommandLine(CLAUDE, {resume: id}), refusal('invalid'), String(id));
});

test('the herdr agent_status values map to the session states; unknown keeps the state, and done or idle give idle only after work', () => {
 for (const state of ['starting', 'working', 'waiting', 'idle']) {
  assert.equal(terminalState(state, 'working', false), 'working');
  assert.equal(terminalState(state, 'blocked', false), 'waiting');
  assert.equal(terminalState(state, 'unknown', true), state);
  assert.equal(terminalState(state, 'something-new', true), state);
  for (const status of ['done', 'idle']) {
   assert.equal(terminalState(state, status, true), 'idle');
   assert.equal(terminalState(state, status, false), state);
  }
 }
 assert.equal(STATUS_INTERVAL_MS, 2000);
 assert.equal(SERVER_WAIT_MS, 5000);
});

test('start runs a detached named server, waits for it, creates the workspace with the variables and runs the command line once', {skip}, async t => {
 const f = await fixture(t), session = f.session();
 assert.deepEqual(await session.start(PROMPT), {pane: 'w1:p1', tab: 'w1:t1', commandLine: terminalCommandLine(CLAUDE)});
 assert.deepEqual([session.pane, session.tab, session.state], ['w1:p1', 'w1:t1', 'starting']);
 const calls = await f.herdrCalls();
 // Every herdr call names the named session.
 for (const call of calls) assert.deepEqual(call.argv.slice(0, 2), ['--session', NAME], JSON.stringify(call.argv));
 // The call sequence: one detached server, pane list until the server answers, workspace create, pane run.
 const server = calls.filter(c => command(c) === 'server');
 assert.equal(server.length, 1);assert.deepEqual(server[0].argv, ['--session', NAME, 'server']);
 if (server[0].sid !== null) assert.equal(server[0].sid, server[0].pid, 'the server runs in its own session (detached)');
 const rest = calls.filter(c => command(c) !== 'server').map(command);
 assert.ok(rest.indexOf('workspace create') >= 2, `pane list waits for the server: ${rest}`);
 assert.deepEqual(rest, [...Array(rest.length - 2).fill('pane list'), 'workspace create', 'pane run']);
 assert.ok(calls.indexOf(server[0]) < calls.findIndex(c => command(c) === 'workspace create'));
 const workspace = calls.find(c => command(c) === 'workspace create'), run = calls.at(-1);
 assert.deepEqual(workspace.argv, ['--session', NAME, 'workspace', 'create', '--cwd', f.worktree, '--label', 'implementer terminal-adapter',
  '--env', `ARTIFACT_PLANE_LAUNCH=${ID}`, '--env', `ARTIFACT_PLANE_PROMPT=${PROMPT}`, '--env', 'PLANE_TEST_FLAG=on', '--no-focus']);
 assert.deepEqual(run.argv, ['--session', NAME, 'pane', 'run', 'w1:p1', `'claude' '--model' 'opus' '--effort' 'high' "$ARTIFACT_PLANE_PROMPT"`]);
 // No call carries the prompt text, except the ARTIFACT_PLANE_PROMPT value of workspace create.
 for (const call of await f.calls()) {
  const argv = command(call) === 'workspace create' ? call.argv.filter(a => a !== `ARTIFACT_PLANE_PROMPT=${PROMPT}`) : call.argv;
  assert.ok(!JSON.stringify([argv, call.env]).includes('PROMPT-TEXT-91c2'), `${call.program} ${command(call)}`);
 }
 // herdr gives the variables to the pane, and the pane got one command.
 const pane = (await f.readState()).sessions[NAME].panes[0];
 assert.deepEqual(pane.env, {ARTIFACT_PLANE_LAUNCH: ID, ARTIFACT_PLANE_PROMPT: PROMPT, PLANE_TEST_FLAG: 'on'});
 assert.deepEqual(pane.runs, [run.argv[5]]);
});

test('the status poll maps agent_status to the session state every 2 seconds, keeps it for unknown and interrupts on a missing pane', {skip}, async t => {
 const f = await fixture(t), updates = [], errors = [];
 const session = f.session({onUpdate: update => updates.push(update), onError: error => errors.push(error)});
 await session.start(PROMPT);
 const status = async value => {await f.setPanes(panes => {panes[0].agent_status = value;});return session.poll();};
 const sequence = [['unknown', 'starting'], ['idle', 'starting'], ['done', 'starting'], ['working', 'working'], ['unknown', 'working'], ['blocked', 'waiting'],
  ['unknown', 'waiting'], ['working', 'working'], ['done', 'idle'], ['unknown', 'idle'], ['working', 'working'], ['idle', 'idle'], ['blocked', 'waiting'], ['idle', 'idle']];
 for (const [agentStatus, state] of sequence) {
  const update = await status(agentStatus);
  assert.deepEqual(update, {session: ID, state, agentStatus}, agentStatus);
  assert.equal(session.state, state);
 }
 // An unchanged status sends no update.
 assert.equal(await status('idle'), null);
 assert.equal(updates.length, sequence.length);
 // A failed read keeps the state and reports the error.
 const garbage = f.session({pane: 'w1:p1', state: 'idle', env: {...f.env, FAKE_HERDR_FAULT: 'pane list:garbage'}, onError: error => errors.push(error)});
 assert.equal(await garbage.poll(), null);
 assert.ok(errors.length === 1 && refusal('malformed', {command: 'pane list'})(errors[0]));
 assert.equal(garbage.state, 'idle');
 // A missing pane interrupts the session with reason pane-missing; then the poll stops.
 await f.setPanes(panes => panes.splice(0));
 assert.deepEqual(await session.poll(), {session: ID, state: 'interrupted', agentStatus: null, reason: 'pane-missing'});
 assert.equal(await session.poll(), null);
 // A stopped named session also has no pane.
 const stopped = f.session({id: 'ffffffffffff', pane: 'w1:p1', state: 'working'});
 assert.deepEqual(await stopped.poll(), {session: 'ffffffffffff', state: 'interrupted', agentStatus: null, reason: 'pane-missing'});
 // watch() reads the status at the default interval of 2 seconds.
 const watched = [], again = f.session({pane: 'w1:p1', state: 'working', onUpdate: update => watched.push(update)});
 await f.setPanes(panes => panes.push({pane_id: 'w1:p1', agent_status: 'blocked', runs: []}));
 t.mock.timers.enable({apis: ['setInterval']});
 const before = (await f.herdrCalls()).length;
 again.watch();
 t.mock.timers.tick(STATUS_INTERVAL_MS - 1);
 await new Promise(done => setImmediate(done));
 assert.equal((await f.herdrCalls()).length, before, 'no read before 2 seconds');
 t.mock.timers.tick(1);
 await waitFor(() => watched.length);
 assert.deepEqual(watched, [{session: ID, state: 'waiting', agentStatus: 'blocked'}]);
 again.stopWatching();
 t.mock.timers.reset();
});

test('after pane run, the adapter calls only pane list, session attach, tab create with pane run for a resume, and server stop, and sends no text or keys', {skip}, async t => {
 const f = await fixture(t), updates = [];
 const session = f.session({onUpdate: update => updates.push(update), intervalMs: 20});
 await session.start(PROMPT);
 const firstRun = (await f.herdrCalls()).length;
 session.watch();
 await f.setPanes(panes => {panes[0].agent_status = 'working';});
 await waitFor(() => updates.some(u => u.state === 'working'));
 await f.setPanes(panes => {panes[0].agent_status = 'blocked';});
 await waitFor(() => updates.some(u => u.state === 'waiting'));
 // The person closes the pane: the session is interrupted, then resumed in a new tab.
 await f.setPanes(panes => panes.splice(0));
 await waitFor(() => updates.some(u => u.reason === 'pane-missing'));
 const resumed = await session.resume('5f0c2a1e-7b7d-4c55-9a51-0d6c1f0e6a77');
 assert.deepEqual(resumed, {pane: 'w1:p2', tab: 'w1:t2', commandLine: `'claude' '--model' 'opus' '--effort' 'high' '--resume' '5f0c2a1e-7b7d-4c55-9a51-0d6c1f0e6a77'`});
 session.watch();
 // The resumed harness session worked before, so idle maps to idle.
 await f.setPanes(panes => {panes[0].agent_status = 'idle';});
 await waitFor(() => updates.at(-1).state === 'idle');
 const opened = session.openTerminal(['term', '-e']);
 assert.equal(typeof opened.pid, 'number');
 await waitFor(async () => (await f.calls()).some(c => c.program === 'term'));
 assert.equal(await session.end(), true);
 const calls = await f.calls(), after = calls.filter(c => c.program === 'herdr').slice(firstRun);
 const allowed = new Set(['pane list', 'tab create', 'pane run', 'server stop']);
 for (const call of after) {
  assert.ok(allowed.has(command(call)), command(call));
  assert.deepEqual(call.argv.slice(0, 2), ['--session', NAME]);
 }
 // The only pane run after the start is the resume command line in the new tab, right after tab create.
 const order = after.map(command).filter(c => c !== 'pane list');
 assert.deepEqual(order, ['tab create', 'pane run', 'server stop']);
 const resumeRun = after.find(c => command(c) === 'pane run');
 assert.deepEqual(resumeRun.argv, ['--session', NAME, 'pane', 'run', 'w1:p2', resumed.commandLine]);
 const tab = after.find(c => command(c) === 'tab create');
 assert.deepEqual(tab.argv, ['--session', NAME, 'tab', 'create', '--cwd', f.worktree, '--label', 'implementer terminal-adapter', '--env', `ARTIFACT_PLANE_LAUNCH=${ID}`, '--env', 'PLANE_TEST_FLAG=on', '--no-focus']);
 // No call sends text or keys: no send-text, send-keys or agent prompt, and no prompt text after the start.
 for (const call of calls) assert.ok(!/send-text|send-keys|^agent /.test(command(call)) && !call.argv.includes('send-text') && !call.argv.includes('send-keys'), command(call));
 for (const call of calls.slice(calls.findIndex(c => command(c) === 'pane run') + 1)) assert.ok(!JSON.stringify(call).includes('PROMPT-TEXT-91c2'), command(call));
 // The attach runs in the terminal app, without --session.
 assert.deepEqual(calls.filter(c => c.program === 'term').map(c => c.argv), [['-e', 'herdr', 'session', 'attach', NAME]]);
 assert.equal((await f.readState()).sessions[NAME].running, false);
});

test('Open in terminal app runs the terminal.open arguments plus herdr session attach as a detached process without a shell', {skip}, async t => {
 const f = await fixture(t), session = f.session({pane: 'w1:p1', state: 'working'});
 const open = ['term', '--title', '$(touch pwned); echo', '-e'];
 session.openTerminal(open);
 const call = await waitFor(async () => (await f.calls()).find(c => c.program === 'term'));
 assert.deepEqual(call.argv, ['--title', '$(touch pwned); echo', '-e', 'herdr', 'session', 'attach', NAME]);
 if (call.sid !== null) assert.equal(call.sid, call.pid, 'the terminal app runs in its own session (detached)');
 assert.equal(existsSync(join(f.worktree, 'pwned')) || existsSync(join(f.dir, 'pwned')), false);
 assert.deepEqual(await f.herdrCalls(), [], 'the adapter itself calls no herdr command');
 for (const value of [undefined, [], [''], 'term -e', ['term', 3]]) assert.throws(() => session.openTerminal(value), refusal('no-terminal-app'), JSON.stringify(value));
 assert.throws(() => session.openTerminal(['ghostty', '-e']), refusal('missing-program', {program: 'ghostty'}));
});

test('resume runs tab create in the same named session and the resume command for claude-code; other harness tools only respawn', {skip}, async t => {
 const f = await fixture(t), session = f.session();
 await session.start(PROMPT);
 const before = (await f.herdrCalls()).length;
 for (const profile of [CODEX, OPENCODE, OTHER]) {
  const other = f.session({profile, programs: {opencode: 'opencode2'}, pane: 'w1:p1', state: 'interrupted'});
  await assert.rejects(other.resume('abc'), refusal('resume-unavailable'), profile.id);
 }
 await assert.rejects(session.resume(undefined), refusal('invalid'));
 await assert.rejects(session.resume('-x'), refusal('invalid'));
 assert.equal((await f.herdrCalls()).length, before, 'a refused resume calls no herdr command');
 const {pane, tab} = await session.resume('session-1');
 assert.deepEqual([pane, tab, session.pane, session.tab], ['w1:p2', 'w1:t2', 'w1:p2', 'w1:t2']);
 assert.deepEqual((await f.readState()).sessions[NAME].panes.map(p => [p.pane_id, p.runs.length]), [['w1:p1', 1], ['w1:p2', 1]]);
 // Without a running server or workspace, tab create fails with the herdr error.
 const stopped = f.session({id: 'ffffffffffff', pane: 'w1:p1', state: 'interrupted'});
 await assert.rejects(stopped.resume('session-1'), refusal('herdr', {herdrCode: 'server_not_running', command: 'tab create'}));
 await f.setState(value => {value.sessions[NAME].workspaces = [];});
 await assert.rejects(session.resume('session-1'), refusal('herdr', {herdrCode: 'workspace_not_found', command: 'tab create'}));
});

test('end runs server stop of the named session only', {skip}, async t => {
 const f = await fixture(t), session = f.session(), other = f.session({id: 'ffffffffffff'});
 await session.start(PROMPT);await other.start(PROMPT);
 assert.equal(await session.end(), true);
 assert.deepEqual((await f.herdrCalls()).at(-1).argv, ['--session', NAME, 'server', 'stop']);
 const state = await f.readState();
 assert.deepEqual([state.sessions[NAME].running, state.sessions['plane-ffffffffffff'].running], [false, true]);
 // A second end finds no server.
 assert.equal(await session.end(), false);
 assert.equal(session.state, 'ended');
 assert.equal(await session.poll(), null);
});

test('a missing program, a server that does not start and a failed herdr call give clear errors; a failed start stops the server', {skip}, async t => {
 const f = await fixture(t);
 await assert.rejects(f.session({env: {...f.env, PATH: join(f.dir, 'empty')}}).start(PROMPT), refusal('missing-program', {program: 'herdr'}));
 await assert.rejects(f.session({profile: {...OTHER, command: ['missing-tool']}}).start(PROMPT), refusal('missing-program', {program: 'missing-tool'}));
 assert.deepEqual(await f.calls(), []);
 // The server never answers: the start fails after the wait and stops the named session.
 const slow = f.session({serverWaitMs: 400, env: {...f.env, FAKE_HERDR_SERVER_DELAY_MS: '-1'}}), started = Date.now();
 await assert.rejects(slow.start(PROMPT), refusal('server-start'));
 assert.ok(Date.now() - started >= 400);
 assert.deepEqual((await f.herdrCalls()).map(command).filter(c => c !== 'pane list'), ['server', 'server stop']);
 // A refused workspace create stops the server again.
 const refused = f.session({id: 'ffffffffffff', env: {...f.env, FAKE_HERDR_FAULT: 'workspace create:error'}});
 await assert.rejects(refused.start(PROMPT), refusal('herdr', {herdrCode: 'internal', command: 'workspace create'}));
 assert.equal((await f.readState()).sessions['plane-ffffffffffff'].running, false);
 for (const value of ['', 'a\0b', null]) await assert.rejects(f.session().start(value), refusal('invalid'));
 for (const id of ['0A1B2C3D4E5F', '0a1b2c', '../x', 'plane-0a1b2c3d4e5f']) assert.throws(() => f.session({id}), refusal('invalid'), id);
 assert.throws(() => herdrSession('x'), refusal('invalid'));
 for (const options of [{worktree: 'relative'}, {label: '--no-focus'}, {label: 'a\nb'}, {profile: {...CLAUDE, connection: 'acp'}}, {profile: {...CLAUDE, env: {ARTIFACT_PLANE_LAUNCH: 'x'}}}])
  assert.throws(() => f.session(options), refusal('invalid'), JSON.stringify(options));
});

test('runHerdr parses the JSON output strictly and limits time and output', {skip}, async t => {
 const f = await fixture(t), list = ['--session', NAME, 'pane', 'list'];
 await f.session().start(PROMPT);
 assert.deepEqual((await runHerdr(list, {env: f.env, result: true})).result.type, 'pane_list');
 assert.equal(HERDR_LIMIT_MS, 10000);
 const env = fault => ({...f.env, FAKE_HERDR_FAULT: `pane list:${fault}`});
 await assert.rejects(runHerdr(list, {env: env('garbage'), result: true}), refusal('malformed', {command: 'pane list'}));
 assert.equal(await runHerdr(list, {env: env('garbage')}), null);
 await assert.rejects(runHerdr(list, {env: env('exit')}), refusal('exit', {exitCode: 3}));
 await assert.rejects(runHerdr(list, {env: env('error')}), refusal('herdr', {herdrCode: 'internal', exitCode: 1}));
 await assert.rejects(runHerdr(list, {env: env('stdout-error')}), refusal('herdr', {herdrCode: 'internal'}));
 const started = Date.now();
 await assert.rejects(runHerdr(list, {env: env('hang'), timeoutMs: 300}), refusal('timeout'));
 assert.ok(Date.now() - started < 3000);
 await assert.rejects(runHerdr(list, {env: env('flood')}), refusal('output-limit'));
 await assert.rejects(runHerdr(['--session', NAME, 'pane', 'run', 'w9:p9', 'true'], {env: f.env}), refusal('herdr', {herdrCode: 'not_found'}));
 await assert.rejects(runHerdr(['--session', 'plane-ffffffffffff', 'pane', 'list'], {env: f.env}), refusal('herdr', {herdrCode: 'server_not_running'}));
});
