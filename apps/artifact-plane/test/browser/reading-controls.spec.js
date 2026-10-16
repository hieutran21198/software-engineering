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
