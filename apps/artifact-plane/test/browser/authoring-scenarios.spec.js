import {test, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRepository, openArtifact, openChange, treeItem, documentPage, noOverflow, showTree} from './workbench.js';
import {editingRepository, editingFiles, tenant, billing, read, commits, git} from './editing-fixtures.js';
import {measure, report} from './measure.js';
import {scanRepository} from '../../server/reader.js';
// Benchmark scenarios S1–S8 of requirements/authoring-workbench.md. Actions
// are Playwright clicks, fills, selections and key presses after the
// repository is open; text entries are the fills of free text.
const audit = 'docs/artifacts/audit/';
function scenarioFiles() {
  const files = editingFiles();
  files.set(audit + 'README.md', '---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Audit\n\nAudit knowledge.\n');
  files.set(audit + 'requirements/trail.md', '# Trail\n\nEvery change has a trail.\n');
  files.set(audit + 'versions/1.0.0/README.md', '---\nsource_change: change-initial\n---\n# Audit 1.0.0\n');
  files.set(audit + 'changes/change-initial/README.md', '# Initial\n');
  files.set(audit + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  return files;
}
const work = page => page.getByRole('region', {name: 'Work page'});
const change = page => page.getByRole('region', {name: 'Change page'});
const tab = (page, name) => change(page).getByRole('group', {name: 'Change sections'}).getByRole('button', {name, exact: true});
const status = page => page.locator('.operation-status');
async function finish(m, name, targets, extra = {}) {
  const result = await m.finish(name, {targets, ...extra});
  await report(result);
  expect(result.validationErrors, name).toEqual([]);
  expect(result.unexpectedChanges, name).toEqual([]);
  expect(result.rawFrontMatterEdits, name).toBe(0);
  return result;
}
async function openDocument(page, artifactTitle, kind, file) {
  const artifact = await openArtifact(page, artifactTitle);
  await artifact.getByRole('group', {name: kind}).getByRole('button', {name: new RegExp(`^${kind.toLowerCase()}/${file.replace('.', '\\.')}`)}).click();
  await expect(documentPage(page)).toBeVisible();
  return documentPage(page);
}

test('S1: create a single-artifact change with a requirement, a task and a unit, then commit', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'Start a change', exact: true}).click();
    const start = work(p).getByRole('form', {name: 'Start change'});
    await start.getByLabel('Artifact').selectOption('billing');
    await start.getByLabel('Title').fill('Invoice rules');
    await start.getByLabel('Reason').fill('Invoices need tenant rules.');
    await start.getByLabel('Reason').press('Enter');
    await expect(change(p)).toBeVisible();
    await change(p).getByRole('button', {name: 'Add requirement', exact: true}).click();
    const add = change(p).getByRole('form', {name: 'Add requirement'});
    await add.getByLabel('Title').fill('Invoice tenancy');
    await add.getByLabel('Title').press('Enter');
    const editor = documentPage(p).getByRole('textbox', {name: 'Document text'});
    await editor.fill('# Invoice tenancy\n\n## Need and constraints\n\nEvery invoice names one tenant.\n\n## Self-check\n\nNot recorded.\n');
    await editor.press('Control+s');
    await expect(documentPage(p).locator('.document-reader')).toContainText('Every invoice names one tenant.');
    await documentPage(p).getByRole('button', {name: 'Record self-check', exact: true}).click();
    await documentPage(p).getByRole('form', {name: 'Record'}).getByRole('button', {name: 'Record', exact: true}).click();
    await expect.poll(() => read(f.root, billing + 'requirements/invoice-tenancy.md')).toContain('self_check:');
    await showTree(p);
    await treeItem(p, /^billing \/ change-invoice-rules/).click();
    await tab(p, 'Plan').click();
    await change(p).getByRole('button', {name: 'Add task', exact: true}).click();
    const task = change(p).getByRole('form', {name: 'Add task'});
    await task.getByLabel('Title').fill('Validate tenancy');
    await task.getByLabel('Definition of Done, one item per line').fill('Invoices without a tenant are rejected.');
    await task.getByRole('button', {name: 'Add task', exact: true}).click();
    await expect(change(p).getByRole('table', {name: 'Tasks'})).toContainText('validate-tenancy');
    await tab(p, 'Review').click();
    await change(p).getByRole('form', {name: 'Commit'}).getByRole('button', {name: 'Commit', exact: true}).click();
    await expect(status(p)).toContainText('Committed');
    const result = await finish(m, 'S1', 'change, plan, task, requirement, unit brief');
    expect(commits(f.root)[0]).toMatch(/^billing change-invoice-rules: /);
    expect(git(f.root, 'status', '--porcelain')).toBe('?? untracked.txt');
    expect(result.filesWritten).toEqual([
      billing + 'changes/change-invoice-rules/README.md', billing + 'changes/change-invoice-rules/tasks/01-validate-tenancy.md', billing + 'changes/change-invoice-rules/tasks/README.md',
      billing + 'requirements/invoice-tenancy.md', 'docs/artifacts/units-of-work/invoice-rules/README.md']);
  } finally {await f.cleanup();}
});

test('S1 by keyboard alone: start a change and add a requirement without the mouse', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    // Tab to a control by its accessible name, as a keyboard user does.
    const tabTo = async (name, limit = 120) => {
      for (let i = 0; i < limit; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {const e = document.activeElement;return (e?.getAttribute('aria-label') || e?.labels?.[0]?.textContent || e?.textContent || '').trim();});
        if (focused === name) return;
      }
      throw Error(`Tab did not reach ${name}`);
    };
    await tabTo('Start a change');await page.keyboard.press('Enter');
    await expect(work(page).getByRole('form', {name: 'Start change'})).toBeVisible();
    const focusedLabel = () => page.evaluate(() => document.activeElement?.labels?.[0]?.textContent?.trim());
    if (await focusedLabel() !== 'Artifact') await tabTo('Artifact');
    await page.keyboard.press('ArrowDown');
    while (await page.evaluate(() => document.activeElement?.value) !== 'billing') await page.keyboard.press('ArrowDown');
    await tabTo('Title');await page.keyboard.type('Keyboard rules');
    await tabTo('Reason');await page.keyboard.type('Keyboard users start changes.');await page.keyboard.press('Enter');
    await expect(change(page)).toBeVisible();
    await tabTo('Add requirement');await page.keyboard.press('Enter');
    await page.keyboard.type('Keyboard need');await page.keyboard.press('Enter');
    await expect(documentPage(page).getByRole('textbox', {name: 'Document text'})).toBeFocused();
    await page.keyboard.press('Control+End');await page.keyboard.type('\nTyped without a mouse.\n');await page.keyboard.press('Control+s');
    await expect.poll(() => read(f.root, billing + 'requirements/keyboard-need.md')).toContain('Typed without a mouse.');
    expect(await read(f.root, 'docs/artifacts/units-of-work/keyboard-rules/README.md')).toContain('change: change-keyboard-rules');
  } finally {await f.cleanup();}
});

test('S2: create a unit with two member changes and an integration criterion', async ({page}) => {
  const files = scenarioFiles();
  for (const [base, name] of [[tenant, 'change-names'], [billing, 'change-totals']]) {
    files.set(`${base}changes/${name}/README.md`, `# ${name}\n\n## Reason and scope\n\nWork.\n`);
    files.set(`${base}changes/${name}/tasks/README.md`, '---\ntasks: []\n---\n# Plan\n');
  }
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'New unit', exact: true}).click();
    const form = work(p).getByRole('form', {name: 'Create unit'});
    await form.getByLabel('Title').fill('Named totals');
    await form.getByRole('checkbox', {name: /tenant \/ change-names/}).check();
    await form.getByRole('checkbox', {name: /billing \/ change-totals/}).check();
    await form.getByLabel('Acceptance criteria, one per line').fill('Totals show tenant names end to end.');
    await form.getByLabel('Flow assessment').fill('Names and totals are data; no flow changes.');
    await form.getByRole('button', {name: 'Create unit', exact: true}).click();
    await expect(page.getByRole('region', {name: 'Unit page'})).toBeVisible();
    const brief = await read(f.root, 'docs/artifacts/units-of-work/named-totals/README.md');
    expect(brief).toContain('integration: true');
    await finish(m, 'S2', 'unit brief');
    // A second unit cannot claim the same change.
    await work(page).isVisible();
  } finally {await f.cleanup();}
});

test('S3: add, explain and remove a dependency; a cycle is refused with its path', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    const artifact = await openArtifact(p, 'Audit');
    await artifact.getByRole('button', {name: 'Add dependency', exact: true}).click();
    const add = artifact.getByRole('form', {name: 'Add dependency'});
    await add.getByLabel('Artifact').selectOption('tenant');
    await add.getByRole('button', {name: 'Add dependency', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'README.md')).toContain('depends_on: [tenant]');
    const doc = await openDocument(p, 'Audit', 'Requirements', 'trail.md');
    await doc.getByRole('button', {name: 'Add reference', exact: true}).click();
    const ref = doc.getByRole('form', {name: 'Add reference'});
    await ref.getByLabel('Target artifact').selectOption('tenant');
    await ref.getByLabel('Target document').selectOption('specifications/identity.md');
    await ref.getByLabel('Reason').fill('Trails name the tenant identity.');
    await ref.getByRole('button', {name: 'Add reference', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'requirements/trail.md')).toContain('element: specifications/identity.md');
    const added = await m.finish('S3-add');
    // Remove the dependency again.
    const again = await openArtifact(p, 'Audit');
    await again.getByRole('button', {name: 'Remove dependency on tenant'}).click();
    await expect.poll(() => read(f.root, audit + 'README.md')).toContain('depends_on: []');
    await finish(m, 'S3', 'audit README depends_on, trail.md references', {addActions: added.actions, addOtherActions: added.otherActions});
    // A cycle is refused before writing and names the path.
    const tenantPage = await openArtifact(page, 'Tenant');
    await tenantPage.getByRole('button', {name: 'Add dependency', exact: true}).click();
    const cycle = tenantPage.getByRole('form', {name: 'Add dependency'});
    await cycle.getByLabel('Artifact').selectOption('billing');
    await cycle.getByRole('button', {name: 'Add dependency', exact: true}).click();
    await expect(page.getByText(/cycle: .*tenant → billing → tenant|cycle: .*billing → tenant → billing/).first()).toBeVisible();
    expect(await read(f.root, tenant + 'README.md')).toContain('depends_on: []');
  } finally {await f.cleanup();}
});

test('S4: create a flow with three steps, two transitions and two supports, modify a step and remove a support', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    const artifact = await openArtifact(p, 'Tenant');
    await artifact.getByRole('button', {name: 'Add flow', exact: true}).click();
    const create = artifact.getByRole('form', {name: 'Create flow'});
    await create.getByLabel('Title').fill('Tenant onboarding');
    await create.getByLabel('Trigger').fill('An admin adds a tenant.');
    await create.getByLabel('Outcome').fill('The tenant can sign in.');
    await create.getByLabel('First step').fill('Enter the name');
    await create.getByLabel('First step').press('Enter');
    const editor = p.getByRole('region', {name: 'Flow editing'});
    await expect(editor).toBeVisible();
    for (const [title, after] of [['Verify the domain', 'enter-the-name'], ['Activate the tenant', 'verify-the-domain']]) {
      await editor.getByRole('button', {name: 'Add step', exact: true}).click();
      const step = editor.getByRole('form', {name: 'Add step'});
      await step.getByLabel('Title').fill(title);
      await step.getByLabel('After step').selectOption(after);
      await step.getByRole('button', {name: 'Add step', exact: true}).click();
      await expect(editor.getByRole('listitem', {name: `Step ${title}`})).toBeVisible();
    }
    for (const [document, step] of [['specifications/identity.md', 'Enter the name'], ['requirements/need.md', 'Activate the tenant']]) {
      await editor.getByRole('button', {name: 'Add support', exact: true}).click();
      const support = editor.getByRole('form', {name: 'Add support'});
      await support.getByLabel('Target document').selectOption(document);
      await support.getByLabel('Reason').fill(`Uses ${document}.`);
      await support.getByRole('checkbox', {name: step}).check();
      await support.getByRole('button', {name: 'Add support', exact: true}).click();
      await expect.poll(() => read(f.root, tenant + 'specifications/flows/tenant-onboarding.md')).toContain(`element: ${document}`);
    }
    await editor.getByRole('button', {name: 'Edit step Verify the domain'}).click();
    const edit = editor.getByRole('form', {name: 'Save step'});
    await edit.getByLabel('Title').fill('Verify the tenant domain');
    await edit.getByLabel('Title').press('Enter');
    await expect(editor).toContainText('Verify the tenant domain');
    await editor.getByRole('button', {name: /^Remove support need/}).click();
    await expect.poll(() => read(f.root, tenant + 'specifications/flows/tenant-onboarding.md')).not.toContain('requirements/need.md');
    const text = await read(f.root, tenant + 'specifications/flows/tenant-onboarding.md');
    expect(text.match(/- from:/g)).toHaveLength(2);
    await finish(m, 'S4', 'flow document');
  } finally {await f.cleanup();}
});

test('S5: edit a requirement and a specification and record both self-checks', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    for (const [kind, file, text] of [['Requirements', 'need.md', '# Need\n\nTenants need stable names.\n'], ['Specifications', 'identity.md', '# Identity\n\nEstablished identity rules.\n\n## Details\n\nNames are unique per tenant.\n']]) {
      const doc = await openDocument(p, 'Tenant', kind, file);
      await doc.getByRole('button', {name: 'Edit', exact: true}).click();
      await doc.getByRole('textbox', {name: 'Document text'}).fill(text);
      await doc.getByRole('textbox', {name: 'Document text'}).press('Control+s');
      await expect(doc.locator('.document-reader')).toContainText(text.split('\n').filter(Boolean).at(-1));
      await doc.getByRole('button', {name: 'Record self-check', exact: true}).click();
      await doc.getByRole('form', {name: 'Record'}).getByRole('button', {name: 'Record', exact: true}).click();
      await expect.poll(() => read(f.root, `${tenant}${kind.toLowerCase()}/${file}`)).toContain('#self-check');
    }
    const spec = await read(f.root, tenant + 'specifications/identity.md');
    expect(spec.startsWith('---\n# Kept comment\nowner_note: keep me\nself_check:\n')).toBe(true);
    await finish(m, 'S5', 'two bodies and their self_check keys and sections');
  } finally {await f.cleanup();}
});

test('S6: resume a change, check two DoD items, record evidence and commit', async ({page}) => {
  const files = scenarioFiles(), prefix = billing + 'changes/change-next/';
  files.set(prefix + 'README.md', '# Next\n\n## Reason and scope\n\nNext billing work.\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks:\n  - 01-work.md\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Totals add up.\n- [ ] Tests pass.\n\n## Evidence\n\nImplementation has not started.\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const card = work(page).getByRole('article', {name: 'billing / change-next'});
    await expect(card).toContainText(/Next|next/);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('article', {name: 'billing / change-next'}).getByRole('button', {name: 'Open', exact: true}).click();
    await tab(p, 'Plan').click();
    await change(p).getByRole('table', {name: 'Tasks'}).getByRole('button', {name: 'Work'}).click();
    const rail = change(p).getByRole('complementary', {name: 'Selection details'});
    await rail.getByRole('checkbox', {name: 'Totals add up.'}).check();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('- [x] Totals add up.');
    await rail.getByRole('checkbox', {name: 'Tests pass.'}).check();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('- [x] Tests pass.');
    await rail.getByRole('button', {name: 'Record evidence', exact: true}).click();
    const evidence = rail.getByRole('form', {name: 'Record evidence'});
    await evidence.getByLabel('Detail').fill('npm test passed 12 of 12 totals tests.');
    await evidence.getByRole('button', {name: 'Record evidence'}).click();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('evidence_records:');
    await tab(p, 'Review').click();
    await change(p).getByRole('form', {name: 'Commit'}).getByRole('button', {name: 'Commit', exact: true}).click();
    await expect(status(p)).toContainText('Committed');
    await finish(m, 'S6', 'task file checkboxes and evidence');
    expect(git(f.root, 'show', '--name-only', '--format=', 'HEAD')).toBe(prefix + 'tasks/01-work.md');
  } finally {await f.cleanup();}
});

test('S7: fix an unresolved reference by picking its target and reject a concurrent save with both versions', async ({page}) => {
  const files = scenarioFiles();
  files.set(audit + 'requirements/trail.md', '---\nreferences:\n  - artifact: tenant\n    element: specifications/missing.md\n    requires: Trails name the tenant identity.\n---\n# Trail\n\nEvery change has a trail.\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const doc = await openDocument(page, 'Audit', 'Requirements', 'trail.md');
    const m = measure(page, f.root), p = m.page;await m.begin();
    await documentPage(p).getByRole('button', {name: 'Fix', exact: true}).click();
    const fix = documentPage(p).getByRole('form', {name: 'Replace reference'});
    await fix.getByLabel('Target document').selectOption('specifications/identity.md');
    await fix.getByRole('button', {name: 'Replace reference', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'requirements/trail.md')).not.toContain('specifications/missing.md');
    expect(await read(f.root, audit + 'requirements/trail.md')).toContain('element: specifications/identity.md');
    const fixed = await finish(m, 'S7', 'trail.md references');
    // A concurrent edit is rejected; both versions show with Reload and Overwrite.
    await doc.getByRole('button', {name: 'Edit', exact: true}).click();
    await doc.getByRole('textbox', {name: 'Document text'}).fill('# Trail\n\nMy version.\n');
    const current = await read(f.root, audit + 'requirements/trail.md');
    await writeFile(join(f.root, audit + 'requirements/trail.md'), current.replace('Every change has a trail.', 'Their version.'));
    await doc.getByRole('button', {name: 'Save', exact: true}).click();
    const dialog = page.getByRole('alertdialog', {name: 'Save conflict'});
    await expect(dialog).toContainText('Their version.');
    await expect(dialog).toContainText('My version.');
    await expect(dialog.getByRole('button', {name: 'Reload', exact: true})).toBeVisible();
    expect(await read(f.root, audit + 'requirements/trail.md')).toContain('Their version.');
    await report({...fixed, conflictDialog: true});
  } finally {await f.cleanup();}
});

test('S8: edited knowledge reloads through the readers without loss', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const before = await scanRepository(f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'Start a change', exact: true}).click();
    const start = work(p).getByRole('form', {name: 'Start change'});
    await start.getByLabel('Artifact').selectOption('audit');
    await start.getByLabel('Title').fill('Trail retention');
    await start.getByLabel('Reason').fill('Trails are kept for a year.');
    await start.getByLabel('Reason').press('Enter');
    await expect(change(p)).toBeVisible();
    const result = await finish(m, 'S8', 'change, plan, unit brief');
    // Reload: a fresh read and the browser show the same knowledge, and nothing else changed.
    // The project tab survives the page reload and reads the repository again.
    await page.reload();
    await expect(work(page)).toContainText('change-trail-retention');
    const after = await scanRepository(f.root);
    const summary = s => s.snapshot.artifacts.map(a => ({id: a.id, version: a.currentVersion, depends: a.dependsOn, elements: a.elements.filter(e => e.source === 'working').map(e => [e.path, e.markdown])}));
    expect(summary(after)).toEqual(summary(before));
    expect(after.snapshot.artifacts.find(a => a.id === 'audit').activeChange).toBe('change-trail-retention');
    for (const width of [390, 700, 851, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page), `${width}`).toBe(true);}
    expect(result.filesWritten).toHaveLength(3);
  } finally {await f.cleanup();}
});

test('W10: a unit whose only missing record is a publication review names it and offers the recording action', async ({page}) => {
  const files = scenarioFiles(), prefix = billing + 'changes/change-next/';
  files.set(billing + 'README.md', '---\ncurrent_version: 1.1.0\ndepends_on: [tenant]\n---\n# Billing\n\nBilling knowledge.\n');
  files.set(billing + 'versions/1.1.0/README.md', '---\nsource_change: change-next\n---\n# Billing 1.1.0\n');
  files.set(prefix + 'README.md', '# Next\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks:\n  - 01-work.md\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [x] Done.\n\n## Evidence\n\nTests passed in test/work.test.js.\n');
  files.set('docs/artifacts/units-of-work/next/README.md', `---\nunit_of_work: next\nchanges:\n  - artifact: billing\n    change: change-next\nacceptance:\n  - id: done\n    criterion: Work is done.\nevidence:\n  - criterion: done\n    method: Unit tests\n    result: passed\n    source: ${prefix}tasks/01-work.md#evidence\n---\n# Next\n`);
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    await showTree(page);
    await treeItem(page, /^Next/).last().click();
    const unit = page.getByRole('region', {name: 'Unit page'});
    await expect(unit).toContainText('Completion unknown: no publication review for billing 1.1.0');
    await unit.getByRole('button', {name: 'Record publication review', exact: true}).click();
    await expect(change(page).getByRole('form', {name: 'Record publication review'})).toBeVisible();
  } finally {await f.cleanup();}
});

test('W11: document, change, unit and flow pages have no horizontal overflow at 390, 700, 851 and 1440 pixels', async ({page}) => {
  const files = scenarioFiles(), prefix = billing + 'changes/change-next/';
  files.set(prefix + 'README.md', '# Next\n\n## Reason and scope\n\nNext billing work.\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks:\n  - 01-work.md\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Totals add up.\n\n## Evidence\n\nImplementation has not started.\n');
  files.set('docs/artifacts/units-of-work/next/README.md', '---\nunit_of_work: next\nchanges:\n  - artifact: billing\n    change: change-next\nacceptance:\n  - id: done\n    criterion: Work is done.\n---\n# Next\n\n## Purpose\n\nNext billing work.\n');
  files.set(tenant + 'specifications/flows/onboarding.md', '---\nflow:\n  id: onboarding\n  artifact: tenant\n  title: Onboarding\n  trigger: An admin adds a tenant.\n  outcome: The tenant signs in.\n  entry_steps:\n    - enter\n  steps:\n    - id: enter\n      title: Enter the name\n      supports:\n        - identity\n  transitions: []\n  support:\n    - id: identity\n      kind: element\n      artifact: tenant\n      element: specifications/identity.md\n      requires: Identity rules.\n      basis: documented\n---\n# Onboarding\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const pages = {
      document: async () => {await openDocument(page, 'Tenant', 'Specifications', 'identity.md');await documentPage(page).getByRole('button', {name: 'Edit', exact: true}).click();},
      change: async () => {await openChange(page, 'change-next', 'Plan');},
      unit: async () => {await showTree(page);await treeItem(page, /^Next/).last().click();await expect(page.getByRole('region', {name: 'Unit page'})).toBeVisible();},
      flow: async () => {const artifact = await openArtifact(page, 'Tenant');await artifact.getByRole('group', {name: 'Flows'}).getByRole('button', {name: /onboarding/}).click();await expect(page.getByRole('region', {name: 'Flow editing'})).toBeVisible();},
    };
    for (const [name, open] of Object.entries(pages)) for (const width of [1440, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      await open();
      expect(await noOverflow(page), `${name} at ${width}`).toBe(true);
      await page.screenshot({path: `test-results/workbench-${name}-${width}.png`, fullPage: true});
    }
  } finally {await f.cleanup();}
});
