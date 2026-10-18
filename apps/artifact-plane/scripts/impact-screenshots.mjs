// Screenshots of the Impact page for the owner's review. Clones the given
// repository without hard links into a temporary directory, starts the Plane
// on that clone with a private state directory, captures the research cases at
// 1440 and 390 pixels, and removes the clone. Nothing is written to the source.
// Usage: node scripts/impact-screenshots.mjs <repository> <output-dir> [change title]
// Needs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when the bundled browser does not run.
import {spawn, execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium} from '@playwright/test';

const [repository, output, changeTitle = 'Explain what a change affects'] = process.argv.slice(2);
if (!repository || !output) {console.error('Usage: impact-screenshots.mjs <repository> <output-dir> [change title]');process.exit(2);}
const port = process.env.PORT || '4351', base = `http://127.0.0.1:${port}/`;
const work = await mkdtemp(join(tmpdir(), 'impact-shots-')), clone = join(work, 'repository'), state = join(work, 'state');
await mkdir(state, {mode: 0o700});await mkdir(resolve(output), {recursive: true});
const git = (...args) => execFileSync('git', ['-C', clone, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
execFileSync('git', ['clone', '--quiet', '--no-hardlinks', resolve(repository), clone]);
// The clone compares with main; create it from the source's main when only the remote branch exists.
try {git('rev-parse', '--verify', 'refs/heads/main');} catch {try {git('branch', 'main', 'origin/main');} catch {}}

const server = spawn(process.execPath, ['server/index.js'], {cwd: new URL('..', import.meta.url).pathname, env: {...process.env, PORT: port, ARTIFACT_PLANE_STATE_DIR: state}, stdio: ['ignore', 'pipe', 'inherit']});
await new Promise((ready, fail) => {server.stdout.on('data', d => {if (String(d).includes('http://')) ready();});server.on('exit', code => fail(Error(`server exited ${code}`)));});
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {});
const shots = [];
const capture = async (page, name, full = true) => {const path = join(resolve(output), `${name}.png`);await page.screenshot({path, fullPage: full});shots.push(path);};
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
const answered = page => page.getByRole('region', {name: 'Impact page'}).getByRole('group', {name: 'Show tiers'}).waitFor({timeout: 120000});
async function open(width) {
  const page = await browser.newPage({viewport: {width, height: width < 500 ? 844 : 1000}});
  await page.goto(base);await page.getByLabel('Repository path').fill(clone);
  await page.getByRole('button', {name: 'Open repository', exact: true}).click();
  await page.getByRole('region', {name: 'Work page'}).waitFor({timeout: 60000});
  return page;
}
async function ask(page, path, symbols) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menuitem', {name: /^Impact/}).click();
  const form = page.getByRole('form', {name: 'Ask what a change affects'});
  await form.getByLabel('File or document path', {exact: true}).fill(path);
  if (symbols) await form.getByLabel('Changed symbols (optional)', {exact: true}).fill(symbols);
  await form.getByRole('button', {name: 'Show impact', exact: true}).click();
  await answered(page);
}
const report = [];
try {
  for (const width of [1440, 390]) {
    const page = await open(width);
    // A: a code change with a changed symbol, its detail and the flow it affects.
    await ask(page, 'apps/artifact-plane/server/runtime-store.js', 'RuntimeStore');
    await capture(page, `a-runtime-store-${width}`);
    const flowRow = page.locator('.impact-row').filter({hasText: 'Observe an explicitly bound execution attempt'}).first();
    if (await flowRow.count()) {
      await flowRow.click();await capture(page, `a-runtime-store-selected-${width}`);
      await page.getByRole('button', {name: 'Open flow with affected steps', exact: true}).click();
      await page.getByRole('region', {name: 'Flow page'}).waitFor();await capture(page, `a-flow-highlight-${width}`);
    }
    report.push(`${width} a overflow ${await overflow(page)}`);
    // B: a shared ADD contract and its focused graph.
    await ask(page, 'docs/artifacts/artifact-driven/specifications/knowledge-layout.md');
    await capture(page, `b-knowledge-layout-${width}`);
    await page.getByRole('button', {name: 'Show as graph', exact: true}).click();
    await page.getByRole('group', {name: 'Impact graph'}).waitFor();await page.waitForTimeout(800);
    await capture(page, `b-knowledge-layout-graph-${width}`, false);
    report.push(`${width} b overflow ${await overflow(page)}`);
    // C: the change page action on the clone's current branch.
    if (width < 800) await page.getByRole('button', {name: 'Navigation', exact: true}).click();
    const change = page.getByRole('treeitem', {name: new RegExp('^' + changeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))}).first();
    if (await change.count()) {
      await change.click();await page.getByRole('region', {name: 'Change page'}).waitFor();
      await page.getByRole('button', {name: 'What does this change affect?', exact: true}).click();
      await answered(page);await capture(page, `c-change-${width}`);
      report.push(`${width} c overflow ${await overflow(page)}`);
    } else report.push(`${width} c skipped: no change titled "${changeTitle}"`);
    await page.close();
  }
} finally {
  await browser.close();server.kill();await rm(work, {recursive: true, force: true});
}
console.log(report.join('\n'));
console.log(shots.join('\n'));
