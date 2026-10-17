import {test, expect} from '@playwright/test';
import {mkdir, writeFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, identity, versionRecord} from '../fixtures.js';
import {openRepository, openWork, region, treeItem, noOverflow, refresh} from './workbench.js';
import {editingRepository, editingFiles, tenant, billing, read, commits, changedPaths} from './editing-fixtures.js';
// The work page: open change cards, Start a change, New unit, uncommitted
// knowledge with Commit and Discard, the protected-branch notice and the
// dependency sentence with its graph.
const work = page => region(page, 'Work page');
const put = async (root, path, text) => {await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), text);};
const commitAll = (root, message) => {git(root, 'add', 'docs');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
const unitPath = 'docs/artifacts/units-of-work/tenant-rules/README.md';
// A work branch with one open change of Tenant in a unit, and one uncommitted file.
async function openChangeRepository() {
  const f = await editingRepository(editingFiles(), 'change-next');
  await put(f.root, tenant + 'specifications/identity.md', '# Identity\n\nProposed identity rules.\n');
  await put(f.root, tenant + 'changes/change-next/README.md', '# Next identity rules\n\nPropose identity rules.\n');
  await put(f.root, tenant + 'changes/change-next/tasks/README.md', '---\ntasks: [01-rules.md]\n---\n# Plan\n');
  await put(f.root, tenant + 'changes/change-next/tasks/01-rules.md', '---\nid: rules\ndepends_on: []\n---\n# Rules\n\n- [ ] Implement.\n');
  await put(f.root, unitPath, '---\nunit_of_work: tenant-rules\nchanges:\n  - artifact: tenant\n    change: change-next\nacceptance:\n  - id: rules\n    criterion: Identity rules are proposed.\nevidence: []\n---\n# Tenant rules\n');
  commitAll(f.root, 'Start change-next');
  await put(f.root, tenant + 'requirements/need.md', '# Need\n\nChanged need, not committed.\n');
  return f;
}

test('change cards show the eyebrow, phases, the next step and Continue without repository writes', async ({page}) => {
  const f = await openChangeRepository(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    await expect(work(page).getByRole('heading', {level: 1})).toHaveText('Current work');
    await expect(work(page).locator('.subtitle')).toHaveText(`${f.root.split('/').at(-1)} · 1 open change`);
    // No protected-branch notice on a work branch; both actions are in the header.
    await expect(work(page)).not.toContainText('Create a branch to edit knowledge.');
    await expect(work(page).getByRole('button', {name: 'Start a change', exact: true})).toBeVisible();
    await expect(work(page).getByRole('button', {name: 'New unit', exact: true})).toBeVisible();
    const card = work(page).getByRole('article', {name: 'Next identity rules', exact: true});
    await expect(card.locator('.eyebrow')).toContainText('Tenant · change-next · unit Tenant rules');
    await expect(card.getByRole('heading', {level: 2})).toHaveText('Next identity rules');
    const phases = card.getByRole('list', {name: 'Phases'});
    await expect(phases.getByRole('listitem')).toHaveText([/Requirement/, /Specification/, /Plan/, /Implementation/, /Version/]);
    await expect(phases.locator('[aria-current="step"]')).toContainText('Requirement');
    await expect(card).toContainText('Next: write the requirement and record its self-check.');
    // The unit link in the eyebrow opens the unit page.
    await card.getByRole('button', {name: 'Tenant rules, unit of Next identity rules', exact: true}).click();
    await expect(region(page, 'Unit page')).toBeVisible();
    await openWork(page);
    // Continue opens the change page and selects its sidebar row.
    await work(page).getByRole('button', {name: 'Continue Next identity rules', exact: true}).click();
    await expect(region(page, 'Change page')).toBeVisible();
    await expect(treeItem(page, /^Next identity rules/)).toHaveAttribute('aria-selected', 'true');
    // Every width fits; on a phone the actions follow the content.
    await openWork(page);
    for (const width of [1440, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      const actions = work(page).getByRole('region', {name: 'Actions'});
      if (width <= 800) await expect(actions.getByRole('button', {name: 'Start a change', exact: true})).toBeVisible();
      else await expect(actions).toHaveCount(0);
      await expect(card).toBeVisible();
      expect(await noOverflow(page)).toBe(true);
    }
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('Start a change opens a change of an artifact with a new unit, and "A new artifact" creates an artifact', async ({page}) => {
  const f = await editingRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    // Without an open change the empty state holds the only Start a change.
    await expect(work(page).getByRole('heading', {name: 'No open change.', exact: true})).toBeVisible();
    const start = work(page).getByRole('button', {name: 'Start a change', exact: true});
    await expect(start).toHaveCount(1);
    await start.click();
    let form = work(page).getByRole('form', {name: 'Start change'});
    await expect(form.getByLabel('Artifact', {exact: true})).toBeFocused();
    await expect(form.getByLabel('Artifact', {exact: true}).locator('option')).toHaveText(['Billing', 'Tenant', 'A new artifact']);
    // Cancel closes the card and returns the focus to its opener.
    await form.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(form).toHaveCount(0);await expect(start).toBeFocused();
    await start.click();form = work(page).getByRole('form', {name: 'Start change'});
    await form.getByLabel('Artifact', {exact: true}).selectOption({label: 'Billing'});
    await expect(form.getByLabel('Unit of work')).toHaveValue('new');
    await form.getByLabel('Title', {exact: true}).fill('Invoice rules');
    await form.getByLabel('Reason').fill('Invoices need tenant rules.');
    await form.getByRole('button', {name: 'Start change', exact: true}).click();
    const change = region(page, 'Change page');
    await expect(change.getByRole('heading', {level: 1})).toHaveText('Invoice rules');
    expect(await read(f.root, billing + 'changes/change-invoice-rules/README.md')).toContain('Invoices need tenant rules.');
    expect(await read(f.root, 'docs/artifacts/units-of-work/invoice-rules/README.md')).toContain('change: change-invoice-rules');
    // Back on the work page the new change has a card and Billing is no longer a choice.
    await openWork(page);
    await expect(work(page).getByRole('article', {name: 'Invoice rules', exact: true})).toBeVisible();
    await expect(work(page).locator('.subtitle')).toContainText('1 open change');
    await work(page).getByRole('button', {name: 'Start a change', exact: true}).click();
    form = work(page).getByRole('form', {name: 'Start change'});
    await expect(form.getByLabel('Artifact', {exact: true}).locator('option')).toHaveText(['Tenant', 'A new artifact']);
    // A new artifact asks for a title and a purpose instead of the change fields.
    await form.getByLabel('Artifact', {exact: true}).selectOption({label: 'A new artifact'});
    await expect(form.getByLabel('Title', {exact: true})).toHaveCount(0);await expect(form.getByLabel('Unit of work')).toHaveCount(0);
    await form.getByLabel('Artifact title').fill('Payments');
    await form.getByLabel('Purpose').fill('Payments records how tenants pay invoices.');
    await form.getByRole('button', {name: 'Start change', exact: true}).click();
    await expect(change).toBeVisible();
    await expect(change.locator('.eyebrow')).toContainText('Payments');
    expect(await read(f.root, 'docs/artifacts/payments/README.md')).toContain('# Payments\n\nPayments records how tenants pay invoices.');
    expect((await readdir(join(f.root, 'docs/artifacts/payments/changes'))).sort()).toEqual(['change-initial']);
    await expect(treeItem(page, /^Payments/)).toBeVisible();
    expect(commits(f.root)).toEqual(['fixture']);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('New unit creates a unit of the selected open changes and opens its page', async ({page}) => {
  const files = editingFiles();
  for (const artifact of ['tenant', 'billing']) {
    files.set(`docs/artifacts/${artifact}/changes/change-rules/README.md`, '# Rules\n');
    files.set(`docs/artifacts/${artifact}/changes/change-rules/tasks/README.md`, '---\ntasks: []\n---\n# Plan\n');
  }
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const opener = work(page).getByRole('button', {name: 'New unit', exact: true});
    await opener.click();await expect(opener).toHaveAttribute('aria-expanded', 'true');
    const form = work(page).getByRole('form', {name: 'Create unit'});
    await form.getByLabel('Title', {exact: true}).fill('Shared rules');await form.getByLabel('Purpose').fill('Rules across tenant and billing.');
    await form.getByRole('checkbox', {name: 'Rules · Tenant', exact: true}).check();await form.getByRole('checkbox', {name: 'Rules · Billing', exact: true}).check();
    await form.getByLabel('Acceptance criteria, one per line').fill('Tenant rules hold.\nBilling uses tenant rules.');
    await expect(form.getByLabel('Flow assessment')).toHaveValue(/^No flow is assessed yet/);
    await form.getByRole('button', {name: 'Create unit', exact: true}).click();
    await expect(region(page, 'Unit page').getByRole('heading', {level: 1})).toHaveText('Shared rules');
    const brief = await read(f.root, 'docs/artifacts/units-of-work/shared-rules/README.md');
    expect(brief).toContain('criterion: Tenant rules hold.');expect(brief).toContain('integration: true');
    expect(brief).toContain('artifact: tenant');expect(brief).toContain('artifact: billing');
    // Both changes now name the unit in their card eyebrow.
    await openWork(page);
    await expect(work(page).getByRole('button', {name: /^Shared rules, unit of /})).toHaveCount(2);
  } finally {await f.cleanup();}
});

test('uncommitted rows name documents; Commit takes the selected files and Discard asks first', async ({page}) => {
  const f = await editingRepository(), errors = [];page.on('pageerror', e => errors.push(e.message));
  await put(f.root, tenant + 'requirements/need.md', '# Need\n\nChanged need.\n');
  await put(f.root, billing + 'requirements/invoice.md', '# Invoice\n\nChanged invoice.\n');
  await put(f.root, tenant + 'specifications/sessions.md', '# Sessions\n\nNew sessions.\n');
  try {
    await openRepository(page, f.root);
    const section = work(page).getByRole('region', {name: 'Uncommitted knowledge'});
    await expect(section).toContainText('3 files');
    const row = name => section.locator('.work-file').filter({has: page.getByText(name, {exact: true})});
    await expect(row('Need')).toContainText('requirement');await expect(row('Need').locator('.badge')).toHaveText('Changed');
    await expect(row('Invoice').locator('.badge')).toHaveText('Changed');
    await expect(row('Sessions')).toContainText('specification');await expect(row('Sessions').locator('.badge')).toHaveText('New');
    await expect(row('Sessions')).toContainText('tenant/specifications/sessions.md');
    const commit = section.getByRole('form', {name: 'Commit'});
    await expect(commit.getByLabel('Commit message')).toHaveValue(/^Update knowledge of (tenant, billing|billing, tenant)$/);
    // Leave Invoice out of the commit.
    await section.getByRole('checkbox', {name: 'Include Invoice', exact: true}).uncheck();
    await commit.getByLabel('Commit message').fill('Tenant knowledge');
    await commit.getByRole('button', {name: 'Commit 2 files', exact: true}).click();
    await expect(section).toContainText('1 file');await expect(row('Need')).toHaveCount(0);
    expect(commits(f.root)).toEqual(['Tenant knowledge', 'fixture']);
    expect(git(f.root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual([tenant + 'requirements/need.md', tenant + 'specifications/sessions.md']);
    expect(git(f.root, 'status', '--porcelain', '--', 'docs')).toBe('M ' + billing + 'requirements/invoice.md');
    // Discard asks; dismissing keeps the file, accepting restores it.
    const discard = section.getByRole('button', {name: 'Discard Invoice', exact: true});
    let asked = '';page.once('dialog', dialog => {asked = dialog.message();dialog.dismiss();});
    await discard.click();
    await expect.poll(() => asked).toBe('Discard the uncommitted changes to Invoice? This cannot be undone.');
    expect(await read(f.root, billing + 'requirements/invoice.md')).toBe('# Invoice\n\nChanged invoice.\n');
    page.once('dialog', dialog => dialog.accept());await discard.click();
    await expect(section).toContainText('All knowledge is committed.');
    expect(await read(f.root, billing + 'requirements/invoice.md')).toBe(editingFiles().get(billing + 'requirements/invoice.md'));
    await expect(page.getByRole('button', {name: /^Uncommitted knowledge/})).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('the protected branch shows a notice whose Create branch makes the page editable', async ({page}) => {
  const f = await fixtureRepository(editingFiles()), before = await fingerprint(f.root);
  await put(f.root, tenant + 'requirements/need.md', '# Need\n\nChanged on main.\n');
  try {
    await openRepository(page, f.root);
    await expect(work(page)).toContainText('This branch is main. Create a branch to edit knowledge.');
    // Read only: no creation actions, no commit form and no Discard.
    await expect(work(page).getByRole('button', {name: /^(Start a change|New unit)$/})).toHaveCount(0);
    const section = work(page).getByRole('region', {name: 'Uncommitted knowledge'});
    await expect(section).toContainText('Need');await expect(section.getByRole('checkbox')).toHaveCount(0);
    await expect(section.getByRole('button', {name: /^Discard/})).toHaveCount(0);await expect(section.getByRole('form', {name: 'Commit'})).toHaveCount(0);
    const form = work(page).getByRole('form', {name: 'Create branch'});
    await form.getByLabel('New branch name').fill('main');await form.getByRole('button', {name: 'Create branch', exact: true}).click();
    await expect(form.getByRole('alert')).toBeVisible();
    expect(git(f.root, 'branch', '--show-current')).toBe('main');
    await form.getByLabel('New branch name').fill('change/next-rules');await form.getByLabel('New branch name').press('Enter');
    await expect(page.getByRole('button', {name: /^Branch change\/next-rules, knowledge can be edited/})).toBeVisible();
    await expect(work(page)).not.toContainText('Create a branch to edit knowledge.');
    await expect(work(page).getByRole('button', {name: 'Start a change', exact: true})).toBeVisible();
    await expect(section.getByRole('checkbox', {name: 'Include Need', exact: true})).toBeChecked();
    expect(git(f.root, 'branch', '--show-current')).toBe('change/next-rules');
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([tenant + 'requirements/need.md']);
  } finally {await f.cleanup();}
});

test('the dependency sentence names working edges; Show graph opens the graph with proposal styles', async ({page}) => {
  const files = editingFiles();
  files.set('docs/artifacts/audit/README.md', identity('Audit', '1.0.0'));
  files.set('docs/artifacts/audit/versions/1.0.0/README.md', versionRecord('change-initial'));
  files.set('docs/artifacts/audit/changes/change-initial/README.md', '# Initial\n');
  const f = await editingRepository(files);
  // The branch proposes Billing to depend on Audit instead of Tenant.
  await put(f.root, billing + 'README.md', identity('Billing', '1.0.0', ['audit']));commitAll(f.root, 'Billing uses audit');
  const before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const dependencies = work(page).getByRole('region', {name: 'Dependencies'});
    // A removal proposed on this branch is not a working dependency.
    await expect(dependencies).toContainText('Billing depends on Audit.');
    const show = dependencies.getByRole('button', {name: 'Show graph', exact: true});
    await show.click();
    const graph = dependencies.getByRole('group', {name: 'Dependency graph'});
    await expect(graph.locator('.react-flow__node')).toHaveCount(3);
    await expect(dependencies.getByRole('button', {name: 'Hide graph', exact: true})).toHaveAttribute('aria-expanded', 'true');
    await expect(graph.locator('.graph-legend')).toContainText('Addition proposed');await expect(graph.locator('.graph-legend')).toContainText('Removal proposed');
    await expect(graph.locator('.safe-edge-label').filter({hasText: 'addition proposed'})).toHaveCount(1);
    await expect(graph.locator('.safe-edge-label').filter({hasText: 'removal proposed'})).toHaveCount(1);
    // Proposed edges are dashed and coloured; the legend and labels name them.
    const stroke = id => graph.locator(`.react-flow__edge[data-id="${id}"] path.react-flow__edge-path`).evaluate(p => [getComputedStyle(p).stroke, p.style.strokeDasharray]);
    expect(await stroke('dependency:audit:billing')).toEqual(['rgb(30, 123, 79)', '6, 4']);
    expect(await stroke('dependency:tenant:billing:proposed-remove')).toEqual(['rgb(180, 35, 24)', '6, 4']);
    // Selecting a node opens its artifact page.
    await graph.locator('.react-flow__node').filter({hasText: 'Audit'}).click();
    await expect(region(page, 'Artifact page').getByRole('heading', {level: 1})).toHaveText('Audit');
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('an invalid path is refused and an empty artifact directory opens an empty work page', async ({page}) => {
  const f = await fixtureRepository(new Map([['docs/artifacts/.keep', '']])), before = await fingerprint(f.root);
  try {
    await page.goto('/');
    await page.getByLabel('Repository path').fill('/does/not/exist/plane');
    await page.getByRole('button', {name: 'Open repository', exact: true}).click();
    await expect(page.getByRole('alert')).toContainText('does not exist');
    await openRepository(page, f.root);
    await expect(work(page).getByRole('heading', {name: 'No open change.', exact: true})).toBeVisible();
    const dependencies = work(page).getByRole('region', {name: 'Dependencies'});
    await expect(dependencies).toContainText('No artifact depends on another artifact.');
    await dependencies.getByRole('button', {name: 'Show graph', exact: true}).click();
    await expect(dependencies).toContainText('No artifacts found.');
    await refresh(page);
    expect(await fingerprint(f.root)).toEqual(before);
  } finally {await f.cleanup();}
});
