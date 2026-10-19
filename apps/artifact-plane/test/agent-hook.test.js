// The hook command (artifact-plane specifications/agent-integration.md: Command line,
// Hook command, Inferred binding, Validation) with recorded inputs of Claude Code
// 2.1.301 and codex-cli 0.163.0. PLANE_TEST_EXECUTABLE selects a built executable
// for the process tests; without it they run the source entry `node server/app.js`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, writeFile, readFile, readdir, rm, chmod, realpath} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hookOutput} from '../server/agent-hook.js';
import {git} from './fixtures.js';
import {runtimeFixture} from './runtime-fixtures.js';

const app = fileURLToPath(new URL('../server/app.js', import.meta.url));
const executable = process.env.PLANE_TEST_EXECUTABLE || null;
const program = executable ? [executable] : [process.execPath, app];
const MARKER = 'FORBIDDEN-PAYLOAD-7f3a';
const UNAVAILABLE = 'Artifact Plane hook unavailable; execution continues.\n';
const TASK = 'docs/artifacts/demo/changes/change-live/tasks/a.md';
const deny = what => ({hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'deny',
  permissionDecisionReason: `ADD reserves ${what} for people (AGENTS.md). Work on a change branch and stop for team review.`}});

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
function assertExpected(output, expected, input) {
  const label = `${input.hook_event_name} ${JSON.stringify(input.tool_input ?? input.source ?? '')}`;
  if (expected === 'context') {
    assert.deepEqual(Object.keys(output), ['hookSpecificOutput'], label);
    assert.deepEqual(Object.keys(output.hookSpecificOutput), ['hookEventName', 'additionalContext'], label);
    assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(output.hookSpecificOutput.additionalContext, /^Artifact Plane .*: ADD state of .* on branch main\.\n- demo\/change-live \(tier medium, unit live\): /, label);
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
    const child = spawn(program[0], [...program.slice(1), 'hook', ...args], {env: {...process.env, ...(stateDir ? {ARTIFACT_PLANE_STATE_DIR: stateDir} : {}), ...env}, stdio: ['pipe', 'pipe', 'pipe']});
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

test('AIA1: recorded Claude Code and Codex inputs get the output of the Hook command table from the dispatcher', async t => {
  const f = await fixture(t);
  for (const [harness, inputs] of [['claude', claudeInputs(f.root)], ['codex', codexInputs(f.root)]]) {
    for (const [input, expected, bind] of inputs) {
      const started = [];
      const {output, unavailable} = await hookOutput(JSON.stringify(input), {stateDir: f.stateDir, steps: {start: (b, dir) => started.push([b, dir])}});
      assertExpected(output, expected, input);
      assert.equal(unavailable, false, `${harness} ${input.hook_event_name}`);
      assert.deepEqual(started, bind ? [[{root: f.root, artifact: 'demo', change: 'change-live', task: 'a.md', session: input.session_id, agent: input.agent_id, unit: 'live'}, f.stateDir]] : [], `${harness} ${input.hook_event_name}`);
    }
  }
  // The observer recorded the supported events of both harnesses and no payload text.
  assert.equal(eventCount(f.stateDir), claudeInputs(f.root).length - 1 + codexInputs(f.root).length);
  await assertNoPayload(f.stateDir);
});

test(`AIA1: recorded inputs of both harnesses get the same output from the ${executable ? 'built executable' : 'source entry'}`, async t => {
  t.diagnostic(`program: ${program.join(' ')}`);
  const f = await fixture(t);
  for (const [input, expected] of [...claudeInputs(f.root), ...codexInputs(f.root)].filter(([input]) => input.tool_input?.file_path === undefined)) {
    const {output, stderr} = await hookProcess(input, {stateDir: f.stateDir});
    assertExpected(output, expected, input);
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
  for (const args of [['--unknown'], ['--state-dir'], ['--state-dir', 'relative/dir'], ['--state-dir', f.stateDir, 'extra']])
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
  assertExpected(context.output, 'context', base);assert.equal(context.stderr, UNAVAILABLE);
  const refused = await hookProcess({...base, hook_event_name: 'PreToolUse', tool_input: {command: 'git commit -m x'}}, {stateDir: file, env: {ARTIFACT_PLANE_STATE_DIR: dir}});
  assert.deepEqual([refused.output, refused.stderr], [deny('commits to main'), UNAVAILABLE]);
  const read = await hookProcess({...base, hook_event_name: 'PreToolUse', agent_id: 'child', tool_input: {file_path: join(f.root, TASK)}}, {stateDir: file, env: {ARTIFACT_PLANE_STATE_DIR: dir}});
  assert.deepEqual([read.output, read.stderr], [{}, UNAVAILABLE]);
  assert.equal(await readFile(file, 'utf8'), '');
});

test('AI7: a step that runs longer than its limit returns {}, and the other steps keep their output', async t => {
  const f = await fixture(t), never = () => new Promise(() => {});
  const limits = {SessionStart: 50, PreToolUse: 50, stop: 50};
  const run = (input, steps) => hookOutput(JSON.stringify({session_id: 's', cwd: f.root, ...input}), {stateDir: f.stateDir, limits, steps});
  const started = Date.now();
  assert.deepEqual(await run({hook_event_name: 'SessionStart'}, {status: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'Stop'}, {stop: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', tool_input: {command: 'git status'}}, {reserved: never}), {output: {}, unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', agent_id: 'c', tool_input: {file_path: TASK}}, {infer: never}), {output: {}, unavailable: true});
  assert.ok(Date.now() - started < 2000, `${Date.now() - started} ms`);
  // Errors of one step leave the others: a failed observer and a failed binding keep the refusal.
  const failed = () => {throw Error('broken');};
  assert.deepEqual(await run({hook_event_name: 'PreToolUse', tool_input: {command: 'git commit -m x'}}, {observe: failed, infer: failed}), {output: deny('commits to main'), unavailable: true});
  assert.deepEqual(await run({hook_event_name: 'SessionStart'}, {status: failed}), {output: {}, unavailable: true});
  const context = await hookOutput(JSON.stringify({session_id: 's', cwd: f.root, hook_event_name: 'SessionStart'}), {stateDir: f.stateDir, steps: {observe: failed}});
  assert.equal(context.unavailable, true);assertExpected(context.output, 'context', {});
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

test('server/app.js imports the module of a command only when that command runs', async () => {
  const source = await readFile(app, 'utf8');
  assert.deepEqual([...source.matchAll(/^import .* from "([^"]+)"/gm)].map(m => m[1]), ['../package.json', 'node:path']);
  for (const module of ['./http.js', './flow-mcp.js', './agent-hook.js', './runtime-cli.js', './flow-model-install.js']) assert.ok(source.includes(`await import("${module}")`), module);
});
