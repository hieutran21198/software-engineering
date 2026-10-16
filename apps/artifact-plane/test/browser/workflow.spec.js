import {test,expect} from '@playwright/test';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,orderingFixture,fingerprint,git} from '../fixtures.js';

test('delivery navigation preserves phases, commits, worktrees, refresh and read-only access without a standalone Workflow tab',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-worktree with space',missing=fixture.root+'-missing';
 const spec='docs/artifacts/knowledge/changes/change-next/specifications/new.md';
 await mkdir(join(fixture.root,spec,'..'),{recursive:true});await writeFile(join(fixture.root,spec),'# New contract\n\n## Self-check\nPassed.');
 git(fixture.root,'add','.');git(fixture.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Define new explorer contract');const id=git(fixture.root,'rev-parse','HEAD');
 git(fixture.root,'worktree','add','-qb','feature/delivery',other);git(fixture.root,'worktree','add','-q','--detach',missing);await rm(missing,{recursive:true,force:true});
 const before=await fingerprint(fixture.root),otherBefore=await fingerprint(other),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  const explorer=page.getByRole('group',{name:'Explorer view'}),panel=page.getByRole('complementary',{name:'Selection details'});
  await expect(explorer.getByRole('button')).toHaveCount(3);await expect(explorer.getByRole('button',{name:'Workflow',exact:true})).toHaveCount(0);await expect(page.getByLabel('Local ADD workflows')).toHaveCount(0);
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();await panel.getByRole('button',{name:/^change-next/}).click();
  await expect(panel.getByRole('navigation',{name:'Change phases'}).getByRole('button')).toHaveCount(6);await expect(panel.getByRole('button',{name:/^Approval/})).toHaveCount(0);
  await panel.getByRole('button',{name:/^Specification/}).click();await expect(panel).toContainText('Define new explorer contract');await panel.locator('.workflow-commit').first().locator('summary').click();await expect(panel.locator('.full-commit').first()).toHaveText(id);
  const divider=page.getByRole('separator',{name:'Resize details panel'});await divider.focus();await page.keyboard.press('ArrowLeft');const width=await divider.getAttribute('aria-valuenow');
  await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();await expect(panel.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();
  await explorer.getByRole('button',{name:'Units of work',exact:true}).click();await explorer.getByRole('button',{name:'Dependencies',exact:true}).click();await expect(panel.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();await expect(divider).toHaveAttribute('aria-valuenow',width);
  const worktrees=page.getByLabel('Registered worktrees');await expect(worktrees.locator('option').filter({hasText:missing})).toBeDisabled();
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.locator('.repo-info')).toContainText('feature/delivery');await expect(panel).toBeHidden();
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();await panel.getByRole('button',{name:/^change-next/}).click();await panel.getByRole('button',{name:/^Specification/}).click();await expect(panel).toContainText('Define new explorer contract');
  await page.screenshot({path:'test-results/delivery-evidence-wide.png',fullPage:true});await page.setViewportSize({width:700,height:1000});await page.screenshot({path:'test-results/delivery-evidence-narrow.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await fingerprint(fixture.root)).toEqual(before);expect(await fingerprint(other)).toEqual(otherBefore);expect(errors).toEqual([]);
  await rm(join(other,'docs/artifacts/knowledge/changes/change-next'),{recursive:true,force:true});await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();await expect(panel.getByRole('heading',{name:'Knowledge',exact:true,level:2})).toBeVisible();
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});
