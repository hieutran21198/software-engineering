// The hook command (artifact-plane specifications/agent-integration.md: Command line,
// Hook command, Inferred binding, Validation) with recorded inputs of Claude Code
// 2.1.301 and codex-cli 0.163.0. PLANE_TEST_EXECUTABLE selects a built executable
// for the process tests; without it they run the source entry `node server/app.js`.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createServer} from 'node:http';
import {spawn, execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, writeFile, readFile, readdir, rm, chmod, realpath} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hookOutput, LIMITS} from '../server/agent-hook.js';
import {workbenchStep, workbenchLine, probe, startServe} from '../server/workbench.js';
import {git} from './fixtures.js';
import {runtimeFixture} from './runtime-fixtures.js';

// A Plane terminal session sets ARTIFACT_PLANE_LAUNCH for its harness program and the
// tests that it runs. The tests below set it only where they say so.
delete process.env.ARTIFACT_PLANE_LAUNCH;

// A program that is not a Plane holds this port. The hook processes probe it, give the
// unavailable line and start no server; ARTIFACT_PLANE_AUTOSTART=0 also stops a start.
const held = createServer((req, res) => {res.writeHead(404);res.end();});
let HELD;
before(() => new Promise(done => held.listen(0, '127.0.0.1', () => {HELD = held.address().port;done();})));
after(() => new Promise(done => held.close(done)));
const heldLine = () => workbenchLine('unavailable', HELD, '');
// A fixed workbench step for the dispatcher tests.
const READY = root => `Artifact Plane workbench: http://127.0.0.1:4310/?repository=${encodeURIComponent(root)}`;
const ready = root => async () => ({state: 'ready', port: 4310, line: READY(root)});

const app = fileURLToPath(new URL('../server/app.js', import.meta.url));
const executable = process.env.PLANE_TEST_EXECUTABLE || null;
const program = executable ? [executable] : [process.execPath, app];
const MARKER = 'FORBIDDEN-PAYLOAD-7f3a';
const UNAVAILABLE = 'Artifact Plane hook unavailable; execution continues.\n';
const TASK = 'docs/artifacts/demo/changes/change-live/tasks/a.md';
const deny = what => ({hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'deny',
  permissionDecisionReason: `ADD reserves ${what} for people (AGENTS.md). Work on a change branch and stop for team review.`}});
const antigravityDeny = what => ({decision: 'deny',
  reason: `ADD reserves ${what} for people (AGENTS.md). Work on a change branch and stop for team review.`});

const put = async (root, path, text) => {await mkdir(dirname(join(root, path)), {recursive: true});await writeFile(join(root, path), text);};
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
// The runtime fixture (demo/change-live, unit live) with a unit brief that the validator rejects.
async function fixture(t) {
  const f = await runtimeFixture();t.after(f.cleanup);
  await put(f.root, 'docs/artifacts/units-of-work/broken/README.md', '---\nunit_of_work: broken\nflow_assessment: The flow is new: context at start.\n  More text.\n---\n# Broken\n');
  commit(f.root, 'broken brief');
  return {...f, root: await realpath(f.root)};
}
const temporary = async t => {const dir = await realpath(await mkdtemp(join(tmpdir(), 'plane-hook-')));t.after(() => rm(dir, {recursive: true, force: true}));return dir;};

// Recorded inputs: the documented fields of each harness, with the marker in every payload field.
function claudeInputs(cwd) {
  const base = {session_id: 'claude-session', transcript_path: `/home/user/.claude/projects/p/${MARKER}.jsonl`, cwd, permission_mode: 'default'};
  const tool = {tool_use_id: 'toolu_01', tool_input: {command: `echo ${MARKER}`, description: MARKER}};
  return [
    ...['startup', 'resume', 'clear', 'compact'].map(source => [{...base, hook_event_name: 'SessionStart', source, model: 'claude-opus-5-5'}, 'context']),
    [{...base, hook_event_name: 'UserPromptSubmit', prompt: `Do the task ${MARKER}`}, {}],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', ...tool}, {}],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'toolu_02', tool_input: {command: `git add . && git commit -m "${MARKER}"`, description: MARKER}}, deny('commits to main')],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'toolu_03', tool_input: {command: 'gh pr merge 44 --squash', description: MARKER}}, deny('the merge of a pull request')],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'toolu_04', tool_input: {command: `echo "git commit ${MARKER}"`}}, {}],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Read', tool_use_id: 'toolu_05', tool_input: {file_path: join(cwd, TASK)}, agent_id: 'claude-child', agent_type: 'general-purpose'}, {}, 'bind'],
    [{...base, hook_event_name: 'PostToolUse', tool_name: 'Bash', ...tool, tool_response: {stdout: MARKER, stderr: '', interrupted: false}}, {}],
    [{...base, hook_event_name: 'PermissionRequest', tool_name: 'Bash', ...tool, permission_suggestions: []}, {}],
    [{...base, hook_event_name: 'SubagentStart', agent_id: 'claude-child', agent_type: 'general-purpose'}, {}],
    [{...base, hook_event_name: 'SubagentStop', agent_id: 'claude-child', agent_type: 'general-purpose', agent_transcript_path: `/home/user/${MARKER}.jsonl`, stop_hook_active: false, last_assistant_message: MARKER}, 'block'],
    [{...base, hook_event_name: 'SubagentStop', agent_id: 'claude-child', agent_type: 'general-purpose', stop_hook_active: true, last_assistant_message: MARKER}, {}],
    [{...base, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: MARKER}, 'block'],
    [{...base, hook_event_name: 'Stop', stop_hook_active: true, last_assistant_message: MARKER}, {}],
    [{...base, hook_event_name: 'SessionEnd', reason: 'other'}, {}],
    [{...base, hook_event_name: 'Notification', message: MARKER}, {}],
  ];
}
function codexInputs(cwd) {
  const base = {session_id: 'codex-session', transcript_path: `/home/user/.codex/sessions/${MARKER}.jsonl`, cwd, model: 'gpt-5.5-codex', turn_id: 'turn-1'};
  return [
    ...['startup', 'resume', 'clear', 'compact'].map(source => [{...base, hook_event_name: 'SessionStart', source}, 'context']),
    [{...base, hook_event_name: 'UserPromptSubmit', prompt: `Do the task ${MARKER}`}, {}],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_1', tool_input: {command: `echo ${MARKER}`}}, {}],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_2', tool_input: {command: `git commit -m ${MARKER}`}}, deny('commits to main')],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_3', tool_input: {command: ['bash', '-lc', `git commit -m ${MARKER}`]}}, deny('commits to main')],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_4', tool_input: {command: ['bash', '-lc', `git push origin HEAD:main # ${MARKER}`]}}, deny('pushes to main')],
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_5', tool_input: {command: ['bash', '-lc', `git log --grep commit ${MARKER}`]}}, {}],
    // A read in the main worktree without agent_id binds nothing.
    [{...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_use_id: 'call_6', tool_input: {command: ['bash', '-lc', `sed -n 1,40p ${TASK}`]}}, {}],
    [{...base, hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_use_id: 'call_1', tool_input: {command: `echo ${MARKER}`}, tool_response: MARKER}, {}],
    [{...base, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: {command: `echo ${MARKER}`}}, {}],
    [{...base, hook_event_name: 'SubagentStart', agent_id: 'codex-child', agent_type: 'worker'}, {}],
    [{...base, hook_event_name: 'SubagentStop', agent_id: 'codex-child', agent_type: 'worker', stop_hook_active: false, last_assistant_message: MARKER}, 'block'],
    [{...base, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: MARKER}, 'block'],
    [{...base, hook_event_name: 'Stop', stop_hook_active: true, last_assistant_message: MARKER}, {}],
    [{...base, hook_event_name: 'Interrupt'}, {}],
    [{...base, hook_event_name: 'SessionEnd'}, {}],
  ];
}
function antigravityInputs(cwd) {
  const base = {conversationId: 'agy-session', transcriptPath: `/home/user/.gemini/antigravity/brain/agy-session/.system_generated/logs/${MARKER}.jsonl`,
    artifactDirectoryPath: `/home/user/.gemini/antigravity/brain/agy-session/${MARKER}`, workspacePaths: [cwd], modelName: 'MODEL_GOOGLE_GEMINI'};
  return [
    [{...base}, 'agy-context', undefined, 'SessionStart'],
    [{...base, invocationNum: 1, prompt: `Do the task ${MARKER}`}, {}, undefined, 'PreInvocation'],
    [{...base, stepIdx: 1, toolCall: {name: 'run_command', args: {CommandLine: `echo ${MARKER}`}}}, {decision: 'allow'}, undefined, 'PreToolUse'],
    [{...base, stepIdx: 2, toolCall: {name: 'run_command', args: {CommandLine: `git commit -m ${MARKER}`}}}, antigravityDeny('commits to main'), undefined, 'PreToolUse'],
    [{...base, stepIdx: 3, toolCall: {name: 'run_command', args: {CommandLine: `git push origin HEAD:main # ${MARKER}`}}}, antigravityDeny('pushes to main'), undefined, 'PreToolUse'],
    [{...base, stepIdx: 4, toolCall: {name: 'run_command', args: {CommandLine: 'gh pr merge 44 --squash'}}}, antigravityDeny('the merge of a pull request'), undefined, 'PreToolUse'],
    [{...base, stepIdx: 5, agentId: 'agy-child', toolCall: {name: 'read_file', args: {Path: join(cwd, TASK)}}}, {decision: 'allow'}, 'bind', 'PreToolUse'],
    [{...base, stepIdx: 6, toolCall: {name: 'run_command', args: {CommandLine: `echo ${MARKER}`}}}, {}, undefined, 'PostToolUse'],
    [{...base, stepIdx: 7, toolCall: {name: 'run_command', args: {CommandLine: `echo ${MARKER}`}}, error: MARKER}, {}],
    [{...base, executionNum: 1, terminationReason: 'NO_TOOL_CALL', fullyIdle: false, responseText: MARKER}, 'agy-continue', undefined, 'Stop'],
    [{...base, executionNum: 2, terminationReason: 'NO_TOOL_CALL', fullyIdle: false, responseText: MARKER}, {}, undefined, 'Stop'],
    [{...base, executionNum: 1, terminationReason: 'MAX_ITERATIONS', fullyIdle: true, responseText: MARKER}, {}, undefined, 'Stop'],
    [{...base, invocationNum: 1, executionCount: 1, responseText: MARKER}, {}, undefined, 'PostInvocation'],
  ];
}
function commandCodeInputs(cwd) {
  const base = {session_id: 'commandcode-session', transcript_path: `/home/user/.commandcode/projects/p/${MARKER}.jsonl`, cwd, permission_mode: 'dont-ask'};
  const shell = (id, input) => ({...base, hook_event_name: 'PreToolUse', tool_use_id: id, tool_name: 'shell_command', tool_display_name: 'SHELL', tool_input: input});
  return [
    ...['startup', 'resume', 'clear'].map(source => [{...base, hook_event_name: 'SessionStart', source}, 'context']),
    [shell('call_1', {command: `echo ${MARKER}`}), {}],
    [shell('call_2', {command: `git commit -m '${MARKER}'`}), deny('commits to main')],
    [shell('call_3', {command: 'git', args: ['commit', '-m', MARKER]}), deny('commits to main')],
    [shell('call_4', {command: 'git', args: ['push', 'origin', 'HEAD:main']}), deny('pushes to main')],
    [shell('call_5', {command: 'gh', args: ['pr', 'merge', '44']}), deny('the merge of a pull request')],
    [shell('call_6', {command: `echo "git commit ${MARKER}"`}), {}],
    [{...base, hook_event_name: 'PreToolUse', tool_use_id: 'call_7', tool_name: 'read_file', tool_display_name: 'READ', tool_input: {file_path: join(cwd, TASK)}}, {}],
    [{...base, hook_event_name: 'PostToolUse', tool_use_id: 'call_1', tool_name: 'shell_command', tool_display_name: 'SHELL', tool_input: {command: `echo ${MARKER}`}, tool_response: MARKER}, {}],
    [{...base, hook_event_name: 'Stop', stop_hook_active: false}, 'block'],
    [{...base, hook_event_name: 'Stop', stop_hook_active: true}, {}],
  ];
}

// `line` is the expected workbench line of a SessionStart output (specifications/ui-discovery.md: Hook output).
function assertExpected(output, expected, input, line = null) {
  const label = `${input.hook_event_name || input.conversationId} ${JSON.stringify(input.tool_input ?? input.toolCall ?? input.source ?? '')}`;
  if (expected === 'context') {
    const shown = line && ['startup', 'resume'].includes(input.source);
    assert.deepEqual(Object.keys(output), shown ? ['hookSpecificOutput', 'systemMessage'] : ['hookSpecificOutput'], label);
    if (shown) assert.equal(output.systemMessage, line, label);
    assert.deepEqual(Object.keys(output.hookSpecificOutput), ['hookEventName', 'additionalContext'], label);
    assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(output.hookSpecificOutput.additionalContext, /^Artifact Plane .*: ADD state of .* on branch main\.\n- demo\/change-live \(tier medium, unit live\): /, label);
    const workbench = output.hookSpecificOutput.additionalContext.split('\n').filter(l => l.startsWith('Workbench for people: '));
    assert.deepEqual(workbench, line ? [`Workbench for people: ${line}`] : [], label);
    if (line) assert.ok(output.hookSpecificOutput.additionalContext.endsWith(`\nWorkbench for people: ${line}`), label);
  } else if (expected === 'agy-context') {
    assert.deepEqual(Object.keys(output), ['injectSteps'], label);
    assert.equal(output.injectSteps.length, 1, label);
    const text = output.injectSteps[0]?.systemMessage?.systemMessage || '';
    assert.match(text, /^Artifact Plane .*: ADD state of .* on branch main\.\n- demo\/change-live \(tier medium, unit live\): /, label);
    const workbench = text.split('\n').filter(l => l.startsWith('Workbench for people: '));
    assert.deepEqual(workbench, line ? [`Workbench for people: ${line}`] : [], label);
  } else if (expected === 'agy-continue') {
    assert.deepEqual(Object.keys(output), ['decision', 'reason'], label);
    assert.equal(output.decision, 'continue');
    assert.match(output.reason, /^demo\/change-live: invalid-unit .*\nFix the records, or say why they stay, before you stop\.$/ms, label);
  } else if (expected === 'block') {
    assert.deepEqual(Object.keys(output), ['decision', 'reason'], label);
    assert.equal(output.decision, 'block');
    assert.match(output.reason, /^demo\/change-live: invalid-unit .*\nFix the records, or say why they stay, before you stop\.$/ms, label);
  } else assert.deepEqual(output, expected, label);
}

// Every row of the runtime store, and the raw database files, hold no marker.
async function assertNoPayload(stateDir) {
  const path = join(stateDir, 'runtime.sqlite');
  if (!existsSync(path)) return;
  const db = new DatabaseSync(path, {readOnly: true});
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('events'));
    for (const table of tables) assert.ok(!JSON.stringify(db.prepare(`SELECT * FROM "${table}"`).all()).includes(MARKER), table);
  } finally {db.close();}
  for (const file of (await readdir(stateDir)).filter(f => f.startsWith('runtime.sqlite')))
    assert.ok(!(await readFile(join(stateDir, file))).includes(MARKER), file);
}
const eventCount = stateDir => {const db = new DatabaseSync(join(stateDir, 'runtime.sqlite'), {readOnly: true});try {return Number(db.prepare('SELECT count(*) AS n FROM events').get().n);} finally {db.close();}};

// One hook process: exit status, the parsed standard output, standard error and the time.
function hookProcess(input, {stateDir, env = {}, args = stateDir ? ['--state-dir', stateDir] : []} = {}) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(program[0], [...program.slice(1), 'hook', ...args], {env: {...process.env, ARTIFACT_PLANE_AUTOSTART: '0', ARTIFACT_PLANE_PORT: String(HELD),
      ...(stateDir ? {ARTIFACT_PLANE_STATE_DIR: stateDir} : {}), ...env}, stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => stdout += chunk);
    child.stderr.setEncoding('utf8').on('data', chunk => stderr += chunk);
    child.on('error', reject);
    child.on('close', code => {
      const ms = Date.now() - started;
      assert.equal(code, 0, stderr);
      assert.ok(stdout.endsWith('}\n') && !stdout.slice(0, -1).includes('\n'), `one JSON line: ${stdout}`);
      assert.ok(stderr === '' || stderr === UNAVAILABLE, `stderr: ${stderr}`);
      resolve({output: JSON.parse(stdout), stderr, ms});
    });
    child.stdin.on('error', () => {});
    child.stdin.end(typeof input === 'string' ? input : JSON.stringify(input));
  });
}
const runtime = (...args) => JSON.parse(execFileSync(program[0], [...program.slice(1), 'runtime', ...args], {encoding: 'utf8'}));

test('AIA1: recorded Claude Code, Codex and Antigravity inputs get the output of the Hook command table from the dispatcher', async t => {
  const f = await fixture(t);
  for (const [harness, inputs] of [['claude', claudeInputs(f.root)], ['codex', codexInputs(f.root)], ['antigravity', antigravityInputs(f.root)]]) {
    for (const [input, expected, bind, event] of inputs) {
      const started = [];
      const {output, unavailable} = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, event, steps: {start: (b, dir) => started.push([b, dir]), workbench: ready(f.root)}});
      assertExpected(output, expected, input, READY(f.root));
      assert.equal(unavailable, false, `${harness} ${event || input.hook_event_name}`);
      assert.deepEqual(started, bind ? [[{root: f.root, artifact: 'demo', change: 'change-live', task: 'a.md', session: input.session_id || input.conversationId, agent: input.agent_id || input.agentId, unit: 'live'}, f.stateDir]] : [], `${harness} ${event || input.hook_event_name}`);
    }
  }
  // The observer recorded the supported events of all three harnesses and no payload text.
  assert.equal(eventCount(f.stateDir), claudeInputs(f.root).length - 1 + codexInputs(f.root).length + antigravityInputs(f.root).length - 1);
  await assertNoPayload(f.stateDir);
});

test(`AIA1: recorded inputs of all harnesses get the same output from the ${executable ? 'built executable' : 'source entry'}`, async t => {
  t.diagnostic(`program: ${program.join(' ')}`);
  const f = await fixture(t);
  for (const [input, expected, bind, event] of [...claudeInputs(f.root), ...codexInputs(f.root), ...antigravityInputs(f.root)].filter(([, , bind]) => !bind)) {
    const args = ['--state-dir', f.stateDir, ...(event ? ['--event', event] : [])];
    const {output, stderr} = await hookProcess(input, {stateDir: f.stateDir, args});
    assertExpected(output, expected, input, heldLine());
    assert.equal(stderr, '');
  }
  await assertNoPayload(f.stateDir);
});

test('CPA2: recorded Command Code inputs get the output of the Hook command table', async t => {
  const f = await fixture(t);
  for (const [input, expected] of commandCodeInputs(f.root)) {
    const {output, unavailable} = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, steps: {workbench: ready(f.root)}});
    assertExpected(output, expected, input, READY(f.root));
    assert.equal(unavailable, false, input.hook_event_name);
  }
  for (const [input, expected] of commandCodeInputs(f.root)) {
    const {output, stderr} = await hookProcess(input, {stateDir: f.stateDir});
    assertExpected(output, expected, input, heldLine());
    assert.equal(stderr, '');
  }
  await assertNoPayload(f.stateDir);
});

test('AI1: the runtime command takes the commands of runtime-cli.js, and bind accepts --binding inferred', async t => {
  const f = await fixture(t);
  const bound = runtime('bind', '--state-dir', f.stateDir, '--root', f.root, '--artifact', 'demo', '--change', 'change-live', '--task', 'b.md', '--session', 's', '--binding', 'inferred');
  assert.deepEqual(Object.keys(bound), ['repository', 'context', 'attempt']);
  const query = runtime('query', '--state-dir', f.stateDir, '--root', f.root);
  assert.deepEqual(query.attempts.map(a => [a.id, a.binding, a.path]), [[bound.attempt, 'inferred', 'docs/artifacts/demo/changes/change-live/tasks/b.md']]);
  // The source command prints the same result.
  const source = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('../server/runtime-cli.js', import.meta.url)), 'query', '--state-dir', f.stateDir, '--root', f.root], {encoding: 'utf8'}));
  assert.deepEqual(source.attempts.map(a => a.id), [bound.attempt]);
  assert.deepEqual(runtime('report', '--state-dir', f.stateDir, '--attempt', bound.attempt, '--state', 'execution-returned').state, 'validating');
});

test('AI7: an argument problem, invalid input, empty input and a missing repository exit 0 with {}', async t => {
  const f = await fixture(t);
  const start = {session_id: 's', hook_event_name: 'SessionStart', source: 'startup', cwd: f.root};
  for (const args of [['--unknown'], ['--state-dir'], ['--state-dir', 'relative/dir'], ['--state-dir', f.stateDir, 'extra'], ['--event'], ['--event', '']])
    assert.deepEqual(await hookProcess(start, {stateDir: f.stateDir, args}).then(r => [r.output, r.stderr]), [{}, UNAVAILABLE], args.join(' '));
  for (const text of ['not json', '', '[1]', 'null', JSON.stringify({...start, x: 'y'.repeat(1024 * 1024)})])
    assert.deepEqual(await hookProcess(text, {stateDir: f.stateDir}).then(r => [r.output, r.stderr]), [{}, UNAVAILABLE], text.slice(0, 20));
  const missing = join(f.stateDir, 'missing-repository');
  for (const event of ['SessionStart', 'PreToolUse', 'Stop'])
    assert.deepEqual(await hookProcess({session_id: 's', hook_event_name: event, cwd: missing, tool_input: {command: 'git commit -m x'}, prompt: MARKER}, {stateDir: f.stateDir}).then(r => [r.output, r.stderr]), [{}, UNAVAILABLE], event);
  // Without hook_event_name, the input is an event that the hook does not serve.
  assert.deepEqual((await hookProcess({cwd: f.root}, {stateDir: f.stateDir})).output, {});
  await assertNoPayload(f.stateDir);
});

test('AI7: a non-ADD repository gets no context, refusal or stop request', async t => {
  const f = await fixture(t), plain = await temporary(t);
  git(plain, 'init', '-q', '-b', 'main');await writeFile(join(plain, 'file.txt'), 'x');commit(plain, 'plain');
  const base = {session_id: 's', cwd: plain, transcript_path: MARKER};
  assert.deepEqual(await hookProcess({...base, hook_event_name: 'SessionStart', source: 'startup'}, {stateDir: f.stateDir}).then(r => [r.output, r.stderr]), [{}, UNAVAILABLE]);
  assert.deepEqual((await hookProcess({...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command: `git commit -m ${MARKER}`}}, {stateDir: f.stateDir})).output, {});
  assert.deepEqual((await hookProcess({...base, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: {command: 'gh pr merge 1'}}, {stateDir: f.stateDir})).output, {});
  assert.deepEqual((await hookProcess({...base, hook_event_name: 'Stop', stop_hook_active: false, last_assistant_message: MARKER}, {stateDir: f.stateDir})).output, {});
  await assertNoPayload(f.stateDir);
});

test('AI7: a store directory that cannot be written stops neither the context nor the refusal', async t => {
  const f = await fixture(t), dir = await temporary(t), file = join(dir, 'state-file');
  await writeFile(file, '');await chmod(file, 0o600);
  const base = {session_id: 's', cwd: f.root, prompt: MARKER};
  const context = await hookProcess({...base, hook_event_name: 'SessionStart', source: 'startup'}, {stateDir: file, env: {ARTIFACT_PLANE_STATE_DIR: dir}});
  assertExpected(context.output, 'context', {...base, source: 'startup'}, heldLine());assert.equal(context.stderr, UNAVAILABLE);
  const refused = await hookProcess({...base, hook_event_name: 'PreToolUse', tool_input: {command: 'git commit -m x'}}, {stateDir: file, env: {ARTIFACT_PLANE_STATE_DIR: dir}});
  assert.deepEqual([refused.output, refused.stderr], [deny('commits to main'), UNAVAILABLE]);
  const read = await hookProcess({...base, hook_event_name: 'PreToolUse', agent_id: 'child', tool_input: {file_path: join(f.root, TASK)}}, {stateDir: file, env: {ARTIFACT_PLANE_STATE_DIR: dir}});
  assert.deepEqual([read.output, read.stderr], [{}, UNAVAILABLE]);
  assert.equal(await readFile(file, 'utf8'), '');
});

test('AI7: a step that runs longer than its limit returns {}, and the other steps keep their output', async t => {
  const f = await fixture(t), never = () => new Promise(() => {});
  const limits = {SessionStart: 50, PreToolUse: 50, workbench: 50, stop: 50};
  const run = (input, steps) => hookOutput(JSON.stringify({session_id: 's', cwd: f.root, ...input}), {stateDir: f.stateDir, limits, steps: {workbench: async () => null, ...steps}});
  const started = Date.now();
  assert.deepEqual(await run({hook_event_name: 'SessionStart'}, {status: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'SessionStart'}, {status: never, workbench: never}), {output: {}, unavailable: true});
  // Without the session context text, the agent context is the workbench line alone.
  assert.deepEqual(await run({hook_event_name: 'SessionStart', source: 'startup'}, {status: never, workbench: ready(f.root)}),
    {output: {hookSpecificOutput: {hookEventName: 'SessionStart', additionalContext: READY(f.root)}, systemMessage: READY(f.root)}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'Stop'}, {stop: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', tool_input: {command: 'git status'}}, {reserved: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', agent_id: 'c', tool_input: {file_path: TASK}}, {infer: never}), {output: {}, unavailable: true});
  assert.ok(Date.now() - started < 2000, `${Date.now() - started} ms`);
  // Errors of one step leave the others: a failed observer and a failed binding keep the refusal.
  const failed = () => {throw Error('broken');};
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', tool_input: {command: 'git commit -m x'}}, {observe: failed, infer: failed}), {output: deny('commits to main'), unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'SessionStart'}, {status: failed}), {output: {}, unavailable: true});
  const context = await hookOutput(JSON.stringify({session_id: 's', cwd: f.root, hook_event_name: 'SessionStart'}), {stateDir: f.stateDir, steps: {observe: failed, workbench: async () => null}});
  assert.equal(context.unavailable, true);assertExpected(context.output, 'context', {});
});

// specifications/ui-discovery.md: Workbench step, Hook output.
test('UDA1: at a free port the hook starts one detached server and gives the ready line to the person and the agent; compact shows no line', async t => {
  const f = await fixture(t), stateDir = await temporary(t), children = [];
  const port = await new Promise(done => {const s = createServer().listen(0, '127.0.0.1', () => {const {port} = s.address();s.close(() => done(port));});});
  t.after(async () => {
    for (const child of children) {
      try {process.kill(child.pid, 'SIGTERM');} catch {/* already ended */}
      for (const deadline = Date.now() + 5000; Date.now() < deadline && await probe(port) !== 'free';) await new Promise(done => setTimeout(done, 50));
    }
  });
  const env = {...process.env, ARTIFACT_PLANE_PORT: String(port), ARTIFACT_PLANE_STATE_DIR: stateDir};
  const workbench = cwd => workbenchStep(cwd, {env, start: (p, e) => {const child = startServe(p, e);children.push(child);return child;}});
  const line = `Artifact Plane workbench: http://127.0.0.1:${port}/?repository=${encodeURIComponent(f.root)}`;
  const run = source => hookOutput(JSON.stringify({session_id: 's', hook_event_name: 'SessionStart', source, cwd: f.root}), {stateDir: f.stateDir, steps: {workbench}});
  const startup = await run('startup');
  assert.equal(startup.unavailable, false);
  assertExpected(startup.output, 'context', {hook_event_name: 'SessionStart', source: 'startup'}, line);
  assert.equal(children.length, 1);
  assert.equal(await probe(port), 'plane');
  for (const source of ['resume', 'clear', 'compact']) assertExpected((await run(source)).output, 'context', {hook_event_name: 'SessionStart', source}, line);
  assert.equal('systemMessage' in (await run('compact')).output, false);
  assert.equal(children.length, 1);
});

test('UDA6: outside an ADD repository the hook gives {} and starts nothing; a failing workbench step keeps the session context', async t => {
  const f = await fixture(t), plain = await temporary(t), starts = [], probes = [];
  git(plain, 'init', '-q', '-b', 'main');await writeFile(join(plain, 'file.txt'), 'x');commit(plain, 'plain');
  const workbench = cwd => workbenchStep(cwd, {env: {}, probe: async port => {probes.push(port);return 'free';}, start: () => {starts.push(1);return new EventEmitter();}});
  const run = (cwd, steps) => hookOutput(JSON.stringify({session_id: 's', hook_event_name: 'SessionStart', source: 'startup', cwd}), {stateDir: f.stateDir, limits: {...LIMITS, workbench: 100}, steps});
  assert.deepEqual(await run(plain, {workbench}), {output: {}, unavailable: true});
  assert.deepEqual([starts, probes], [[], []]);
  for (const failing of [() => {throw Error('broken');}, () => new Promise(() => {})]) {
    const result = await run(f.root, {workbench: failing});
    assert.equal(result.unavailable, true);
    assertExpected(result.output, 'context', {hook_event_name: 'SessionStart', source: 'startup'});
  }
});

test('UDA6: a failed start in the hook process exits with status 0 and keeps the session context', async t => {
  const f = await fixture(t);
  const input = {session_id: 's', hook_event_name: 'SessionStart', source: 'startup', cwd: f.root};
  const {output, stderr} = await hookProcess(input, {stateDir: f.stateDir, env: {ARTIFACT_PLANE_PORT: 'none', ARTIFACT_PLANE_AUTOSTART: ''}});
  assertExpected(output, 'context', input, workbenchLine('unavailable', 'none', f.root));
  assert.equal(stderr, '');
});

// A git on the path that sleeps for the reads of the guidance steps and runs the real git otherwise.
test('AI7: the process returns {} at the SessionStart limit and exits without waiting for the slow step', {skip: process.platform === 'win32'}, async t => {
  const f = await fixture(t), bin = await temporary(t), real = execFileSync('sh', ['-c', 'command -v git'], {encoding: 'utf8'}).trim();
  await writeFile(join(bin, 'git'), `#!/bin/sh\ncase " $* " in *core.untrackedCache=false*) sleep 15;; esac\nexec "${real}" "$@"\n`);
  await chmod(join(bin, 'git'), 0o755);
  const {output, stderr, ms} = await hookProcess({session_id: 's', hook_event_name: 'SessionStart', source: 'resume', cwd: f.root}, {stateDir: f.stateDir, env: {PATH: `${bin}:${process.env.PATH}`}});
  assert.deepEqual([output, stderr], [{}, UNAVAILABLE]);
  assert.ok(ms >= 5000 && ms < 9000, `${ms} ms`);
  // The observer step finished before the time limit.
  assert.equal(eventCount(f.stateDir), 1);
});

test('AI6: a PreToolUse read in a linked worktree returns within 2 seconds, and the detached bind records an inferred attempt', async t => {
  const f = await fixture(t), linked = join(await temporary(t), 'linked');
  git(f.root, 'worktree', 'add', '-q', '-b', 'change-live-work', linked);
  const input = {session_id: 'codex-linked', transcript_path: MARKER, cwd: linked, hook_event_name: 'PreToolUse', model: 'gpt-5.5-codex', turn_id: 't1',
    tool_name: 'Bash', tool_input: {command: ['bash', '-lc', `sed -n 1,80p ${TASK} # ${MARKER}`]}};
  const {output, stderr, ms} = await hookProcess(input, {stateDir: f.stateDir});
  assert.deepEqual([output, stderr], [{}, '']);
  assert.ok(ms < 2000, `${ms} ms`);
  t.diagnostic(`PreToolUse with an inferred binding: ${ms} ms`);
  let attempts = [];
  for (const deadline = Date.now() + 30000; !attempts.length && Date.now() < deadline; await new Promise(done => setTimeout(done, 200)))
    attempts = runtime('query', '--state-dir', f.stateDir, '--root', linked).attempts;
  assert.deepEqual(attempts.map(a => [a.session, a.agent, a.binding, a.path, a.sourceWorktree]), [['codex-linked', '', 'inferred', TASK, linked]]);
  // An open attempt stops a second inference: the next read starts no other bind.
  await hookProcess(input, {stateDir: f.stateDir});
  await new Promise(done => setTimeout(done, 1500));
  assert.equal(runtime('query', '--state-dir', f.stateDir, '--root', linked).attempts.length, 1);
  await assertNoPayload(f.stateDir);
});

test('AIA8: Antigravity payload inference without --event and attempt state transitions across PreInvocation, PreToolUse, PostToolUse and Stop', async t => {
  const f = await fixture(t);
  const base = {conversationId: 'agy-turn', workspacePaths: [f.root], modelName: 'MODEL_GOOGLE_GEMINI'};
  const bound = runtime('bind', '--state-dir', f.stateDir, '--root', f.root, '--artifact', 'demo', '--change', 'change-live', '--task', 'a.md', '--session', 'agy-turn');
  // Without --event, the adapter infers SessionStart, UserPromptSubmit, PreToolUse, PostToolUse (when error is present) and Stop.
  assertExpected((await hookOutput(JSON.stringify(base), {stateDir: f.stateDir, steps: {workbench: ready(f.root)}})).output, 'agy-context', base, READY(f.root));
  assert.deepEqual((await hookOutput(JSON.stringify({...base, invocationNum: 1, prompt: MARKER}), {stateDir: f.stateDir})).output, {});
  assert.equal(runtime('query', '--state-dir', f.stateDir, '--root', f.root).attempts.find(a => a.id === bound.attempt).state, 'processing');
  assert.deepEqual((await hookOutput(JSON.stringify({...base, stepIdx: 1, toolCall: {name: 'run_command', args: {CommandLine: 'git status'}}}), {stateDir: f.stateDir})).output, {decision: 'allow'});
  assert.deepEqual((await hookOutput(JSON.stringify({...base, stepIdx: 1, toolCall: {name: 'run_command', args: {CommandLine: 'git commit -m x'}}}), {stateDir: f.stateDir})).output, antigravityDeny('commits to main'));
  // An Antigravity PreToolUse fail-open also returns decision allow.
  assert.deepEqual(await hookOutput('not json', {stateDir: f.stateDir, event: 'PreToolUse'}), {output: {decision: 'allow'}, unavailable: true});
  // With --event PostToolUse, a successful toolCall without error is recorded as PostToolUse and keeps processing.
  assert.deepEqual((await hookOutput(JSON.stringify({...base, stepIdx: 2, toolCall: {name: 'run_command', args: {CommandLine: 'git status'}}}), {stateDir: f.stateDir, event: 'PostToolUse'})).output, {});
  assert.equal(runtime('query', '--state-dir', f.stateDir, '--root', f.root).attempts.find(a => a.id === bound.attempt).state, 'processing');
  // Stop transitions the attempt to validating because conversationId normalizes turn_id across events.
  assertExpected((await hookOutput(JSON.stringify({...base, executionNum: 1, terminationReason: 'NO_TOOL_CALL'}), {stateDir: f.stateDir})).output, 'agy-continue', base);
  assert.equal(runtime('query', '--state-dir', f.stateDir, '--root', f.root).attempts.find(a => a.id === bound.attempt).state, 'validating');
  await assertNoPayload(f.stateDir);
});

// specifications/agent-orchestration.md: Terminal adapter, step 3.
const LAUNCH = '0123456789ab';
const harnessIdEvents = stateDir => {
  const db = new DatabaseSync(join(stateDir, 'runtime.sqlite'), {readOnly: true});
  try {return db.prepare("SELECT session, attempt, agent, json FROM events WHERE kind='session:harness-id' ORDER BY seq").all().map(r => ({...r, json: JSON.parse(r.json)}));}
  finally {db.close();}
};
test('AO7: with ARTIFACT_PLANE_LAUNCH, the Claude Code SessionStart hook records session:harness-id with the hook session_id and model', async t => {
  const f = await fixture(t), env = {ARTIFACT_PLANE_LAUNCH: LAUNCH};
  const starts = claudeInputs(f.root).filter(([input]) => input.hook_event_name === 'SessionStart');
  for (const [input, expected] of starts) {
    const result = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, env, steps: {workbench: ready(f.root)}});
    // The agent context stays the same as without the variable.
    assertExpected(result.output, expected, input, READY(f.root));
    assert.equal(result.unavailable, false, input.source);
  }
  const events = harnessIdEvents(f.stateDir);
  assert.equal(events.length, starts.length);
  for (const event of events) {
    assert.deepEqual([event.session, event.attempt, event.agent], [LAUNCH, null, '']);
    assert.deepEqual(Object.keys(event.json).sort(), ['agent', 'harnessSession', 'id', 'kind', 'model', 'observedAt', 'session']);
    assert.deepEqual([event.json.kind, event.json.session, event.json.harnessSession, event.json.model], ['session:harness-id', LAUNCH, 'claude-session', 'claude-opus-5-5']);
  }
  // Other events with the variable record no harness ID.
  for (const [input] of claudeInputs(f.root).filter(([input]) => input.hook_event_name !== 'SessionStart'))
    await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, env, steps: {start: () => {}, workbench: ready(f.root)}});
  assert.equal(harnessIdEvents(f.stateDir).length, starts.length);
  await assertNoPayload(f.stateDir);
});

test('AO7: an invalid ARTIFACT_PLANE_LAUNCH records nothing and keeps the context; a hook process with the variable exits 0 and records the event', async t => {
  const f = await fixture(t);
  const input = {session_id: 'claude-session', transcript_path: MARKER, cwd: f.root, hook_event_name: 'SessionStart', source: 'startup', model: 'claude-opus-5-5'};
  for (const launch of ['plane-0123456789ab', '0123456789AB', '0123456789a', `${LAUNCH}0`]) {
    const result = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, env: {ARTIFACT_PLANE_LAUNCH: launch}, steps: {workbench: ready(f.root)}});
    assertExpected(result.output, 'context', input, READY(f.root));
    assert.equal(result.unavailable, true, launch);
  }
  assert.deepEqual(harnessIdEvents(f.stateDir), []);
  // A failed store write keeps the context.
  const failed = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, env: {ARTIFACT_PLANE_LAUNCH: LAUNCH}, steps: {workbench: ready(f.root), harnessId: () => {throw Error('broken');}}});
  assertExpected(failed.output, 'context', input, READY(f.root));
  assert.equal(failed.unavailable, true);
  const {output, stderr, ms} = await hookProcess(input, {stateDir: f.stateDir, env: {ARTIFACT_PLANE_LAUNCH: LAUNCH}});
  assertExpected(output, 'context', input, heldLine());
  assert.equal(stderr, '');
  t.diagnostic(`SessionStart with ARTIFACT_PLANE_LAUNCH: ${ms} ms`);
  assert.deepEqual(harnessIdEvents(f.stateDir).map(e => [e.session, e.json.harnessSession, e.json.model]), [[LAUNCH, 'claude-session', 'claude-opus-5-5']]);
  await assertNoPayload(f.stateDir);
});

test('server/app.js imports the module of a command only when that command runs', async () => {
  const source = await readFile(app, 'utf8');
  assert.deepEqual([...source.matchAll(/^import .* from "([^"]+)"/gm)].map(m => m[1]), ['../package.json', 'node:path']);
  for (const module of ['./http.js', './flow-mcp.js', './agent-hook.js', './runtime-cli.js', './flow-model-install.js']) assert.ok(source.includes(`await import("${module}")`), module);
});
