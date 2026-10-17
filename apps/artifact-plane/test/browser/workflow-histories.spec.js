import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {join} from 'node:path';
import {fixtureRepository,orderingFixture,fingerprint,git} from '../fixtures.js';
import {openRepository,openArtifact,tree,noOverflow} from './workbench.js';

test('delivery histories stay closed, order by Git recency and preserve phase selection',async({page})=>{
 const f=await fixtureRepository(orderingFixture()),base='docs/artifacts/knowledge/';
 await writeFile(join(f.root,base,'README.md'),(await readFile(join(f.root,base,'README.md'),'utf8'))+'\n## Active change\n[Next](changes/change-next/README.md)\n');
 git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Declare active source');
 for(const [name,date]of [['change-aold','2025-01-01T12:00:00Z'],['change-tie10','2025-02-01T12:00:00Z'],['change-tie2','2025-02-01T12:00:00Z'],['change-znew','2025-03-01T12:00:00Z'],['change-unknown',null]]){
  const prefix=join(f.root,base,'changes',name);await mkdir(join(prefix,'specifications'),{recursive:true});await writeFile(join(prefix,'README.md'),'# Retained change');await writeFile(join(prefix,'specifications/main.md'),'# Historic contract\n\n## Self-check\nPassed.');
  if(date){git(f.root,'add',base+'changes/'+name);execFileSync('git',['-C',f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Evidence '+name],{env:{...process.env,GIT_AUTHOR_DATE:date,GIT_COMMITTER_DATE:date}});}
 }
 const before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,f.root);let artifact=await openArtifact(page,'Knowledge');
  const histories=artifact.getByRole('button',{name:'Delivery histories'});
  await expect(histories).toHaveAttribute('aria-expanded','false');await expect(artifact.locator('.delivery-change')).toHaveCount(1);await histories.click();
  await expect.poll(()=>artifact.locator('.delivery-change span').allTextContents()).toEqual(['change-next','change-znew','change-tie2','change-tie10','change-aold','change-unknown']);
  await artifact.getByRole('button',{name:/^change-znew/}).click();const change=page.getByRole('region',{name:'Change page'});await change.getByRole('button',{name:/^Specification/}).click();await expect(change).toContainText('Evidence change-znew');await expect(change).toContainText('2025-03-01T12:00:00.000Z');await expect(change).toContainText('does not prove completion');
  await change.getByRole('navigation',{name:'Breadcrumb'}).getByRole('button',{name:'knowledge',exact:true}).click();await expect(histories).toHaveAttribute('aria-expanded','true');await histories.click();await expect(histories).toHaveAttribute('aria-expanded','false');
  await expect(tree(page).getByRole('treeitem',{name:/^Delivery history/})).toBeVisible();await tree(page).getByRole('treeitem',{name:/^Delivery history/}).click();await tree(page).getByRole('treeitem',{name:/^change-znew/}).click();await expect(change.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();await expect(change).toContainText('Evidence change-znew');
  await page.screenshot({path:'test-results/delivery-histories-wide.png',fullPage:true});await page.setViewportSize({width:700,height:1000});await page.screenshot({path:'test-results/delivery-histories-narrow.png',fullPage:true});expect(await noOverflow(page)).toBe(true);expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});
