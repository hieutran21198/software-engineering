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
