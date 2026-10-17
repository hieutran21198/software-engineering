import {test, expect} from '@playwright/test';
import {writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, rootReadme, sourceFixture} from '../fixtures.js';
import {unitFixture, unitPath, unitBrief, changeDeliveryFixture} from '../unit-fixtures.js';
import {editingRepository, editingFiles, tenant, read, changedPaths} from './editing-fixtures.js';
import {openRepository, openUnit, openChange, region, refresh, noOverflow, setHistory, treeItem, layoutFacts, showSidebar} from './workbench.js';
// The unit page: brief, one completion line, member changes, acceptance
// criteria with evidence, affected flows, and the artifact graph on request.
const unitPage = page => region(page, 'Unit page');
const completion = page => unitPage(page).locator('.unit-completion');
const changes = page => unitPage(page).getByRole('region', {name: 'Changes'});
const criteria = page => unitPage(page).getByRole('region', {name: 'Acceptance criteria'});
const flows = page => unitPage(page).getByRole('region', {name: 'Affected flows'});
const memberRow = (page, text) => changes(page).locator('.row').filter({hasText: text});
const openTenantLogin = page => openUnit(page, 'Login outcome', 'Tenant login');

// Two open in-place changes with retained task evidence, and one flow.
const sharedBrief = 'docs/artifacts/units-of-work/shared-rules/README.md';
function editableFiles() {
  const files = editingFiles();
  for (const [artifact, title] of [['tenant', 'Tenant rules'], ['billing', 'Billing rules']]) {
    const base = `docs/artifacts/${artifact}/changes/change-rules/`;
    files.set(base + 'README.md', `# ${title}\n`);
    files.set(base + 'tasks/README.md', '---\ntasks: [01-a.md]\n---\n# Plan\n');
    files.set(base + 'tasks/01-a.md', `---\nid: a\ndepends_on: []\n---\n# ${title} task\n\n- [x] Done.\n\n## Evidence\n\nChecks passed.\n`);
  }
  files.set(tenant + 'specifications/flows/login.md', '---\nflow:\n  id: login\n  artifact: tenant\n  title: Login\n  trigger: Start\n  outcome: Done\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Start\n      supports: []\n  transitions: []\n  support: []\n  gaps: [Not traced]\n---\n# Login\n');
  return files;
}

test('read-only unit page shows the brief, completion, members, criteria and graph without writes', async ({page}) => {
  const files = unitFixture();
  files.set('docs/artifacts/tenant/README.md', rootReadme('Tenant', '1.0.0', ['external']));
  files.set('docs/artifacts/external/README.md', rootReadme('External', '1.0.0'));
  files.set(unitPath, files.get(unitPath) + '\n<script>window.unitInjected=true</script><img src="/tracking" onerror="window.unitInjected=true">\n');
  const f = await fixtureRepository(files), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);await openTenantLogin(page);
    const unit = unitPage(page);
    await expect(unit.getByRole('heading', {level: 1})).toHaveText('Tenant login');
    await expect(unit).toContainText('Unit of work · tenant-login');
    await expect(unit.locator('.lead')).toHaveText('Allow tenant members to sign in.');
    // One completion result, without a second loading or failure line.
    await expect(completion(page)).toHaveCount(1);await expect(completion(page)).toContainText('Complete');
    await expect(unit.getByText('Checking completion…')).toHaveCount(0);
    await expect(changes(page).getByRole('heading', {level: 2})).toHaveText('Changes 2');
    await expect(memberRow(page, 'Tenant · change-login')).toContainText('Delivered 1.0.0');
    await expect(memberRow(page, 'authentication · change-login')).toContainText('Delivered 1.0.0');
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 2 of 2 have evidence');
    await expect(criteria(page).locator('.criterion').filter({hasText: 'integration'})).toContainText('Integration');
    await expect(criteria(page).locator('.criterion .badge.passed')).toHaveCount(2);
    await expect(flows(page)).toContainText('No flow is affected.');
    // Main is read only: no edit controls.
    await expect(unit.getByRole('button', {name: /^Edit criterion|^Record evidence for|^Remove|Add a change|Add criterion|Edit affected flows|Edit brief/})).toHaveCount(0);
    expect(await layoutFacts(page)).toMatchObject({titles: ['Tenant login'], treesInMain: 0, modeControls: []});
    // Show graph: the unit's artifacts and the prerequisite outside the unit.
    await changes(page).getByRole('button', {name: 'Show graph', exact: true}).click();
    const graph = changes(page).getByRole('group', {name: 'Artifact graph of this unit'});
    await expect(graph.locator('.react-flow__node')).toHaveCount(3);
    await expect(graph.locator('.react-flow__node').filter({hasText: 'External'})).toContainText('Prerequisite, not in this unit');
    await expect(graph.locator('.react-flow__edge')).toHaveCount(2);
    await expect(changes(page).getByRole('button', {name: 'Hide graph', exact: true})).toHaveAttribute('aria-expanded', 'true');
    for (const width of [1440, 700, 390]) {await page.setViewportSize({width, height: 1000});expect(await noOverflow(page)).toBe(true);}
    await page.setViewportSize({width: 1440, height: 1000});
    await graph.locator('.react-flow__node').filter({hasText: 'External'}).click();
    await expect(region(page, 'Artifact page').getByRole('heading', {level: 1})).toHaveText('External');
    // The brief opens as a document with sanitized Markdown.
    await openTenantLogin(page);
    await unitPage(page).getByRole('button', {name: 'Read brief', exact: true}).click();
    const document = region(page, 'Document page');
    await expect(document).toContainText('Combined tenant and authentication checks passed in this fixture.');
    expect(await document.locator('script, img').count()).toBe(0);
    expect(await page.evaluate(() => window.unitInjected)).toBeUndefined();
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
    // A removed brief leaves an honest page after refresh.
    await openTenantLogin(page);await rm(join(f.root, unitPath));await refresh(page);
    await expect(unitPage(page).getByRole('heading', {level: 1})).toHaveText('Unit of work not found');
  } finally {await f.cleanup();}
});

test('incomplete evidence and invalid membership stay readable', async ({page}) => {
  const files = unitFixture({delivered: false});files.set(unitPath, unitBrief(undefined, false));
  const f = await fixtureRepository(files);
  try {
    await openRepository(page, f.root);await openTenantLogin(page);
    await expect(completion(page)).toContainText('Incomplete');
    await expect(completion(page)).toContainText('Shared criteria lack passing delivered evidence: login, integration.');
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 0 of 2 have evidence');
    await expect(criteria(page).locator('.criterion .badge.none')).toHaveCount(2);
    await writeFile(join(f.root, unitPath), unitBrief(undefined, false).replace('artifact: tenant', 'artifact: absent'));
    await refresh(page);
    await expect(memberRow(page, 'absent · change-login')).toContainText('Not found');
    await expect(completion(page)).toContainText('Unknown');
    await writeFile(join(f.root, unitPath), unitBrief(undefined, false).replace('unit_of_work: tenant-login', 'unit_of_work: [invalid]'));
    await refresh(page);
    await expect(completion(page)).toContainText('Unknown');
  } finally {await f.cleanup();}
});

test('the worktree choice isolates units, and legacy repositories without briefs show no unit', async ({page}) => {
  const f = await fixtureRepository(unitFixture()), other = `${f.root}-other`;git(f.root, 'worktree', 'add', '-qb', 'other', other);
  try {
    await writeFile(join(other, unitPath), unitBrief([['tenant', 'change-login']], false));
    const before = await fingerprint(f.root), otherBefore = await fingerprint(other);
    await openRepository(page, f.root);await openTenantLogin(page);
    await expect(changes(page).getByRole('heading', {level: 2})).toHaveText('Changes 2');
    await page.getByRole('button', {name: /^Branch main/}).click();
    await page.getByRole('menuitemradio', {name: /^other/}).click();
    await expect(page.getByRole('button', {name: /^Branch other/})).toBeVisible();
    await showSidebar(page);await treeItem(page, /^Login outcome tenant/).click();
    await region(page, 'Change page').getByRole('button', {name: 'Tenant login', exact: true}).click();
    await expect(changes(page).getByRole('heading', {level: 2})).toHaveText('Changes 1');
    await expect(memberRow(page, 'authentication')).toHaveCount(0);
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 0 of 2 have evidence');
    expect(await fingerprint(f.root)).toEqual(before);expect(await fingerprint(other)).toEqual(otherBefore);
  } finally {git(f.root, 'worktree', 'remove', '--force', other);await f.cleanup();}
  const legacy = await fixtureRepository(sourceFixture());
  try {
    await openRepository(page, legacy.root);
    const change = await openChange(page, 'Login change');
    await expect(change).toContainText('No unit');
    await setHistory(page, true);
    await expect(treeItem(page, /Unit of work ·/)).toHaveCount(0);
  } finally {await legacy.cleanup();}
});

test('new-layout versions use exact retained tasks and lose completion support when evidence changes', async ({page}) => {
  const f = await editingRepository(changeDeliveryFixture()), source = 'docs/artifacts/authentication/changes/change-login/tasks/api.md';
  try {
    const before = await fingerprint(f.root);
    await openRepository(page, f.root);await openTenantLogin(page);
    // Completion reads the retained task evidence of the change that the version names.
    await expect(completion(page)).toContainText('Complete');
    expect(await fingerprint(f.root)).toEqual(before);
    await writeFile(join(f.root, source), '---\nid: api\ndepends_on: []\n---\n# Revised evidence\n\n- [x] Verify behavior\n\n## Evidence\n\nChanged on this branch.');
    await refresh(page);
    await expect(completion(page)).toContainText('Incomplete');
    await expect(completion(page)).toContainText('Shared criteria lack passing delivered evidence: login.');
  } finally {await f.cleanup();}
});

test('completion has one result, shows a distinct reason and recovers from a failed read', async ({page}) => {
  const f = await fixtureRepository(unitFixture());let fail = true;
  await page.route('**/api/repository/query', async route => {
    const body = route.request().postDataJSON();
    if (body.section === 'completion' && fail) return route.fulfill({status: 503, json: {error: 'Evidence temporarily unavailable'}});
    const response = await route.fetch(), data = await response.json();
    if (body.section === 'completion') data.data.completion = {...data.data.completion, derivation: 'unknown', reasons: ['A distinct publication source requires inspection.', 'A second reason stays out of the line.']};
    try {await route.fulfill({json: data});} catch {}
  });
  try {
    await openRepository(page, f.root);await openTenantLogin(page);
    await expect(completion(page)).toContainText('Completion cannot be read.');
    fail = false;await completion(page).getByRole('button', {name: 'Retry', exact: true}).click();
    await expect(completion(page)).toHaveCount(1);
    await expect(completion(page)).toContainText('Unknown');
    await expect(completion(page)).toContainText('A distinct publication source requires inspection.');
    await expect(completion(page)).not.toContainText('A second reason');
  } finally {await page.unrouteAll({behavior: 'ignoreErrors'});await f.cleanup();}
});

test('a delivered member without publication review links its completion to the change', async ({page}) => {
  const files = editingFiles();
  files.set('docs/artifacts/units-of-work/initial-tenant/README.md', '---\nunit_of_work: initial-tenant\nchanges:\n  - artifact: tenant\n    change: change-initial\nacceptance:\n  - id: initial\n    criterion: Tenant knowledge exists.\nevidence:\n  - criterion: initial\n    method: Read the knowledge.\n    result: passed\n    source: docs/artifacts/units-of-work/initial-tenant/README.md#combined-checks\n---\n# Initial tenant\n\n## Purpose\n\nStart the tenant knowledge.\n\n## Combined checks\n\nThe tenant knowledge was read.\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);await setHistory(page, true);
    await treeItem(page, /^Initial tenant/).first().click();
    await expect(completion(page)).toContainText('publication_reviews');
    await completion(page).getByRole('button', {name: 'Record publication review', exact: true}).click();
    await expect(region(page, 'Change page')).toBeVisible();
    await expect(region(page, 'Change page')).toContainText('change-initial');
  } finally {await f.cleanup();}
});

test('a new unit manages its changes, criteria, evidence, affected flows and graph in place', async ({page}) => {
  const f = await editingRepository(editableFiles()), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const work = region(page, 'Work page');
    await work.getByRole('button', {name: 'New unit', exact: true}).click();
    const create = work.getByRole('form', {name: 'Create unit'});
    await create.getByLabel('Title', {exact: true}).fill('Shared rules');await create.getByLabel('Purpose', {exact: true}).fill('Rules across tenant and billing.');
    await create.getByRole('checkbox', {name: 'Tenant rules · Tenant'}).check();await create.getByRole('checkbox', {name: 'Billing rules · Billing'}).check();
    await create.getByLabel('Acceptance criteria, one per line').fill('Tenant rules hold.\nBilling uses tenant rules.');
    await create.getByRole('button', {name: 'Create unit', exact: true}).click();
    const unit = unitPage(page);
    await expect(unit.getByRole('heading', {level: 1})).toHaveText('Shared rules');
    await expect(unit.locator('.lead')).toHaveText('Rules across tenant and billing.');
    await expect(unit.getByRole('button', {name: 'Edit brief', exact: true})).toBeVisible();
    await expect(changes(page).getByRole('heading', {level: 2})).toHaveText('Changes 2');
    // Remove a change, then add it again from "+ Add a change".
    await changes(page).getByRole('button', {name: 'Remove Billing rules from the unit', exact: true}).click();
    await expect(changes(page).getByRole('heading', {level: 2})).toHaveText('Changes 1');
    await expect.poll(async () => (await read(f.root, sharedBrief)).includes('artifact: billing')).toBe(false);
    // A single change cannot be removed.
    await expect(changes(page).getByRole('button', {name: /^Remove .* from the unit$/})).toHaveCount(0);
    await changes(page).getByRole('button', {name: '+ Add a change', exact: true}).click();
    const add = changes(page).getByRole('form', {name: 'Add the change'});
    await expect(add.getByLabel('Open change')).toHaveValue('billing/change-rules');
    await add.getByRole('button', {name: 'Add the change', exact: true}).click();
    await expect(memberRow(page, 'Billing rules')).toBeVisible();
    await expect.poll(() => read(f.root, sharedBrief)).toContain('artifact: billing');
    // Criteria: edit the text in place; Escape cancels; Save writes.
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 0 of 2 have evidence');
    const first = criteria(page).getByRole('button', {name: /^Edit criterion /}).first();
    const id = (await first.getAttribute('aria-label')).replace('Edit criterion ', '');
    await first.click();
    const field = criteria(page).getByLabel(`Criterion ${id}`, {exact: true});
    await expect(field).toBeFocused();await field.fill('Discarded text.');await field.press('Escape');
    await expect(criteria(page)).toContainText('Tenant rules hold.');await expect(criteria(page)).not.toContainText('Discarded text.');
    await criteria(page).getByRole('button', {name: `Edit criterion ${id}`, exact: true}).click();
    await criteria(page).getByLabel(`Criterion ${id}`, {exact: true}).fill('Tenant rules hold on every branch.');
    await criteria(page).getByRole('button', {name: 'Save', exact: true}).click();
    await expect(criteria(page).getByRole('button', {name: `Edit criterion ${id}`, exact: true})).toContainText('Tenant rules hold on every branch.');
    await expect.poll(() => read(f.root, sharedBrief)).toContain('criterion: Tenant rules hold on every branch.');
    // Evidence from the badge: the combined checks of the brief, or a member task.
    const badge = criteria(page).getByRole('button', {name: `Record evidence for ${id}`, exact: true});
    await expect(badge).toHaveText('No evidence');await badge.click();
    const evidence = criteria(page).getByRole('form', {name: 'Record evidence'});
    await expect(evidence.getByLabel('Source', {exact: true})).toHaveValue('');
    await expect(evidence.getByLabel('Source', {exact: true}).locator('option:checked')).toHaveText('Combined checks of this brief');
    await evidence.getByLabel('Result', {exact: true}).selectOption('failed');
    await evidence.getByLabel('Detail for the combined checks').fill('Combined rule checks failed once.');
    await evidence.getByRole('button', {name: 'Record evidence', exact: true}).click();
    await expect(badge).toHaveText('Failed');
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 1 of 2 have evidence');
    await expect.poll(() => read(f.root, sharedBrief)).toContain('Combined rule checks failed once.');
    // Add a criterion, then remove it from its edit form.
    await criteria(page).getByRole('button', {name: '+ Add criterion', exact: true}).click();
    const addCriterion = criteria(page).getByRole('form', {name: 'Add criterion'});
    await addCriterion.getByLabel('Criterion', {exact: true}).fill('Docs are updated.');
    await addCriterion.getByRole('button', {name: 'Add criterion', exact: true}).click();
    await expect(criteria(page).getByRole('heading', {level: 2})).toHaveText('Acceptance criteria · 1 of 3 have evidence');
    const docs = criteria(page).locator('.criterion').filter({hasText: 'Docs are updated.'});
    await docs.getByRole('button', {name: /^Edit criterion /}).click();
    await criteria(page).getByRole('button', {name: 'Remove', exact: true}).click();
    await expect(criteria(page)).not.toContainText('Docs are updated.');
    // Affected flows: Edit opens the checklist, effect and assessment in place.
    await flows(page).getByRole('button', {name: 'Edit affected flows', exact: true}).click();
    const flowForm = flows(page).getByRole('form', {name: 'Save affected flows'});
    await flowForm.getByRole('checkbox', {name: 'Login · Tenant'}).check();
    await flowForm.getByLabel('Effect on the selected flows').selectOption('modify');
    await flowForm.getByLabel('Flow assessment').fill('Login reads the shared rules.');
    await flowForm.getByRole('button', {name: 'Save affected flows', exact: true}).click();
    await expect(flowForm).toHaveCount(0);
    await expect(flows(page).getByRole('button', {name: 'Edit affected flows', exact: true})).toBeFocused();
    await expect.poll(() => read(f.root, sharedBrief)).toContain('flow: login');
    const brief = await read(f.root, sharedBrief);
    expect(brief).toContain('effect: modify');expect(brief).toContain('Login reads the shared rules.');expect(brief).toContain('integration: true');
    // The graph shows the two artifacts; the chip opens the flow page.
    await changes(page).getByRole('button', {name: 'Show graph', exact: true}).click();
    await expect(changes(page).getByRole('group', {name: 'Artifact graph of this unit'}).locator('.react-flow__node')).toHaveCount(2);
    expect(await layoutFacts(page)).toMatchObject({titles: ['Shared rules'], duplicates: []});
    for (const width of [390, 1440]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    await flows(page).getByRole('button', {name: /^Login/}).click();
    await expect(region(page, 'Flow page').getByRole('heading', {level: 1})).toHaveText('Login');
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([sharedBrief]);
    expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

// Product bug: the Source field lists only the brief, because the page reads
// unit.members[].taskGraph from the overview, where it stays pending.
test('the evidence source offers the Evidence sections of the exact retained member tasks', async ({page}) => {
  const f = await editingRepository(changeDeliveryFixture()), source = 'docs/artifacts/authentication/changes/change-login/tasks/api.md';
  try {
    await openRepository(page, f.root);await openTenantLogin(page);
    await criteria(page).getByRole('button', {name: 'Record evidence for login', exact: true}).click();
    const field = criteria(page).getByRole('form', {name: 'Record evidence'}).getByLabel('Source', {exact: true});
    await expect(field.locator(`option[value="${source}#evidence"]`)).toHaveCount(1);
    await expect(field.locator('option[value*="/versions/"]')).toHaveCount(0);
  } finally {await f.cleanup();}
});
