import {test,expect} from '@playwright/test';
import YAML from 'yaml';
import {openRepository,openArtifact,treeItem,showTree,noOverflow} from './workbench.js';
import {editingRepository,editingFiles,tenant,read,changedPaths,fingerprint} from './editing-fixtures.js';
// Task flow-page: structured flow editing through flow operations, with the
// graph and behavior discovery still reachable.
const flowPath=tenant+'specifications/flows/member-login.md';
const flowValue=async root=>YAML.parse((await read(root,flowPath)).match(/^---\n([\s\S]*?)\n---/)[1]).flow;

test('create a flow, add, edit, move and remove steps, transitions and support',async({page})=>{
 const files=editingFiles();files.set('src/login.js','export const login = true;\n');
 const f=await editingRepository(files),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await openRepository(page,f.root);const artifact=await openArtifact(page,'Tenant tenant');
  await artifact.getByRole('button',{name:'Add flow',exact:true}).click();
  const create=artifact.getByRole('form',{name:'Create flow'});
  await create.getByLabel('Title').fill('Member login');await create.getByLabel('Trigger').fill('A member signs in.');await create.getByLabel('Outcome').fill('A session exists.');await create.getByLabel('First step').fill('Check member');await create.getByLabel('First step').press('Enter');
  const editor=page.getByRole('region',{name:'Flow editing'});await expect(editor.getByRole('heading',{name:'Member login'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Flow knowledge'}).getByRole('button',{name:'Planning'})).toHaveAttribute('aria-pressed','true');
  const steps=editor.getByRole('region',{name:'Steps'});
  for(const title of ['Issue session','Audit']){await editor.getByRole('button',{name:'Add step',exact:true}).click();const add=editor.getByRole('form',{name:'Add step'});await add.getByLabel('Title').fill(title);await add.getByLabel('Title').press('Enter');await expect(steps.getByRole('listitem',{name:`Step ${title}`})).toBeVisible();}
  await expect(steps.getByRole('listitem',{name:'Step Check member'})).toContainText('Next: Issue session');
  await editor.getByRole('button',{name:'Add support',exact:true}).click();
  let support=editor.getByRole('form',{name:'Add support'});await support.getByLabel('Target artifact').selectOption('tenant');await support.getByLabel('Target document').selectOption('requirements/need.md');await support.getByLabel('Reason',{exact:true}).fill('The need to sign in.');await support.getByRole('checkbox',{name:'Check member'}).check();await support.getByRole('button',{name:'Add support'}).click();
  await expect(steps.getByRole('listitem',{name:'Step Check member'})).toContainText('need');
  await editor.getByRole('button',{name:'Add support',exact:true}).click();
  support=editor.getByRole('form',{name:'Add support'});await support.getByLabel('Support kind').selectOption('implementation');await support.getByLabel('Tracked file path').fill('src/login.js');await support.getByLabel('Reason',{exact:true}).fill('Issues the session.');await support.getByLabel('Basis').selectOption('static');await support.getByRole('checkbox',{name:'Issue session'}).check();await support.getByRole('button',{name:'Add support'}).click();
  await expect(editor.getByRole('region',{name:'Support'})).toContainText('src/login.js');
  await editor.getByRole('button',{name:'Edit step Audit'}).click();const edit=editor.getByRole('form',{name:'Save step'});await edit.getByLabel('Title').fill('Record audit');await edit.getByLabel('Title').press('Enter');
  await expect(steps.getByRole('listitem',{name:'Step Record audit'})).toBeVisible();
  await editor.getByRole('button',{name:'Move Record audit up'}).click();
  await expect.poll(async()=>(await flowValue(f.root)).steps.map(s=>s.title)).toEqual(['Check member','Record audit','Issue session']);
  await editor.getByRole('button',{name:'Add next step after Record audit'}).click();const next=editor.getByRole('form',{name:'Set next step'});await next.getByLabel('Next step').selectOption('check-member');await next.getByLabel('Condition (optional)').fill('retry');await next.getByLabel('Condition (optional)').press('Enter');
  await expect(steps.getByRole('listitem',{name:'Step Record audit'})).toContainText('Next: Check member (retry)');
  await editor.getByRole('button',{name:'Remove transition from Record audit to Check member'}).click();
  await expect(steps.getByRole('listitem',{name:'Step Record audit'})).not.toContainText('Next: Check member');
  await editor.getByRole('button',{name:/^Remove support login/}).click();await expect(editor.getByRole('region',{name:'Support'})).not.toContainText('src/login.js');
  await editor.getByRole('button',{name:'Edit gaps and exclusions'}).click();const gaps=editor.getByRole('form',{name:'Save gaps and exclusions'});await gaps.getByLabel('Gaps, one per line').fill('No runtime trace.');await gaps.getByRole('button',{name:'Save gaps and exclusions'}).click();
  await expect(gaps).toHaveCount(0);await expect.poll(async()=>(await flowValue(f.root)).gaps).toEqual(['No runtime trace.']);
  await expect(editor.getByRole('region',{name:'Gaps and exclusions'})).toContainText('Gaps: No runtime trace.');
  const flow=await flowValue(f.root);
  expect(flow.entry_steps).toEqual(['check-member']);expect(flow.steps.map(s=>s.id)).toEqual(['check-member','audit','issue-session']);
  expect(flow.steps.find(s=>s.id==='check-member').supports).toEqual(['need']);expect(flow.support.map(s=>s.id)).toEqual(['need']);
  expect(flow.transitions).toEqual([{from:'check-member',to:'issue-session'},{from:'issue-session',to:'audit'}]);expect(flow.gaps).toEqual(['No runtime trace.']);
  // The existing flow canvas and behavior discovery stay on the page.
  await expect(page.locator('.flow-surface .flow-node')).toHaveCount(3);
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});expect(await noOverflow(page)).toBe(true);await page.screenshot({path:`test-results/flow-page-${width}.png`,fullPage:true});}
  await showTree(page);await treeItem(page,/^Discover behavior/).first().click();await expect(page.getByRole('button',{name:'Back to title or ID'})).toBeVisible();
  expect(changedPaths(before,await fingerprint(f.root))).toEqual([flowPath]);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});

test('model layer, comments and unknown keys survive step edits',async({page})=>{
 const files=editingFiles();
 files.set(tenant+'specifications/flows/member-login.md','---\n# Flow comment\nflow:\n  id: member-login\n  artifact: tenant\n  title: Member login\n  trigger: Sign in\n  outcome: Session\n  entry_steps: [check]\n  steps:\n    - id: check\n      title: Check\n      supports: [need]\n      interactions:\n        - {from: member, to: member, action: Check, outcome: Checked, supports: [need]}\n  transitions: []\n  support:\n    - id: need\n      kind: element\n      artifact: tenant\n      element: requirements/need.md\n      requires: Need\n      basis: documented\n  participants:\n    - {id: member, artifact: tenant, model: member, requires: Signs in}\n  custom_key: keep\n---\n# Member login\n');
 const f=await editingRepository(files);
 try{
  await openRepository(page,f.root);await showTree(page);await treeItem(page,/^Tenant tenant/).click();await treeItem(page,/^Flows/).last().click();await treeItem(page,/^member-login\.md/).click();
  const editor=page.getByRole('region',{name:'Flow editing'});await expect(editor.getByRole('region',{name:'Model layer'})).toContainText('member: tenant:member');
  await editor.getByRole('button',{name:'Add step',exact:true}).click();await editor.getByRole('form',{name:'Add step'}).getByLabel('Title').fill('Done');await editor.getByRole('form',{name:'Add step'}).getByLabel('Title').press('Enter');
  await expect(editor.getByRole('listitem',{name:'Step Done'})).toBeVisible();
  const text=await read(f.root,flowPath);
  expect(text).toContain('# Flow comment');expect(text).toContain('custom_key: keep');expect(text).toContain('- {from: member, to: member, action: Check, outcome: Checked, supports: [need]}');expect(text).toContain('- {id: member, artifact: tenant, model: member, requires: Signs in}');
 }finally{await f.cleanup();}
});
