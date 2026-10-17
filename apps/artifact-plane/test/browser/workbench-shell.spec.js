import {test,expect} from '@playwright/test';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,fingerprint,git,identity,versionRecord} from '../fixtures.js';
import {openRepository,tree,treeItem,openArtifact,showTree,noOverflow} from './workbench.js';
// The workbench shell: source bar, branch control, protection banner, one
// navigation tree and the work page over an in-place repository.
const base='docs/artifacts/tenant/',change=base+'changes/change-next/',unit='docs/artifacts/units-of-work/tenant-rules/README.md';
async function fixture(){
 const f=await fixtureRepository(new Map([
  [base+'README.md',identity('Tenant','1.0.0')],[base+'specifications/identity.md','# Identity\n\nEstablished identity rules.\n'],[base+'requirements/need.md','# Need\n\nStable need.\n'],
  [base+'versions/1.0.0/README.md',versionRecord('change-initial')],[base+'changes/change-initial/README.md','# Initial'],[base+'changes/change-initial/tasks/README.md','---\ntasks: []\n---\n# Plan'],
  ['docs/artifacts/billing/README.md',identity('Billing','1.0.0',['tenant'])],['docs/artifacts/billing/requirements/invoice.md','# Invoice\n'],
  ['docs/artifacts/billing/versions/1.0.0/README.md',versionRecord('change-initial')],['docs/artifacts/billing/changes/change-initial/README.md','# Initial'],['docs/artifacts/billing/changes/change-initial/tasks/README.md','---\ntasks: []\n---\n# Plan'],
 ]));
 return f;
}
const put=async(root,p,t)=>{await mkdir(join(root,p,'..'),{recursive:true});await writeFile(join(root,p),t);};
async function branchFixture(){
 const f=await fixture();git(f.root,'checkout','-q','-b','change-next');
 await put(f.root,base+'specifications/identity.md','# Identity\n\nProposed identity rules.\n');
 await put(f.root,base+'specifications/sessions.md','# Sessions\n');
 await put(f.root,change+'README.md','# Next change\n\nPropose identity rules.\n');
 await put(f.root,change+'tasks/README.md','---\ntasks: [01-rules.md]\n---\n# Plan\n');
 await put(f.root,change+'tasks/01-rules.md','---\nid: rules\ndepends_on: []\n---\n# Rules\n\n- [ ] Implement.\n');
 await put(f.root,unit,'---\nunit_of_work: tenant-rules\nchanges:\n  - artifact: tenant\n    change: change-next\nacceptance:\n  - id: rules\n    criterion: Identity rules are proposed.\nevidence: []\n---\n# Tenant rules\n');
 git(f.root,'add','docs');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Start change-next');
 await put(f.root,base+'requirements/need.md','# Need\n\nChanged need, not committed.\n');
 return f;
}
const work=page=>page.getByRole('region',{name:'Work page'});

test('work page shows open changes with phase chips, units, uncommitted knowledge and honest labels',async({page})=>{
 const f=await branchFixture(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,f.root);
  await expect(work(page)).toContainText('Branch change-next · knowledge can be edited');
  await expect(page.getByRole('region',{name:'Branch protection'})).toHaveCount(0);await expect(page.getByText('Read-only',{exact:true})).toHaveCount(0);
  const card=work(page).getByRole('article',{name:'tenant / change-next'});
  await expect(card.locator('.phase-chip')).toHaveText('Requirement');await expect(card).toContainText('Write the requirement and record its self-check.');await expect(card).toContainText('Unit: Tenant rules');
  await expect(work(page).getByRole('region',{name:'Units in progress'})).toContainText('Tenant rules');
  await expect(work(page).getByRole('region',{name:'Uncommitted knowledge'})).toContainText(base+'requirements/need.md');
  await expect(page.getByRole('status',{name:'Edit state'})).toHaveText('1 uncommitted knowledge file');
  await expect(treeItem(page,/^tenant \/ change-next/)).toContainText('Requirement');
  await card.getByRole('button',{name:'Open',exact:true}).click();
  const changePage=page.getByRole('region',{name:'Change page'});await expect(changePage).toContainText('current step: Requirement');
  await expect(treeItem(page,/^tenant \/ change-next/)).toHaveAttribute('aria-selected','true');
  const billing=await openArtifact(page,'Billing');await expect(billing).toContainText('Open change: No open change');await expect(billing).not.toContainText('Ambiguous');
  const tenant=await openArtifact(page,'Tenant tenant');await expect(tenant.locator('.status-pill').filter({hasText:'changed since main'})).toHaveCount(2);await expect(tenant.locator('.status-pill').filter({hasText:'new since main'})).toHaveCount(1);
  await treeItem(page,/^Specifications/).last().click();await expect(treeItem(page,/^identity\.md/)).toContainText('changed since main');await expect(treeItem(page,/^sessions\.md/)).toContainText('new since main');
  await treeItem(page,/^identity\.md/).click();await expect(page.getByRole('region',{name:'Document page'})).toContainText('Changed since main');await expect(page.getByRole('region',{name:'Document page'})).toContainText('Proposed identity rules.');
  expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});

test('tree search filters every group and roving keys move, expand, collapse and open',async({page})=>{
 const f=await branchFixture();
 try{
  await openRepository(page,f.root);
  const search=page.getByLabel('Search knowledge',{exact:true});
  await search.fill('rules');await expect(treeItem(page,/^Tenant rules/).first()).toBeVisible();await expect(treeItem(page,/^Billing/)).toHaveCount(0);
  await search.fill('invoice');await expect(treeItem(page,/^invoice\.md/)).toBeVisible();await expect(treeItem(page,/^Tenant rules/)).toHaveCount(0);
  await search.fill('absent');await expect(tree(page).getByRole('treeitem')).toHaveCount(0);await expect(page.getByRole('status').filter({hasText:'No work, artifacts or units match'})).toBeVisible();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  const first=tree(page).getByRole('treeitem').first();await first.focus();await expect(first).toHaveAttribute('tabindex','0');
  await page.keyboard.press('ArrowDown');await expect(treeItem(page,/^tenant \/ change-next/)).toBeFocused();
  await expect(tree(page).locator('[role=treeitem][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('End');await expect(tree(page).getByRole('treeitem').last()).toBeFocused();
  await page.keyboard.press('Home');await expect(first).toBeFocused();
  await page.keyboard.press('ArrowLeft');await expect(first).toHaveAttribute('aria-expanded','false');await expect(treeItem(page,/^tenant \/ change-next/)).toHaveCount(0);
  await page.keyboard.press('ArrowRight');await expect(first).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('ArrowRight');await expect(treeItem(page,/^tenant \/ change-next/)).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.getByRole('region',{name:'Change page'})).toBeVisible();
  // Expansion belongs to the project for this session.
  const artifacts=treeItem(page,/^Artifacts/);await artifacts.click();await expect(artifacts).toHaveAttribute('aria-expanded','false');
  await page.reload();await expect(work(page)).toBeVisible();await expect(treeItem(page,/^Artifacts/)).toHaveAttribute('aria-expanded','false');
 }finally{await f.cleanup();}
});

test('branch control switches worktrees and the protected branch offers Create branch',async({page})=>{
 const f=await fixture(),other=f.root+'-other';git(f.root,'worktree','add','-qb','feature/other',other);
 try{
  await openRepository(page,f.root);
  const banner=page.getByRole('region',{name:'Branch protection'});
  await expect(banner).toContainText('This worktree has main checked out. You cannot edit knowledge here.');
  await expect(work(page)).toContainText('Branch main · protected');
  await expect(work(page).getByRole('region',{name:'Open changes'})).toContainText('No open change');
  await banner.getByRole('button',{name:'Create branch',exact:true}).click();
  const name=banner.getByLabel('Branch name');await name.fill('main');await expect(banner.getByRole('button',{name:'Create',exact:true})).toBeDisabled();
  await name.fill('change/next-rules');await banner.getByRole('button',{name:'Create',exact:true}).click();
  // Without the Git route the banner explains the fallback; with it the branch is created.
  await expect.poll(async()=>await banner.getByRole('alert').count()?'explained':(await work(page).textContent()).includes('Branch change/next-rules')?'created':'pending').not.toBe('pending');
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);
  await expect(work(page)).toContainText('Branch feature/other');await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(other);
  await expect(treeItem(page,/^Tenant tenant/)).toBeVisible();
 }finally{await rm(other,{recursive:true,force:true});await f.cleanup();}
});

test('the tree becomes a drawer at narrow widths and no page overflows at four widths',async({page})=>{
 const f=await branchFixture();
 try{
  await openRepository(page,f.root);
  for(const width of [1440,851,700,390]){
   await page.setViewportSize({width,height:900});
   const toggle=page.getByRole('button',{name:'Navigation',exact:true});
   if(width<=800){await expect(toggle).toBeVisible();await expect(tree(page)).toBeHidden();await toggle.click();await expect(tree(page)).toBeVisible();await page.keyboard.press('Escape');await expect(tree(page)).toBeHidden();}
   else{await expect(toggle).toBeHidden();await expect(tree(page)).toBeVisible();}
   expect(await noOverflow(page)).toBe(true);
   await showTree(page);await treeItem(page,/^Dependency graph/).click();await expect(page.getByRole('region',{name:'Graph page'})).toBeVisible();expect(await noOverflow(page)).toBe(true);
   await page.screenshot({path:`test-results/workbench-graph-${width}.png`,fullPage:true});
   await showTree(page);await treeItem(page,/^tenant \/ change-next/).click();await expect(page.getByRole('region',{name:'Change page'})).toBeVisible();expect(await noOverflow(page)).toBe(true);
   await page.getByRole('navigation',{name:'Breadcrumb'}).getByRole('button').filter({hasText:f.root.split('/').at(-1)}).click();await expect(work(page)).toBeVisible();expect(await noOverflow(page)).toBe(true);
   await page.screenshot({path:`test-results/workbench-work-${width}.png`,fullPage:true});
  }
 }finally{await f.cleanup();}
});
