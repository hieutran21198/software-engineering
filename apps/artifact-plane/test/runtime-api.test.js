import {test} from 'node:test';import assert from 'node:assert/strict';import {createAppServer} from '../server/http.js';import {RuntimeStore} from '../server/runtime-store.js';import {runtimeFixture,bind} from './runtime-fixtures.js';import {fingerprint} from './fixtures.js';
async function serverFor(stateDir){const s=createAppServer({stateDir,intervalMs:20,maxClients:1});await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));return {server:s,url:'http://127.0.0.1:'+s.address().port,close:()=>new Promise(resolve=>{s.runtime.close();s.close(resolve);s.closeAllConnections();})};}
test('runtime query and SSE expose observations with origin checks and client cleanup',async()=>{
 const f=await runtimeFixture(),app=await serverFor(f.stateDir),s=new RuntimeStore({stateDir:f.stateDir});try{
  const a=await bind(s,f.root);s.observe({session_id:'session',hook_event_name:'UserPromptSubmit',turn_id:'turn'});const before=await fingerprint(f.root);
  const post=(body,headers={})=>fetch(app.url+'/api/runtime/query',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
  assert.equal((await post({path:f.root},{origin:'https://evil.invalid'})).status,403);
  assert.equal((await post({})).status,400);assert.equal((await post({path:f.root,pad:'x'.repeat(20000)})).status,413);
  const data=await (await post({path:f.root})).json();assert.equal(data.attempts[0].id,a.attempt);assert.equal(data.attempts[0].state,'processing');
  const controller=new AbortController(),response=await fetch(app.url+'/api/runtime/events',{signal:controller.signal});assert.equal(response.headers.get('content-type'),'text/event-stream; charset=utf-8');const reader=response.body.getReader();const first=new TextDecoder().decode((await reader.read()).value);assert.match(first,/sequence/);assert.equal(app.server.runtime.watching,true);
  assert.equal((await fetch(app.url+'/api/runtime/events')).status,429);s.observe({session_id:'session',hook_event_name:'Stop',turn_id:'turn'});assert.match(new TextDecoder().decode((await reader.read()).value),/sequence/);controller.abort();await new Promise(resolve=>setTimeout(resolve,50));assert.equal(app.server.runtime.clientCount,0);assert.equal(app.server.runtime.watching,false);
  assert.equal((await fetch(app.url+'/api/runtime/write',{method:'POST'})).status,405);assert.deepEqual(await fingerprint(f.root),before);
 }finally{s.close();await app.close();await f.cleanup();}
});
test('restart marks old active observations unknown; unavailable storage preserves explorer',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});await bind(s,f.root);s.observe({session_id:'session',hook_event_name:'UserPromptSubmit',turn_id:'turn'});s.close();await new Promise(resolve=>setTimeout(resolve,5));const app=await serverFor(f.stateDir);try{
  const response=await fetch(app.url+'/api/runtime/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:f.root})});assert.equal((await response.json()).attempts[0].state,'unknown');
  const invalid=await fetch(app.url+'/api/runtime/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:'/missing'})});assert.equal((await invalid.json()).available,false);
  const explore=await fetch(app.url+'/api/explore',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:f.root})});assert.equal(explore.status,200);
 }finally{await app.close();await f.cleanup();}
});
