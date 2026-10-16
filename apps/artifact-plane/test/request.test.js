import {test} from 'node:test';
import assert from 'node:assert/strict';
import {postJSON} from '../src/request.js';
test('visible reads distinguish timeout, cancellation and server errors',async t=>{
 t.mock.method(globalThis,'fetch',async(_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true})));
 const timer=setTimeout(()=>{},1000);
 await assert.rejects(postJSON('/read',{},undefined,10),/timed out/);
 const controller=new AbortController(),pending=postJSON('/read',{},controller.signal);controller.abort();await assert.rejects(pending,{name:'AbortError'});
 clearTimeout(timer);
 globalThis.fetch.mock.mockImplementation(async()=>({ok:false,status:422,json:async()=>({error:{message:'Unsafe source'}})}));await assert.rejects(postJSON('/read',{}),e=>e.status===422&&e.message==='Unsafe source');
});
