import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {join} from 'node:path';
import {fixtureRepository,orderingFixture,fingerprint,git} from '../fixtures.js';

test('delivery histories stay closed, order by Git recency, preserve phase selection and keep navigation centered',async({page})=>{
 const f=await fixtureRepository(orderingFixture()),base='docs/artifacts/knowledge/';
 await writeFile(join(f.root,base,'README.md'),(await readFile(join(f.root,base,'README.md'),'utf8'))+'\n## Active change\n[Next](changes/change-next/README.md)\n');
 git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Declare active source');
 for(const [name,date]of [['change-aold','2025-01-01T12:00:00Z'],['change-tie10','2025-02-01T12:00:00Z'],['change-tie2','2025-02-01T12:00:00Z'],['change-znew','2025-03-01T12:00:00Z'],['change-unknown',null]]){
  const prefix=join(f.root,base,'changes',name);await mkdir(join(prefix,'specifications'),{recursive:true});await writeFile(join(prefix,'README.md'),'# Retained change');await writeFile(join(prefix,'specifications/main.md'),'# Historic contract\n\n## Self-check\nPassed.');
  if(date){git(f.root,'add',base+'changes/'+name);execFileSync('git',['-C',f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Evidence '+name],{env:{...process.env,GIT_AUTHOR_DATE:date,GIT_COMMITTER_DATE:date}});}
 }
 const before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(f.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();
  const switcher=page.getByRole('group',{name:'Explorer view'}),area=page.locator('.canvas-area'),panel=page.getByRole('complementary',{name:'Selection details'}),histories=panel.getByRole('button',{name:'Delivery histories'});
  const initial=await switcher.boundingBox(),canvas=await area.boundingBox();expect(Math.abs(initial.x+initial.width/2-canvas.x-canvas.width/2)).toBeLessThan(1);
  await expect(histories).toHaveAttribute('aria-expanded','false');await expect(panel.locator('.delivery-change')).toHaveCount(1);await histories.click();
  await expect.poll(()=>panel.locator('.delivery-change span').allTextContents()).toEqual(['change-next','change-znew','change-tie2','change-tie10','change-aold','change-unknown']);
  await panel.getByRole('button',{name:/^change-znew/}).click();await panel.getByRole('button',{name:/^Specification/}).click();await expect(panel).toContainText('Evidence change-znew');await expect(panel).toContainText('2025-03-01T12:00:00.000Z');await expect(panel).toContainText('does not prove completion');
  await histories.click();await expect(histories).toHaveAttribute('aria-expanded','false');await expect(panel.getByRole('heading',{name:'Specification',level:2,exact:true})).toBeVisible();await expect(panel).toContainText('Evidence change-znew');
  await switcher.getByRole('button',{name:'Units of work',exact:true}).click();const units=await switcher.boundingBox();expect(units.x).toBe(initial.x);expect(units.width).toBe(initial.width);await switcher.getByRole('button',{name:'Dependencies',exact:true}).click();await expect(histories).toHaveAttribute('aria-expanded','false');await expect(panel).toContainText('Evidence change-znew');
  await page.screenshot({path:'test-results/delivery-histories-wide.png',fullPage:true});await page.setViewportSize({width:700,height:1000});const narrow=await switcher.boundingBox(),narrowArea=await area.boundingBox();expect(Math.abs(narrow.x+narrow.width/2-narrowArea.x-narrowArea.width/2)).toBeLessThan(1);await switcher.getByRole('button',{name:'Units of work',exact:true}).click();expect((await switcher.boundingBox()).x).toBe(narrow.x);await switcher.getByRole('button',{name:'Dependencies',exact:true}).click();await page.screenshot({path:'test-results/delivery-histories-narrow.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});
