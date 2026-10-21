import {test, expect} from '@playwright/test';
import {fixtureRepository, orderingFixture, fingerprint, git} from '../fixtures.js';
import {openRepository, openArtifact, openChange, openDocument, region, tree, treeItem, documentPage} from './workbench.js';
import {editingRepository, editingFiles, tenant, billing} from './editing-fixtures.js';
// Browser Back (specifications/concept-pages.md, Browser Back): one history entry
// for each trail push, Back moves only the active project tab, and the page object
// keeps the Discover query and the open brief rows.
const length = page => page.evaluate(() => history.length);
const entry = page => page.evaluate(() => navigation.currentEntry.index);
const heading = page => page.getByRole('main').getByRole('heading', {level: 1});
const back = page => page.goBack();
const discover = page => region(page, 'Discover behavior');
async function openDiscover(page) {
  await page.getByRole('button', {name: 'More', exact: true}).click();
  await page.getByRole('menu', {name: 'More'}).getByRole('menuitem', {name: /^Discover behavior/}).click();
  await expect(discover(page).getByRole('heading', {level: 1})).toHaveText('Discover behavior');
}
const results = page => discover(page).locator('.discover-results > li button');
const flowDoc = (artifact, id, title, trigger) => '---\nflow:\n  id: ' + id + '\n  artifact: ' + artifact + '\n  title: ' + title + '\n  trigger: ' + trigger + '\n  outcome: Read membership rules\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Read rules\n      supports: [rule]\n  transitions: []\n  support:\n    - {id: rule, kind: element, artifact: tenant, element: requirements/need.md, requires: Read membership rules, basis: documented}\n  gaps: [Static context only]\n---\n# ' + title + '\n';

test('a document opened from the artifact page returns to it with focus; Back after an editor refusal keeps the page', async ({page}) => {
  const f = await editingRepository(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const start = await length(page);
    const artifact = await openArtifact(page, 'Tenant');
    expect(await length(page)).toBe(start + 1);
    const row = artifact.getByRole('region', {name: 'Specifications', exact: true}).getByRole('button', {name: /^Identity/});
    await row.click();
    await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Identity');
    expect(await length(page)).toBe(start + 2);
    await back(page);
    await expect(heading(page)).toHaveText('Tenant');
    await expect(region(page, 'Artifact page').getByRole('region', {name: 'Specifications', exact: true}).getByRole('button', {name: /^Identity/})).toBeFocused();
    // A refused leave() keeps the page, the editor text and the browser position.
    await region(page, 'Artifact page').getByRole('region', {name: 'Specifications', exact: true}).getByRole('button', {name: /^Identity/}).click();
    const doc = documentPage(page), editor = doc.getByRole('textbox', {name: 'Document text'});
    await doc.getByRole('button', {name: 'Edit', exact: true}).click();await editor.fill('# Identity\n\nDraft.\n');
    const position = await entry(page);
    let asked = '';page.once('dialog', dialog => {asked = dialog.message();dialog.dismiss();});
    await back(page);
    await expect.poll(() => asked).toBe('Discard unsaved changes?');
    await expect(editor).toHaveValue('# Identity\n\nDraft.\n');
    await expect.poll(() => entry(page)).toBe(position);
    page.once('dialog', dialog => dialog.accept());
    await back(page);
    await expect(heading(page)).toHaveText('Tenant');
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('Back from a page opened from Discover returns to the submitted query and its results', async ({page}) => {
  const files = editingFiles();
  files.set(tenant + 'specifications/flows/route.md', flowDoc('tenant', 'route', 'Tenant route', 'Request access'));
  files.set(billing + 'specifications/flows/shared.md', flowDoc('billing', 'shared', 'Shared access', 'An invoice reader asks for shared access'));
  const f = await fixtureRepository(files), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);await openDiscover(page);
    const field = discover(page).getByLabel('Behavior', {exact: true}), entries = await length(page);
    await field.fill('shared access for invoices');await field.press('Enter');
    await expect(results(page).first()).toContainText('Shared access');
    // A submit replaces the page in place: no history entry, and the focus stays in the form.
    expect(await length(page)).toBe(entries);
    await expect(field).toBeFocused();
    // The TopBar entry on an open Discover page keeps the results.
    await openDiscover(page);
    await expect(field).toHaveValue('shared access for invoices');
    await expect(results(page).first()).toContainText('Shared access');
    expect(await length(page)).toBe(entries);
    await results(page).first().click();
    await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Shared access');
    expect(await length(page)).toBe(entries + 1);
    await back(page);
    await expect(discover(page).getByLabel('Behavior', {exact: true})).toHaveValue('shared access for invoices');
    await expect(results(page).first()).toContainText('Shared access');
    await expect(discover(page).getByRole('status')).toHaveText(/flows found/);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('Back from a page opened from the change brief keeps the open brief rows and the focus list', async ({page}) => {
  const files = editingFiles(), next = billing + 'changes/change-next/';
  files.set(next + 'README.md', '# Invoice rules\n\n## Reason and scope\n\nInvoices need tenant rules.\n');
  files.set(next + 'tasks/README.md', '---\ntasks: [01-rules.md]\n---\n# Plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit user approval before implementation.\n');
  files.set(next + 'tasks/01-rules.md', '---\nid: rules\ndepends_on: []\nclaims:\n  - id: tenant-scope\n    kind: decision\n    statement: Scope invoices by tenant.\n    status: open\n    basis: inferred\n    check: List invoices in two tenants.\n---\n# Rules\n\n- [ ] Rules hold.\n');
  const f = await editingRepository(files), errors = [];page.on('pageerror', e => errors.push(e.message));
  const brief = () => region(page, 'Change page').getByRole('region', {name: 'Change brief', exact: true});
  const opened = () => brief().locator('.brief-rows details[open] .brief-question').allTextContents();
  try {
    await openRepository(page, f.root);
    // Without a toggled row, the 1.24.0 default stays after Back.
    await openChange(page, 'Invoice rules');await expect(brief().getByRole('region', {name: 'Claims'})).toBeVisible();
    expect(await opened()).toEqual(['What should I care about?']);
    // A claim link moves to a fragment of the same page; Back from it changes no page.
    await brief().locator('.brief-attention a').first().click();await expect.poll(() => new URL(page.url()).hash).toBe('#claim-tenant-scope');
    await back(page);await expect.poll(() => new URL(page.url()).hash).toBe('');
    await expect(region(page, 'Change page')).toBeVisible();
    await openArtifact(page, 'Tenant');await back(page);
    await expect(brief().getByRole('region', {name: 'Claims'})).toBeVisible();
    expect(await opened()).toEqual(['What should I care about?']);
    // Toggled rows replace the page in place and come back after Back.
    const entries = await length(page);
    await brief().locator('summary', {hasText: 'What needs my decision?'}).click();
    await brief().locator('summary', {hasText: 'What should I care about?'}).click();
    await expect.poll(opened).toEqual(['What needs my decision?']);
    expect(await length(page)).toBe(entries);
    const artifactRow = tree(page).getByRole('treeitem', {name: 'Tenant', exact: true});
    await artifactRow.click();await expect(heading(page)).toHaveText('Tenant');
    await back(page);
    await expect(brief().getByRole('region', {name: 'Claims'})).toBeVisible();
    await expect.poll(opened).toEqual(['What needs my decision?']);
    await expect(artifactRow).toBeFocused();
    // The in-place toggles added no focus target: the next Back returns to the Work page and focuses the change row.
    await back(page);await expect(region(page, 'Work page')).toBeVisible();
    await expect(treeItem(page, /^Invoice rules/)).toBeFocused();
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('with two project tabs Back moves only the active tab and never shows the other repository', async ({page}) => {
  const a = await fixtureRepository(orderingFixture()), b = await editingRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  const panel = () => page.getByRole('tabpanel');
  try {
    await openRepository(page, a.root);await openArtifact(page, 'Knowledge');
    await page.getByRole('button', {name: 'New project tab'}).click();
    await panel().getByLabel('Repository path').fill(b.root);await panel().getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', b.root);
    await openDocument(page, 'Tenant', 'Requirements', 'Need');
    await back(page);await expect(heading(page)).toHaveText('Tenant');
    await back(page);await expect(region(page, 'Work page')).toBeVisible();
    // The trail of the active tab is empty: the next Back uses the entry of the other tab and changes no page.
    await back(page);
    await expect(region(page, 'Work page')).toBeVisible();
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', b.root);
    await expect(tree(page).getByRole('treeitem', {name: 'Knowledge', exact: true})).toHaveCount(0);
    await page.getByRole('tab').first().click();
    await expect(heading(page)).toHaveText('Knowledge');
    expect(errors).toEqual([]);
  } finally {await a.cleanup();await b.cleanup();}
});

test('after a worktree switch Back changes no page of the old worktree', async ({page}) => {
  const f = await fixtureRepository(orderingFixture()), other = f.root + '-back-other';git(f.root, 'worktree', 'add', '-qb', 'back-other', other);
  try {
    await openRepository(page, f.root);await openArtifact(page, 'Knowledge');
    await page.getByRole('button', {name: /^Branch main/}).click();await page.getByRole('menuitemradio', {name: /^back-other/}).click();
    await expect(page.getByRole('button', {name: /^Branch back-other/})).toBeVisible();
    await expect(region(page, 'Work page')).toBeVisible();
    await back(page);
    await expect(region(page, 'Work page')).toBeVisible();
    await expect(page.getByRole('button', {name: /^Branch back-other/})).toBeVisible();
    // A page of the new worktree goes back to its own Work page.
    await openArtifact(page, 'Knowledge');await back(page);
    await expect(region(page, 'Work page')).toBeVisible();
    await expect(page.getByRole('button', {name: /^Branch back-other/})).toBeVisible();
  } finally {git(f.root, 'worktree', 'remove', '--force', other);await f.cleanup();}
});

test('after 51 pages each Back press moves one page back; after a reload Back changes no page', async ({page}) => {
  test.setTimeout(90000);
  const f = await editingRepository();
  try {
    await openRepository(page, f.root);
    const start = await entry(page), titles = [];
    for (let n = 1; n <= 51; n++) {const title = n % 2 ? 'Tenant' : 'Billing';await openArtifact(page, title);await expect(heading(page)).toHaveText(title);titles.push(title);}
    // Chromium keeps 50 entries of session history, so it offers fewer Back presses than the 51 pushes.
    const presses = await entry(page);
    expect(presses).toBeGreaterThanOrEqual(Math.min(start + 51, 49));
    for (let n = 1; n <= presses; n++) {await back(page);await expect(heading(page)).toHaveText(titles[50 - n]);}
    expect(await entry(page)).toBe(0);
    // A reload starts an empty trail; Back changes no page.
    await openArtifact(page, 'Billing');await openDocument(page, 'Billing', 'Requirements', 'Invoice');
    await page.reload();
    await expect(region(page, 'Work page')).toBeVisible();
    await back(page);
    await expect(region(page, 'Work page')).toBeVisible();
    await expect(page.getByRole('tab', {selected: true})).toHaveAttribute('title', f.root);
  } finally {await f.cleanup();}
});
