import {test, expect} from '@playwright/test';
import {mkdir, writeFile, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {fixtureRepository, sourceFixture, inPlaceFixture, identity, versionRecord} from '../fixtures.js';
import {openRepository, openArtifact, openDocument, openWork, region, treeItem, showSidebar, noOverflow, refresh} from './workbench.js';
import {editingRepository, editingFiles, tenant, billing, read, commits, changedPaths, fingerprint, git} from './editing-fixtures.js';
// The artifact page and the document page: subtitle and dependencies, kind
// sections, versions, migration, and the document reader, editor and properties.
const artifactPage = page => region(page, 'Artifact page'), documentPage = page => region(page, 'Document page');
const put = async (root, path, text) => {await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), text);};
const commitAll = (root, message) => {git(root, 'add', '-A', 'docs');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
const spec = tenant + 'specifications/identity.md', original = editingFiles().get(spec);
const editor = page => documentPage(page).getByRole('textbox', {name: 'Document text'});
const properties = page => documentPage(page).getByRole('region', {name: 'Properties'});
const prop = (page, label) => properties(page).locator('.prop').filter({has: page.locator('.prop-key', {hasText: new RegExp(`^${label}$`)})});
const docRows = section => section.locator('.doc-list > li');

test('artifact page: subtitle, purpose, kind sections with badges, Show all and versions without repository writes', async ({page}) => {
  const files = editingFiles();
  files.set(tenant + 'README.md', identity('Tenant', '1.1.0', [], '\n## Scope\n\nScope text.\n\n## Owners\n\nOwner text.\n'));
  files.set(tenant + 'versions/1.1.0/README.md', versionRecord('change-second'));
  files.set(tenant + 'changes/change-second/README.md', '# Second tenant\n');
  files.set(tenant + 'changes/change-second/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  for (const title of ['Access', 'Billing rules', 'Claims', 'Domains', 'Exports']) files.set(`${tenant}specifications/${title.toLowerCase().replace(' ', '-')}.md`, `# ${title}\n\n${title} on main.\n`);
  const f = await editingRepository(files);
  // The branch changes Access, removes Claims, adds Sessions and prepares 1.2.0.
  await put(f.root, tenant + 'specifications/access.md', '# Access\n\nAccess on the branch.\n');
  await rm(join(f.root, tenant + 'specifications/claims.md'));
  await put(f.root, tenant + 'specifications/sessions.md', '# Sessions\n\nNew sessions.\n');
  await put(f.root, tenant + 'README.md', identity('Tenant', '1.2.0', [], '\n## Scope\n\nScope text.\n\n## Owners\n\nOwner text.\n'));
  await put(f.root, tenant + 'versions/1.2.0/README.md', versionRecord('change-third'));
  await put(f.root, tenant + 'changes/change-third/README.md', '# Third tenant\n');
  await put(f.root, tenant + 'changes/change-third/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  commitAll(f.root, 'Prepare 1.2.0');
  const before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const tenantPage = await openArtifact(page, 'Tenant');
    await expect(tenantPage.getByRole('heading', {level: 1})).toHaveText('Tenant');
    await expect(tenantPage.locator('.subtitle')).toContainText('Version 1.1.0 established · 1.2.0 prepared by Third tenant · no dependencies');
    await expect(tenantPage.getByRole('button', {name: 'Edit dependencies', exact: true})).toBeVisible();
    await expect(tenantPage.locator('.purpose .lead')).toHaveText('Tenant knowledge.');
    await expect(tenantPage.locator('.purpose')).toContainText('Scope · Owners.');
    // Without an open change: Start a change, and no "New" actions; the change of 1.2.0 is still in progress (HG2).
    await expect(tenantPage).toContainText('Change in progress: Third tenant · ');
    await expect(tenantPage.getByRole('button', {name: 'Start a change', exact: true})).toBeVisible();
    await expect(tenantPage.getByRole('button', {name: /^New (requirement|specification|decision|flow)$/})).toHaveCount(0);
    // Kind sections: counts, the first 5 by title with badges, Show all in place.
    const specs = tenantPage.getByRole('region', {name: 'Specifications', exact: true});
    await expect(specs.getByRole('heading', {level: 2})).toHaveText('Specifications 7');
    await expect(docRows(specs)).toHaveText(['Access~Changed', 'Billing rules', 'claims−Removed', 'Domains', 'Exports']);
    await specs.getByRole('button', {name: 'Show all 7 specifications', exact: true}).click();
    await expect(docRows(specs)).toHaveText(['Access~Changed', 'Billing rules', 'claims−Removed', 'Domains', 'Exports', 'Identity', 'Sessions+New']);
    await expect(specs.getByRole('button', {name: 'Show first 5 specifications', exact: true})).toHaveAttribute('aria-expanded', 'true');
    await expect(tenantPage.getByRole('region', {name: 'Requirements', exact: true})).toContainText('Need');
    await expect(tenantPage.getByRole('region', {name: 'Decisions', exact: true})).toContainText('No decisions yet.');
    await expect(tenantPage.getByRole('region', {name: 'Flows', exact: true})).toContainText('No flows yet.');
    // Versions: the latest with its source change, the prepared one, then all newest first.
    const versions = tenantPage.getByRole('region', {name: 'Versions', exact: true});
    await expect(versions).toContainText('Latest: 1.1.0 from Second tenant. Version 1.2.0 is prepared and not on main yet.');
    await versions.getByRole('button', {name: 'Show versions', exact: true}).click();
    await expect(docRows(versions)).toHaveText(['1.2.0Third tenantprepared on this branch', '1.1.0Second tenant', '1.0.0Initial']);
    await docRows(versions).nth(1).getByRole('button').click();
    await expect(documentPage(page).locator('.eyebrow')).toHaveText('Tenant / Versions');
    await expect(prop(page, 'Kind')).toContainText('Version record');
    await openArtifact(page, 'Tenant');
    await artifactPage(page).getByRole('region', {name: 'Versions', exact: true}).getByRole('button', {name: 'Second tenant', exact: true}).click();
    await expect(region(page, 'Change page').getByRole('heading', {level: 1})).toHaveText('Second tenant');
    // A removed document is named by its file and opens the text on main.
    await openArtifact(page, 'Tenant');
    await artifactPage(page).getByRole('region', {name: 'Specifications', exact: true}).getByRole('button', {name: /^claims/}).click();
    await expect(documentPage(page).getByRole('status').filter({hasText: 'This document is removed on this branch. The text below is the version on main.'})).toBeVisible();
    await expect(documentPage(page)).toContainText('Claims on main.');
    await expect(prop(page, 'In this branch')).toContainText('Removed');
    // Read the overview opens the README; a dependency link opens its artifact.
    await openArtifact(page, 'Tenant');
    await artifactPage(page).getByRole('button', {name: 'Read the overview', exact: true}).click();
    await expect(documentPage(page).locator('.eyebrow')).toHaveText('Tenant / Overview');
    await expect(documentPage(page)).toContainText('Owner text.');
    const billingPage = await openArtifact(page, 'Billing');
    await expect(billingPage.locator('.subtitle')).toContainText('Version 1.0.0 established · depends on Tenant');
    await billingPage.locator('.subtitle').getByRole('button', {name: 'Tenant', exact: true}).click();
    await expect(artifactPage(page).getByRole('heading', {level: 1})).toHaveText('Tenant');
    for (const width of [1440, 851, 700, 390]) {await page.setViewportSize({width, height: 900});expect(await noOverflow(page)).toBe(true);}
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('dependency Edit refuses a cycle with its path and saves a valid set', async ({page}) => {
  const f = await editingRepository();
  try {
    await openRepository(page, f.root);
    const tenantPage = await openArtifact(page, 'Tenant');
    const edit = tenantPage.getByRole('button', {name: 'Edit dependencies', exact: true});
    await edit.click();
    let form = tenantPage.getByRole('form', {name: 'Save dependencies'});
    await expect(form).toContainText('This artifact uses the knowledge of the selected artifacts.');
    await form.getByRole('checkbox', {name: 'Billing', exact: true}).check();
    await form.getByRole('button', {name: 'Save dependencies', exact: true}).click();
    await expect(form.getByRole('alert')).toContainText(/cycle/i);
    await expect(form.getByRole('alert')).toContainText(/tenant/);await expect(form.getByRole('alert')).toContainText(/billing/);
    expect(await read(f.root, tenant + 'README.md')).toBe(editingFiles().get(tenant + 'README.md'));
    await form.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(form).toHaveCount(0);await expect(edit).toBeFocused();
    const billingPage = await openArtifact(page, 'Billing');
    await billingPage.getByRole('button', {name: 'Edit dependencies', exact: true}).click();
    form = billingPage.getByRole('form', {name: 'Save dependencies'});
    await expect(form.getByRole('checkbox', {name: 'Tenant', exact: true})).toBeChecked();
    await form.getByRole('checkbox', {name: 'Tenant', exact: true}).uncheck();
    await form.getByRole('button', {name: 'Save dependencies', exact: true}).click();
    await expect(billingPage.locator('.subtitle')).toContainText('Version 1.0.0 established · no dependencies');
    expect(await read(f.root, billing + 'README.md')).toContain('depends_on: []');
    expect(git(f.root, 'status', '--porcelain', '--', 'docs')).toBe('M ' + billing + 'README.md');
  } finally {await f.cleanup();}
});

test('Show dependencies: selecting an edge explains the dependency and opens the consuming document', async ({page}) => {
  const f = await fixtureRepository(inPlaceFixture()), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    // The front matter, not a body heading, gives the version.
    await expect((await openArtifact(page, 'Tenant')).locator('.subtitle')).toContainText('Version 1.0.0 established · no dependencies');
    const authentication = await openArtifact(page, 'Authentication');
    const show = authentication.getByRole('button', {name: 'Show dependencies', exact: true});
    await show.click();
    await expect(authentication.getByRole('button', {name: 'Hide dependencies', exact: true})).toHaveAttribute('aria-expanded', 'true');
    const graph = authentication.getByRole('group', {name: 'Dependency graph'});
    await expect(graph.locator('.react-flow__node')).toHaveCount(2);
    await expect(authentication).toContainText('Select an arrow to see why the dependency exists.');
    const edge = graph.locator('.react-flow__edge[data-id="dependency:tenant:authentication"]');
    await edge.dispatchEvent('click');
    const explanation = authentication.getByRole('region', {name: 'Dependency explanation'});
    await expect(explanation.getByRole('heading', {level: 3})).toHaveText('Authentication depends on Tenant');
    await expect(edge).toHaveAttribute('aria-label', 'authentication depends on tenant (established)');
    await expect(explanation).toContainText('Established · declared in docs/artifacts/authentication/README.md');
    await expect(explanation).toContainText('identity format');await expect(explanation).toContainText('Uses Identity');
    await expect(explanation).toContainText('Recorded references explain consumption; resolution does not prove runtime behavior.');
    await explanation.getByRole('button', {name: 'Close explanation', exact: true}).click();
    await expect(explanation).toHaveCount(0);
    await expect(authentication).toContainText('Select an arrow to see why the dependency exists.');
    await edge.dispatchEvent('click');
    await explanation.getByRole('button', {name: 'Login rules', exact: true}).click();
    await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Login rules');
    await expect(documentPage(page).locator('.eyebrow')).toHaveText('Authentication / Specifications');
    expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('"New <kind>" adds documents and flows to the open change; without one, Start a change', async ({page}) => {
  const files = editingFiles();
  files.set(tenant + 'changes/change-next/README.md', '# Next identity rules\n\nPropose identity rules.\n');
  files.set(tenant + 'changes/change-next/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  const f = await editingRepository(files), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    let tenantPage = await openArtifact(page, 'Tenant');
    await expect(tenantPage).toContainText('Open change: Next identity rules · Requirement');
    for (const kind of ['requirement', 'specification', 'decision', 'flow']) await expect(tenantPage.getByRole('button', {name: `New ${kind}`, exact: true})).toBeVisible();
    // An empty text opens the new document in the editor.
    await tenantPage.getByRole('button', {name: 'New requirement', exact: true}).click();
    let form = tenantPage.getByRole('form', {name: 'Add requirement'});
    await expect(form.getByLabel('Title')).toBeFocused();
    await form.getByLabel('Title').fill('Session limits');await form.getByLabel('Title').press('Enter');
    await expect(editor(page)).toBeVisible();
    await editor(page).fill('# Session limits\n\nA tenant has at most ten sessions.\n');
    await documentPage(page).getByRole('button', {name: 'Save', exact: true}).click();
    await expect(documentPage(page).locator('.document-reader')).toContainText('A tenant has at most ten sessions.');
    expect(await read(f.root, tenant + 'requirements/session-limits.md')).toBe('# Session limits\n\nA tenant has at most ten sessions.\n');
    // A text opens the document to read.
    tenantPage = await openArtifact(page, 'Tenant');
    await expect(tenantPage.getByRole('region', {name: 'Requirements', exact: true}).getByRole('button', {name: /^Session limits/})).toContainText('New');
    await tenantPage.getByRole('button', {name: 'New decision', exact: true}).click();
    form = tenantPage.getByRole('form', {name: 'Add decision'});
    await form.getByLabel('Title').fill('Session store');await form.getByLabel('Text (optional)').fill('# Session store\n\nSessions live in the tenant store.\n');
    await form.getByRole('button', {name: 'Add decision', exact: true}).click();
    await expect(documentPage(page).locator('.document-reader')).toContainText('Sessions live in the tenant store.');
    await expect(documentPage(page).locator('.eyebrow')).toHaveText('Tenant / Decisions');
    tenantPage = await openArtifact(page, 'Tenant');
    await tenantPage.getByRole('button', {name: 'New flow', exact: true}).click();
    form = tenantPage.getByRole('form', {name: 'Create flow'});
    await form.getByLabel('Title').fill('Sign in');await form.getByLabel('Starts when').fill('A member signs in.');
    await form.getByLabel('Ends with').fill('A session exists.');await form.getByLabel('First step').fill('Check member');
    await form.getByRole('button', {name: 'Create flow', exact: true}).click();
    await expect(region(page, 'Flow page')).toBeVisible();
    expect(existsSync(join(f.root, tenant + 'specifications/flows/sign-in.md'))).toBe(true);
    // Billing has no open change: Start a change opens the change page.
    const billingPage = await openArtifact(page, 'Billing');
    await expect(billingPage.getByRole('button', {name: /^New (requirement|specification|decision|flow)$/})).toHaveCount(0);
    await billingPage.getByRole('button', {name: 'Start a change', exact: true}).click();
    form = billingPage.getByRole('form', {name: 'Start change'});
    await expect(form).toContainText('Start a change of Billing');
    await form.getByLabel('Title').fill('Invoice rules');await form.getByLabel('Reason').fill('Invoices need rules.');
    await form.getByLabel('Unit of work').selectOption({label: 'No unit of work'});
    await form.getByRole('button', {name: 'Start change', exact: true}).click();
    await expect(region(page, 'Change page').getByRole('heading', {level: 1})).toHaveText('Invoice rules');
    expect(existsSync(join(f.root, 'docs/artifacts/units-of-work'))).toBe(false);
    expect(commits(f.root)).toEqual(['fixture']);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('a legacy artifact is read-only on main; on a branch Migrate previews the plan and applies it', async ({page}) => {
  const files = sourceFixture();for (const a of ['tenant', 'authentication']) files.set(`docs/artifacts/${a}/versions/1.0.0/README.md`, '# Snapshot\n');
  const f = await fixtureRepository(files);
  try {
    await openRepository(page, f.root);
    let tenantPage = await openArtifact(page, 'Tenant');
    await expect(tenantPage).toContainText('This artifact uses the legacy snapshot layout. Its knowledge is read-only until you migrate it.');
    await expect(tenantPage.getByRole('button', {name: 'Migrate', exact: true})).toHaveCount(0);
    // The protected branch creates a branch from the work page.
    const work = await openWork(page);
    const branch = work.getByRole('form', {name: 'Create branch'});
    await branch.getByLabel('New branch name').fill('migrate-tenant');await branch.getByLabel('New branch name').press('Enter');
    await expect(page.getByRole('button', {name: /^Branch migrate-tenant, knowledge can be edited/})).toBeVisible();
    tenantPage = await openArtifact(page, 'Tenant');
    await tenantPage.getByRole('button', {name: 'Migrate', exact: true}).click();
    const plan = tenantPage.getByRole('region', {name: 'Migration plan'});
    await expect(plan).toContainText('The migration writes these files. Nothing changes until you apply it.');
    await expect(plan).toContainText('docs/artifacts/tenant/specifications/identity.md');
    expect(git(f.root, 'status', '--porcelain')).toBe('?? untracked.txt');
    await plan.getByRole('button', {name: 'Cancel', exact: true}).click();await expect(plan).toHaveCount(0);
    expect(git(f.root, 'status', '--porcelain')).toBe('?? untracked.txt');
    await tenantPage.getByRole('button', {name: 'Migrate', exact: true}).click();
    await plan.getByRole('button', {name: 'Apply migration', exact: true}).click();
    await expect.poll(() => read(f.root, 'docs/artifacts/tenant/README.md')).toMatch(/^---\ncurrent_version: 1\.0\.0/);
    await expect(tenantPage).not.toContainText('legacy snapshot layout');
    await expect(tenantPage.getByRole('button', {name: 'Edit dependencies', exact: true})).toBeVisible();
    await expect(tenantPage.getByRole('region', {name: 'Specifications', exact: true})).toContainText('Identity');
    expect(commits(f.root)).toEqual(['fixture']);
  } finally {await f.cleanup();}
});

test('document Edit: Write and Preview, Ctrl+S, Undo and Cancel with confirmation keep front matter and other bytes', async ({page}) => {
  const f = await editingRepository(), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await expect(doc.locator('.eyebrow')).toHaveText('Tenant / Specifications');
    await expect(doc.getByRole('heading', {level: 1})).toHaveText('Identity');
    await expect(doc.locator('.document-reader')).toContainText('Established identity rules.');
    // The body is shown without its first heading.
    await expect(doc.locator('.document-reader h1')).toHaveCount(0);
    const edit = doc.getByRole('button', {name: 'Edit', exact: true});
    await edit.click();
    await expect(editor(page)).toBeFocused();
    await expect(editor(page)).toHaveValue('# Identity\n\nEstablished identity rules.\n\n## Details\n\nUnchanged details.\n');
    const state = doc.getByRole('status', {name: 'Editor state'});
    await expect(state).toHaveText('No changes');
    await editor(page).fill('# Identity\n\nProposed identity rules.\n\n## Details\n\nUnchanged details.\n');
    await expect(state).toHaveText('Unsaved changes · Ctrl+S saves');
    await doc.getByRole('tab', {name: 'Preview', exact: true}).click();
    await expect(doc.getByRole('tab', {name: 'Preview', exact: true})).toHaveAttribute('aria-selected', 'true');
    await expect(doc.locator('.editor-preview')).toContainText('Proposed identity rules.');await expect(editor(page)).toHaveCount(0);
    await doc.getByRole('tab', {name: 'Write', exact: true}).click();
    await editor(page).press('Control+s');
    await expect(doc.locator('.document-reader')).toContainText('Proposed identity rules.');
    await expect(edit).toBeFocused();
    const status = page.locator('.status-line');
    await expect(status).toContainText('Saved specifications/identity.md.');
    // The writer keeps the front matter bytes and the separator before the body.
    expect(await read(f.root, spec)).toBe('---\n# Kept comment\nowner_note: keep me\n---\n# Identity\n\nProposed identity rules.\n\n## Details\n\nUnchanged details.\n');
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([spec]);
    await status.getByRole('button', {name: 'Undo', exact: true}).click();
    await expect.poll(() => read(f.root, spec)).toBe(original);
    await expect(doc.locator('.document-reader')).toContainText('Established identity rules.');
    // Cancel asks before it drops unsaved text.
    await edit.click();await editor(page).fill('# Identity\n\nDraft.\n');
    let asked = '';page.once('dialog', dialog => {asked = dialog.message();dialog.dismiss();});
    await doc.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect.poll(() => asked).toBe('Discard unsaved changes?');await expect(editor(page)).toHaveValue('# Identity\n\nDraft.\n');
    page.once('dialog', dialog => dialog.accept());await doc.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(editor(page)).toHaveCount(0);await expect(edit).toBeFocused();
    expect(await read(f.root, spec)).toBe(original);
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([]);expect(commits(f.root)).toEqual(['fixture']);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

test('a save over newer bytes opens the conflict dialog with Reload and Overwrite; refresh keeps the editor text', async ({page}) => {
  const f = await editingRepository();
  try {
    await openRepository(page, f.root);
    const doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await doc.getByRole('button', {name: 'Edit', exact: true}).click();await editor(page).fill('# Identity\n\nMy text.\n');
    await writeFile(join(f.root, spec), '---\nowner_note: other\n---\n# Identity\n\nTheir text.\n');
    await refresh(page);
    const notice = doc.getByRole('status').filter({hasText: 'The file changed on disk.'});
    await expect(notice).toBeVisible();await expect(editor(page)).toHaveValue('# Identity\n\nMy text.\n');
    await doc.getByRole('button', {name: 'Save', exact: true}).click();
    const dialog = page.getByRole('alertdialog', {name: 'Save conflict'});
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.diff-line.remove')).toContainText('Their text.');await expect(dialog.locator('.diff-line.add')).toContainText('My text.');
    // Focus starts on Reload and stays inside the dialog.
    await expect(dialog.getByRole('button', {name: 'Reload', exact: true})).toBeFocused();
    await page.keyboard.press('Tab');await expect(dialog.getByRole('button', {name: 'Overwrite', exact: true})).toBeFocused();
    await page.keyboard.press('Tab');await expect(dialog.getByRole('button', {name: 'Reload', exact: true})).toBeFocused();
    await dialog.getByRole('button', {name: 'Overwrite', exact: true}).click();
    await expect(doc.locator('.document-reader')).toContainText('My text.');
    expect(await read(f.root, spec)).toBe('---\nowner_note: other\n---\n# Identity\n\nMy text.\n');
    // Reload takes the text on disk into the editor.
    await doc.getByRole('button', {name: 'Edit', exact: true}).click();await editor(page).fill('# Identity\n\nSecond draft.\n');
    await writeFile(join(f.root, spec), '---\nowner_note: other\n---\n# Identity\n\nDisk wins.\n');
    await doc.getByRole('button', {name: 'Save', exact: true}).click();
    await dialog.getByRole('button', {name: 'Reload', exact: true}).click();
    await expect(dialog).toHaveCount(0);
    await expect(editor(page)).toHaveValue('# Identity\n\nDisk wins.\n');
    expect(await read(f.root, spec)).toBe('---\nowner_note: other\n---\n# Identity\n\nDisk wins.\n');
  } finally {await f.cleanup();}
});

test('references add, remove and Fix; self-check, front matter and delete', async ({page}) => {
  const files = editingFiles();
  files.set(spec, '---\nreferences:\n  - artifact: billing\n    element: requirements/missing.md\n    requires: Old invoice rules\n---\n# Identity\n\nRules.\n');
  const f = await editingRepository(files), before = await fingerprint(f.root);
  try {
    await openRepository(page, f.root);
    const doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    const refs = doc.getByRole('group', {name: 'References'});
    await expect(refs).toContainText('Billing / requirements/missing.md');await expect(refs).toContainText('Old invoice rules');
    await expect(refs.locator('.status-badge')).toHaveText('Unresolved');
    await refs.getByRole('button', {name: 'Fix reference to Billing / requirements/missing.md', exact: true}).click();
    const fix = refs.getByRole('form', {name: 'Replace reference'});
    await expect(fix.getByLabel('Target artifact')).toHaveValue('billing');
    await fix.getByLabel('Target document').selectOption({label: 'Invoice'});
    await expect(fix.getByLabel('Reason')).toHaveValue('Old invoice rules');
    await fix.getByRole('button', {name: 'Replace reference', exact: true}).click();
    await expect(refs.getByRole('button', {name: 'Invoice', exact: true})).toBeVisible();await expect(refs).not.toContainText('Unresolved');
    expect(await read(f.root, spec)).toContain('element: requirements/invoice.md\n    requires: Old invoice rules');
    await refs.getByRole('button', {name: 'Add reference', exact: true}).click();
    const add = refs.getByRole('form', {name: 'Add reference'});
    await add.getByLabel('Target artifact').selectOption({label: 'Tenant'});await add.getByLabel('Target document').selectOption({label: 'Need'});
    await add.getByLabel('Reason').fill('The need it serves');await add.getByLabel('Reason').press('Enter');
    await expect(refs.getByRole('button', {name: 'Need', exact: true})).toBeVisible();await expect(refs).toContainText('The need it serves');
    await refs.getByRole('button', {name: 'Remove reference to Need', exact: true}).click();
    await expect(refs.getByRole('button', {name: 'Need', exact: true})).toHaveCount(0);
    expect(await read(f.root, spec)).not.toContain('requirements/need.md');
    // A reference link opens its target; Used by names the consumer there.
    await refs.getByRole('button', {name: 'Invoice', exact: true}).click();
    await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Invoice');
    await expect(prop(page, 'Used by')).toContainText('Identity');
    await prop(page, 'Used by').getByRole('button', {name: 'Identity (document)', exact: true}).click();
    // Self-check: Not recorded, then Record writes a passed self-check with its section.
    await expect(prop(page, 'Self-check')).toContainText('Not recorded');
    await doc.getByRole('button', {name: 'Record self-check', exact: true}).click();
    await doc.getByRole('form', {name: 'Record'}).getByRole('button', {name: 'Record', exact: true}).click();
    await expect(prop(page, 'Self-check').locator('.status-badge')).toHaveText('Passed');
    await expect(prop(page, 'Self-check').getByRole('button', {name: 'Read the self-check', exact: true})).toBeVisible();
    const text = await read(f.root, spec);expect(text).toMatch(/self_check:\n  result: passed\n  source: .*#self-check/);
    // Invalid front matter stays inline; valid front matter saves.
    await doc.getByText('Edit front matter', {exact: true}).click();
    const front = doc.getByRole('textbox', {name: 'Front matter'});
    await front.fill('references: [unclosed');await doc.getByRole('button', {name: 'Save front matter', exact: true}).click();
    await expect(doc.locator('.front-matter').getByRole('alert')).toBeVisible();expect(await read(f.root, spec)).toBe(text);
    await front.fill(text.match(/^---\n([\s\S]*?)\n---/)[1] + '\nreviewer: team');await doc.getByRole('button', {name: 'Save front matter', exact: true}).click();
    await expect.poll(() => read(f.root, spec)).toContain('reviewer: team');
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([spec]);
    // Delete asks in place, then removes the file and opens the artifact section.
    await doc.getByRole('button', {name: 'Delete document', exact: true}).click();
    const confirm = doc.getByRole('group', {name: 'Delete document'});
    await expect(confirm).toContainText('Delete “Identity”? The file is removed from this branch.');
    await confirm.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(doc.getByRole('button', {name: 'Delete document', exact: true})).toBeFocused();
    await doc.getByRole('button', {name: 'Delete document', exact: true}).click();
    await confirm.getByRole('button', {name: 'Delete', exact: true}).click();
    await expect(artifactPage(page).getByRole('heading', {level: 1})).toHaveText('Tenant');
    await expect(artifactPage(page).getByRole('region', {name: 'Specifications', exact: true}).getByRole('button', {name: /^identity/})).toContainText('Removed');
    expect(existsSync(join(f.root, spec))).toBe(false);
    expect(commits(f.root)).toEqual(['fixture']);
  } finally {await f.cleanup();}
});

test('Compare with main, the unsaved guard and the Properties disclosure at narrow widths', async ({page}) => {
  const f = await editingRepository();
  await put(f.root, spec, original.replace('Established identity rules.', 'Proposed identity rules.'));
  await put(f.root, tenant + 'specifications/sessions.md', '# Sessions\n\nNew sessions.\n');
  const before = await fingerprint(f.root);
  try {
    await openRepository(page, f.root);
    let doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    const branchProp = prop(page, 'In this branch');
    await expect(branchProp).toContainText('Changed differs from main');
    await branchProp.getByRole('button', {name: 'Compare with main', exact: true}).click();
    const comparison = doc.getByRole('region', {name: 'Comparison with main'});
    await expect(comparison.locator('.diff-line.remove')).toContainText('Established identity rules.');
    await expect(comparison.locator('.diff-line.add')).toContainText('Proposed identity rules.');
    await branchProp.getByRole('button', {name: 'Hide comparison', exact: true}).click();await expect(comparison).toHaveCount(0);
    doc = await openDocument(page, 'Tenant', 'Specifications', 'Sessions');
    await expect(branchProp).toContainText('New not on main');
    await branchProp.getByRole('button', {name: 'Compare with main', exact: true}).click();
    await expect(comparison.locator('.diff-line.add')).toContainText(['# Sessions']);await expect(comparison.locator('.diff-line.remove')).toHaveCount(0);
    doc = await openDocument(page, 'Tenant', 'Requirements', 'Need');
    await expect(branchProp).toContainText('Same as main');await expect(branchProp.getByRole('button')).toHaveCount(0);
    // Keyboard editing; another page asks before it drops unsaved text.
    doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await expect(doc.getByRole('button', {name: 'Edit', exact: true})).toBeEnabled();
    await doc.getByRole('button', {name: 'Edit', exact: true}).focus();await page.keyboard.press('Enter');
    await expect(editor(page)).toBeFocused();await page.keyboard.press('Control+End');await page.keyboard.type('Keyboard line.\n');
    let asked = 0;page.once('dialog', dialog => {asked++;dialog.dismiss();});
    await showSidebar(page);await treeItem(page, /^Current work/).click();
    await expect.poll(() => asked).toBe(1);await expect(editor(page)).toBeVisible();await expect(doc).toBeVisible();
    // Properties sit beside the text when wide and in a disclosure at 1100 pixels and below.
    for (const width of [1440, 1100, 851, 700, 390]) {
      await page.setViewportSize({width, height: 900});
      const disclosure = doc.locator('details.properties-disclosure');
      if (width <= 1100) {
        await expect(disclosure).toBeVisible();await expect(disclosure).not.toHaveAttribute('open', '');
        await expect(properties(page)).toBeHidden();
        await disclosure.getByText('Properties', {exact: true}).click();
        await expect(properties(page)).toBeVisible();await expect(prop(page, 'File')).toContainText(spec);
        await disclosure.getByText('Properties', {exact: true}).click();
      } else {
        await expect(disclosure).toHaveCount(0);
        await expect(doc.locator('aside').getByRole('region', {name: 'Properties'}).getByRole('heading', {name: 'Properties', exact: true})).toBeVisible();
      }
      expect(await noOverflow(page)).toBe(true);
    }
    await editor(page).press('Control+s');await expect(doc.locator('.document-reader')).toContainText('Keyboard line.');
    expect(await read(f.root, spec)).toContain('Unchanged details.\nKeyboard line.\n');
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([spec]);
  } finally {await f.cleanup();}
});

test('Compare with main waits for the text of the branch before it shows a comparison', async ({page}) => {
  const f = await editingRepository();
  await put(f.root, spec, original.replace('Established identity rules.', 'Proposed identity rules.'));
  // The read of the branch text waits until the text on main is shown.
  let release, held = 0;const gate = new Promise(resolve => {release = resolve;});
  await page.route('**/api/repository/query', async route => {
    const body = route.request().postDataJSON();
    if (body.section === 'markdown' && body.source === spec && !body.revision) {held++;await gate;}
    // A refresh can abort a held read; its route is then gone.
    await route.continue().catch(() => {});
  });
  try {
    await openRepository(page, f.root);
    const doc = await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await expect.poll(() => held).toBeGreaterThan(0);
    const main = page.waitForResponse(r => r.url().endsWith('/api/repository/query') && r.request().postDataJSON().revision === 'established');
    await prop(page, 'In this branch').getByRole('button', {name: 'Compare with main', exact: true}).click();
    await main;
    // The text on main is read; without the branch text no line is compared.
    const comparison = doc.getByRole('region', {name: 'Comparison with main'});
    await expect(comparison.getByRole('status')).toHaveText('Reading the text…');
    await expect(comparison.locator('.diff-line')).toHaveCount(0);
    release();
    await expect(comparison.locator('.diff-line.remove')).toHaveText([/Established identity rules\./]);
    await expect(comparison.locator('.diff-line.add')).toHaveText([/Proposed identity rules\./]);
  } finally {release();await f.cleanup();}
});

const headings = '\n## Second\n\n### Third\n\n#### Fourth\n\n##### Fifth\n\n###### Sixth\n\nBody text.\n';
test('document reading: heading levels, safe code highlighting and sanitized Markdown without repository writes', async ({page}) => {
  const files = editingFiles(), source = '<script>window.codeInjected=true</script>\nconst answer = 42;\n<span data-knowledge-index="0">Forged callback</span>';
  files.set(tenant + 'README.md', identity('Tenant', '1.0.0', [], headings + '\n## Code examples\n\nOrdinary prose with `source_change`.\n\n```js\n' + source + '\n```\n\n```yaml\nsource_change: change-login\n```\n\n```unrecognized\n<unsafe>&exact text\n```\n'));
  files.set(tenant + 'specifications/hostile.md', '# Hostile\n\nStable text.\n<script>window.compromised=true</script><img src="https://hostile.example/x" onerror="window.compromised=true"><a href="javascript:window.compromised=true">Unsafe link</a>\n');
  const f = await editingRepository(files), before = await fingerprint(f.root), external = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));page.on('request', r => {if (new URL(r.url()).hostname !== '127.0.0.1') external.push(r.url());});
  try {
    await openRepository(page, f.root);
    await (await openArtifact(page, 'Tenant')).getByRole('button', {name: 'Read the overview', exact: true}).click();
    const reader = documentPage(page).locator('.document-reader .markdown');
    await expect(reader).toContainText('Body text.');
    await expect(reader.locator('h2, h3, h4, h5, h6')).toHaveText(['Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Code examples']);
    // Fenced code highlights as text; inline code and prose stay distinct.
    const panels = reader.locator('.code-panel');
    await expect(panels).toHaveCount(3);
    await expect(panels.nth(0).locator('code')).toHaveText(source);await expect(panels.nth(0).locator('.hljs-keyword').first()).toBeVisible();
    await expect(panels.nth(1).locator('.code-panel-label')).toHaveText('YAML');await expect(panels.nth(2).locator('code')).toHaveText('<unsafe>&exact text');
    await expect(reader.locator('p > code')).toHaveText('source_change');
    await expect(reader.locator('script, img, button.knowledge-link')).toHaveCount(0);
    expect(await page.evaluate(() => window.codeInjected)).toBeUndefined();
    // Hostile Markdown renders inert.
    const doc = await openDocument(page, 'Tenant', 'Specifications', 'Hostile');
    await expect(doc.locator('.document-reader')).toContainText('Stable text.');
    await expect(doc.locator('.document-reader').locator('script, img, a[href^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.compromised)).toBeUndefined();
    for (const width of [390, 700, 851, 1440]) {await page.setViewportSize({width, height: 1000});await expect(doc.getByRole('heading', {level: 1})).toBeVisible();expect(await noOverflow(page)).toBe(true);}
    await refresh(page);
    expect(await fingerprint(f.root)).toEqual(before);expect(external).toEqual([]);expect(errors).toEqual([]);
  } finally {await f.cleanup();}
});

// Heading sizes, keyboard dependency explanations and the artifact error notice.
test('document headings exceed the body size at each level and shrink by level', async ({page}) => {
  const files = editingFiles();files.set(tenant + 'README.md', identity('Tenant', '1.0.0', [], headings));
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    await (await openArtifact(page, 'Tenant')).getByRole('button', {name: 'Read the overview', exact: true}).click();
    const reader = documentPage(page).locator('.document-reader .markdown');
    await expect(reader).toContainText('Body text.');
    const sizes = await reader.evaluate(el => ({body: parseFloat(getComputedStyle(el.querySelector('p')).fontSize), headings: ['h2', 'h3', 'h4', 'h5', 'h6'].map(h => parseFloat(getComputedStyle(el.querySelector(h)).fontSize))}));
    for (let i = 0; i < sizes.headings.length; i++) {expect(sizes.headings[i]).toBeGreaterThan(sizes.body);if (i) expect(sizes.headings[i - 1]).toBeGreaterThan(sizes.headings[i]);}
  } finally {await f.cleanup();}
});

test('Enter on a focused dependency edge opens its explanation', async ({page}) => {
  const f = await fixtureRepository(inPlaceFixture());
  try {
    await openRepository(page, f.root);
    const authentication = await openArtifact(page, 'Authentication');
    await authentication.getByRole('button', {name: 'Show dependencies', exact: true}).click();
    const edge = authentication.locator('.react-flow__edge[data-id="dependency:tenant:authentication"]');
    await edge.focus();await expect(edge).toBeFocused();await page.keyboard.press('Enter');
    await expect(authentication.getByRole('region', {name: 'Dependency explanation'})).toContainText('identity format', {timeout: 2000});
  } finally {await f.cleanup();}
});

test('an error diagnostic of the artifact shows one notice with Fix', async ({page}) => {
  const files = editingFiles();
  files.set(spec, '---\nreferences:\n  - artifact: billing\n    element: requirements/missing.md\n    requires: Old invoice rules\n---\n# Identity\n\nRules.\n');
  const f = await editingRepository(files);
  try {
    await openRepository(page, f.root);
    const tenantPage = await openArtifact(page, 'Tenant');
    const notice = tenantPage.getByRole('alert').filter({hasText: 'This artifact has an error.'});
    await expect(notice).toBeVisible({timeout: 2000});
    await notice.getByRole('button', {name: 'Fix Identity', exact: true}).click();
    await expect(documentPage(page).getByRole('heading', {level: 1})).toHaveText('Identity');
  } finally {await f.cleanup();}
});

// Concept links (CP7, CP8, CPA4, CPA6). The concept page is another task, so
// the tests check the page object that a link opens, read from the props of
// the rendered page.
const shownPage = page => page.evaluate(() => {
  const element = document.querySelector('main.page-area > section');
  let fiber = element[Object.keys(element).find(k => k.startsWith('__reactFiber$'))];
  while (fiber && !(typeof fiber.type === 'function' && fiber.memoizedProps?.page)) fiber = fiber.return;
  return fiber?.memoizedProps.page;
});
const conceptsRead = (page, artifact) => page.waitForResponse(r => r.url().endsWith('/api/flows/query') && r.request().postDataJSON()?.operation === 'concepts' && r.request().postDataJSON()?.artifact === artifact);
const models = list => '---\nmodels:\n' + list.map(m => `  - id: ${m.id}\n    title: ${m.title}\n    description: ${m.description}\n    sources: [${m.sources.join(', ')}]\n`).join('') + '---\n# Domain model\n\nThe models of the artifact.\n';
const model = (id, title, description, sources = ['requirements/need.md']) => ({id, title, description, sources});
const catalog = 'docs/artifacts/catalog/';
const conceptTitles = section => section.locator('.concept-title');

test('artifact page Concepts: first sentences on one line, Show all, the concept page object, and no section without models', async ({page}) => {
  const files = editingFiles();
  files.set(tenant + 'specifications/domain-model.md', models([
    model('member', 'Member', 'The person who signs in to the tenant. A member has one identity.'),
    model('session', 'Session', 'The signed-in period of a member, which starts when the member signs in with a valid identity and ends when the member signs out, when the session expires after its idle time or when an administrator revokes it for the tenant. It has a token.'),
    model('team', 'Team', 'A group of members.'),
  ]));
  files.set(catalog + 'README.md', identity('Catalog', '1.0.0'));
  files.set(catalog + 'requirements/need.md', '# Catalog need\n\nItems exist.\n');
  files.set(catalog + 'versions/1.0.0/README.md', versionRecord('change-initial'));
  files.set(catalog + 'changes/change-initial/README.md', '# Initial\n');
  files.set(catalog + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  files.set(catalog + 'specifications/domain-model.md', models(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'].map(t => model(t.toLowerCase(), t, `${t} item.`))));
  const f = await fixtureRepository(files), before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    const tenantPage = await openArtifact(page, 'Tenant');
    const concepts = tenantPage.getByRole('region', {name: 'Concepts', exact: true});
    await expect(concepts.getByRole('heading', {level: 2})).toHaveText('Concepts 3');
    // After Flows and before Versions, which stays last.
    await expect(tenantPage.locator('.section-title')).toHaveText([/^Requirements/, /^Specifications/, /^Decisions/, /^Flows/, 'Concepts 3', /^Versions/]);
    await expect(conceptTitles(concepts)).toHaveText(['Member', 'Session', 'Team']);
    const details = concepts.locator('.concept-detail');
    await expect(details).toHaveText(['The person who signs in to the tenant.', /^The signed-in period of a member, .* for the tenant\.$/, 'A group of members.']);
    // One line at 1440 pixels: the long first sentence is cut, not wrapped.
    const lines = () => details.evaluateAll(list => list.map(e => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))));
    expect(await lines()).toEqual([1, 1, 1]);
    expect(await details.nth(1).evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
    await expect(concepts.getByRole('button', {name: /^Show all/})).toHaveCount(0);
    await expect(concepts.getByRole('button', {name: /^New /})).toHaveCount(0);
    await concepts.getByRole('button', {name: /^Session /}).click();
    await expect.poll(() => shownPage(page)).toEqual({kind: 'concept', artifact: 'tenant', model: 'session'});
    // Six concepts: five rows and Show all 6 concepts, in place.
    const catalogPage = await openArtifact(page, 'Catalog');
    const many = catalogPage.getByRole('region', {name: 'Concepts', exact: true});
    await expect(many.getByRole('heading', {level: 2})).toHaveText('Concepts 6');
    await expect(conceptTitles(many)).toHaveText(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']);
    await many.getByRole('button', {name: 'Show all 6 concepts', exact: true}).click();
    await expect(conceptTitles(many)).toHaveText(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']);
    await expect(many.getByRole('button', {name: 'Show first 5 concepts', exact: true})).toHaveAttribute('aria-expanded', 'true');
    // An artifact without models has no Concepts section after its concepts read (CPA6).
    const read = conceptsRead(page, 'billing');
    const billingPage = await openArtifact(page, 'Billing');
    expect((await (await read).json()).data.concepts).toEqual([]);
    await expect(billingPage.getByRole('region', {name: 'Versions', exact: true})).toBeVisible();
    await expect(billingPage.getByRole('region', {name: 'Concepts', exact: true})).toHaveCount(0);
    await expect(billingPage.getByText(/concept/i)).toHaveCount(0);
    // Two lines at most and no horizontal scroll at 390 pixels.
    await page.setViewportSize({width: 390, height: 900});
    await openArtifact(page, 'Tenant');
    await expect(conceptTitles(concepts)).toHaveText(['Member', 'Session', 'Team']);
    expect(Math.max(...await lines())).toBeLessThanOrEqual(2);
    expect(await noOverflow(page)).toBe(true);
    expect(errors).toEqual([]);
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([]);
  } finally {await f.cleanup();}
});

test('document Concepts: Declares and Describes with New, Changed and Removed on a branch; none on other documents', async ({page}) => {
  const files = editingFiles();
  const domain = tenant + 'specifications/domain-model.md';
  files.set(domain, models([model('member', 'Member', 'A person who signs in.'), model('session', 'Session', 'A signed-in period.'), model('legacy', 'Legacy', 'An old account.', ['specifications/identity.md'])]));
  files.set(tenant + 'specifications/plain.md', '# Plain\n\nNo model here.\n');
  const f = await editingRepository(files);
  // The branch adds Audit, changes Session and removes Legacy.
  await put(f.root, domain, models([model('member', 'Member', 'A person who signs in.'), model('session', 'Session', 'A signed-in period that expires.'), model('audit', 'Audit', 'A record of checks.')]));
  const before = await fingerprint(f.root), errors = [];page.on('pageerror', e => errors.push(e.message));
  try {
    await openRepository(page, f.root);
    await openDocument(page, 'Tenant', 'Specifications', 'Domain model');
    const concepts = prop(page, 'Concepts');
    await expect(concepts.locator('.prop-value')).toHaveText('Declares Audit +New, Legacy −Removed, Member, Session ~Changed');
    await expect.poll(async () => (await properties(page).locator('.prop-key').allTextContents()).slice(0, 3)).toEqual(['Kind', 'Concepts', 'In this branch']);
    // A removed declaration has no page: its name is plain text.
    await expect(concepts.getByRole('button')).toHaveText(['Audit', 'Member', 'Session']);
    await expect(concepts.locator('.concept-name').filter({hasText: 'Legacy'})).toHaveText('Legacy −Removed');
    await openDocument(page, 'Tenant', 'Requirements', 'Need');
    await expect(prop(page, 'Concepts').locator('.prop-value')).toHaveText('Describes Audit +New, Member, Session ~Changed');
    await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await expect(prop(page, 'Concepts').locator('.prop-value')).toHaveText('Describes Legacy −Removed');
    await expect(prop(page, 'Concepts').getByRole('button')).toHaveCount(0);
    // A document that declares and describes no model has no Concepts property (CPA6).
    let read = conceptsRead(page, 'tenant');
    await openDocument(page, 'Tenant', 'Specifications', 'Plain');
    expect((await (await read).json()).data.concepts.length).toBe(4);
    await expect(prop(page, 'Kind')).toBeVisible();
    await expect(prop(page, 'Concepts')).toHaveCount(0);
    read = conceptsRead(page, 'billing');
    await openDocument(page, 'Billing', 'Requirements', 'Invoice');
    await read;
    await expect(prop(page, 'Kind')).toBeVisible();
    await expect(prop(page, 'Concepts')).toHaveCount(0);
    // A name opens the concept page object.
    await openDocument(page, 'Tenant', 'Specifications', 'Domain model');
    await prop(page, 'Concepts').getByRole('button', {name: 'Member', exact: true}).click();
    await expect.poll(() => shownPage(page)).toEqual({kind: 'concept', artifact: 'tenant', model: 'member'});
    expect(errors).toEqual([]);
    expect(changedPaths(before, await fingerprint(f.root))).toEqual([]);
  } finally {await f.cleanup();}
});
