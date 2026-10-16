import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {RuntimeStore} from '../../server/runtime-store.js';
import {runtimeFixture,bind} from '../runtime-fixtures.js';
import {git,fingerprint} from '../fixtures.js';
const stateDir=()=>process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
function hook(root,session,kind,extra={}){execFileSync(process.execPath,['server/runtime-cli.js','hook','--state-dir',stateDir()],{cwd:new URL('../../',import.meta.url),input:JSON.stringify({cwd:root,session_id:session,hook_event_name:kind,turn_id:'turn',...extra}),stdio:['pipe','pipe','ignore']});}
async function open(page,root){await page.goto('/');await page.getByLabel('Repository path').fill(root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.locator('.repo-info')).toContainText(root.split('/').at(-1));}
async function unit(page){await page.getByRole('button',{name:'Units of work',exact:true}).click();await page.getByRole('navigation',{name:'Units of work'}).getByRole('button',{name:/Live execution/}).click();await page.getByRole('group',{name:'Unit view'}).getByRole('button',{name:'Implementation',exact:true}).click();}
test('hooks drive concurrent nodes, validation, readable labels and preserved selection',async({page})=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:stateDir()}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
  const a=await bind(s,f.root),b=await bind(s,f.root,'b.md','other');const before=await fingerprint(f.root);await open(page,f.root);await unit(page);
  const view=page.getByLabel('Unit of work exploration'),taskA=view.locator('.unit-node.task').filter({hasText:'Task A'}),taskB=view.locator('.unit-node.task').filter({hasText:'Task B'});
  await expect(taskA.locator('.artifact-label')).toHaveText('demo');await expect(taskA.locator('.change-label')).toHaveText('change-live');
  hook(f.root,'session','UserPromptSubmit');hook(f.root,'other','UserPromptSubmit');await expect(view.locator('.unit-node.task.state-processing')).toHaveCount(2);await expect(taskB).toContainText('other');await expect(taskA).toContainText('session');
  await taskA.click();const panel=page.getByRole('complementary',{name:'Selection details'});await expect(panel).toContainText('Observed execution');await view.getByRole('button',{name:'Fit View',exact:true}).click();await page.screenshot({path:'test-results/runtime-concurrent-wide.png',fullPage:true});
  const viewport=await view.locator('.react-flow__viewport').getAttribute('style');
  await page.context().setOffline(true);await expect(view.getByText('Observer disconnected / unavailable',{exact:true})).toBeVisible();await expect(view.locator('.unit-node.task.state-processing')).toHaveCount(0);hook(f.root,'session','PreToolUse',{tool_name:'Bash'});await page.context().setOffline(false);await expect(view.locator('.unit-node.task.state-processing')).toHaveCount(2);
  hook(f.root,'session','PermissionRequest');await expect(taskA).toContainText('Blocked');hook(f.root,'session','PostToolUse',{tool_name:'Bash'});await expect(taskA).toContainText('Processing');hook(f.root,'session','Stop');await expect(taskA).toContainText('Validating');await expect(panel).toContainText('Task ID: a');expect(await view.locator('.react-flow__viewport').getAttribute('style')).toEqual(viewport);
  s.report({attempt:a.attempt,state:'validated',root:f.root,method:'Fixture behavior suite',source:'evidence.md#checks'});await expect(taskA).toContainText('Done (reported)');s.report({attempt:b.attempt,state:'failed'});await expect(taskB).toContainText('Failed');
  const joinAttempt=await bind(s,f.root,'join.md','join-session');hook(f.root,'join-session','UserPromptSubmit');hook(f.root,'join-session','Interrupt');await expect(view.locator('.unit-node.task').filter({hasText:'Join'})).toContainText('Interrupted');
  await bind(s,f.root,'b.md','other');hook(f.root,'other','UserPromptSubmit');await expect(taskB).toContainText('Processing');
  const row=s.db.prepare('SELECT id,json FROM attempts WHERE session=? ORDER BY rowid DESC LIMIT 1').get('other');const silent=JSON.parse(row.json);silent.updatedAt=Date.now()-700000;s.db.prepare('UPDATE attempts SET json=? WHERE id=?').run(JSON.stringify(silent),row.id);hook(f.root,'unbound','SessionStart');await expect(taskB).toContainText('Unknown');

  await page.setViewportSize({width:700,height:1000});await view.getByRole('button',{name:'Fit View',exact:true}).click();await page.screenshot({path:'test-results/runtime-narrow.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(await fingerprint(f.root)).toEqual(before);
 }finally{await page.context().setOffline(false);s.close();await f.cleanup();}
});
test('recorded graph survives worktree removal and exposes exact archived attempts',async({page})=>{
 const f=await runtimeFixture(),other=f.root+'-worker';git(f.root,'worktree','add','-qb','worker',other);const s=new RuntimeStore({stateDir:stateDir()});try{
  const a=await bind(s,other);hook(other,'session','UserPromptSubmit');hook(other,'session','Stop');git(f.root,'worktree','remove','--force',other);
  await open(page,f.root);await page.getByLabel('Recorded executions',{exact:true}).selectOption(a.context);const view=page.getByLabel('Unit of work exploration');await expect(page.locator('.recorded-meta')).toContainText('original worktree removed');await expect(view.locator('.unit-node.task')).toHaveCount(3);await expect(view.locator('.unit-node.gate')).toContainText('unknown');await expect(view.locator('.unit-node.task').filter({hasText:'Task A'})).toContainText('Validating');
  await page.reload();await page.getByLabel('Recorded executions',{exact:true}).selectOption(a.context);await expect(view.locator('.unit-node.task')).toHaveCount(3);await page.screenshot({path:'test-results/runtime-archived.png',fullPage:true});
 }finally{s.close();await f.cleanup();}
});
test('identical task plans show only the selected source worktree activity',async({page})=>{
 const f=await runtimeFixture(),other=f.root+'-scope';git(f.root,'worktree','add','-qb','scope-worker',other);
 const s=new RuntimeStore({stateDir:stateDir()});try{
  await bind(s,other,'a.md','other-worktree');hook(other,'other-worktree','UserPromptSubmit');
  await open(page,f.root);await unit(page);
  const task=page.getByLabel('Unit of work exploration').locator('.unit-node.task').filter({hasText:'Task A'});
  await expect(task).toContainText('No recorded execution');await expect(task).not.toContainText('other-worktree');
  await bind(s,f.root,'a.md','selected-worktree');hook(f.root,'selected-worktree','UserPromptSubmit');
  await expect(task).toContainText('Processing');await expect(task).toContainText('selected-worktree');await expect(task).not.toContainText('other-worktree');await expect(task).toContainText('Captured revision:');
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.locator('.repo-info')).toContainText('scope-worker');await page.getByRole('navigation',{name:'Units of work'}).getByRole('button',{name:/Live execution/}).click();await page.getByRole('group',{name:'Unit view'}).getByRole('button',{name:'Implementation',exact:true}).click();await expect(task).toContainText('other-worktree');await expect(task).not.toContainText('selected-worktree');
 }finally{s.close();git(f.root,'worktree','remove','--force',other);await f.cleanup();}
});

// Manual retry and automatic recovery are separate paths. The event stream is
// held in a network error during the manual case, so no background refresh can
// recover the history (and detach the button) before the click.
const failingHistory=async(page,state)=>page.route('**/api/runtime/query',async route=>{if(state.fail)await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'History temporarily unavailable'})});else await route.continue();});
test('execution navigation retries a failed read manually, hides an empty result and returns when recording begins',async({page})=>{
 const f=await runtimeFixture(),store=new RuntimeStore({stateDir:stateDir()}),state={fail:true};
 try{
  await failingHistory(page,state);await page.route('**/api/runtime/events',route=>route.abort());
  await open(page,f.root);
  await expect(page.getByRole('status').filter({hasText:'History temporarily unavailable'})).toBeVisible();
  state.fail=false;await page.getByRole('button',{name:'Retry execution history',exact:true}).click();
  await expect(page.locator('.recorded-picker')).toHaveCount(0);
  await page.unroute('**/api/runtime/events');
  const attempt=await bind(store,f.root);hook(f.root,'session','UserPromptSubmit');
  await expect(page.getByLabel('Recorded executions',{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByLabel('Recorded executions',{exact:true}).locator('option').filter({hasText:/^live ·/})).toHaveCount(1);
  await page.getByLabel('Recorded executions',{exact:true}).selectOption(attempt.context);
  await expect(page.getByLabel('Unit of work exploration').locator('.unit-node.task').filter({hasText:'Task A'})).toContainText('Processing');
 }finally{store.close();await f.cleanup();}
});
test('execution navigation recovers a failed read automatically when the observer reports activity',async({page})=>{
 const f=await runtimeFixture(),store=new RuntimeStore({stateDir:stateDir()}),state={fail:true};
 try{
  await failingHistory(page,state);
  await open(page,f.root);
  await expect(page.getByRole('status').filter({hasText:'History temporarily unavailable'})).toBeVisible();
  state.fail=false;await bind(store,f.root);hook(f.root,'session','UserPromptSubmit');
  await expect(page.getByLabel('Recorded executions',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry execution history',exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Recorded executions',{exact:true}).locator('option').filter({hasText:/^live ·/})).toHaveCount(1);
 }finally{store.close();await f.cleanup();}
});
