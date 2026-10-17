import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,fingerprint,git,identity,versionRecord} from '../fixtures.js';
import {openRepository,selectOnGraph,openChange,documentPage,noOverflow} from './workbench.js';
// In-place layout: working knowledge, the established view on main, delivery
// records with declared evidence, and the Git-baseline review.
const base='docs/artifacts/tenant/',change=base+'changes/change-next/';
async function fixture(){
 const f=await fixtureRepository(new Map([
  [base+'README.md',identity('Tenant','1.0.0')],[base+'specifications/identity.md','# Identity\n\nEstablished identity rules.\n'],[base+'requirements/need.md','# Need\n\nStable need.\n'],
  [base+'versions/1.0.0/README.md',versionRecord('change-initial')],[base+'changes/change-initial/README.md','# Initial'],[base+'changes/change-initial/tasks/README.md','---\ntasks: []\n---\n# Plan'],
 ]));
 git(f.root,'checkout','-q','-b','change-next');
 const put=async(p,t)=>{await mkdir(join(f.root,p,'..'),{recursive:true});await writeFile(join(f.root,p),t);};
 await put(base+'specifications/identity.md','---\nself_check: {result: passed, source: "'+base+'specifications/identity.md#self-check"}\n---\n# Identity\n\nProposed identity rules.\n\n## Self-check\n\nContract checked.\n');
 await put(change+'README.md','# Next change\n\nPropose identity rules.\n');
 await put(change+'tasks/README.md','---\ntasks: [01-rules.md]\n---\n# Plan\n');
 await put(change+'tasks/01-rules.md','---\nid: rules\ndepends_on: []\n---\n# Rules\n\n- [ ] Implement.\n');
 return f;
}
const panel=page=>page.getByRole('tabpanel').filter({visible:true}),details=page=>panel(page).getByRole('complementary',{name:'Selection details'});
test('L5: in-place working knowledge, established view, declared delivery evidence and review fit wide and narrow widths',async({page})=>{
 const f=await fixture(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,f.root);await selectOnGraph(page,'Tenant');
  await expect(details(page)).toContainText('In-place layout');await expect(details(page)).toContainText('Established v1.0.0');
  await page.getByRole('button',{name:'Expand Tenant',exact:true}).click();
  await page.getByRole('button',{name:'Specifications in Tenant',exact:true}).click();
  await expect(panel(page).getByText('Working knowledge',{exact:true}).first()).toBeVisible();
  await panel(page).locator('.element-node').filter({hasText:'specifications/identity.md'}).click();
  await expect(details(page)).toContainText('Working · proposed (changed)');
  const established=details(page).getByRole('button',{name:'Read established on main',exact:true});
  await established.focus();await page.keyboard.press('Enter');
  const reader=documentPage(page);
  await expect(reader).toContainText('Established identity rules.');
  await reader.getByRole('button',{name:'Back to graph',exact:true}).click();
  // Back returns to the graph details and keeps keyboard focus inside them.
  await expect(details(page).locator(':focus')).toHaveCount(1);
  await panel(page).locator('.element-node').filter({hasText:'specifications/identity.md'}).click();
  await details(page).getByRole('button',{name:'Read document',exact:true}).click();await expect(reader).toContainText('Proposed identity rules.');await reader.getByRole('button',{name:'Back to graph',exact:true}).click();
  const change=await openChange(page,'change-next');
  await expect(change.getByRole('navigation',{name:'Change phases'})).toContainText('Not declared');
  await expect(change.getByRole('navigation',{name:'Change phases'})).toContainText('Documented complete');
  await expect(change).toContainText('current step: Requirement');
  await change.getByRole('group',{name:'Change sections'}).getByRole('button',{name:'Review',exact:true}).click();
  const review=panel(page).getByRole('region',{name:'Change review',exact:true});
  await expect(review).toContainText('Baseline: established on main');
  await expect(review.getByRole('region',{name:'Declared evidence'})).toContainText('Remaining gate: Requirement');
  for(const width of [1440,390]){await page.setViewportSize({width,height:1000});expect(await noOverflow(page)).toBe(true);await page.screenshot({path:`test-results/in-place-${width}.png`,fullPage:true});}
  expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});
