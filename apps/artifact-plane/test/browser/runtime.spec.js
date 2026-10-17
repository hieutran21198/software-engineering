import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {RuntimeStore} from '../../server/runtime-store.js';
import {runtimeFixture,bind} from '../runtime-fixtures.js';
import {git,fingerprint} from '../fixtures.js';
import {openRepository,openUnit} from './workbench.js';
const stateDir=()=>process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
function hook(root,session,kind,extra={}){execFileSync(process.execPath,['server/runtime-cli.js','hook','--state-dir',stateDir()],{cwd:new URL('../../',import.meta.url),input:JSON.stringify({cwd:root,session_id:session,hook_event_name:kind,turn_id:'turn',...extra}),stdio:['pipe','pipe','ignore']});}
async function open(page,root){await openRepository(page,root);await expect(page.locator('.source-bar strong')).toHaveAttribute('title',root);}
test('recorded graph survives worktree removal and exposes exact archived attempts',async({page})=>{
 const f=await runtimeFixture(),other=f.root+'-worker';git(f.root,'worktree','add','-qb','worker',other);const s=new RuntimeStore({stateDir:stateDir()});try{
  const a=await bind(s,other);hook(other,'session','UserPromptSubmit');hook(other,'session','Stop');git(f.root,'worktree','remove','--force',other);
  await open(page,f.root);await page.getByLabel('Recorded executions',{exact:true}).selectOption(a.context);const view=page.getByLabel('Unit of work exploration');await expect(page.locator('.recorded-meta')).toContainText('original worktree removed');await expect(view.locator('.unit-node.task')).toHaveCount(3);await expect(view.locator('.unit-node.gate')).toContainText('unknown');await expect(view.locator('.unit-node.task').filter({hasText:'Task A'})).toContainText('Validating');
  await page.reload();await page.getByLabel('Recorded executions',{exact:true}).selectOption(a.context);await expect(view.locator('.unit-node.task')).toHaveCount(3);await page.screenshot({path:'test-results/runtime-archived.png',fullPage:true});
 }finally{s.close();await f.cleanup();}
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
