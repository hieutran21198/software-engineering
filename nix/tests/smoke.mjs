import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:net';

const [adopt, planePackage] = process.argv.slice(2);
const plane = join(planePackage, 'bin/artifact-plane');
const app = join(planePackage, 'lib/artifact-plane');
const require = createRequire(join(app, 'package.json'));
const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')));
const { StdioClientTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/stdio.js')));
const directory = await mkdtemp(join(tmpdir(), 'nix-packages-'));
const state = join(directory, 'state');
const repository = join(directory, 'repository');
const env = { ...process.env, ARTIFACT_PLANE_STATE_DIR: state };
const run = (command, args, cwd = directory) => execFileSync(command, args, { cwd, env, encoding: 'utf8', timeout: 30000 });
let server, client;
try {
  await mkdir(repository);
  await mkdir(join(repository, 'docs/artifacts'), { recursive: true });
  run('git', ['init', '-q', repository]);
  run('git', ['-C', repository, '-c', 'user.name=Nix check', '-c', 'user.email=check@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture']);
  const help = spawnSync(adopt, ['--help'], { cwd: directory, env, encoding: 'utf8', timeout: 30000 });
  assert.equal(help.status, 0);
  assert.match(help.stdout + help.stderr, /architecture/i);
  const list = run(adopt, ['--list']);
  for (const arch of ['artifact-driven', 'story-driven']) {
    assert.ok(list.includes(arch));
    const project = join(directory, arch);
    await mkdir(project);
    run(adopt, ['--arch', arch, '--project', project]);
    assert.ok((await readFile(join(project, 'docs', arch, 'README.md'), 'utf8')).length);
  }
  const validator = join(directory, 'artifact-driven/docs/artifact-driven/tools/add-validate.mjs');
  assert.ok((await readFile(validator, 'utf8')).length > 1000, 'embedded validator is present');
  assert.equal(JSON.parse(run(process.execPath, [validator, '--repository', repository])).ok, true);
  assert.match(run(plane, ['--help']), /model-install/);
  const metadata = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'));
  assert.equal(run(plane, ['--version']).trim(), metadata.version);
  assert.ok(require('sharp').versions.vips);
  assert.ok(require('onnxruntime-node').InferenceSession);

  const port = await new Promise((resolve, reject) => {
    const listener = createServer();
    listener.on('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const { port } = listener.address();
      listener.close(() => resolve(port));
    });
  });
  server = spawn(plane, ['serve'], { cwd: repository, env: { ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('HTTP startup timeout: ' + stderr)), 30000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(Error(`HTTP exited ${code}: ${stderr}`)); });
    server.stdout.on('data', chunk => {
      if (String(chunk).includes('http://')) { clearTimeout(timer); resolve(); }
    });
  });
  const response = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html/i);
  const asset = html.match(/src="([^"]+\.js)"/);
  assert.ok(asset, 'built JavaScript asset is linked');
  assert.equal((await fetch(new URL(asset[1], `http://127.0.0.1:${port}`))).status, 200);

  client = new Client({ name: 'nix-package-smoke', version: '1.0.0' });
  // Omit --repository to check the wrapper preserves the caller's working directory.
  const transport = new StdioClientTransport({ command: plane, args: ['mcp'], cwd: repository, env, stderr: 'pipe' });
  transport.stderr?.on('data', chunk => process.stderr.write(chunk));
  await client.connect(transport);
  const tools = (await client.listTools()).tools.map(tool => tool.name);
  assert.ok(tools.includes('check_records'));
  assert.ok(tools.includes('search_flows'));
  console.log('PASS: adoption, embedded validator, CLI, native modules, HTTP assets and MCP handshake');
} finally {
  await client?.close();
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
}
