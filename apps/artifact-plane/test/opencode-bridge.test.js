import {test} from 'node:test';
import assert from 'node:assert/strict';
import {realpath, mkdtemp, rm, writeFile, readFile, access} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {createPlugin} from '../integration/opencode/index.js';
import {createRunner} from '../integration/opencode/transport.js';
import {RuntimeStore} from '../server/runtime-store.js';
import {runtimeFixture, bind} from './runtime-fixtures.js';
import {fileURLToPath} from 'node:url';

async function host({runner, clock, directory = process.cwd(), locations: sharedLocations} = {}) {
  const hooks = {}, observed = [], disposed = [], queue = [];
  let wake, aborted = false, streamError;
  const locations = sharedLocations || new Map(['a', 'b', 'child'].map(id => [id, {location: {directory, subpath: 'never-append'}, ...(id === 'child' ? {parentID: 'a'} : {})}]));
  const domain = name => ({hook: async (kind, fn) => {
    hooks[`${name}.${kind}`] = fn;
    return {dispose: async () => disposed.push(`${name}.${kind}`)};
  }});
  const ctx = {
    app: {version: '2.1.2'}, location: {directory, project: {canonical: '/wrong-project-root'}},
    session: {...domain('session'), get: async ({sessionID}) => locations.get(sessionID)},
    permission: domain('permission'), tool: domain('tool'),
    event: {async *subscribe({signal}) {
      signal.addEventListener('abort', () => {aborted = true;wake?.();}, {once: true});
      while (!aborted) {
        if (!queue.length) await new Promise(r => {wake = r;});
        if (aborted) break;
        if (streamError) throw streamError;
        const item = queue.shift();
        yield item.event;
        item.done();
      }
    }},
  };
  for (const method of ['prompt', 'synthetic', 'interrupt', 'generate', 'update']) ctx.session[method] = () => assert.fail(`forbidden ${method}`);
  const run = runner || (async (input, options) => {
    observed.push({input, options});
    return input.hook_event_name === 'SessionStart' ? {hookSpecificOutput: {additionalContext: 'Change context\nWorkbench for people: http://localhost:1234'}} : {};
  });
  const cleanup = await createPlugin({runner: run, clock}).setup(ctx);
  return {hooks, observed, disposed, locations, cleanup, get aborted() {return aborted;},
    loseStream: async () => {streamError = Error('private stream failure');wake?.();await new Promise(r => setImmediate(r));},
    emit: event => new Promise(done => {queue.push({event, done});wake?.();}),
    before: e => hooks['tool.execute.before'](e), after: e => hooks['tool.execute.after'](e),
    permission: e => hooks['permission.evaluate'](e), context: e => hooks['session.context'](e)};
}
const tool = (sessionID = 'a', id = 'call', input = {command: 'pwd'}, name = 'shell') => ({sessionID, messageID: 'message', id, tool: name, agent: 'build', input});
const permission = (sessionID = 'a', id = 'call', effect = 'ask') => ({sessionID, action: 'shell', resources: ['not a command'], source: {type: 'tool', messageID: 'message', id}, effect});
function events(h, id = 'a') {
  let seq = 0;
  return (type, data = {}, skip = 0) => {
    seq += skip;
    return h.emit({type: `session.${type}`, durable: {aggregateID: id, seq: seq++}, data: {sessionID: id, ...data}});
  };
}
async function admitted(send, id = 'turn') {
  await send('inbox.enqueued', {inboxID: id, item: {type: 'user', payload: {text: 'PRIVATE PROMPT'}}});
}
async function turn(send, id = 'turn') {
  await admitted(send, id);await send('execution.started');await send('inbox.delivered', {inboxID: id});
}

test('V2 context preserves parts, actual directory and five-second session/worktree cache', async () => {
  let now = 0;
  const h = await host({clock: () => now});
  try {
    const existing = {type: 'text', text: 'Existing'};
    const e = {sessionID: 'a', system: [existing]};
    await h.context(e);await h.context({sessionID: 'a', system: []});
    assert.equal(e.system[0], existing);assert.match(e.system[1].text, /Workbench for people/);
    assert.equal(h.observed.length, 1);assert.equal(h.observed[0].options.timeout, 12000);
    assert.equal(h.observed[0].input.cwd, await realpath(process.cwd()));
    now = 5000;await h.context({sessionID: 'a', system: []});assert.equal(h.observed.length, 2);
    await h.context({sessionID: 'b', system: []});assert.equal(h.observed.length, 3);
    h.locations.get('a').location.directory = '/tmp/opencode';
    const moved = {sessionID: 'a', system: []};await h.context(moved);assert.equal(h.observed.length, 3);assert.deepEqual(moved.system, []);
    h.locations.get('a').location.directory = process.cwd();
    await h.context({sessionID: 'a', system: []});assert.equal(h.observed.length, 4);
    assert.equal(h.observed[0].input.session_id, h.observed[3].input.session_id);
  } finally {await h.cleanup();}
  assert.equal(h.disposed.length, 4);assert.equal(h.aborted, true);
});

test('shell permission uses final mutable keyed input once and never relaxes existing effects', async () => {
  const inputs = [];
  const h = await host({runner: async input => {
    inputs.push(input);
    return input.tool_input?.command === 'gh pr merge' ? {hookSpecificOutput: {permissionDecision: 'deny', permissionDecisionReason: 'Reserved'}} : {};
  }});
  try {
    const a = tool(), b = tool('b');
    await h.before(a);await h.before(b);
    a.input = {command: 'gh pr merge', workdir: '../'};
    const p = permission();await h.permission(p);assert.equal(p.effect, 'deny');assert.equal(p.message, 'Reserved');
    await h.permission(permission());
    const ask = permission('b');await h.permission(ask);assert.equal(ask.effect, 'ask');
    const deny = permission('b', 'call', 'deny');deny.message = 'Original';await h.permission(deny);assert.equal(deny.message, 'Original');
    const unmatched = permission('a', 'missing');await h.permission(unmatched);assert.equal(unmatched.effect, 'ask');
    assert.equal(inputs.filter(e => e.hook_event_name === 'PreToolUse').length, 2);
    assert.equal(inputs[0].tool_input.command, 'gh pr merge');assert.equal(inputs[0].cwd, resolve(process.cwd(), '..'));
    assert.notEqual(inputs[0].session_id, inputs[1].session_id);
    await h.after({...a, status: 'error', error: 'PRIVATE ERROR'});
    await h.after({...b, status: 'completed', result: 'PRIVATE RESULT'});
    assert.equal(inputs.filter(e => e.hook_event_name === 'PostToolUse').length, 2);
    assert.ok(!JSON.stringify(inputs).includes('PRIVATE'));
  } finally {await h.cleanup();}
});

test('reads normalize paths; verified children alone receive unique agent identity', async () => {
  const h = await host();
  try {
    for (const id of ['a', 'b', 'child']) {
      await h.before(tool(id, 'read', {path: 'docs/artifacts/demo/changes/change-live/tasks/a.md', unrelated: 'PRIVATE'}, 'read'));
    }
    const inputs = h.observed.map(e => e.input);
    assert.equal(inputs[0].tool_input.file_path, resolve('docs/artifacts/demo/changes/change-live/tasks/a.md'));
    assert.equal(inputs[0].agent_id, '');assert.equal(inputs[1].agent_id, '');assert.equal(inputs[2].agent_id, 'child');
    assert.equal(new Set(inputs.map(e => e.session_id)).size, 3);
    assert.ok(!JSON.stringify(inputs).includes('PRIVATE'));assert.ok(inputs.every(e => !e.turn_id));
    const e = tool('a', 'home', {command: 'pwd', workdir: '~'});
    await h.before(e);await h.permission(permission('a', 'home'));
    assert.equal(h.observed.at(-1).input.cwd, homedir());
  } finally {await h.cleanup();}
});

test('durable user delivery supplies stable turn; continuations and terminal never validate or force continuation', async () => {
  const h = await host(), send = events(h);
  try {
    await turn(send);
    await send('unknown-but-durable');
    const e = tool();await h.before(e);await h.permission(permission());await h.after({...e, status: 'completed', result: 'PRIVATE RESULT'});
    await h.context({sessionID: 'a', system: []});
    await send('execution.succeeded');await send('idle');
    const inputs = h.observed.map(e => e.input);
    assert.ok(inputs.every(e => e.turn_id === 'turn'));
    assert.equal(inputs.filter(e => e.hook_event_name === 'Stop').length, 1);
    assert.equal(inputs.at(-1).stop_hook_active, true);
    assert.ok(!JSON.stringify(inputs).includes('PRIVATE'));
    assert.ok(!JSON.stringify(inputs).includes('validated'));
  } finally {await h.cleanup();}
});

for (const scenario of ['gap', 'missing-admission', 'multiple', 'late', 'failed', 'move', 'new-turn-late-terminal']) {
  test(`uncertain settlement is suppressed: ${scenario}`, async () => {
    const h = await host(), send = events(h);
    try {
      if (scenario === 'missing-admission' || scenario === 'late') {
        await send('execution.started');await send('inbox.delivered', {inboxID: 'unknown'});
      } else await turn(send);
      if (scenario === 'gap') await send('unknown', {}, 1);
      if (scenario === 'multiple') {await admitted(send, 'second');await send('inbox.delivered', {inboxID: 'second'});}
      if (scenario === 'move') h.locations.get('a').location.directory = '/tmp/opencode';
      if (scenario === 'new-turn-late-terminal') {await admitted(send, 'new');await send('inbox.delivered', {inboxID: 'new'});}
      await send(scenario === 'failed' ? 'execution.failed' : 'execution.succeeded');
      assert.equal(h.observed.filter(e => ['Stop', 'Interrupt'].includes(e.input.hook_event_name)).length, 0);
      if (scenario === 'gap' || scenario === 'move') {
        if (scenario === 'move') h.locations.get('a').location.directory = process.cwd();
        await h.before(tool('a', 'read', {path: 'a.md'}, 'read'));assert.ok(!h.observed.at(-1).input.turn_id);
      }
    } finally {await h.cleanup();}
  });
}

test('interrupt is distinct from success; stale calls, abandoned calls and moves cannot attach to a new turn', async () => {
  let now = 0;
  const h = await host({clock: () => now}), send = events(h);
  try {
    await turn(send);await send('execution.interrupted');
    assert.equal(h.observed.at(-1).input.hook_event_name, 'Interrupt');
    await h.before(tool());now = 60000;await h.permission(permission());assert.equal(h.observed.length, 2);
    await h.before(tool('a', 'moved'));h.locations.get('a').location.directory = '/tmp/opencode';
    await h.after({...tool('a', 'moved'), status: 'completed'});assert.equal(h.observed.length, 2);
  } finally {await h.cleanup();}
});

test('hook failures leave asks unchanged and cleanup disables new work', async () => {
  const h = await host({runner: async () => {throw Error('private failure');}});
  await h.before(tool());const p = permission();await h.permission(p);assert.equal(p.effect, 'ask');
  const e = {sessionID: 'a', system: []};await h.context(e);assert.deepEqual(e.system, []);
  await h.cleanup();await h.context(e);assert.deepEqual(e.system, []);
});

test('stream failure clears active turns; late tool results cannot revive them', async () => {
  const h = await host(), send = events(h);
  try {
    await turn(send);await h.before(tool());await h.loseStream();
    await h.after({...tool(), status: 'completed', result: 'PRIVATE'});
    assert.equal(h.observed.length, 1);
    await h.before(tool('a', 'read', {path: 'a.md'}, 'read'));
    assert.ok(!h.observed.at(-1).input.turn_id);
  } finally {await h.cleanup();}
});

test('new deliveries suppress late earlier tool completion and call cache stays bounded', async () => {
  const h = await host(), send = events(h);
  try {
    await turn(send);await h.before(tool());
    await admitted(send, 'new');await send('inbox.delivered', {inboxID: 'new'});
    await h.after({...tool(), status: 'completed'});
    assert.equal(h.observed.length, 2);
    for (let i = 0; i < 1025; i++) await h.before(tool('b', String(i)));
    await h.permission(permission('b', '0'));assert.equal(h.observed.length, 2);
    await h.permission(permission('b', '1024'));assert.equal(h.observed.length, 3);
  } finally {await h.cleanup();}
});

test('real hook subprocess keeps policy, task attempts and persistence privacy boundary unchanged', async () => {
  const f = await runtimeFixture();
  const prior = process.env.ARTIFACT_PLANE_AUTOSTART;
  process.env.ARTIFACT_PLANE_AUTOSTART = '0';
  const run = createRunner({command: process.execPath, args: [fileURLToPath(new URL('../server/app.js', import.meta.url)), 'hook', '--state-dir', f.stateDir]});
  const inputs = [];
  const runner = async (input, options) => {inputs.push(input);return run(input, options);};
  runner.close = run.close;
  const h = await host({runner, directory: f.root}), send = events(h);
  h.locations.get('a').location.directory = f.root;
  let store;
  try {
    const context = {sessionID: 'a', system: []};await h.context(context);
    assert.equal(context.system.length, 1);assert.ok(context.system[0].text.length > 0);
    store = new RuntimeStore({stateDir: f.stateDir});
    await bind(store, f.root, 'a.md', inputs[0].session_id);
    await turn(send);
    const read = tool('a', 'read', {path: 'docs/artifacts/demo/changes/change-live/tasks/a.md', unrelated: 'ARGUMENT_PRIVATE'}, 'read');
    await h.before(read);await h.after({...read, status: 'completed', result: 'RESULT_PRIVATE'});
    const shell = tool('a', 'shell', {command: 'echo COMMAND_PRIVATE; gh pr merge'});
    await h.before(shell);
    const p = permission('a', 'shell');await h.permission(p);assert.equal(p.effect, 'deny');
    await h.permission(permission('a', 'shell'));
    await h.after({...shell, status: 'error', error: 'ERROR_PRIVATE'});
    await send('execution.succeeded');
    const query = store.query(f.root);
    assert.equal(query.attempts.length, 1);
    assert.equal(query.attempts[0].state, 'validating');
    assert.equal(query.attempts[0].validation, undefined);
    assert.equal(query.events.filter(e => e.kind === 'PreToolUse').length, 2);
    assert.equal(query.events.filter(e => e.kind === 'PostToolUse').length, 2);
    assert.equal(query.events.filter(e => e.kind === 'Stop').length, 1);
    assert.ok(!JSON.stringify(query).includes('_PRIVATE'));
    assert.ok(!JSON.stringify(query).includes('PRIVATE PROMPT'));
    assert.ok(!JSON.stringify(query).includes('gh pr merge'));
  } finally {
    store?.close();await h.cleanup();await f.cleanup();
    if (prior === undefined) delete process.env.ARTIFACT_PLANE_AUTOSTART;else process.env.ARTIFACT_PLANE_AUTOSTART = prior;
  }
});

test('real reserved-action denial survives unavailable observation storage', async () => {
  const f = await runtimeFixture();
  const run = createRunner({command: process.execPath, args: [fileURLToPath(new URL('../server/app.js', import.meta.url)), 'hook', '--state-dir', '/dev/null/unavailable']});
  const h = await host({runner: run, directory: f.root});
  try {
    await h.before(tool('a', 'call', {command: 'gh pr merge'}));
    const p = permission();await h.permission(p);assert.equal(p.effect, 'deny');assert.match(p.message, /reserved|people|human/i);
  } finally {await h.cleanup();await f.cleanup();}
});

test('real child task read infers one binding without permission duplication', async () => {
  const f = await runtimeFixture();
  const run = createRunner({command: process.execPath, args: [fileURLToPath(new URL('../server/app.js', import.meta.url)), 'hook', '--state-dir', f.stateDir]});
  const h = await host({runner: run, directory: f.root});
  let store;
  try {
    const read = tool('child', 'read', {path: 'docs/artifacts/demo/changes/change-live/tasks/a.md'}, 'read');
    await h.before(read);await h.before(read);
    store = new RuntimeStore({stateDir: f.stateDir});
    let query;
    for (let i = 0; i < 100; i++) {
      query = store.query(f.root);
      if (query.attempts.length) break;
      await new Promise(r => setTimeout(r, 50));
    }
    assert.equal(query.attempts.length, 1);assert.equal(query.attempts[0].agent, 'child');
    const shell = tool('child', 'shell', {command: 'pwd'});
    await h.before(shell);await h.permission(permission('child', 'shell'));await h.permission(permission('child', 'shell'));
    await h.after({...shell, status: 'completed'});
    assert.equal(store.query(f.root).attempts.length, 1);
  } finally {store?.close();await h.cleanup();await f.cleanup();}
});

test('160-character runtime labels preserve long session and child identities across Git worktrees', async () => {
  const f = await runtimeFixture(), g = await runtimeFixture();
  const long = 'ses_' + 'common'.repeat(70), ids = [long + 'a', long + 'b'];
  const first = await host({directory: f.root}), second = await host({directory: g.root});
  try {
    for (const h of [first, second]) for (const id of ids) {
      h.locations.set(id, {location: {directory: h === first ? f.root : g.root}, parentID: 'parent'});
      await h.context({sessionID: id, system: []});
    }
    const inputs = [...first.observed, ...second.observed].map(e => e.input);
    assert.equal(new Set(inputs.map(i => i.session_id)).size, 4);
    assert.ok(inputs.every(i => i.session_id.length <= 160 && i.agent_id.length <= 160));
    assert.notEqual(inputs[0].agent_id, inputs[1].agent_id);
    assert.equal(inputs[0].agent_id, inputs[2].agent_id);
    // The store applies its real truncating label function without collisions.
    const store = new RuntimeStore({stateDir: f.stateDir});
    try {
      for (const i of inputs) store.observe({...i, hook_event_name: 'PreToolUse'});
      const stored = store.db.prepare('SELECT session,agent FROM events').all();
      assert.equal(new Set(stored.map(i => i.session)).size, 4);
      assert.deepEqual(stored.map(i => i.session), inputs.map(i => i.session_id));
    } finally {store.close();}
  } finally {await first.cleanup();await second.cleanup();await f.cleanup();await g.cleanup();}
});

test('nested location identity uses canonical Git top-level, not location directory', async () => {
  const f = await runtimeFixture(), nested = resolve(f.root, 'docs');
  const rootHost = await host({directory: f.root}), nestedHost = await host({directory: nested});
  try {
    await rootHost.context({sessionID: 'a', system: []});await nestedHost.context({sessionID: 'a', system: []});
    const a = rootHost.observed[0].input, b = nestedHost.observed[0].input;
    assert.equal(a.session_id, b.session_id);assert.match(a.session_id, /^opencode:a:/);
    assert.equal(a.cwd, f.root);assert.equal(b.cwd, nested);
    const other = tool('a', 'call', {command: 'pwd', workdir: '../'});
    await nestedHost.before(other);await nestedHost.permission(permission());
    assert.equal(nestedHost.observed.at(-1).input.cwd, f.root);
    assert.equal(nestedHost.observed.at(-1).input.session_id, a.session_id);
  } finally {await rootHost.cleanup();await nestedHost.cleanup();await f.cleanup();}
});

for (const priorTurn of [undefined, 'old']) test(`policy survives new user delivery without borrowing a turn (snapshot ${priorTurn})`, async () => {
  const inputs = [];
  const h = await host({runner: async input => {
    inputs.push(input);
    return {hookSpecificOutput: {permissionDecision: 'deny', permissionDecisionReason: 'Reserved for people'}};
  }}), send = events(h);
  try {
    if (priorTurn) await turn(send, priorTurn);
    await h.before(tool('a', 'call', {command: 'gh pr merge'}));
    if (priorTurn) {await admitted(send, 'new');await send('inbox.delivered', {inboxID: 'new'});}
    else await turn(send, 'new');
    const p = permission();await h.permission(p);assert.equal(p.effect, 'deny');
    const pre = inputs.filter(i => i.hook_event_name === 'PreToolUse');assert.equal(pre.length, 1);assert.ok(!('turn_id' in pre[0]));
    await h.after({...tool(), status: 'completed'});
    const post = inputs.filter(i => i.hook_event_name === 'PostToolUse');
    assert.equal(post.length, priorTurn ? 0 : 1);
    assert.ok(post.every(i => !('turn_id' in i)));
  } finally {await h.cleanup();}
});

test('two exact-location owners observe shared public stream once through moves out and back', async () => {
  const f = await runtimeFixture(), nested = resolve(f.root, 'docs');
  const locations = new Map([['a', {location: {directory: f.root}}], ['b', {location: {directory: nested}}]]);
  const a = await host({directory: f.root, locations}), b = await host({directory: nested, locations});
  const shared = {emit: event => Promise.all([a.emit(event), b.emit(event)])};
  const sendA = events(shared, 'a'), sendB = events(shared, 'b');
  const lifecycle = h => h.observed.map(i => i.input.hook_event_name);
  try {
    await turn(sendA, 'a1');await turn(sendB, 'b1');
    // An inaccessible unrelated aggregate must not invalidate an owned session.
    await shared.emit({type: 'session.unknown', durable: {aggregateID: 'missing', seq: 0}, data: {sessionID: 'missing'}});
    await sendA('execution.succeeded');await sendB('execution.succeeded');
    assert.deepEqual(lifecycle(a), ['UserPromptSubmit', 'Stop']);assert.deepEqual(lifecycle(b), ['UserPromptSubmit', 'Stop']);
    await a.before(tool());
    locations.get('a').location.directory = nested;
    await sendA('moved');
    const p = permission();await a.permission(p);assert.equal(p.effect, 'ask');
    await sendA('execution.succeeded'); // No delivered user in this owner's window.
    assert.equal(a.observed.length, 2);assert.equal(b.observed.length, 2);
    await turn(sendA, 'a2');await sendA('execution.interrupted');
    assert.deepEqual(lifecycle(b), ['UserPromptSubmit', 'Stop', 'UserPromptSubmit', 'Interrupt']);
    locations.get('a').location.directory = f.root;await sendA('moved');
    await sendA('execution.succeeded');
    await turn(sendA, 'a3');await sendA('execution.succeeded');
    assert.deepEqual(lifecycle(a), ['UserPromptSubmit', 'Stop', 'UserPromptSubmit', 'Stop']);
    assert.equal(b.observed.length, 4);
    assert.equal(a.observed[0].input.session_id, b.observed[2].input.session_id);
  } finally {await a.cleanup();await b.cleanup();await f.cleanup();}
});

test('non-Git locations fail open without observations', async () => {
  const directory = await mkdtemp('/tmp/opencode/bridge-nongit-'), h = await host({directory});
  try {
    const e = {sessionID: 'a', system: []};await h.context(e);await h.before(tool());
    const p = permission();await h.permission(p);assert.equal(p.effect, 'ask');
    assert.deepEqual(e.system, []);assert.equal(h.observed.length, 0);
  } finally {await h.cleanup();await rm(directory, {recursive: true, force: true});}
});

test('a move during policy execution cannot apply an old-directory response or reuse its correlation', async () => {
  let release, entered;
  const started = new Promise(r => {entered = r;});
  const h = await host({runner: async () => {entered();return new Promise(r => {release = r;});}});
  try {
    await h.before(tool());const p = permission();const pending = h.permission(p);await started;
    h.locations.get('a').location.directory = '/tmp/opencode';
    release({hookSpecificOutput: {permissionDecision: 'deny'}});await pending;
    assert.equal(p.effect, 'ask');
    h.locations.get('a').location.directory = process.cwd();
    const next = permission();await h.permission(next);assert.equal(next.effect, 'ask');
  } finally {await h.cleanup();}
});

test('permission source cannot override the enclosing session identity', async () => {
  const h = await host();
  try {
    await h.before(tool('b'));
    const p = permission('a');p.source.sessionID = 'b';await h.permission(p);
    assert.equal(p.effect, 'ask');assert.equal(h.observed.length, 0);
  } finally {await h.cleanup();}
});

test('a durable move discards correlations even after the session has already moved back', async () => {
  const h = await host(), send = events(h);
  try {
    await h.context({sessionID: 'a', system: []});await h.before(tool());
    // Current location is already back at the owner while the stream catches up.
    await send('moved', {location: {directory: '/tmp/opencode'}});
    await send('moved', {location: {directory: process.cwd()}});
    const p = permission();await h.permission(p);assert.equal(p.effect, 'ask');
    assert.equal(h.observed.length, 1);
    await h.context({sessionID: 'a', system: []});assert.equal(h.observed.length, 2);
  } finally {await h.cleanup();}
});

test('Git identity lookup fails open on missing executable, excess output and timeout, and reaps on unload', async () => {
  const directory = await mkdtemp('/tmp/opencode/bridge-git-'), git = resolve(directory, 'git'), marker = resolve(directory, 'pid');
  const h = await host(), prior = process.env.PATH;
  const context = () => h.context({sessionID: 'a', system: []});
  const script = body => writeFile(git, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},String(process.pid));\n${body}\n`, {mode: 0o700});
  const assertReaped = async () => {
    const pid = Number(await readFile(marker, 'utf8'));
    assert.throws(() => process.kill(pid, 0), {code: 'ESRCH'});
  };
  try {
    process.env.PATH = directory;
    await context();assert.equal(h.observed.length, 0);
    await script('process.stdout.write("x".repeat(65537));setInterval(()=>{},1000);');
    await context();assert.equal(h.observed.length, 0);await assertReaped();
    await script('setInterval(()=>{},1000);');
    await context();assert.equal(h.observed.length, 0);await assertReaped();
    await rm(marker);
    const pending = context();
    for (let i = 0; i < 100; i++) {
      try {await access(marker);break;} catch {await new Promise(r => setTimeout(r, 10));}
    }
    await access(marker);await h.cleanup();await pending;await assertReaped();
    assert.equal(h.observed.length, 0);
  } finally {
    if (prior === undefined) delete process.env.PATH;else process.env.PATH = prior;
    await h.cleanup();await rm(directory, {recursive: true, force: true});
  }
});
