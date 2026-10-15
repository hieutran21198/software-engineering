import {test,expect} from '@playwright/test';
import {writeFile,rm} from 'node:fs/promises';
import {fixtureRepository,orderingFixture,fingerprint,git,rootReadme} from '../fixtures.js';

test('one worktree selection replaces the complete context and ignores obsolete replies',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-other';
 git(fixture.root,'worktree','add','-qb','feature/other',other);
 await writeFile(`${other}/docs/artifacts/knowledge/README.md`,rootReadme('Other worktree knowledge','1.0.0'));
 const before=await Promise.all([fingerprint(fixture.root),fingerprint(other)]),requests=[];
 try{
  await page.route('**/api/repository/query',async route=>{const body=route.request().postDataJSON();requests.push(body);if(body.section==='overview'&&body.worktree===other)await new Promise(r=>setTimeout(r,250));await route.continue().catch(()=>{});});
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Knowledge');
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);
  await expect(page.getByRole('status').filter({hasText:`Opening ${other}`})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Other worktree knowledge');
  await expect(page.locator('.repo-info')).toContainText('feature/other');
  await expect(page.getByRole('tab',{selected:true})).toHaveAttribute('title',fixture.root);
  await expect(page.getByRole('button',{name:'Open worktree',exact:true})).toHaveCount(0);
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Other worktree/}).click();
  await expect(page.getByRole('complementary',{name:'Selection details'})).toContainText('Other worktree knowledge');
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Other worktree knowledge');
  expect(requests.some(r=>r.path===fixture.root&&r.worktree===other&&r.section==='markdown')).toBe(true);
  await page.getByLabel('Worktree',{exact:true}).selectOption(fixture.root);
  await expect(page.getByRole('navigation',{name:'Artifacts'})).not.toContainText('Other worktree knowledge');
  expect(await Promise.all([fingerprint(fixture.root),fingerprint(other)])).toEqual(before);
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});

test('failed and superseded worktree switches keep the committed source',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-delayed';git(fixture.root,'worktree','add','-qb','feature/delayed',other);
 let fail=true;
 try{
  await page.route('**/api/repository/query',async route=>{const body=route.request().postDataJSON();if(body.section==='overview'&&body.worktree===other){await new Promise(r=>setTimeout(r,250));if(fail){await route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:'Target unavailable'})}).catch(()=>{});return;}}await route.continue().catch(()=>{});});
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.getByRole('alert')).toContainText('Target unavailable');await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);await expect(page.locator('.repo-info')).not.toContainText('feature/delayed');
  fail=false;await page.getByLabel('Worktree',{exact:true}).selectOption(other);await page.getByLabel('Worktree',{exact:true}).selectOption(fixture.root);await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);await expect(page.locator('.repo-info')).not.toContainText('feature/delayed');
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});

test('reading is primary and list disclosure preserves graph nodes and viewport',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),before=await fingerprint(fixture.root);
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'Selection details'})).toBeHidden();
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();
  const panel=page.getByRole('complementary',{name:'Selection details'});
  await expect(panel.getByLabel('Artifact overview')).toContainText('knowledge');
  const nodes=await page.locator('.canvas-surface .react-flow__node').count(),viewport=await page.locator('.canvas-surface .react-flow__viewport').getAttribute('style');
  await panel.getByRole('button',{name:'Requirements in inspector',exact:true}).click();
  expect(await page.locator('.canvas-surface .react-flow__node').count()).toBe(nodes);
  await panel.getByRole('button',{name:'requirements/need.md version:1.0.0',exact:true}).click();
  const reader=page.getByRole('region',{name:'Knowledge reader'});await expect(reader).toContainText('requirements/need.md');await expect(panel).toBeHidden();
  await reader.getByRole('button',{name:'Back to artifact',exact:true}).click();await expect(reader).toHaveCount(0);await expect(panel).toBeVisible();
  expect(await page.locator('.canvas-surface .react-flow__viewport').getAttribute('style')).toBe(viewport);
  for(const width of [390,700,851,1440]){await page.setViewportSize({width,height:1000});await panel.getByRole('button',{name:'Read overview',exact:true}).click();await expect(page.getByRole('region',{name:'Knowledge reader'})).toContainText('Knowledge');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Back to graph',exact:true}).click();}
  expect(await fingerprint(fixture.root)).toEqual(before);
 }finally{await fixture.cleanup();}
});
