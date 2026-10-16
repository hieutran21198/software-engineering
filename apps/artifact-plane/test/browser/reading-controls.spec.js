import {test,expect} from '@playwright/test';
import {fixtureRepository,orderingFixture,rootReadme,fingerprint} from '../fixtures.js';

export async function openProject(page,root){await page.goto('/');await page.getByLabel('Repository path').fill(root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.locator('.repo-info')).toContainText(root.split('/').at(-1));}
export async function readOverview(page){await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();await page.getByRole('button',{name:'Read overview',exact:true}).click();return page.getByRole('region',{name:'Knowledge reader'});}

test('document headings exceed body size at each level and long titles fit every layout',async({page})=>{
 const files=orderingFixture(),title='Knowledge '+('long-title-'.repeat(14));
 files.set('docs/artifacts/knowledge/README.md',rootReadme(title,'1.0.0')+'\n## Second\n\n### Third\n\n#### Fourth\n\n##### Fifth\n\n###### Sixth\n\nBody text.');
 const f=await fixtureRepository(files),before=await fingerprint(f.root);
 try{
  await openProject(page,f.root);const reader=await readOverview(page);await expect(reader.locator('.markdown')).toContainText('Body text.');
  const sizes=await reader.locator('.markdown').evaluate(el=>({body:parseFloat(getComputedStyle(el).fontSize),headings:[...el.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>parseFloat(getComputedStyle(h).fontSize))}));
  expect(sizes.headings).toHaveLength(6);for(let i=0;i<6;i++){expect(sizes.headings[i]).toBeGreaterThan(sizes.body);if(i)expect(sizes.headings[i-1]).toBeGreaterThan(sizes.headings[i]);}
  for(const width of [390,700,851,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(reader.locator(':scope>h2')).toBeVisible();await page.screenshot({path:`test-results/reading-headings-${width}.png`,fullPage:true});}
  expect(await fingerprint(f.root)).toEqual(before);
 }finally{await f.cleanup();}
});

test('left navigation resizes with pointer and keyboard, respects both panels and keeps reader alignment',async({page})=>{
 const f=await fixtureRepository(orderingFixture()),before=await fingerprint(f.root);
 try{
  await openProject(page,f.root);const divider=page.getByRole('separator',{name:'Resize navigation panel',exact:true}),sidebar=page.locator('.sidebar');
  const width=()=>sidebar.evaluate(el=>Math.round(el.getBoundingClientRect().width));
  await expect.poll(width).toBe(220);const box=await divider.boundingBox();await page.mouse.move(box.x+4,box.y+200);await page.mouse.down();await page.mouse.move(box.x+124,box.y+200,{steps:8});await page.mouse.up();await expect.poll(width).toBe(340);
  await divider.focus();await divider.press('ArrowRight');await expect.poll(width).toBe(360);await divider.press('Home');await expect.poll(width).toBe(180);await divider.press('End');await expect.poll(width).toBe(420);
  const reader=await readOverview(page);await expect(reader.locator('.markdown')).toContainText('Knowledge knowledge.');expect(Math.round((await reader.boundingBox()).x)).toBe(420);await divider.focus();await divider.press('ArrowLeft');await expect.poll(width).toBe(400);await expect.poll(async()=>Math.round((await reader.boundingBox()).x)).toBe(400);
  await page.getByRole('button',{name:'Back to graph',exact:true}).click();const inspector=page.getByRole('separator',{name:'Resize details panel',exact:true});await inspector.focus();await inspector.press('End');
  await page.setViewportSize({width:851,height:1000});await expect.poll(async()=>Math.round((await page.locator('.canvas-area').boundingBox()).width)).toBeGreaterThanOrEqual(300);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const w of [390,700]){await page.setViewportSize({width:w,height:1000});await expect(divider).toBeHidden();await expect(inspector).toBeHidden();}
  await page.setViewportSize({width:1440,height:1000});await expect.poll(width).toBe(400);await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');await expect.poll(width).toBe(400);expect(await fingerprint(f.root)).toEqual(before);
 }finally{await f.cleanup();}
});

test('left widths belong to each project and survive view changes independently',async({page})=>{
 const a=await fixtureRepository(orderingFixture()),b=await fixtureRepository(orderingFixture());
 try{
  await openProject(page,a.root);const divider=()=>page.getByRole('separator',{name:'Resize navigation panel',exact:true});await divider().focus();await divider().press('End');await expect(divider()).toHaveAttribute('aria-valuenow','420');
  await page.getByRole('button',{name:'Units of work',exact:true}).click();await expect(divider()).toHaveAttribute('aria-valuenow','420');await page.getByRole('button',{name:'Dependencies',exact:true}).click();
  await page.getByRole('button',{name:'New project tab',exact:true}).click();await page.getByRole('tabpanel').getByLabel('Repository path').fill(b.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.getByRole('tab',{selected:true})).toHaveAttribute('title',b.root);await expect(divider()).toHaveAttribute('aria-valuenow','220');await divider().focus();await divider().press('Home');
  await page.getByRole('tab').first().click();await expect(divider()).toHaveAttribute('aria-valuenow','420');await page.getByRole('tab').last().click();await expect(divider()).toHaveAttribute('aria-valuenow','180');
 }finally{await a.cleanup();await b.cleanup();}
});
