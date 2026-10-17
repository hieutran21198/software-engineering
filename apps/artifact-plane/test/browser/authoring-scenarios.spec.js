import {test, expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRepository, openArtifact, openDocument, region, treeItem, showSidebar} from './workbench.js';
import {editingRepository, editingFiles, tenant, billing, read, commits, git} from './editing-fixtures.js';
import {measure, report} from './measure.js';
import {scanRepository} from '../../server/reader.js';
// Benchmark scenarios S1–S8 (requirements/authoring-workbench.md, measured by
// requirements/workbench-redesign.md B6). Actions are Playwright clicks, fills,
// selections and key presses after the repository is open; text entries are
// the fills of free text. No scenario may need more actions than in 1.16.0.
test.describe.configure({timeout: 120000});
const LIMITS = {S1: 20, S2: 7, S3: 13, S4: 29, S5: 14, S6: 10, S7: 3, S8: 5};
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
const work = page => region(page, 'Work page');
const change = page => region(page, 'Change page');
const doc = page => region(page, 'Document page');
const statusLine = page => page.locator('.status-line');
async function finish(m, name, targets, extra = {}) {
  const result = await m.finish(name, {targets, limit: LIMITS[name], ...extra});
  await report(result);
  expect(result.validationErrors, name).toEqual([]);
  expect(result.unexpectedChanges, name).toEqual([]);
  expect(result.rawFrontMatterEdits, name).toBe(0);
  expect(result.actions, `${name} actions: ${result.log.join(' | ')}`).toBeLessThanOrEqual(LIMITS[name]);
  return result;
}

test('S1: create a single-artifact change with a requirement, a task and a unit, then commit', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'Start a change', exact: true}).click();
    const start = work(p).getByRole('form', {name: 'Start change'});
    await start.getByLabel('Artifact', {exact: true}).selectOption('billing');
    await start.getByLabel('Title', {exact: true}).fill('Invoice rules');
    await start.getByLabel('Reason', {exact: true}).fill('Invoices need tenant rules.');
    await start.getByRole('button', {name: 'Start change', exact: true}).click();
    await expect(change(p).getByRole('heading', {level: 1})).toHaveText('Invoice rules');
    // Knowledge is added on its artifact's page; the new document opens in edit mode.
    await change(p).getByRole('button', {name: 'Billing', exact: true}).click();
    await region(p, 'Artifact page').getByRole('button', {name: '+ New requirement', exact: true}).click();
    const add = region(p, 'Artifact page').getByRole('form', {name: 'Add requirement'});
    await add.getByLabel('Title', {exact: true}).fill('Invoice tenancy');
    await add.getByRole('button', {name: 'Add requirement', exact: true}).click();
    const editor = doc(p).getByRole('textbox', {name: 'Document text'});
    await editor.fill('# Invoice tenancy\n\n## Need and constraints\n\nEvery invoice names one tenant.\n\n## Self-check\n\nNot recorded.\n');
    await editor.press('Control+s');
    await expect(doc(p).locator('.prose')).toContainText('Every invoice names one tenant.');
    await doc(p).getByRole('button', {name: 'Record self-check', exact: true}).click();
    await doc(p).getByRole('form', {name: 'Record'}).getByRole('button', {name: 'Record', exact: true}).click();
    await expect.poll(() => read(f.root, billing + 'requirements/invoice-tenancy.md')).toContain('self_check:');
    await showSidebar(p);
    await treeItem(p, /^Invoice rules/).click();
    await change(p).getByRole('button', {name: '+ Add task', exact: true}).click();
    const task = change(p).getByRole('form', {name: 'Add task'});
    await task.getByLabel('Title', {exact: true}).fill('Validate tenancy');
    await task.getByLabel('Definition of Done, one item per line').fill('Invoices without a tenant are rejected.');
    await task.getByRole('button', {name: 'Add task', exact: true}).click();
    await expect(change(p).getByRole('group', {name: 'Tasks'})).toContainText('Validate tenancy');
    await p.getByRole('button', {name: /^Uncommitted knowledge, \d+ files$/}).click();
    await work(p).getByRole('form', {name: 'Commit'}).getByRole('button', {name: /^Commit \d+ files$/}).click();
    await expect(statusLine(p)).toContainText('Committed');
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
    const name = () => page.evaluate(() => {const e = document.activeElement;return (e?.getAttribute('aria-label') || e?.labels?.[0]?.textContent || e?.textContent || '').trim();});
    const tabTo = async (target, limit = 150) => {
      for (let i = 0; i < limit; i++) {await page.keyboard.press('Tab');if (await name() === target) return;}
      throw Error(`Tab did not reach ${target}`);
    };
    await tabTo('Start a change');await page.keyboard.press('Enter');
    await expect(work(page).getByRole('form', {name: 'Start change'})).toBeVisible();
    if (await name() !== 'Artifact') await tabTo('Artifact');
    while (await page.evaluate(() => document.activeElement?.value) !== 'billing') await page.keyboard.press('ArrowDown');
    await tabTo('Title');await page.keyboard.type('Keyboard rules');
    await tabTo('Reason');await page.keyboard.type('Keyboard users start changes.');
    await tabTo('Start change');await page.keyboard.press('Enter');
    await expect(change(page).getByRole('heading', {level: 1})).toHaveText('Keyboard rules');
    await tabTo('Billing');await page.keyboard.press('Enter');
    await expect(region(page, 'Artifact page')).toBeVisible();
    await tabTo('+ New requirement');await page.keyboard.press('Enter');
    await page.keyboard.type('Keyboard need');await page.keyboard.press('Enter');
    await expect(doc(page).getByRole('textbox', {name: 'Document text'})).toBeFocused();
    await page.keyboard.press('Control+End');await page.keyboard.type('\nTyped without a mouse.\n');await page.keyboard.press('Control+s');
    await expect.poll(() => read(f.root, billing + 'requirements/keyboard-need.md')).toContain('Typed without a mouse.');
    expect(await read(f.root, 'docs/artifacts/units-of-work/keyboard-rules/README.md')).toContain('change: change-keyboard-rules');
  } finally {await f.cleanup();}
});

test('S2: create a unit with two member changes and an integration criterion', async ({page}) => {
  const files = scenarioFiles();
  for (const [base, name, title] of [[tenant, 'change-names', 'Tenant names'], [billing, 'change-totals', 'Billing totals']]) {
    files.set(`${base}changes/${name}/README.md`, `# ${title}\n\n## Reason and scope\n\nWork.\n`);
    files.set(`${base}changes/${name}/tasks/README.md`, '---\ntasks: []\n---\n# Plan\n');
  }
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'New unit', exact: true}).click();
    const form = work(p).getByRole('form', {name: 'Create unit'});
    await form.getByLabel('Title', {exact: true}).fill('Named totals');
    await form.getByRole('checkbox', {name: /^Tenant names/}).check();
    await form.getByRole('checkbox', {name: /^Billing totals/}).check();
    await form.getByLabel('Acceptance criteria, one per line').fill('Totals show tenant names end to end.');
    await form.getByLabel('Flow assessment').fill('Names and totals are data; no flow changes.');
    await form.getByRole('button', {name: 'Create unit', exact: true}).click();
    await expect(region(p, 'Unit page')).toBeVisible();
    expect(await read(f.root, 'docs/artifacts/units-of-work/named-totals/README.md')).toContain('integration: true');
    await finish(m, 'S2', 'unit brief');
  } finally {await f.cleanup();}
});

test('S3: add, explain and remove a dependency; a cycle is refused with its path', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    const artifact = await openArtifact(p, 'Audit');
    await artifact.getByRole('button', {name: 'Edit dependencies', exact: true}).click();
    const deps = artifact.getByRole('form', {name: 'Save dependencies'});
    await deps.getByRole('checkbox', {name: 'Tenant', exact: true}).check();
    await deps.getByRole('button', {name: 'Save dependencies', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'README.md')).toContain('depends_on: [tenant]');
    await artifact.getByRole('button', {name: /^Trail/}).click();
    await doc(p).getByRole('button', {name: '+ Add reference', exact: true}).click();
    const ref = doc(p).getByRole('form', {name: 'Add reference'});
    await ref.getByLabel('Target artifact').selectOption('tenant');
    await ref.getByLabel('Target document').selectOption('specifications/identity.md');
    await ref.getByLabel('Reason').fill('Trails name the tenant identity.');
    await ref.getByRole('button', {name: 'Add reference', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'requirements/trail.md')).toContain('element: specifications/identity.md');
    const added = await m.finish('S3-add');
    // Remove the dependency again from the artifact page.
    await doc(p).getByRole('button', {name: 'Audit', exact: true}).click();
    await artifact.getByRole('button', {name: 'Remove dependency on Tenant', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'README.md')).toContain('depends_on: []');
    await finish(m, 'S3', 'audit README depends_on, trail.md references', {addActions: added.actions, addOtherActions: added.otherActions});
    // A cycle is refused before writing and names the path.
    const tenantPage = await openArtifact(page, 'Tenant');
    await tenantPage.getByRole('button', {name: 'Edit dependencies', exact: true}).click();
    const cycle = tenantPage.getByRole('form', {name: 'Save dependencies'});
    await cycle.getByRole('checkbox', {name: 'Billing', exact: true}).check();
    await cycle.getByRole('button', {name: 'Save dependencies', exact: true}).click();
    await expect(page.getByText(/cycle: .*tenant → billing → tenant|cycle: .*billing → tenant → billing/).first()).toBeVisible();
    expect(await read(f.root, tenant + 'README.md')).toContain('depends_on: []');
  } finally {await f.cleanup();}
});

test('S4: create a flow with three steps, two transitions and two supports, modify a step and remove a support', async ({page}) => {
  // Flows are knowledge: an open change on the artifact is the precondition.
  const files = scenarioFiles(), prefix = tenant + 'changes/change-onboarding/';
  files.set(prefix + 'README.md', '# Tenant onboarding\n\n## Reason and scope\n\nDescribe onboarding.\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  const f = await editingRepository(files);
  const flowFile = tenant + 'specifications/flows/tenant-onboarding.md';
  const step = (flow, title) => flow.getByRole('button', {name: new RegExp(`^Step \\d+: ${title}`)});
  // Expanding a step that is already open would close it.
  const expand = async (flow, title) => {if ((await step(flow, title).getAttribute('aria-expanded')) !== 'true') await step(flow, title).click();};
  async function addSupport(flow, document) {
    await flow.getByRole('button', {name: '+ Add support', exact: true}).click();
    const support = flow.getByRole('form', {name: 'Add support'});
    await support.getByLabel('Document', {exact: true}).selectOption({label: document === 'Identity' ? 'Identity · specification' : 'Need · requirement'});
    await support.getByLabel('What the step needs from it').fill(`Uses ${document}.`);
    await support.getByRole('button', {name: 'Add support', exact: true}).click();
    await expect.poll(() => read(f.root, flowFile)).toContain(document === 'Identity' ? 'specifications/identity.md' : 'requirements/need.md');
  }
  async function addNext(flow, title) {
    await flow.getByRole('button', {name: 'Add a next step', exact: true}).click();
    const next = flow.getByRole('form', {name: 'Add the next step'});
    await next.getByLabel('Title of the new step').fill(title);
    await next.getByRole('button', {name: 'Add the next step', exact: true}).click();
    await expect(step(flow, title)).toBeVisible();
  }
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    const artifact = await openArtifact(p, 'Tenant');
    await artifact.getByRole('button', {name: '+ New flow', exact: true}).click();
    const create = artifact.getByRole('form', {name: 'Create flow'});
    await create.getByLabel('Title', {exact: true}).fill('Tenant onboarding');
    await create.getByLabel('Starts when').fill('An admin adds a tenant.');
    await create.getByLabel('Ends with').fill('The tenant can sign in.');
    await create.getByLabel('First step').fill('Enter the name');
    await create.getByRole('button', {name: 'Create flow', exact: true}).click();
    const flow = region(p, 'Flow page');
    await expect(flow.getByRole('heading', {level: 1})).toHaveText('Tenant onboarding');
    await expand(flow, 'Enter the name');
    await addSupport(flow, 'Identity');
    // Each next step is added from the step before it, which also writes the transition.
    await addNext(flow, 'Verify the domain');
    await expand(flow, 'Verify the domain');
    await flow.getByRole('button', {name: 'Rename step', exact: true}).click();
    const rename = flow.getByRole('form', {name: 'Rename step'});
    await rename.getByLabel('Step title').fill('Verify the tenant domain');
    await rename.getByRole('button', {name: 'Rename step', exact: true}).click();
    await expect(step(flow, 'Verify the tenant domain')).toBeVisible();
    await addNext(flow, 'Activate the tenant');
    await expand(flow, 'Activate the tenant');
    await addSupport(flow, 'Need');
    await flow.getByRole('button', {name: 'Remove Need from this step', exact: true}).click();
    await expect.poll(() => read(f.root, flowFile)).not.toContain('requirements/need.md');
    const text = await read(f.root, flowFile);
    expect(text.match(/- from:/g)).toHaveLength(2);
    expect(text).toContain('title: Verify the tenant domain');
    await finish(m, 'S4', 'flow document');
  } finally {await f.cleanup();}
});

test('S5: edit a requirement and a specification and record both self-checks', async ({page}) => {
  const f = await editingRepository(scenarioFiles());
  try {
    await openRepository(page, f.root);
    const m = measure(page, f.root), p = m.page;await m.begin();
    await openArtifact(p, 'Tenant');
    for (const [title, file, text] of [['Need', 'requirements/need.md', '# Need\n\nTenants need stable names.\n'], ['Identity', 'specifications/identity.md', '# Identity\n\nEstablished identity rules.\n\n## Details\n\nNames are unique per tenant.\n']]) {
      // The artifact page lists its documents; the document eyebrow returns to it.
      if (await doc(p).isVisible()) await doc(p).getByRole('button', {name: 'Tenant', exact: true}).click();
      await region(p, 'Artifact page').getByRole('button', {name: title, exact: true}).click();
      const page_ = doc(p);
      await page_.getByRole('button', {name: 'Edit', exact: true}).click();
      await page_.getByRole('textbox', {name: 'Document text'}).fill(text);
      await page_.getByRole('textbox', {name: 'Document text'}).press('Control+s');
      await expect(page_.locator('.prose')).toContainText(text.split('\n').filter(Boolean).at(-1));
      await page_.getByRole('button', {name: 'Record self-check', exact: true}).click();
      await page_.getByRole('form', {name: 'Record'}).getByRole('button', {name: 'Record', exact: true}).click();
      await expect.poll(() => read(f.root, tenant + file)).toContain('#self-check');
    }
    const spec = await read(f.root, tenant + 'specifications/identity.md');
    expect(spec.startsWith('---\n# Kept comment\nowner_note: keep me\nself_check:\n')).toBe(true);
    await finish(m, 'S5', 'two bodies and their self_check keys and sections');
  } finally {await f.cleanup();}
});

test('S6: resume a change, check two DoD items, record evidence and commit', async ({page}) => {
  const files = scenarioFiles(), prefix = billing + 'changes/change-next/';
  files.set(prefix + 'README.md', '# Next billing work\n\n## Reason and scope\n\nNext billing work.\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks:\n  - 01-work.md\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Totals add up.\n- [ ] Tests pass.\n\n## Evidence\n\nImplementation has not started.\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    await expect(work(page).getByRole('heading', {name: 'Next billing work'})).toBeVisible();
    const m = measure(page, f.root), p = m.page;await m.begin();
    await work(p).getByRole('button', {name: 'Continue Next billing work', exact: true}).click();
    await change(p).getByRole('group', {name: 'Tasks'}).getByRole('button', {name: /^01 Work,/}).click();
    await change(p).getByRole('checkbox', {name: 'Totals add up.'}).check();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('- [x] Totals add up.');
    await change(p).getByRole('checkbox', {name: 'Tests pass.'}).check();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('- [x] Tests pass.');
    await change(p).getByRole('button', {name: 'Record evidence', exact: true}).click();
    const evidence = change(p).getByRole('form', {name: 'Record evidence'});
    await evidence.getByLabel('Detail').fill('npm test passed 12 of 12 totals tests.');
    await evidence.getByRole('button', {name: 'Record evidence', exact: true}).click();
    await expect.poll(() => read(f.root, prefix + 'tasks/01-work.md')).toContain('evidence_records:');
    await p.getByRole('button', {name: /^Uncommitted knowledge, 1 file$/}).click();
    await work(p).getByRole('form', {name: 'Commit'}).getByRole('button', {name: 'Commit 1 file', exact: true}).click();
    await expect(statusLine(p)).toContainText('Committed');
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
    const page_ = await openDocument(page, 'Audit', 'Requirements', 'Trail');
    const m = measure(page, f.root), p = m.page;await m.begin();
    await doc(p).getByRole('button', {name: /^Fix reference to /}).click();
    const fix = doc(p).getByRole('form', {name: 'Replace reference'});
    await fix.getByLabel('Target document').selectOption('specifications/identity.md');
    await fix.getByRole('button', {name: 'Replace reference', exact: true}).click();
    await expect.poll(() => read(f.root, audit + 'requirements/trail.md')).not.toContain('specifications/missing.md');
    expect(await read(f.root, audit + 'requirements/trail.md')).toContain('element: specifications/identity.md');
    const fixed = await finish(m, 'S7', 'trail.md references');
    // A concurrent edit is rejected; both versions show with Reload and Overwrite.
    await page_.getByRole('button', {name: 'Edit', exact: true}).click();
    await page_.getByRole('textbox', {name: 'Document text'}).fill('# Trail\n\nMy version.\n');
    const current = await read(f.root, audit + 'requirements/trail.md');
    await writeFile(join(f.root, audit + 'requirements/trail.md'), current.replace('Every change has a trail.', 'Their version.'));
    await page_.getByRole('button', {name: 'Save', exact: true}).click();
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
    await start.getByLabel('Artifact', {exact: true}).selectOption('audit');
    await start.getByLabel('Title', {exact: true}).fill('Trail retention');
    await start.getByLabel('Reason', {exact: true}).fill('Trails are kept for a year.');
    await start.getByRole('button', {name: 'Start change', exact: true}).click();
    await expect(change(p).getByRole('heading', {level: 1})).toHaveText('Trail retention');
    const result = await finish(m, 'S8', 'change, plan, unit brief');
    // Reload: a fresh read and the browser show the same knowledge, and nothing else changed.
    await page.reload();
    await expect(work(page)).toContainText('Trail retention');
    const after = await scanRepository(f.root);
    const summary = s => s.snapshot.artifacts.map(a => ({id: a.id, version: a.currentVersion, depends: a.dependsOn, elements: a.elements.filter(e => e.source === 'working').map(e => [e.path, e.markdown])}));
    expect(summary(after)).toEqual(summary(before));
    expect(after.snapshot.artifacts.find(a => a.id === 'audit').activeChange).toBe('change-trail-retention');
    expect(result.filesWritten).toHaveLength(3);
  } finally {await f.cleanup();}
});

test('W10: a unit whose only missing record is a publication review names it and offers the recording action', async ({page}) => {
  const files = scenarioFiles(), prefix = billing + 'changes/change-next/';
  files.set(billing + 'README.md', '---\ncurrent_version: 1.1.0\ndepends_on: [tenant]\n---\n# Billing\n\nBilling knowledge.\n');
  files.set(billing + 'versions/1.1.0/README.md', '---\nsource_change: change-next\n---\n# Billing 1.1.0\n');
  files.set(prefix + 'README.md', '# Next billing work\n');
  files.set(prefix + 'tasks/README.md', '---\ntasks:\n  - 01-work.md\n---\n# Plan\n');
  files.set(prefix + 'tasks/01-work.md', '---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [x] Done.\n\n## Evidence\n\nTests passed in test/work.test.js.\n');
  files.set('docs/artifacts/units-of-work/next/README.md', `---\nunit_of_work: next\nchanges:\n  - artifact: billing\n    change: change-next\nacceptance:\n  - id: done\n    criterion: Work is done.\nevidence:\n  - criterion: done\n    method: Unit tests\n    result: passed\n    source: ${prefix}tasks/01-work.md#evidence\n---\n# Next outcome\n`);
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    // The delivered change and its finished unit appear under History.
    await showSidebar(page);
    await page.getByRole('switch', {name: 'Show history'}).click();
    await treeItem(page, /^Next outcome/).click();
    const unit = region(page, 'Unit page');
    await expect(unit).toContainText(/publication review/i);
    await unit.getByRole('button', {name: 'Record publication review', exact: true}).or(unit.getByRole('link', {name: 'Record publication review', exact: true})).click();
    await expect(change(page)).toBeVisible();
    await expect(change(page).getByRole('button', {name: 'Record publication review', exact: true})).toBeVisible();
  } finally {await f.cleanup();}
});
