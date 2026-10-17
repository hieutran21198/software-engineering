import {test, expect} from '@playwright/test';
import {writeFile, appendFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository} from '../fixtures.js';
import {changeDeliveryFixture} from '../unit-fixtures.js';
import {editingRepository, editingFiles, tenant, billing} from './editing-fixtures.js';
import {openRepository, openArtifact, openChange, region} from './workbench.js';
// Automatic updates and lazy loading on the redesigned pages: the open page
// follows saved edits, offline and failed updates say so only while they
// last, late replies of an earlier repository are ignored, and only the
// visible page keeps its scoped data.
const refreshButton = page => page.getByRole('button', {name: 'Refresh', exact: true});
const settled = page => expect(refreshButton(page)).toHaveAttribute('aria-busy', 'false');
function changeFiles() {
  const files = editingFiles(), prefix = billing + 'changes/change-next/';
  files.set(prefix + 'README.md', '# Next billing work\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks: [01-work.md]\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [x] Totals add up.\n');
  return files;
}

test('saved edits update the open page; offline shows Not up to date until it recovers; Refresh keeps the page', async ({page, context}) => {
  const f = await editingRepository(changeFiles()), task = join(f.root, billing + 'changes/change-next/tasks/01-work.md'), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);await settled(page);
    await expect(page.getByText('Not up to date')).toHaveCount(0);
    const change = await openChange(page, 'Next billing work');
    const row = change.getByRole('group', {name: 'Tasks'}).getByRole('button', {name: /^01 Work,/});
    await row.click();await expect(row).toHaveAttribute('aria-expanded', 'true');
    await expect(row).toContainText('1 of 1');
    const start = Date.now();
    await writeFile(task, '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Totals add up.\n');
    await expect(row).toContainText('0 of 1', {timeout: 5000});
    expect(Date.now() - start).toBeLessThan(5000);
    // The expanded task and the page survive the update.
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    await context.setOffline(true);
    await expect(page.getByText('Not up to date')).toBeVisible();
    await expect(region(page, 'Change page')).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText('Not up to date')).toHaveCount(0, {timeout: 5000});
    await refreshButton(page).click();await settled(page);
    await expect(region(page, 'Change page')).toBeVisible();await expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the overview loads first and a delayed earlier repository cannot replace a newer open', async ({page}) => {
  const first = await fixtureRepository(changeDeliveryFixture()), second = await fixtureRepository(changeDeliveryFixture());
  let release, held = false;const gate = new Promise(resolve => release = resolve), sections = [];
  await page.route('**/api/repository/query', async route => {
    const body = route.request().postDataJSON();sections.push(body.section);
    if (body.path === first.root && body.section === 'overview' && !held) {held = true;const response = await route.fetch();await gate;try {await route.fulfill({response});} catch {}}
    else await route.continue();
  });
  try {
    await page.goto('/');
    await page.getByLabel('Repository path').fill(first.root);await page.getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect.poll(() => held).toBe(true);
    await page.getByLabel('Repository path').fill(second.root);await page.getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', second.root);
    await expect(region(page, 'Work page')).toBeVisible();
    release();await settled(page);
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', second.root);
    // Opening reads the overview, then only the phase evidence of open changes.
    expect(sections[0]).toBe('overview');
    expect(sections.every(section => ['overview', 'workflow'].includes(section))).toBe(true);
  } finally {release();await first.cleanup();await second.cleanup();}
});

test('twenty page switches keep only the visible page and report browser heap', async ({page}) => {
  test.setTimeout(90000);
  const files = editingFiles();
  for (const [base, name, title] of [[tenant, 'change-names', 'Tenant names'], [billing, 'change-totals', 'Billing totals']]) {
    files.set(`${base}changes/${name}/README.md`, `# ${title}\n`);
    files.set(`${base}changes/${name}/tasks/README.md`, '---\ntasks: [01-work.md]\n---\n# Plan\n');
    files.set(`${base}changes/${name}/tasks/01-work.md`, '---\nid: work\ndepends_on: []\n---\n# Work\n\n- [ ] Done.\n');
  }
  const f = await editingRepository(files), memory = [];
  try {
    await openRepository(page, f.root);
    memory.push(await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null));
    for (let i = 0; i < 20; i++) {
      const title = ['Tenant names', 'Billing totals'][i % 2];
      await openChange(page, title);
      await expect(region(page, 'Change page').getByRole('heading', {level: 1})).toHaveText(title);
      await expect(page.getByRole('region', {name: 'Change page'})).toHaveCount(1);
      await expect(page.locator('.react-flow')).toHaveCount(0);
    }
    memory.push(await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null));
    await appendFile('/tmp/artifact-plane-browser-memory.jsonl', JSON.stringify({scenario: 'navigation', cycles: 20, heapBytes: memory, available: memory.every(v => v !== null)}) + '\n');
    await test.info().attach('browser-memory.json', {body: JSON.stringify({cycles: 20, heapBytes: memory, available: memory.every(v => v !== null)}), contentType: 'application/json'});
  } finally {await f.cleanup();}
});

test('a large repository opens and shows an artifact page with measured heap', async ({page}) => {
  test.setTimeout(120000);
  const {benchmarkFixture} = await import('../../scripts/reload-benchmark.js');
  const f = await benchmarkFixture({files: 5000, worktrees: 10}), memory = [];
  try {
    const start = Date.now();
    await page.goto('/');
    await page.getByLabel('Repository path').fill(f.root);await page.getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect(region(page, 'Work page')).toBeVisible({timeout: 30000});
    memory.push(await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null));
    await openArtifact(page, 'artifact-0');
    await expect(region(page, 'Artifact page').getByRole('heading', {level: 1})).toHaveText('artifact-0', {timeout: 15000});
    memory.push(await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null));
    const result = {knowledgeRecords: f.files, worktrees: 10, overviewAndSelectedMs: Date.now() - start, heapBytes: memory, available: memory.every(v => v !== null)};
    await appendFile('/tmp/artifact-plane-browser-memory.jsonl', JSON.stringify({scenario: 'large', ...result}) + '\n');
    await test.info().attach('large-browser-memory.json', {body: JSON.stringify(result), contentType: 'application/json'});
  } finally {await f.cleanup();}
});

test('a dependency edit on disk updates the open artifact page automatically', async ({page}) => {
  const f = await editingRepository(editingFiles());
  try {
    await openRepository(page, f.root);
    const artifact = await openArtifact(page, 'Billing');
    await expect(artifact.getByRole('button', {name: 'Tenant', exact: true})).toBeVisible();
    const start = Date.now();
    await writeFile(join(f.root, billing + 'README.md'), '---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Billing\n');
    await expect(artifact).toContainText('no dependencies', {timeout: 5000});
    expect(Date.now() - start).toBeLessThan(5000);
  } finally {await f.cleanup();}
});
