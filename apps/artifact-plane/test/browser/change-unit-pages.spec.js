import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRepository,openArtifact,openUnit,treeItem,documentPage,noOverflow} from './workbench.js';
import {editingRepository,editingFiles,tenant,billing,read,commits,changedPaths,fingerprint,git} from './editing-fixtures.js';
import {fixtureRepository,sourceFixture} from '../fixtures.js';
// Task change-unit-pages: start a change, plan it, review, commit and version
// it; manage units; edit dependencies; migrate legacy; create a branch.
const work=page=>page.getByRole('region',{name:'Work page'}),change=page=>page.getByRole('region',{name:'Change page'});
const tab=(page,name)=>change(page).getByRole('group',{name:'Change sections'}).getByRole('button',{name,exact:true});
async function startChange(page,artifact,title){
 await work(page).getByRole('button',{name:'Start a change',exact:true}).click();
 const form=work(page).getByRole('form',{name:'Start change'});
 await form.getByLabel('Artifact').selectOption(artifact);await form.getByLabel('Title').fill(title);await form.getByLabel('Reason').fill('Invoices need tenant rules.');await form.getByLabel('Reason').press('Enter');
 await expect(change(page)).toBeVisible();
}

test('start a change with a unit, add a requirement, plan tasks, check DoD, record evidence and commit',async({page})=>{
 const f=await editingRepository(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,f.root);
  await startChange(page,'billing','Invoice rules');
  await expect(change(page).getByRole('heading',{name:'billing / change-invoice-rules',level:1})).toBeVisible();
  await expect(change(page).getByRole('region',{name:'Unit of work'})).toContainText('Invoice rules');
  expect(await read(f.root,billing+'changes/change-invoice-rules/README.md')).toContain('Invoices need tenant rules.');
  expect(await read(f.root,'docs/artifacts/units-of-work/invoice-rules/README.md')).toContain('change: change-invoice-rules');
  // Readiness names unmet items with the place that fixes them.
  const ready=change(page).getByRole('region',{name:'Readiness'});await expect(ready).toContainText('The plan is valid and has tasks');await expect(ready.getByRole('button',{name:'Open plan'}).first()).toBeVisible();
  await change(page).getByRole('button',{name:'Add requirement',exact:true}).click();
  const add=change(page).getByRole('form',{name:'Add requirement'});await add.getByLabel('Title').fill('Invoice tenancy');await add.getByLabel('Title').press('Enter');
  await expect(documentPage(page).getByRole('textbox',{name:'Document text'})).toBeVisible();
  await documentPage(page).getByRole('textbox',{name:'Document text'}).fill('# Invoice tenancy\n\nEvery invoice names one tenant.\n');
  await documentPage(page).getByRole('button',{name:'Save',exact:true}).click();
  await expect(documentPage(page).locator('.document-reader')).toContainText('Every invoice names one tenant.');
  expect(await read(f.root,billing+'requirements/invoice-tenancy.md')).toBe('# Invoice tenancy\n\nEvery invoice names one tenant.\n');
  await treeItem(page,/^billing \/ change-invoice-rules/).click();await tab(page,'Plan').click();
  await change(page).getByRole('button',{name:'Add task',exact:true}).click();
  const task=change(page).getByRole('form',{name:'Add task'});await task.getByLabel('Title').fill('Validate tenancy');await task.getByLabel('Definition of Done, one item per line').fill('Invoices without a tenant are rejected.\nTests pass.');await task.getByRole('button',{name:'Add task',exact:true}).click();
  const table=change(page).getByRole('table',{name:'Tasks'});await expect(table).toContainText('validate-tenancy');await expect(table).toContainText('0 of 2');
  await change(page).getByRole('button',{name:'Add task',exact:true}).click();await task.getByLabel('Title').fill('Remove me');await task.getByLabel('Definition of Done, one item per line').fill('Nothing.');await task.getByRole('button',{name:'Add task',exact:true}).click();
  await expect(table).toContainText('remove-me');
  await change(page).getByRole('button',{name:'Remove task remove-me'}).click();await expect(table).not.toContainText('remove-me');
  await table.getByRole('button',{name:'Validate tenancy'}).click();
  const rail=change(page).getByRole('complementary',{name:'Selection details'});
  await rail.getByRole('checkbox',{name:'Invoices without a tenant are rejected.'}).check();
  await expect(table).toContainText('1 of 2');
  await rail.getByRole('button',{name:'Edit task',exact:true}).click();const edit=rail.getByRole('form',{name:'Save task'});await edit.getByLabel('Title').fill('Validate invoice tenancy');await edit.getByRole('button',{name:'Save task'}).click();
  await expect(table).toContainText('Validate invoice tenancy');await expect(rail.getByRole('checkbox',{name:'Invoices without a tenant are rejected.'})).toBeChecked();
  await rail.getByRole('button',{name:'Record evidence',exact:true}).click();const evidence=rail.getByRole('form',{name:'Record evidence'});await evidence.getByLabel('Detail').fill('Rejection tests passed.');await evidence.getByRole('button',{name:'Record evidence'}).click();
  const taskPath=billing+'changes/change-invoice-rules/tasks/01-validate-tenancy.md';await expect.poll(()=>read(f.root,taskPath)).toContain('evidence_records:');const taskText=await read(f.root,taskPath);
  await expect(table.locator('tr').filter({hasText:'validate-tenancy'}).locator('td').last()).toHaveText('1');
  expect(taskText).toContain('- [x] Invoices without a tenant are rejected.');expect(taskText).toContain('evidence_records:');expect(taskText).toContain('# Validate invoice tenancy');
  await change(page).getByRole('button',{name:'Record plan self-check',exact:true}).click();await change(page).getByRole('form',{name:'Record'}).getByRole('button',{name:'Record'}).click();
  await expect.poll(()=>read(f.root,billing+'changes/change-invoice-rules/tasks/README.md')).toContain('self_check:');
  // Commit only the knowledge of this change, with the prefilled message.
  await writeFile(join(f.root,tenant+'requirements/need.md'),'# Need\n\nOutside the change.\n');
  await tab(page,'Review').click();
  const commit=change(page).getByRole('form',{name:'Commit'});await expect(commit.getByLabel('Commit message')).toHaveValue(/^billing change-invoice-rules: /);
  await expect(commit).not.toContainText(tenant+'requirements/need.md');
  await commit.getByRole('button',{name:'Commit',exact:true}).click();
  await expect(page.locator('.operation-status')).toContainText('Committed');
  expect(commits(f.root)[0]).toMatch(/^billing change-invoice-rules: /);expect(commits(f.root)).toHaveLength(2);
  expect(git(f.root,'status','--porcelain')).toContain(tenant+'requirements/need.md');
  expect(git(f.root,'show','--name-only','--format=','HEAD').split('\n').every(p=>p.startsWith(billing)||p==='docs/artifacts/units-of-work/invoice-rules/README.md')).toBe(true);
  expect(changedPaths(before,await fingerprint(f.root)).filter(p=>!p.startsWith(billing+'changes/change-invoice-rules/')&&!p.startsWith('docs/artifacts/units-of-work/invoice-rules/'))).toEqual([billing+'requirements/invoice-tenancy.md',tenant+'requirements/need.md']);
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});expect(await noOverflow(page)).toBe(true);await page.screenshot({path:`test-results/change-review-tab-${width}.png`,fullPage:true});}
  expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});

test('prepare a version with the two-file preview and record a publication review',async({page})=>{
 const files=editingFiles();
 files.set(billing+'changes/change-next/README.md','# Next\n\n## Reason and scope\n\nNext billing work.\n');
 files.set(billing+'changes/change-next/tasks/README.md','---\ntasks: [01-work.md]\n---\n# Plan\n');
 files.set(billing+'changes/change-next/tasks/01-work.md','---\nid: work\ndepends_on: []\n---\n# Work\n\n## Definition of Done\n\n- [ ] Done.\n\n## Evidence\n\nImplementation has not started.\n');
 const f=await editingRepository(files);
 try{
  await openRepository(page,f.root);await work(page).getByRole('article',{name:'billing / change-next'}).getByRole('button',{name:'Review',exact:true}).click();
  await change(page).getByRole('button',{name:'Prepare version',exact:true}).click();
  const form=change(page).getByRole('form',{name:'Prepare version'});await form.getByLabel('Reason').fill('Adds invoice rules.');await form.getByLabel('Summary').fill('Billing gains invoice tenancy.');
  await form.getByRole('button',{name:'Preview version'}).click();
  await expect(form.getByRole('alert')).toContainText('Definition of Done items are not checked');await expect(form.getByRole('alert')).toContainText('work: Done.');
  await form.getByLabel('Prepare the version with unchecked Definition of Done items').check();await form.getByRole('button',{name:'Preview version'}).click();
  const preview=form.getByRole('region',{name:'Version preview'});await expect(preview).toContainText('Version 1.1.0');await expect(preview).toContainText(billing+'versions/1.1.0/README.md');await expect(preview).toContainText(billing+'README.md');
  expect(git(f.root,'status','--porcelain','--','docs')).toBe('');
  await form.getByRole('button',{name:'Prepare 1.1.0'}).click();
  await expect(change(page).getByRole('region',{name:'Publication review'})).toBeVisible();
  expect(await read(f.root,billing+'versions/1.1.0/README.md')).toContain('source_change: change-next');expect(await read(f.root,billing+'README.md')).toContain('current_version: 1.1.0');
  await change(page).getByRole('button',{name:'Record publication review',exact:true}).click();
  const review=change(page).getByRole('form',{name:'Record publication review'});await review.getByLabel('Pull request URL').fill('https://example.invalid/org/repo/pull/7');await review.getByLabel('Repository URL (empty: the origin remote)').fill('https://example.invalid/org/repo');await review.getByRole('button',{name:'Record publication review'}).click();
  await expect.poll(()=>read(f.root,billing+'README.md')).toContain('pull_request: https://example.invalid/org/repo/pull/7');
  expect(await read(f.root,billing+'versions/1.1.0/README.md')).toContain('## Publication review');
 }finally{await f.cleanup();}
});

test('unit page manages members, criteria, evidence and affected flows; new unit and dependencies',async({page})=>{
 const files=editingFiles();
 for(const [artifact,name] of [['tenant','change-rules'],['billing','change-rules']]){files.set(`docs/artifacts/${artifact}/changes/${name}/README.md`,'# Rules\n');files.set(`docs/artifacts/${artifact}/changes/${name}/tasks/README.md`,'---\ntasks: [01-a.md]\n---\n# Plan\n');files.set(`docs/artifacts/${artifact}/changes/${name}/tasks/01-a.md`,'---\nid: a\ndepends_on: []\n---\n# A\n\n- [x] Done.\n\n## Evidence\n\nChecks passed.\n');}
 files.set(tenant+'specifications/flows/login.md','---\nflow:\n  id: login\n  artifact: tenant\n  title: Login\n  trigger: Start\n  outcome: Done\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Start\n      supports: []\n  transitions: []\n  support: []\n  gaps: [Not traced]\n---\n# Login\n');
 const f=await editingRepository(files);
 try{
  await openRepository(page,f.root);
  await work(page).getByRole('button',{name:'New unit',exact:true}).click();
  const form=work(page).getByRole('form',{name:'Create unit'});await form.getByLabel('Title').fill('Shared rules');await form.getByLabel('Purpose').fill('Rules across tenant and billing.');
  await form.getByRole('checkbox',{name:'tenant / change-rules'}).check();await form.getByRole('checkbox',{name:'billing / change-rules'}).check();
  await form.getByLabel('Acceptance criteria, one per line').fill('Tenant rules hold.\nBilling uses tenant rules.');await form.getByRole('button',{name:'Create unit'}).click();
  const unit=page.getByRole('region',{name:'Unit page'});await expect(unit.getByRole('heading',{name:'Shared rules',level:1})).toBeVisible();
  const rail=unit.getByRole('complementary',{name:'Selection details'});
  await expect(rail.getByRole('region',{name:'Unit editing'})).toContainText('billing / change-rules');
  await rail.getByRole('button',{name:'Remove member billing / change-rules'}).click();await expect(rail.getByRole('region',{name:'Unit editing'})).not.toContainText('billing / change-rules');
  await rail.getByRole('button',{name:'Add member',exact:true}).click();await rail.getByRole('form',{name:'Add member'}).getByRole('button',{name:'Add member'}).click();
  await expect(rail.getByRole('button',{name:'Remove member billing / change-rules'})).toBeVisible();
  await rail.getByRole('button',{name:'Add criterion',exact:true}).click();await rail.getByRole('form',{name:'Add criterion'}).getByLabel('Criterion',{exact:true}).fill('Docs are updated.');await rail.getByRole('form',{name:'Add criterion'}).getByLabel('Criterion',{exact:true}).press('Enter');
  await expect(rail).toContainText('Docs are updated.');
  await rail.getByRole('button',{name:/^Remove criterion docs/}).click();await expect(rail).not.toContainText('Docs are updated.');
  await rail.getByRole('button',{name:/^Record evidence for tenant/}).click();const evidence=rail.getByRole('form',{name:'Record evidence'});await evidence.getByLabel('Source').selectOption('');await evidence.getByLabel('Detail for the brief').fill('Combined rule checks passed.');await evidence.getByRole('button',{name:'Record evidence'}).click();
  await expect.poll(()=>read(f.root,'docs/artifacts/units-of-work/shared-rules/README.md')).toContain('Combined rule checks passed.');
  await rail.getByRole('button',{name:'Set affected flows',exact:true}).click();const flows=rail.getByRole('form',{name:'Set affected flows'});await flows.getByRole('checkbox',{name:'tenant:login'}).check();await flows.getByLabel('Flow assessment').fill('Login reads the shared rules.');await flows.getByRole('button',{name:'Set affected flows'}).click();
  await expect.poll(()=>read(f.root,'docs/artifacts/units-of-work/shared-rules/README.md')).toContain('flow: login');
  const brief=await read(f.root,'docs/artifacts/units-of-work/shared-rules/README.md');expect(brief).toContain('criterion: Tenant rules hold.');expect(brief).toContain('integration: true');expect(brief).toContain('artifact: billing');
  // A dependency cycle is rejected inline; a valid edge applies and can be removed.
  const tenantPage=await openArtifact(page,'Tenant tenant');
  await tenantPage.getByRole('button',{name:'Add dependency',exact:true}).click();await tenantPage.getByRole('form',{name:'Add dependency'}).getByLabel('Artifact').selectOption('billing');await tenantPage.getByRole('form',{name:'Add dependency'}).getByRole('button',{name:'Add dependency'}).click();
  await expect(tenantPage.getByRole('alert')).toContainText(/cycle/i);expect(await read(f.root,tenant+'README.md')).toContain('depends_on: []');
  const billingPage=await openArtifact(page,'Billing billing');await billingPage.getByRole('button',{name:'Remove dependency on tenant'}).click();
  await expect.poll(()=>read(f.root,billing+'README.md')).toContain('depends_on: []');
 }finally{await f.cleanup();}
});

test('legacy migration previews its plan and the protected branch creates a branch',async({page})=>{
 const files=sourceFixture();for(const a of ['tenant','authentication'])files.set(`docs/artifacts/${a}/versions/1.0.0/README.md`,'# Snapshot\n');
 const f=await fixtureRepository(files);
 try{
  await openRepository(page,f.root);
  const banner=page.getByRole('region',{name:'Branch protection'});await banner.getByRole('button',{name:'Create branch',exact:true}).click();await banner.getByLabel('Branch name').fill('migrate-tenant');await banner.getByLabel('Branch name').press('Enter');
  await expect(work(page)).toContainText('Branch migrate-tenant');await expect(banner).toHaveCount(0);await expect(page.getByLabel('Worktree',{exact:true}).locator('option:checked')).toContainText('migrate-tenant');
  const artifact=await openArtifact(page,'Tenant tenant');await expect(artifact).toContainText('legacy snapshot layout');
  await artifact.getByRole('button',{name:'Migrate to in-place',exact:true}).click();
  const plan=artifact.getByRole('region',{name:'Migration plan'});await expect(plan).toContainText('docs/artifacts/tenant/specifications/identity.md');
  expect(git(f.root,'status','--porcelain')).toBe('?? untracked.txt');
  await plan.getByRole('button',{name:'Apply migration'}).click();
  await expect.poll(()=>read(f.root,'docs/artifacts/tenant/README.md')).toMatch(/^---\ncurrent_version: 1\.0\.0/);
  await expect(page.getByRole('region',{name:'Artifact page'})).toContainText('In-place layout');
  expect(commits(f.root)).toEqual(['fixture']);
 }finally{await f.cleanup();}
});
