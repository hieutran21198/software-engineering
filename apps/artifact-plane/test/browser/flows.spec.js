import {test,expect} from '@playwright/test';
import {fixtureRepository,fingerprint} from '../fixtures.js';
import {unitFixture} from '../unit-fixtures.js';
import {openRepository,openFlows,openUnit,selectOnGraph,documentPage} from './workbench.js';
const flow={id:'flow-1',logicalId:'tenant:login',artifact:'tenant',source:'change:change-login',title:'Tenant login flow',trigger:'User signs in',outcome:'Membership checked',state:'valid',steps:[{nodeId:'a',supports:['shared']},{nodeId:'b',supports:['shared']}],support:[{id:'shared',targetId:'s',kind:'implementation',basis:'static',requires:'Check membership',file:'src/login.js',resolved:true}],gaps:['No runtime trace'],exclusions:['Password recovery']};
const graph={nodes:[{id:'a',kind:'step',title:'Sign in'},{id:'b',kind:'step',title:'Check membership'},{id:'s',kind:'implementation',title:'src/login.js'}],edges:[{id:'ab',source:'a',target:'b',kind:'transition',flow:'flow-1'},{id:'ba',source:'b',target:'a',kind:'transition',flow:'flow-1',condition:'Retry'},{id:'as',source:'a',target:'s',kind:'supports',flow:'flow-1',basis:'static'},{id:'bs',source:'b',target:'s',kind:'supports',flow:'flow-1',basis:'static'}]};
async function selectSource(page,value){const reader=documentPage(page);if(await reader.count())await reader.getByRole('button',{name:'Back to flow',exact:true}).click();await page.getByLabel('Inspect flow source').selectOption(value);}
async function mock(page,empty=false){await page.route('**/api/flows/query',route=>{const body=route.request().postDataJSON();const data=body.operation==='detail'?{flow:body.flow==='invalid'?{...flow,id:'invalid',state:'invalid'}:flow,graph,sources:[{id:'source-1',path:'src/login.js',kind:'implementation'}]}:body.operation==='source'?{path:'src/login.js',text:'<script>window.flowInjected=true</script>'}:{flows:empty?[]:body.query==='invalid'?[{...flow,id:'invalid',state:'invalid'}]:[flow],total:1};return route.fulfill({json:{revision:'test',generation:1,freshness:'fresh',completeness:'complete',data,diagnostics:[],pagination:{},omissions:[]}});});}
async function open(page,root){await openRepository(page,root);await openFlows(page);}
test('flow list describes browsing versus nonempty search order',async({page})=>{
 const f=await fixtureRepository(unitFixture());
 try{
  await mock(page);await open(page,f.root);
  const list=page.getByLabel('Flow browsing');
  await expect(list.getByText('Newest records first',{exact:true})).toBeVisible();
  await list.getByRole('button',{name:'Behavior discovery',exact:true}).click();
  await list.getByPlaceholder('Describe a behavior or enter an ID').fill('tenant:login');
  await list.getByRole('button',{name:'Search',exact:true}).click();
  await expect(list.getByText('Relevance first',{exact:true})).toBeVisible();
  await list.getByPlaceholder('Describe a behavior or enter an ID').fill('  ');
  await list.getByRole('button',{name:'Search',exact:true}).click();
  await expect(list.getByText('Newest records first',{exact:true})).toBeVisible();
 }finally{await f.cleanup();}
});
test('loops, shared support, evidence, escaped source and narrow keyboard discovery',async({page})=>{const f=await fixtureRepository(unitFixture()),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await mock(page);await open(page,f.root);const view=page.locator('body');await view.getByRole('button',{name:/Tenant login flow/}).click();await expect(view.getByRole('heading',{name:'Tenant login flow'}).first()).toBeVisible();await expect(view.locator('.flow-node')).toHaveCount(2);await view.getByLabel('Show supporting nodes').check();await expect(view.locator('.flow-node')).toHaveCount(3);await expect(view).toContainText('No runtime trace');await expect(view).toContainText('Password recovery');await selectSource(page,'source-1');await expect(view.locator('pre')).toContainText('<script>');expect(await page.evaluate(()=>window.flowInjected)).toBeUndefined();await page.getByRole('button',{name:'Back to flow',exact:true}).click();await page.setViewportSize({width:700,height:1000});await view.getByLabel('Search flows').fill('invalid');await view.getByLabel('Search flows').press('Enter');await view.getByRole('button',{name:/Tenant login flow/}).click();await expect(view).toContainText('Invalid flow record');expect(await fingerprint(f.root)).toEqual(before);expect(errors).toEqual([]);}finally{await f.cleanup();}});
test('legacy empty map remains explicit',async({page})=>{const f=await fixtureRepository(unitFixture());try{await mock(page,true);await open(page,f.root);await expect(page.getByLabel('Flow browsing')).toContainText('Legacy knowledge may have no flow records');}finally{await f.cleanup();}});
test('unit impact links open flow detail and refresh reloads selected context',async({page})=>{const files=unitFixture();for(const [path,text] of files)if(path.includes('units-of-work/')&&path.endsWith('/README.md'))files.set(path,text.replace('---\n','---\naffected_flows:\n  - artifact: tenant\n    flow: login\n    effect: modify\nflow_assessment: Review tenant login.\n'));const f=await fixtureRepository(files);let details=0;await page.route('**/api/flows/query',route=>{const body=route.request().postDataJSON();if(body.operation==='detail')details++;return route.fulfill({json:{generation:details,freshness:'fresh',completeness:'complete',data:body.operation==='detail'?{flow,graph,sources:[]}:{flows:[flow]},diagnostics:[],pagination:{}}});});try{await openRepository(page,f.root);await openUnit(page,'Tenant login');await page.getByRole('button',{name:'modify · tenant:login',exact:true}).click();await expect(page.getByRole('heading',{name:'Tenant login flow'}).first()).toBeVisible();const count=details;await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect.poll(()=>details).toBeGreaterThan(count);await expect(page.getByRole('heading',{name:'Tenant login flow'}).first()).toBeVisible();}finally{await f.cleanup();}});
test('source pagination advances excerpts and resets on selection and refresh',async({page})=>{const f=await fixtureRepository(unitFixture()),requests=[];let removed=false;await page.route('**/api/flows/query',route=>{const body=route.request().postDataJSON();requests.push(body);const data=body.operation==='detail'?{flow,graph,sources:[{id:'source-1',path:'src/login.js'},...(!removed?[{id:'source-2',path:'src/other.js'}]:[])]}:body.operation==='source'?{path:body.source==='source-1'?'src/login.js':'src/other.js',text:body.cursor?'Second excerpt':'First excerpt'}:{flows:[flow]};return route.fulfill({json:{generation:1,freshness:'fresh',completeness:'complete',data,diagnostics:[],pagination:body.operation==='source'&&!body.cursor?{nextCursor:'next-source'}:{}}});});try{await open(page,f.root);const view=page.locator('body');await view.getByRole('button',{name:/Tenant login flow/}).click();await selectSource(page,'source-1');await expect(view.locator('pre')).toHaveText('First excerpt');await view.getByRole('button',{name:'Next source excerpt'}).click();await expect(view.locator('pre')).toHaveText('Second excerpt');await selectSource(page,'source-2');await expect(view.locator('pre')).toHaveText('First excerpt');expect(requests.filter(r=>r.operation==='source'&&r.source==='source-2').at(-1).cursor).toBeUndefined();await view.getByRole('button',{name:'Next source excerpt'}).click();await expect(view.locator('pre')).toHaveText('Second excerpt');await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(view.locator('pre')).toHaveText('First excerpt');const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/flows/query')&&r.request().postDataJSON().operation==='detail');await page.getByRole('button',{name:'Back to flow',exact:true}).click();await refreshed;await expect(view.getByLabel('Inspect flow source')).toHaveValue('source-2');expect(requests.filter(r=>r.operation==='source').at(-1).cursor).toBeUndefined();removed=true;const removal=page.waitForResponse(r=>r.url().endsWith('/api/flows/query')&&r.request().postDataJSON().operation==='detail');await page.getByRole('button',{name:'Refresh',exact:true}).click();await removal;await expect(view.getByLabel('Inspect flow source')).toHaveValue('');await expect(view.locator('pre')).toHaveCount(0);}finally{await f.cleanup();}});
test('actual HTTP resolves fixture flow, graph, source and artifact participation',async({page})=>{const files=unitFixture();files.set('docs/artifacts/tenant/changes/change-login/specifications/flows/login.md','---\nflow:\n  id: login\n  artifact: tenant\n  title: Tenant browser journey\n  trigger: Sign in\n  outcome: Membership checked\n  entry_steps: [start]\n  steps:\n    - id: start\n      title: Validate membership\n      supports: [source]\n  transitions: []\n  support:\n    - id: source\n      kind: implementation\n      path: src/login.js\n      requires: Membership rule\n      basis: static\n  gaps: [No runtime trace]\n  exclusions: [Password recovery]\n---\n# Tenant journey');files.set('src/login.js','export const membership = true;\r\n');const f=await fixtureRepository(files),before=await fingerprint(f.root);try{await open(page,f.root);const view=page.locator('body');await page.getByRole('group',{name:'Flow knowledge'}).getByRole('button',{name:'Planning',exact:true}).click();await view.getByLabel('Search flows').fill('tenant:login');await view.getByLabel('Search flows').press('Enter');await view.getByRole('button',{name:/Tenant browser journey/}).click();await expect(view.getByRole('heading',{name:'Tenant browser journey'}).first()).toBeVisible();await expect(view.locator('.flow-node')).toHaveCount(1);await view.getByLabel('Show supporting nodes').check();await expect(view.locator('.flow-node')).toHaveCount(2);await selectSource(page,{label:'src/login.js'});await expect(view.locator('pre')).toContainText('export const membership');expect(await view.locator('.code-panel code').textContent()).toBe('export const membership = true;\r\n');await expect(view.locator('.code-panel .hljs-keyword').first()).toBeVisible();const panel=await selectOnGraph(page,'tenant');await panel.getByRole('button',{name:'Find participating flows'}).click();await expect(view.getByLabel('Artifact',{exact:true})).toHaveValue('tenant');await expect(view.getByRole('button',{name:/Tenant browser journey/})).toBeVisible();expect(await fingerprint(f.root)).toEqual(before);}finally{await f.cleanup();}});
test('readable optional-model notice, shortened sources and inline toggle',async({page})=>{
 const f=await fixtureRepository(unitFixture());
 const message="ENOENT: no such file or directory, open '/private/models/manifest.json'";
 await page.route('**/api/flows/query',route=>{
  const body=route.request().postDataJSON(),detail=body.operation==='detail';
  return route.fulfill({json:{generation:1,freshness:'fresh',completeness:'complete',diagnostics:[{code:'flow-model-unavailable',message}],omissions:detail?[{source:JSON.stringify(['/repo','tenant','change:change-login','element','docs/artifacts/tenant/specifications/login.md']),characters:8138}]:[],data:detail?{flow,graph,sources:[]}:{flows:[flow]},pagination:{}}});
 });
 try{
  await open(page,f.root);const view=page.locator('body');
  await view.getByRole('button',{name:/Tenant login flow/}).click();
  const notice=view.getByText('Semantic search is unavailable. Keyword search and graph discovery still work.',{exact:true});
  await expect(notice).toHaveCount(1);await expect(notice).toBeVisible();
  await expect(view.getByText(message,{exact:false})).toBeHidden();
  await expect(view.getByText('Omissions:',{exact:false})).toHaveCount(0);
  const technical=view.getByText('Technical details',{exact:true});await technical.focus();await technical.press('Enter');
  await expect(view.getByText(message,{exact:false})).toBeVisible();await technical.press('Enter');
  await view.getByText('Evidence details',{exact:true}).click();
  const shortened=view.getByText('1 shortened source',{exact:true});await shortened.focus();await shortened.press('Enter');
  await expect(view.getByText('docs/artifacts/tenant/specifications/login.md',{exact:true})).toBeVisible();
  await expect(view.getByText('8,138 characters omitted',{exact:true})).toBeVisible();await shortened.press('Enter');
  for(const width of [1440,700]){
   await page.setViewportSize({width,height:1000});const toggle=view.getByLabel('Show supporting nodes');
   await expect.poll(()=>toggle.evaluate(el=>{const c=el.getBoundingClientRect(),l=el.parentElement.getBoundingClientRect();return Math.abs(c.y+c.height/2-l.y-l.height/2)<2&&c.x-l.x<2;})).toBe(true);
   expect(await page.getByLabel('Flow exploration').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
   await expect(async()=>{await toggle.scrollIntoViewIfNeeded();await expect(toggle).toBeInViewport();await page.screenshot({path:`/tmp/flow-readability-${width}.png`});}).toPass();
  }
  await view.getByLabel('Show supporting nodes').focus();await view.getByLabel('Show supporting nodes').press('Space');await expect(view.locator('.flow-node')).toHaveCount(3);
 }finally{await f.cleanup();}
});
test('lazy pages, synchronized panels and retained cross-view knowledge and selection',async({page})=>{
 const f=await fixtureRepository(unitFixture()),requests=[];
 const flows=Array.from({length:45},(_,i)=>({...flow,id:`flow-${i}`,title:`Journey ${i}`,createdAt:new Date(Date.UTC(2025,0,45-i)).toISOString()}));
 await page.route('**/api/flows/query',route=>{
  const body=route.request().postDataJSON();requests.push(body);
  const offset=Number(body.cursor||0),chosen=flows.find(f=>f.id===body.flow)||flows[0];
  const data=body.operation==='detail'?{flow:chosen,graph:{...graph,edges:graph.edges.map(e=>({...e,flow:chosen.id}))},sources:[{id:'source-1',path:'src/login.js'}]}:body.operation==='source'?{path:'src/login.js',text:'Retained source'}:{flows:flows.slice(offset,offset+20),total:45};
  return route.fulfill({json:{revision:'stable-pagination',generation:1,freshness:'fresh',completeness:'complete',diagnostics:[],data,pagination:body.operation==='search'&&offset+20<45?{nextCursor:String(offset+20)}:{}}});
 });
 try{
  await openRepository(page,f.root);expect(requests).toHaveLength(0);
  // The initial observation pulse can refresh flow reads; settle it before measuring cross-view reuse.
  await expect(page.getByLabel('Repository update status')).toHaveText('Current');
  const {openGraph,openUnit:unitPage}=await import('./workbench.js');
  await (await openGraph(page)).getByRole('group',{name:'Dependency view'}).getByRole('button',{name:'Planning',exact:true}).click();
  await openFlows(page);
  const panel=page.getByRole('region',{name:'Flow page'}),nav=panel.getByRole('navigation',{name:'System flows'}),knowledge=panel.getByRole('group',{name:'Flow knowledge'});
  await expect(knowledge.getByRole('button',{name:'Planning',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(nav.getByRole('button',{name:/Journey 0 /})).toBeVisible();expect(requests.filter(r=>r.operation==='detail'||r.operation==='source')).toHaveLength(0);
  for(const cursor of ['20','40']){const response=page.waitForResponse(r=>r.url().endsWith('/api/flows/query')&&r.request().postDataJSON().cursor===cursor);await nav.getByRole('button',{name:'Load more',exact:true}).click();await response;}
  await expect(nav.getByRole('button')).toHaveCount(45);expect(requests.filter(r=>r.cursor==='20')).toHaveLength(1);expect(requests.filter(r=>r.cursor==='40')).toHaveLength(1);
  await nav.getByRole('button',{name:/Journey 0 /}).click();await expect(panel.getByLabel('Flow details').getByRole('heading',{name:'Journey 0',exact:true})).toBeVisible();
  await panel.getByLabel('Show supporting nodes').check();await panel.locator('.flow-node').filter({hasText:'Check membership'}).click();await expect(panel.getByRole('button',{name:'Show all support'})).toBeVisible();
  await selectSource(page,'source-1');await expect(documentPage(page).locator('pre')).toHaveText('Retained source');
  const count=requests.length;
  await documentPage(page).getByRole('button',{name:'Back to flow',exact:true}).click();
  await expect((await openGraph(page)).getByRole('group',{name:'Dependency view'}).getByRole('button',{name:'Planning',exact:true})).toHaveAttribute('aria-pressed','true');
  await unitPage(page,'Tenant login');await openFlows(page);expect(requests.length).toBe(count);
  await expect(panel.getByLabel('Inspect flow source')).toHaveValue('source-1');await panel.getByRole('button',{name:'Read selected source',exact:true}).click();await expect(documentPage(page).locator('pre')).toHaveText('Retained source');await documentPage(page).getByRole('button',{name:'Back to flow',exact:true}).click();await expect(nav.getByRole('button')).toHaveCount(45);
  await knowledge.getByRole('button',{name:'All snapshots',exact:true}).click();await expect(knowledge.getByRole('button',{name:'All snapshots',exact:true})).toHaveAttribute('aria-pressed','true');
  await openGraph(page);await openFlows(page);await expect(knowledge.getByRole('button',{name:'All snapshots',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(knowledge.locator('button.active')).toHaveCount(1);await nav.getByRole('button',{name:/Journey 0 /}).click();await expect(panel.getByLabel('Flow details').getByRole('heading',{name:'Journey 0',exact:true})).toBeVisible();await page.screenshot({path:'/tmp/flow-navigation-wide.png'});
  await page.setViewportSize({width:700,height:1000});await nav.getByRole('button',{name:/Journey 0 /}).scrollIntoViewIfNeeded();await expect(nav.getByRole('button',{name:/Journey 0 /})).toBeInViewport();await expect.poll(()=>panel.locator('.flow-node').last().evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.flow-surface').getBoundingClientRect();return a.right<=b.right&&a.left>=b.left;})).toBe(true);await page.screenshot({path:'/tmp/flow-navigation-narrow.png'});
 }finally{await f.cleanup();}
});
test('flow sessions remain isolated across project tabs and knowledge changes cancel old replies',async({page})=>{
 const a=await fixtureRepository(unitFixture()),b=await fixtureRepository(unitFixture()),requests=[];
 await page.route('**/api/flows/query',async route=>{
  const body=route.request().postDataJSON();requests.push(body);const title=body.path===a.root?'Project A journey':'Project B journey';
  if(body.knowledge==='all')await new Promise(resolve=>setTimeout(resolve,150));
  const candidate={...flow,title:body.knowledge==='all'?'Old all-snapshots reply':title};
  try{await route.fulfill({json:{revision:body.path+body.knowledge,generation:1,freshness:'fresh',completeness:'complete',diagnostics:[],data:body.operation==='detail'?{flow:candidate,graph,sources:[]}:{flows:[candidate]},pagination:{}}});}catch{}
 });
 try{
  await open(page,a.root);const active=()=>page.getByRole('tabpanel');await active().getByRole('button',{name:/Project A journey/}).click();
  await expect(active().getByLabel('Flow details').getByRole('heading',{name:'Project A journey'})).toBeVisible();
  await active().getByLabel('Search flows').fill('remember A');
  await page.getByRole('button',{name:'New project tab'}).click();await active().getByLabel('Repository path').fill(b.root);await active().getByRole('button',{name:'Open repository',exact:true}).click();await openFlows(page);
  await expect(active().getByRole('button',{name:/Project B journey/})).toBeVisible();await expect(active().getByLabel('Search flows')).toHaveValue('');await expect(active().getByLabel('Flow details')).toBeHidden();
  await page.getByRole('tab').first().click();await expect(active().getByLabel('Search flows')).toHaveValue('remember A');await expect(active().getByLabel('Flow details').getByRole('heading',{name:'Project A journey'})).toBeVisible();
  const knowledge=active().getByRole('group',{name:'Flow knowledge'});await knowledge.getByRole('button',{name:'All snapshots',exact:true}).click();await knowledge.getByRole('button',{name:'Planning',exact:true}).click();
  await expect(active().getByRole('navigation',{name:'System flows'})).toContainText('Project A journey');await expect(active().getByRole('navigation',{name:'System flows'})).not.toContainText('Old all-snapshots reply');
  await page.getByRole('button',{name:'New project tab'}).click();await expect(active().getByLabel('Repository path')).toHaveValue('');const count=requests.length;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));expect(requests.length).toBe(count);
 }finally{await a.cleanup();await b.cleanup();}
});
test('changing registered worktree clears incompatible flow and source selections',async({page})=>{
 const {git}=await import('../fixtures.js');const f=await fixtureRepository(unitFixture()),other=f.root+'-flow-other';git(f.root,'worktree','add','-q','-b','other',other);
 await page.route('**/api/flows/query',route=>{const body=route.request().postDataJSON(),candidate={...flow,id:body.worktree+'-flow',title:body.worktree===other?'Other worktree flow':'Original worktree flow'};return route.fulfill({json:{revision:body.worktree,generation:1,freshness:'fresh',completeness:'complete',diagnostics:[],data:body.operation==='detail'?{flow:candidate,graph,sources:[{id:'source-1',path:'src/login.js'}]}:body.operation==='source'?{path:'src/login.js',text:'Original source'}:{flows:[candidate]},pagination:{}}});});
 try{
  await open(page,f.root);await page.getByRole('button',{name:/Original worktree flow/}).click();await selectSource(page,'source-1');await expect(page.locator('pre')).toHaveText('Original source');
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.getByRole('region',{name:'Work page'})).toContainText('Branch other');await openFlows(page);await expect(page.getByRole('button',{name:/Other worktree flow/})).toBeVisible();await expect(page.locator('pre')).toHaveCount(0);await expect(page.getByLabel('Flow details')).toBeHidden();
  await page.getByRole('button',{name:/Other worktree flow/}).click();await expect(page.getByLabel('Flow details').getByRole('heading',{name:'Other worktree flow'})).toBeVisible();await expect(page.getByLabel('Inspect flow source')).toHaveValue('');
 }finally{git(f.root,'worktree','remove','--force',other);await f.cleanup();}
});
