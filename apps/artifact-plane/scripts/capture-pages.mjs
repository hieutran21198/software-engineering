// Golden captures of a Plane revision (claim golden-captures, CP1). Extracts
// apps/artifact-plane of the revision with git archive into a temporary
// directory outside the worktree, builds it, serves it with its own server and
// state directory, captures the pages of the golden fixture at 1440 and 390
// pixels and writes the JSON. Removes the temporary directory afterwards.
// Usage: node scripts/capture-pages.mjs [revision] [output]
// Defaults: 0eecce1 (Plane 1.24.0) and test/fixtures/golden-1.24.0.json.
// Needs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when the bundled browser does not run.
import {execFileSync, spawn} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {capturePages, goldenRepository} from '../test/browser/golden-pages.js';

const app = fileURLToPath(new URL('..', import.meta.url));
const [revision = '0eecce1', output = join(app, 'test/fixtures/golden-1.24.0.json')] = process.argv.slice(2);
const port = process.env.PORT || '4353', base = `http://127.0.0.1:${port}`;
const work = await mkdtemp(join(tmpdir(), 'plane-golden-')), build = join(work, 'build'), state = join(work, 'state'), fixtures = join(work, 'fixture');
const run = (command, args, cwd) => execFileSync(command, args, {cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
let server;
try {
  await mkdir(build);await mkdir(state, {mode: 0o700});await mkdir(fixtures);
  const top = run('git', ['rev-parse', '--show-toplevel'], app).trim();
  const tar = join(work, 'source.tar');
  run('git', ['archive', '--format=tar', '-o', tar, revision, 'apps/artifact-plane'], top);
  run('tar', ['-xf', tar, '-C', build]);
  const source = join(build, 'apps/artifact-plane');
  // The installed packages serve the revision only when its lock file is the same.
  if (await readFile(join(source, 'package-lock.json'), 'utf8') !== await readFile(join(app, 'package-lock.json'), 'utf8'))
    throw Error(`package-lock.json of ${revision} differs; install its packages first.`);
  await symlink(join(app, 'node_modules'), join(source, 'node_modules'));
  run(process.execPath, [join(app, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'error'], source);
  const root = await goldenRepository(fixtures);
  server = spawn(process.execPath, ['server/index.js'], {cwd: source, env: {...process.env, PORT: port, ARTIFACT_PLANE_STATE_DIR: state}, stdio: ['ignore', 'pipe', 'inherit']});
  await new Promise((ready, fail) => {server.stdout.on('data', d => {if (String(d).includes('http://')) ready();});server.on('exit', code => fail(Error(`server exited ${code}`)));});
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {});
  try {
    const captures = await capturePages(width => browser.newPage({baseURL: base, viewport: {width, height: width < 500 ? 844 : 1000}}), root);
    await writeFile(resolve(output), JSON.stringify({revision, captures}, null, 2) + '\n');
    console.log(`${Object.keys(captures).length} captures of ${revision} written to ${resolve(output)}`);
  } finally {await browser.close();}
} finally {
  server?.kill();
  await rm(work, {recursive: true, force: true});
}
