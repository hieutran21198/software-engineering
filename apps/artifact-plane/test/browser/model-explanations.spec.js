import {test,expect} from '@playwright/test';
import {fixtureRepository,fingerprint,inPlaceFixture} from '../fixtures.js';
import {openRepository,selectOnGraph,openFlows,documentPage,tree} from './workbench.js';
// Dependency explanations and model-aware flows over real HTTP reads.
const models='---\nmodels:\n  - id: member\n    title: Member\n    description: The member who signs in.\n    sources: [specifications/identity.md]\n---\n# Models\n';
const flow=id=>'---\n'+JSON.stringify({flow:{id,artifact:'tenant',title:'Flow '+id,trigger:'Begin.',outcome:'Done.',entry_steps:['check'],
 steps:[{id:'check',title:'Check member',supports:['identity'],interactions:[{from:'member',to:'member',action:'Check membership',outcome:'Membership checked.',supports:['identity']}]},{id:'issue',title:'Issue session',supports:['identity']}],
 transitions:[{from:'check',to:'issue'},{from:'issue',to:'check',condition:'retry'}],
 support:[{id:'identity',kind:'element',artifact:'tenant',element:'specifications/identity.md',requires:'Identity rules.',basis:'documented'}],
 participants:[{id:'member',artifact:'tenant',model:'member',requires:'Signs in.'},{id:'ghost',artifact:'tenant',model:'ghost',requires:'Missing.'}]}})+'\n---\n# Flow\n';
async function fixture(){const files=inPlaceFixture();files.set('docs/artifacts/tenant/specifications/domain-model.md',models);files.set('docs/artifacts/tenant/specifications/flows/login.md',flow('login'));files.set('docs/artifacts/tenant/specifications/flows/report.md',flow('report'));return fixtureRepository(files);}
const panel=page=>page.getByRole('tabpanel').filter({visible:true}),details=page=>panel(page).getByRole('complementary',{name:'Selection details'});
async function open(page,root){await openRepository(page,root);await expect(tree(page)).toContainText('Authentication');}
test('P1: dependency explanation by keyboard and pointer, with source return',async({page})=>{
 const f=await fixture(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await open(page,f.root);
  await selectOnGraph(page,'Authentication');
  await details(page).getByText('Dependencies',{exact:true}).click();
  const why=details(page).getByRole('button',{name:'Explain dependency on tenant',exact:true});
  await why.focus();await page.keyboard.press('Enter');
  const explanation=details(page).getByRole('region',{name:'Dependency explanation'});
  await expect(explanation.getByRole('heading',{name:'authentication depends on tenant',level:2})).toBeVisible();
  await expect(explanation).toContainText('identity format');
  await expect(explanation).toContainText('established');
  await explanation.getByRole('button',{name:'Read consuming source',exact:true}).click();
  const reader=documentPage(page);
  await expect(reader).toContainText('Login rules');
  await expect(reader.getByRole('button',{name:'Back to graph',exact:true})).toBeFocused();
  await reader.getByRole('button',{name:'Back to graph',exact:true}).click();
  await expect(details(page).getByRole('region',{name:'Dependency explanation'})).toBeVisible();
  await details(page).getByRole('button',{name:'Clear dependency selection',exact:true}).click();
  await expect(details(page).getByRole('region',{name:'Dependency explanation'})).toHaveCount(0);
  // Canvas edge: pointer and keyboard open the same explanation.
  const edge=panel(page).locator('.react-flow__edge[data-id="dependency:tenant:authentication"]');
  await edge.focus();await page.keyboard.press('Enter');
  await expect(details(page).getByRole('region',{name:'Dependency explanation'})).toContainText('identity format');
  expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});
test('P4: model cards, step interactions, loop navigation, known flows and model sources at wide and narrow widths',async({page})=>{
 const f=await fixture(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await open(page,f.root);await openFlows(page);
  await page.getByLabel('Flow browsing').getByRole('button',{name:/Flow login/}).click();
  const models=page.getByRole('region',{name:'Flow models'});
  await expect(models.getByRole('button',{name:/Member/})).toBeVisible();
  await expect(models.getByRole('button',{name:/Missing model tenant:ghost/})).toBeVisible();
  const steps=models.getByLabel('Step interactions');
  await expect(steps).toContainText('Member → Member: Check membership');
  await models.getByRole('button',{name:'Next: Issue session',exact:true}).click();
  await expect(steps).toContainText('No declared interactions for this step.');
  await models.getByRole('button',{name:'Loop to: Check member (retry)',exact:true}).click();
  await expect(steps).toContainText('Check membership');
  const card=models.getByRole('button',{name:/^Member/});await card.focus();await page.keyboard.press('Enter');
  const selected=models.getByLabel('Selected model');
  await expect(selected).toContainText('tenant:member');await expect(selected).toContainText('Known participation');
  await selected.getByRole('button',{name:'Read model declaration',exact:true}).click();
  const reader=documentPage(page);
  await expect(reader).toContainText('Models');await reader.getByRole('button',{name:/^Back to/}).first().click();
  await expect(page.getByRole('region',{name:'Flow models'})).toBeVisible();
  if(!await page.getByLabel('Selected model').count())await page.getByRole('region',{name:'Flow models'}).getByRole('button',{name:/^Member/}).click();
  await page.getByLabel('Selected model').getByRole('button',{name:'Flow report',exact:true}).click();
  await expect(page.getByRole('region',{name:'Flow exploration'}).getByRole('heading',{name:'Flow report'})).toBeVisible();
  for(const width of [1440,390]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/model-flows-${width}.png`,fullPage:true});}
  expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});
