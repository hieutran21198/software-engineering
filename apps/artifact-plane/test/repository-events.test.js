import {test} from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';
import {writeFile,rename,rm,mkdir,utimes} from 'node:fs/promises';import {join} from 'node:path';
import {fixtureRepository,git,fingerprint} from './fixtures.js';import {changeDeliveryFixture} from './unit-fixtures.js';
import {repositoryFingerprint,repositoryService} from '../server/repository-events.js';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('fingerprints cover content/rename/delete/refs/worktree changes without writes',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture()),other=f.root+'-other',before=await fingerprint(f.root);
 try{const initial=await repositoryFingerprint(f.root);assert.deepEqual(await fingerprint(f.root),before);
 const path=join(f.root,'docs/artifacts/tenant/changes/change-login/tasks/api.md');await writeFile(path,'# Changed');await utimes(path,1,1);const edited=await repositoryFingerprint(f.root);assert.notEqual(edited.fingerprint,initial.fingerprint);
 await writeFile(path,'# Revised');await utimes(path,1,1);assert.notEqual((await repositoryFingerprint(f.root)).fingerprint,edited.fingerprint);
 await rename(path,path.replace('api.md','renamed.md'));const renamed=await repositoryFingerprint(f.root);await rm(path.replace('api.md','renamed.md'));assert.notEqual((await repositoryFingerprint(f.root)).fingerprint,renamed.fingerprint);
 const prior=await repositoryFingerprint(f.root);git(f.root,'worktree','add','-qb','other',other);assert.notEqual((await repositoryFingerprint(f.root)).fingerprint,prior.fingerprint);
 const registered=await repositoryFingerprint(f.root);await writeFile(join(other,'docs/artifacts/tenant/README.md'),'# Other');assert.notEqual((await repositoryFingerprint(f.root)).fingerprint,registered.fingerprint);
 git(f.root,'worktree','remove','--force',other);git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Updated');assert.notEqual((await repositoryFingerprint(f.root)).fingerprint,prior.fingerprint);
 }finally{await f.cleanup();}
});
test('shared observer coalesces, recovers, never overlaps and releases final subscriber',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());let revision='a',failure=false,active=0,peak=0,calls=0;
 const service=repositoryService({intervalMs:15,debounceMs:5,heartbeatMs:20,maxClients:2,sample:async()=>{active++;peak=Math.max(peak,active);calls++;try{await pause(5);if(failure)throw Error('unavailable');return {fingerprint:revision,files:1};}finally{active--;}}});
 const client=()=>{const req=new EventEmitter(),res=new EventEmitter();res.output='';res.writeHead=()=>{};res.write=value=>res.output+=value;res.end=()=>res.emit('close');return {req,res};};const a=client(),b=client();
 try{await service.subscribe(a.req,a.res,{},f.root);await service.subscribe(b.req,b.res,{},f.root);assert.equal(service.observerCount,1);await pause(50);assert.match(a.res.output,/"available":true/);const initial=a.res.output.match(/data:/g).length;await pause(40);assert.equal(a.res.output.match(/data:/g).length,initial);assert.match(a.res.output,/: heartbeat/);
 const c=client();await assert.rejects(service.subscribe(c.req,c.res,{},f.root),e=>e.status===429);
 revision='b';await pause(35);failure=true;await pause(35);assert.match(a.res.output,/"available":false/);failure=false;await pause(35);assert(a.res.output.lastIndexOf('"available":true')>a.res.output.lastIndexOf('"available":false'));assert.equal(peak,1);
 a.req.emit('close');assert.equal(service.clientCount,1);b.req.emit('close');assert.equal(service.observerCount,0);assert.equal(service.clientCount,0);const stopped=calls;await pause(40);assert.equal(calls,stopped);
 }finally{service.close();await f.cleanup();}
});
test('repository SSE validates origin/root/client limits and closes on server shutdown',async()=>{
 const {createAppServer}=await import('../server/http.js');const f=await fixtureRepository(changeDeliveryFixture());const server=createAppServer({repositoryObservation:{intervalMs:20,debounceMs:5,maxClients:1}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{
 const url=base+'/api/repository/events?path='+encodeURIComponent(f.root);
 assert.equal((await fetch(url,{headers:{Origin:'https://foreign.invalid'}})).status,403);assert.equal((await fetch(base+'/api/repository/events')).status,400);assert.equal((await fetch(base+'/api/repository/events?path=/missing')).status,404);
 const controller=new AbortController(),response=await fetch(url,{signal:controller.signal});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/event-stream; charset=utf-8');const reader=response.body.getReader();let text='';while(!text.includes('available'))text+=new TextDecoder().decode((await reader.read()).value);assert.match(text,/"available":true/);assert.equal((await fetch(url)).status,429);
 await new Promise(resolve=>server.close(resolve));assert.equal(server.repositories.observerCount,0);controller.abort();
 }finally{server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));await f.cleanup();}
});

// Incremental observation: notifications invalidate paths, periodic full
// reconciliation bounds missed events, and the full scan is the oracle.
import {incrementalSampler} from '../server/repository-events.js';
import {readFile} from 'node:fs/promises';
const login='docs/artifacts/tenant/changes/change-login/tasks/api.md';
// A controllable notification adapter: events arrive only when emitted.
function fakeWatches({fail=false}={}){
 const open=new Map();
 return {open,watchPath(path,listener,onError){if(fail)throw Object.assign(Error('no watch'),{code:'ENOSPC'});const handle={close(){open.delete(handle);}};open.set(handle,{path,listener,onError});return handle;},
  emit(name,event='change'){for(const {listener} of [...open.values()])listener(event,name);},error(){for(const {onError} of [...open.values()])onError(Error('watch failed'));}};
}
const waitFor=async(check,timeoutMs=4000)=>{const end=Date.now()+timeoutMs;while(Date.now()<end){if(await check())return true;await pause(20);}return false;};
const oracle=async root=>(await repositoryFingerprint(root)).fingerprint;
test('P5: real notifications reread same-size preserved-timestamp edits, nested creation, rename and delete; results match the full scan',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());let wakes=0;
 const sampler=incrementalSampler(f.root,{fullMs:1e9,debounceMs:10,wake:()=>wakes++});
 const agree=async()=>(await sampler.sample()).fingerprint===await oracle(f.root);
 try{
  assert.equal((await sampler.sample()).fingerprint,await oracle(f.root));
  const fullBytes=sampler.stats().bytesRead;assert.ok(sampler.stats().watches>5);
  const path=join(f.root,login),text=(await readFile(path,'utf8')).slice(0,-1);
  for(const last of ['X','Y']){
   const seen=wakes;await writeFile(path,text+last);await utimes(path,1,1);
   assert.ok(await waitFor(()=>wakes>seen),'notification');assert.ok(await agree(),'same-size edit '+last);
  }
  assert.ok(sampler.stats().bytesRead-fullBytes<=(text.length+1)*4,'only invalidated bytes are reread');
  await mkdir(join(f.root,'docs/artifacts/tenant/new/deeper'),{recursive:true});await writeFile(join(f.root,'docs/artifacts/tenant/new/deeper/file.md'),'# New');
  assert.ok(await waitFor(agree),'nested creation');
  await writeFile(join(f.root,'docs/artifacts/tenant/new/deeper/file.md'),'# Edited in a new nested directory');assert.ok(await waitFor(agree),'edit in new directory');
  await rename(join(f.root,'docs/artifacts/tenant/new'),join(f.root,'docs/artifacts/tenant/moved'));assert.ok(await waitFor(agree),'rename');
  await rm(join(f.root,'docs/artifacts/tenant/moved'),{recursive:true});await rm(path);assert.ok(await waitFor(agree),'delete');
  assert.equal(sampler.stats().fullScans,1);assert.ok(sampler.stats().incrementalScans>3);assert.equal(sampler.stats().mode,'watching');
 }finally{sampler.close();await f.cleanup();}
});
test('P5: dropped notifications are recovered by the full reconciliation within its interval plus scan duration',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());let clock=0;const watches=fakeWatches();
 const sampler=incrementalSampler(f.root,{now:()=>clock,watchPath:watches.watchPath,fullMs:30000,fallbackMs:10000});
 try{
  const initial=await sampler.sample();
  await writeFile(join(f.root,login),'# Dropped notification');
  clock=29999;const missed=await sampler.sample();assert.notEqual(missed.fingerprint,initial.fingerprint,'git status still changes');assert.notEqual(missed.fingerprint,await oracle(f.root),'the dropped content edit is not yet read');
  clock=30000;assert.equal((await sampler.sample()).fingerprint,await oracle(f.root));assert.equal(sampler.stats().fullScans,2);
  await writeFile(join(f.root,login),'# Delivered notification');watches.emit('api.md');
  clock=30001;assert.equal((await sampler.sample()).fingerprint,await oracle(f.root));assert.equal(sampler.stats().fullScans,2);
 }finally{sampler.close();await f.cleanup();}
});
test('P5: watch exhaustion, watch failure and watch errors degrade visibly to the 10-second fallback',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());let clock=0;
 try{
  for(const options of [{maxWatches:2,watchPath:fakeWatches().watchPath},{watchPath:fakeWatches({fail:true}).watchPath}]){
   const sampler=incrementalSampler(f.root,{now:()=>clock,...options});
   try{
    clock=0;const initial=await sampler.sample();assert.equal(initial.mode,'degraded');assert.ok(sampler.stats().watches<=2);
    await writeFile(join(f.root,login),'# Degraded edit '+options.maxWatches);
    clock=9999;assert.notEqual((await sampler.sample()).fingerprint,await oracle(f.root),'degraded content is read only by the fallback scan');
    clock=10000;assert.equal((await sampler.sample()).fingerprint,await oracle(f.root));
   }finally{sampler.close();}
  }
  const watches=fakeWatches(),sampler=incrementalSampler(f.root,{now:()=>clock,watchPath:watches.watchPath});
  try{
   clock=0;await sampler.sample();assert.equal(sampler.stats().mode,'watching');watches.error();
   assert.equal(sampler.stats().mode,'degraded');assert.equal(sampler.stats().watches,0);
   clock=10000;await sampler.sample();assert.equal(sampler.stats().fullScans,2);assert.equal(sampler.stats().mode,'watching');
  }finally{sampler.close();}
 }finally{await f.cleanup();}
});
test('P5: queues stay bounded, scans never overlap and closing releases every watch and timer',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());const watches=fakeWatches();let wakes=0;
 const timers={pending:new Set(),setTimeout(fn){const t={fn};this.pending.add(t);return t;},clearTimeout(t){this.pending.delete(t);}};
 const sampler=incrementalSampler(f.root,{watchPath:watches.watchPath,maxPending:4,timers,wake:()=>wakes++,fullMs:1e9});
 try{
  await sampler.sample();assert.ok(watches.open.size>0);
  for(let i=0;i<5000;i++)watches.emit('file-'+i+'.md');
  assert.equal(timers.pending.size,1,'one debounced wake');for(const t of [...timers.pending]){timers.pending.delete(t);t.fn();}assert.equal(wakes,1);
  assert.ok(sampler.stats().collapses>=1);
  const a=sampler.sample(),b=sampler.sample();assert.strictEqual(a,b,'concurrent callers share one scan');
  assert.equal((await a).fingerprint,await oracle(f.root));
  watches.emit('api.md');assert.equal(timers.pending.size,1);
  sampler.close();assert.equal(watches.open.size,0);assert.equal(timers.pending.size,0);assert.equal(sampler.stats().watches,0);
  await assert.rejects(sampler.sample());
 }finally{sampler.close();await f.cleanup();}
});
test('P5: the shared observer reports watch mode, wakes on notifications and releases watches with the final subscriber',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture());const watches=fakeWatches();
 const service=repositoryService({intervalMs:60000,debounceMs:5,samplerOptions:{watchPath:watches.watchPath}});
 const req=new EventEmitter(),res=new EventEmitter();res.output='';res.writeHead=()=>{};res.write=value=>res.output+=value;res.end=()=>res.emit('close');
 try{
  await service.subscribe(req,res,{},f.root);assert.ok(await waitFor(()=>/"available":true/.test(res.output)));
  assert.match(res.output,/"observation":"watching"/);const stats=service.stats()[0].observation;assert.ok(stats.watches>0);assert.equal(stats.fullScans,1);
  const sequence=service.stats()[0].sequence;await writeFile(join(f.root,login),'# Woken');watches.emit('api.md');
  assert.ok(await waitFor(()=>service.stats()[0]?.sequence>sequence),'a notification wakes the observer before the 60-second interval');
  assert.equal(service.stats()[0].observation.fullScans,1);
  req.emit('close');assert.equal(service.observerCount,0);assert.equal(watches.open.size,0);
 }finally{service.close();await f.cleanup();}
});
test('P5: real ref, worktree and HEAD changes, stale recovery and read-only observation',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture()),other=f.root+'-observed',before=await fingerprint(f.root);
 const sampler=incrementalSampler(f.root,{fullMs:1e9,debounceMs:5});
 const agree=async()=>(await sampler.sample()).fingerprint===await oracle(f.root);
 try{
  await sampler.sample();assert.deepEqual(await fingerprint(f.root),before,'observation writes nothing');
  git(f.root,'branch','master');assert.ok(await agree(),'protected ref');
  git(f.root,'worktree','add','-qb','observed',other);assert.ok(await agree(),'added worktree');
  await writeFile(join(other,'docs/artifacts/tenant/README.md'),'# Other worktree');assert.ok(await waitFor(agree),'edit in added worktree');
  git(f.root,'worktree','remove','--force',other);assert.ok(await agree(),'removed worktree');
  git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Observed');assert.ok(await agree(),'new HEAD');
  const artifacts=join(f.root,'docs/artifacts');await rename(artifacts,artifacts+'-away');
  assert.ok(await waitFor(agree),'missing knowledge is reported, not served from the map');
  await rename(artifacts+'-away',artifacts);assert.ok(await waitFor(agree),'recovers after the knowledge returns');
 }finally{sampler.close();await rm(other,{recursive:true,force:true});await f.cleanup();}
});
