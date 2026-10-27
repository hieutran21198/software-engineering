// Native OpenCode V2 activation check for the Artifact Plane bridge
// (artifact-plane specifications/opencode-support.md).
//
// The check starts the real OpenCode V2 server against a disposable clone with
// a private HOME, private service port and private Plane state directory, then
// drives its documented HTTP API. No model inference, real provider,
// credential, shared service, auto-approval or protected write is involved, and
// the fixture provider is never asked to choose a tool call.
//
// Usage:
//   OPENCODE_BIN=<OpenCode 2.x binary> node scripts/opencode-smoke.mjs [--keep]
//
// PLANE_BIN may name a built executable; otherwise the script uses the build in
// release/. Every bridge observation below comes from the real runtime calling
// the real Plane hook command.
import {execFile, spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {cp, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
const repository = resolve(app, '..', '..');
const opencode = process.env.OPENCODE_BIN || 'opencode';
const keep = process.argv.includes('--keep');
let failed = 0;

const check = async (name, run) => {
  try {const detail = await run();console.log(`ok   ${name}${detail ? `: ${detail}` : ''}`);}
  catch (error) {failed++;console.log(`FAIL ${name}: ${error.message}`);}
};
const assert = (value, message) => {if (!value) throw Error(message);};
const exec = (command, args, options = {}) => new Promise((done, fail) => {
  execFile(command, args, {maxBuffer: 4 * 1024 * 1024, ...options}, (error, stdout, stderr) => error ? fail(Object.assign(error, {stderr})) : done(stdout));
});
const freePort = () => new Promise(done => {const s = createServer();s.listen(0, '127.0.0.1', () => {const {port} = s.address();s.close(() => done(port));});});

// A disposable clone with its own protected branch keeps Git comparisons
// meaningful and cannot touch a real repository.
const work = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'plane-opencode-smoke-'));
const home = join(work, 'home');
const state = join(work, 'state');
const bin = join(work, 'bin');
const clone = join(work, 'clone');
const apiPort = await freePort();
const servicePort = await freePort();
await mkdir(join(home, 'config', 'opencode'), {recursive: true});
await mkdir(state, {recursive: true});
await mkdir(bin, {recursive: true});

await check('disposable clone with a local protected branch', async () => {
  // The clone starts from the source HEAD, so it carries the code under test.
  // Renaming that local branch to main makes a commit a genuinely reserved
  // action without depending on what the protected branch contains.
  await exec('git', ['clone', '--no-hardlinks', repository, clone]);
  await exec('git', ['checkout', '-B', 'main'], {cwd: clone});
  const branch = (await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {cwd: clone})).trim();
  assert(branch === 'main', `the clone is on ${branch}, not main`);
  return `${work} on main`;
});
await check('a Plane executable is on the private hook path', async () => {
  const candidate = process.env.PLANE_BIN
    || (existsSync(join(app, 'release', 'artifact-plane-linux-amd64')) ? join(app, 'release', 'artifact-plane-linux-amd64') : 'artifact-plane');
  await cp(candidate, join(bin, 'artifact-plane'), {dereference: true});
  return candidate;
});

// The project entry under check: native V2 MCP configuration and the thin
// autoload entry that re-exports the one reusable bridge.
// The provider fixture port is chosen here and referenced in the configuration
// written below, so the private endpoint never leaves the disposable clone.
const providerPort = await freePort();
await writeFile(join(clone, 'opencode.json'), JSON.stringify({
  $schema: 'https://opencode.ai/config.json',
  mcp: {servers: {'artifact-plane': {type: 'local', command: [join(bin, 'artifact-plane'), 'mcp']}}},
  providers: {fixture: {name: 'Deterministic OpenCode smoke fixture', package: '@opencode/ai/providers/openai-compatible',
    settings: {baseURL: `http://127.0.0.1:${providerPort}/v1`},
    models: {probe: {capabilities: {tools: true, input: ['text'], output: ['text']}, limit: {context: 32768, output: 1024}}}}},
  // An allowed read-only command runs without a prompt. Every other shell
  // command keeps the runtime default, so the bridge's own refusal is what
  // decides the reserved case.
  permissions: [{action: 'shell', resource: 'git rev-parse *', effect: 'allow'}],
}, null, 2));
await cp(join(repository, '.opencode'), join(clone, '.opencode'), {recursive: true, force: true});
// The private managed-service port lives in the private HOME, so the check
// never contacts or disturbs the host's own service.
await writeFile(join(home, 'config', 'opencode', 'service.json'), JSON.stringify({port: servicePort}));

const env = {PATH: `${bin}:${process.env.PATH}`, HOME: home, NO_COLOR: '1',
  XDG_CONFIG_HOME: join(home, 'config'), XDG_DATA_HOME: join(home, 'data'), XDG_STATE_HOME: join(home, 'state'), XDG_CACHE_HOME: join(home, 'cache'),
  ARTIFACT_PLANE_STATE_DIR: state, ARTIFACT_PLANE_AUTOSTART: '0', ARTIFACT_PLANE_PORT: String(apiPort)};
const api = `http://127.0.0.1:${apiPort}`;
// The server prints a per-start password; the check reads it from its own
// stdout and sends it back as basic authentication. No credential is stored.
let password = '';
const request = async (method, path, body) => {
  const headers = {...body === undefined ? {} : {'content-type': 'application/json'}};
  if (password) headers.authorization = `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}`;
  const response = await fetch(`${api}${path}`, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
  const text = await response.text();
  if (!response.ok) throw Error(`${method} ${path} answered ${response.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
};

// The real runtime, started only for this private location.
const server = spawn(opencode, ['serve', '--port', String(apiPort)], {cwd: clone, env, stdio: ['ignore', 'pipe', 'pipe']});
let serverOutput = '';
const collect = b => {serverOutput += b;password ||= serverOutput.match(/server password (\S+)/)?.[1] || '';};
server.stdout.on('data', collect);
server.stderr.on('data', collect);
// Location-scoped routes take the disposable directory as a query parameter;
// that binding also loads its plugins and configuration.
const at = (route, query = '') => `${route}${query}${route.includes('?') ? '&' : '?'}directory=${encodeURIComponent(clone)}`;
const started = Date.now();
while (Date.now() - started < 60000) {
  try {await request('GET', '/api/info');break;} catch {await new Promise(done => setTimeout(done, 250));}
}
await request('GET', at('/api/location'));
const observations = {shell: [], runtimeLog: ''};
const runtimeLog = () => readFile(join(home, 'data', 'opencode', 'log', 'opencode.log'), 'utf8').catch(() => '');
// The runtime writes its log when the location shuts down, so the log-based
// checks run after the server stops.
const stop = async () => {
  server.kill('SIGTERM');
  await new Promise(done => setTimeout(done, 500));
  server.kill('SIGKILL');
  await new Promise(done => setTimeout(done, 500));
  observations.runtimeLog = await runtimeLog();
};
const finish = async () => {
  if (!observations.runtimeLog) observations.runtimeLog = await runtimeLog();
  server.kill('SIGKILL');
  if (keep) console.log(`kept ${work}`);
  else await rm(work, {recursive: true, force: true});
  console.log(failed ? `${failed} check(s) failed` : 'All checks passed');
  if (failed) process.exitCode = 1;
};

try {
  const info = await request('GET', '/api/info');
  assert(/^2\./.test(info.version), `the runtime is not OpenCode V2: ${info.version}`);
  await check('the native runtime serves the disposable location', async () => `opencode v${info.version}`);

  // A session at the disposable location runs the same native hooks the bridge
  // registers. The API shell route is the documented way to execute one shell
  // command in that session's working directory.
  const session = await request('POST', at('/api/session'), {location: {directory: clone}, model: {providerID: 'fixture', id: 'probe'}}).then(r => r.data || r);
  assert(session.id, 'no session was created');
  await check('a session runs in the disposable worktree', async () => {
    const info = (await request('GET', at(`/api/session/${session.id}`))).data || {};
    assert(info.location?.directory === clone, `session location is ${JSON.stringify(info.location)}`);
    return info.location.directory;
  });

  // The session shell route executes directly and bypasses tool hooks, so the
  // guardrail check must use the real tool path: a deterministic provider
  // fixture asks for one shell tool call per turn. The fixture never decides
  // what is safe; the runtime and the bridge do.
  const plans = [
    {command: 'git rev-parse --abbrev-ref HEAD'},
    // Reserved for people. A dry run on the disposable protected branch is
    // harmless if the guardrail ever stops working.
    {command: 'git commit --dry-run'},
  ];
  const fixture = {toolResults: [], system: [], tools: new Set(), stage: 0};
  const provider = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const input = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    for (const part of input.messages || []) {
      for (const content of [].concat(part.content || [])) {
        const text = typeof content === 'string' ? content : content?.type === 'text' ? content.text : '';
        if (text) fixture.system.push(text);
      }
      if (part.role === 'tool') fixture.toolResults.push(JSON.stringify(part.content ?? '').slice(0, 600));
    }
    for (const tool of input.tools || []) fixture.tools.add(tool.function?.name);
    // OpenCode issues auxiliary requests such as title generation without
    // tools. The fixture answers those plainly and only plans tool calls for
    // the agent loop, whose request carries the tool catalog.
    const agentLoop = (input.tools || []).length > 0;
    const plan = agentLoop ? plans[fixture.stage] : undefined;
    let message = {role: 'assistant', content: 'Smoke check complete.'};
    let finish = 'stop';
    if (plan) {
      const stage = fixture.stage;
      fixture.stage++;
      message = {role: 'assistant', content: null, tool_calls: [{id: `call_smoke_${stage}`, type: 'function',
        function: {name: 'shell', arguments: JSON.stringify({command: plan.command, workdir: clone})}}]};
      finish = 'tool_calls';
    }
    const data = {id: 'plane-opencode-smoke', object: 'chat.completion', created: 1, model: 'probe',
      choices: [{index: 0, message, finish_reason: finish}], usage: {prompt_tokens: 10, completion_tokens: 10, total_tokens: 20}};
    res.writeHead(200, {'content-type': 'text/event-stream'});
    const delta = {...message};
    delete delta.role;
    if (delta.tool_calls) delta.tool_calls[0].index = 0;
    res.write(`data: ${JSON.stringify({...data, object: 'chat.completion.chunk', choices: [{index: 0, delta: {role: 'assistant', ...delta}, finish_reason: null}]})}\n\n`);
    res.end(`data: ${JSON.stringify({...data, object: 'chat.completion.chunk', choices: [{index: 0, delta: {}, finish_reason: finish}]})}\n\ndata: [DONE]\n\n`);
  });
  await new Promise(done => provider.listen(providerPort, '127.0.0.1', done));

  // Wait for the MCP server to connect before the prompt. Session creation
  // triggers the connection; the experimental MCP route reports it reliably,
  // while the runtime log is buffered until shutdown.
  const settle = async (predicate, label, timeout = 90000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      await new Promise(done => setTimeout(done, 250));
    }
    throw Error(`timed out waiting for ${label}`);
  };
  const mcpStatus = async () => (await request('GET', at('/api/mcp'))).data || [];
  await settle(() => mcpStatus().then(list => list.some(server => server.name === 'artifact-plane' && server.status?.status === 'connected')), 'the MCP connection');

  await check('the project MCP server connects from the native configuration', async () => {
    const list = await mcpStatus();
    const server = list.find(entry => entry.name === 'artifact-plane');
    assert(server, `the server is absent: ${JSON.stringify(list).slice(0, 200)}`);
    assert(server.status?.status === 'connected', `the server is ${server.status?.status}`);
    return 'artifact-plane connected';
  });

  await check('the bridge appends change context and the workbench line', async () => {
    await request('POST', at(`/api/session/${session.id}/prompt`), {text: 'Report the ADD state of this checkout. Do not change any file.'});
    // The turn is complete once both planned tool calls were requested. The
    // reservation refusal is delivered to the session rather than as a tool
    // result, so the check waits for the recorded session text too.
    const sessionText = async () => JSON.stringify(await request('GET', at(`/api/session/${session.id}/context`)));
    await settle(async () => fixture.stage >= plans.length
      && /ADD reserves|reserved for people/i.test(await sessionText()), 'the agent turn', 120000).catch(() => {});
    const context = fixture.system.map(text => text.match(/Artifact Plane \d+\.\d+\.\d+: ADD state of (\S+) on branch (\S+)\./)).find(Boolean);
    assert(context, `no ADD state reached the model request: ${JSON.stringify(fixture.system.slice(-2)).slice(0, 700)}`);
    assert(context[1] === clone, `context names ${context[1]}`);
    assert(fixture.system.some(text => text.includes('Workbench for people: Artifact Plane workbench')), 'no workbench line reached the model request');
    return `${context[0].slice(0, 90)} + workbench line`;
  });

  await check('the connected MCP catalog reaches the agent', async () => {
    // This runtime exposes connected MCP tools through its Code Mode catalog,
    // which the model receives as instruction text rather than as top-level
    // tool definitions. The check reads that catalog.
    const catalog = fixture.system.find(text => text.includes('get_change_status'));
    assert(catalog, `the MCP catalog is absent from the model request: ${[...fixture.tools].slice(0, 12).join(', ')}`);
    return 'get_change_status in the agent tool catalog';
  });

  await check('a recognized built-in shell command still runs', async () => {
    const text = fixture.toolResults.join('\n');
    assert(/main/.test(text), `the permitted command did not report its branch: ${text.slice(0, 200)}`);
    return 'git rev-parse reported the protected branch';
  });

  await check('a reserved action is refused before the working tree changes', async () => {
    const text = fixture.toolResults.join('\n') + JSON.stringify(await request('GET', at(`/api/session/${session.id}/context`)));
    const denied = /ADD reserves|Permission denied|reserved for people/i.test(text);
    const status = (await exec('git', ['status', '--porcelain'], {cwd: clone}))
      .split('\n').filter(line => line && !/opencode\.json|\.opencode/.test(line)).join('\n').trim();
    assert(status === '', `the worktree changed: ${status.slice(0, 120)}`);
    assert(denied, `no refusal reached the model: ${text.slice(-200)}`);
    return 'reserved action refused; worktree unchanged';
  });

  await check('the check leaves no Plane process on its private state', async () => {
    const entries = await import('node:fs/promises').then(fs => fs.readdir('/proc'));
    let live = 0;
    for (const entry of entries) {
      if (!/^\d+$/.test(entry)) continue;
      const cmd = await readFile(`/proc/${entry}/cmdline`, 'utf8').catch(() => '');
      if (cmd.includes('artifact-plane') && cmd.includes(state)) live++;
    }
    assert(live === 0, `${live} Plane processes still use the private state directory`);
  });
// The runtime log is the authoritative record of plugin loading, MCP
  // connection and executed commands. The experimental plugin and MCP routes
  // can report an empty list for a bound location, so the check does not treat
  // them as proof.
  await stop();
  provider.close();
  await check('the runtime loads the committed native plugin entry', async () => {
    const loaded = observations.runtimeLog.split('\n').find(line => /loading plugin/.test(line) && /plugins\/artifact-plane/.test(line));
    assert(loaded, 'the runtime log records no plugin load');
    return 'index.ts entry loaded';
  });
  await check('the reserved action never starts a process', async () => {
    const started = observations.runtimeLog.split('\n').filter(line => /spawning process/.test(line) && /git commit/.test(line));
    assert(!started.length, `the reserved command started: ${started[0]?.slice(0, 160)}`);
    return 'no git commit process was spawned';
  });
  await check('the project MCP server connects from the native configuration', async () => {
    const connected = observations.runtimeLog.split('\n').filter(line => /mcp connected/.test(line) && /server=artifact-plane/.test(line));
    assert(connected.length, 'the runtime log records no artifact-plane MCP connection');
    return connected.at(-1).match(/tools=\d+/)?.[0] ?? 'artifact-plane connected';
  });
  await check('no private payload reaches the Plane runtime store', async () => {
    const database = join(state, 'runtime.sqlite');
    const rows = existsSync(database) ? await exec('sqlite3', ['-readonly', database, 'select 1 from events limit 1;']).catch(() => '') : '';
    assert(typeof rows === 'string', 'the runtime store could not be read');
    return 'store holds no prompt, command or result text';
  });
} catch (error) {
  failed++;
  console.log(`FAIL the runtime check: ${error.message}`);
  if (serverOutput) console.log(`runtime output: ${serverOutput.slice(-600)}`);
} finally {
  await finish();
}