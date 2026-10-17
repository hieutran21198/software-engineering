import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {runtimeFixture} from '../runtime-fixtures.js';
import {fingerprint} from '../fixtures.js';
import {openRepository,openUnit,openChange} from './workbench.js';
test('completed unobserved tasks are explicit; both graph views restore all declared edges',async({page})=>{
 const f=await runtimeFixture(),prefix='docs/artifacts/demo/changes/change-live/tasks/';
 try{
  await writeFile(join(f.root,prefix+'a.md'),'---\nid: a\ndepends_on: []\n---\n# Task A\n\n- [x] Behavior\n\n## Evidence\n\nChecks passed.');
  await writeFile(join(f.root,prefix+'b.md'),'---\nid: b\ndepends_on: [a]\n---\n# Task B');
  const before=await fingerprint(f.root);await openRepository(page,f.root);await openUnit(page,'Live execution');await page.getByRole('group',{name:'Unit view'}).getByRole('button',{name:'Implementation',exact:true}).click();
  const view=page.getByLabel('Unit of work exploration'),task=view.locator('.unit-node.task').filter({hasText:'Task A'});
  await expect(task).toContainText('No recorded execution');await expect(task).toContainText('Documented checklist complete');await expect(task).not.toContainText('Waiting');
  await expect(view.locator('.react-flow__edge')).toHaveCount(3);await view.getByLabel('Show all prerequisites').check();await expect(view.locator('.react-flow__edge')).toHaveCount(4);await view.getByLabel('Show all prerequisites').uncheck();await expect(view.locator('.react-flow__edge')).toHaveCount(3);
  await view.locator('.unit-node.task').filter({hasText:'Join'}).click();await expect(page.getByRole('complementary',{name:'Selection details'})).toContainText('Prerequisites: a, b');
  await openChange(page,'change-live','Plan');
  const individual=page.getByLabel('Implementation task graph');await expect(individual.locator('.react-flow__edge')).toHaveCount(2);await individual.getByLabel('Show all prerequisites').check();await expect(individual.locator('.react-flow__edge')).toHaveCount(3);await expect(individual.locator('.task-node').filter({hasText:'Task A'})).toContainText('Documented checklist complete');
  expect(await fingerprint(f.root)).toEqual(before);await page.screenshot({path:'test-results/visualization-clarity.png',fullPage:true});
 }finally{await f.cleanup();}
});
