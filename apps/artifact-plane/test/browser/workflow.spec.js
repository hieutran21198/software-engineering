import {test,expect} from '@playwright/test';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,orderingFixture,fingerprint,git} from '../fixtures.js';
import {openRepository,openChange,openGraph,noOverflow} from './workbench.js';

test('delivery navigation preserves phases, commits, worktrees, refresh and read-only access without a standalone Workflow tab',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-worktree with space',missing=fixture.root+'-missing';
 const spec='docs/artifacts/knowledge/changes/change-next/specifications/new.md';
 await mkdir(join(fixture.root,spec,'..'),{recursive:true});await writeFile(join(fixture.root,spec),'# New contract\n\n## Self-check\nPassed.');
 git(fixture.root,'add','.');git(fixture.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Define new explorer contract');const id=git(fixture.root,'rev-parse','HEAD');
 git(fixture.root,'worktree','add','-qb','feature/delivery',other);git(fixture.root,'worktree','add','-q','--detach',missing);await rm(missing,{recursive:true,force:true});
 const before=await fingerprint(fixture.root),otherBefore=await fingerprint(other),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,fixture.root);
  await expect(page.getByRole('group',{name:'Explorer view'})).toHaveCount(0);await expect(page.getByLabel('Local ADD workflows')).toHaveCount(0);
  let change=await openChange(page,'change-next');
  await expect(change.getByRole('navigation',{name:'Change phases'}).getByRole('button')).toHaveCount(6);await expect(change.getByRole('button',{name:/^Approval/})).toHaveCount(0);
  await change.getByRole('button',{name:/^Specification/}).click();await expect(change).toContainText('Define new explorer contract');await change.locator('.workflow-commit').first().locator('summary').click();await expect(change.locator('.full-commit').first()).toHaveText(id);
  await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();await expect(change.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();
  await openGraph(page);change=await openChange(page,'change-next');await expect(change.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();
  await expect(page.getByLabel('Worktree',{exact:true}).locator('option').filter({hasText:missing})).toBeDisabled();
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.getByRole('region',{name:'Work page'})).toContainText('Branch feature/delivery');await expect(change).toBeHidden();
  change=await openChange(page,'change-next');await change.getByRole('button',{name:/^Specification/}).click();await expect(change).toContainText('Define new explorer contract');
  await page.screenshot({path:'test-results/delivery-evidence-wide.png',fullPage:true});await page.setViewportSize({width:700,height:1000});await page.screenshot({path:'test-results/delivery-evidence-narrow.png',fullPage:true});expect(await noOverflow(page)).toBe(true);
  expect(await fingerprint(fixture.root)).toEqual(before);expect(await fingerprint(other)).toEqual(otherBefore);expect(errors).toEqual([]);
  await rm(join(other,'docs/artifacts/knowledge/changes/change-next'),{recursive:true,force:true});await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Change not found',level:1})).toBeVisible();
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});
