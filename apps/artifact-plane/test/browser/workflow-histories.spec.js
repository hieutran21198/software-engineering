import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fixtureRepository,orderingFixture,fingerprint,git} from '../fixtures.js';

test('B17-B18: collapsed histories, commit-time order, retained evidence, six phases and stable switcher',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture());
 const base='docs/artifacts/knowledge/';
 const root=join(fixture.root,base,'README.md');
 await writeFile(root,(await readFile(root,'utf8'))+'\n## Active change\n[Next](changes/change-next/README.md)\n');
 git(fixture.root,'add','.');git(fixture.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Declare active source');
 for(const [name,date] of [['change-aold','2025-01-01T12:00:00Z'],['change-tie10','2025-02-01T12:00:00Z'],['change-tie2','2025-02-01T12:00:00Z'],['change-znew','2025-03-01T12:00:00Z'],['change-unknown',null]]) {
  const prefix=join(fixture.root,base,'changes',name);
  await mkdir(join(prefix,'specifications'),{recursive:true});
  await writeFile(join(prefix,'README.md'),'# Retained change');
  await writeFile(join(prefix,'specifications','main.md'),'# Historic contract\n\n## Self-check\nPassed.');
  if(date) {git(fixture.root,'add',base+'changes/'+name);execFileSync('git',['-C',fixture.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Evidence '+name],{env:{...process.env,GIT_AUTHOR_DATE:date,GIT_COMMITTER_DATE:date}});}
 }
 const before=await fingerprint(fixture.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository'}).click();
  const switcher=page.getByRole('group',{name:'Explorer view'}),area=page.locator('.canvas-area');
  const initial=await switcher.boundingBox(),canvas=await area.boundingBox();
  expect(Math.abs(initial.x+initial.width/2-canvas.x-canvas.width/2)).toBeLessThan(1);
  await expect(switcher.getByRole('button',{name:'Dependencies',exact:true})).toBeVisible();
  await switcher.getByRole('button',{name:'Workflow',exact:true}).click();
  const wf=await switcher.boundingBox();expect(wf.x).toBe(initial.x);expect(wf.width).toBe(initial.width);
  const view=page.getByLabel('Local ADD workflows'),panel=page.getByRole('complementary',{name:'Selection details'});
  const histories=view.getByRole('button',{name:'Change histories in '+fixture.root,exact:true});
  await expect(histories).toHaveAttribute('aria-expanded','false');
  await expect(view.locator('.react-flow__node-change')).toHaveCount(1);
  await expect(view.locator('.react-flow__node-phase')).toHaveCount(6);
  await expect(view.locator('.react-flow__node-phase').filter({hasText:'Approval'})).toHaveCount(0);
  await histories.click();await expect(histories).toHaveAttribute('aria-expanded','true');
  const headings=await view.locator('.workflow-row strong').allTextContents();
  expect(headings).toEqual(['knowledge / change-next','knowledge / change-znew','knowledge / change-tie2','knowledge / change-tie10','knowledge / change-aold','knowledge / change-unknown']);
  await expect(view.locator('.react-flow__node-phase')).toHaveCount(6);
  await view.getByRole('button',{name:'Expand change-znew in '+fixture.root,exact:true}).click();
  await view.getByRole('button',{name:'Fit View',exact:true}).click();
  await expect(view.locator('.react-flow__node-phase')).toHaveCount(12);
  await expect(view.locator('.react-flow__node-phase .current')).toHaveCount(0);
  await view.getByTestId('rf__node-'+JSON.stringify([fixture.root,'knowledge','change-znew','Specification'])).click();
  await expect(panel).toContainText('Evidence change-znew');
  await expect(panel).toContainText('2025-03-01T12:00:00.000Z');
  await expect(panel).toContainText('does not prove completion');
  await view.getByRole('button',{name:'Collapse change-znew in '+fixture.root,exact:true}).click();
  await expect(view.locator('.react-flow__node-phase')).toHaveCount(6);
  await expect(panel.getByRole('heading',{name:'Specification',exact:true,level:2})).toBeVisible();
  await histories.click();await expect(view.locator('.react-flow__node-change')).toHaveCount(1);
  await expect(panel).toContainText('Evidence change-znew');
  await switcher.getByRole('button',{name:'Dependencies',exact:true}).click();
  expect((await switcher.boundingBox()).x).toBe(initial.x);
  await switcher.getByRole('button',{name:'Workflow',exact:true}).click();
  await expect(histories).toHaveAttribute('aria-expanded','false');
  await histories.click();await view.getByRole('button',{name:'Expand change-znew in '+fixture.root,exact:true}).click();
  await view.getByRole('button',{name:'Fit View',exact:true}).click();
  await page.screenshot({path:'test-results/workflow-histories-wide.png',fullPage:true});
  await page.setViewportSize({width:700,height:1000});
  const narrow=await switcher.boundingBox(),narrowArea=await area.boundingBox();
  expect(Math.abs(narrow.x+narrow.width/2-narrowArea.x-narrowArea.width/2)).toBeLessThan(1);
  await switcher.getByRole('button',{name:'Dependencies',exact:true}).click();expect((await switcher.boundingBox()).x).toBe(narrow.x);
  await switcher.getByRole('button',{name:'Workflow',exact:true}).click();await view.getByRole('button',{name:'Fit View',exact:true}).click();
  await page.screenshot({path:'test-results/workflow-histories-narrow.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await fingerprint(fixture.root)).toEqual(before);expect(errors).toEqual([]);
 } finally {await fixture.cleanup();}
});
