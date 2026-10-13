import {test} from 'node:test';import assert from 'node:assert/strict';import {refreshQueue} from '../src/reload.js';
test('save bursts and manual requests coalesce to one trailing reload',async()=>{
 let active=0,peak=0,calls=0,release;const queue=refreshQueue(async()=>{active++;peak=Math.max(peak,active);calls++;if(calls===1)await new Promise(resolve=>release=resolve);active--;});
 const first=queue.request();for(let i=0;i<20;i++)queue.request();assert.equal(calls,1);release();await first;assert.equal(calls,2);assert.equal(peak,1);
});
test('switch cancellation aborts active work and prevents a trailing reload',async()=>{
 let calls=0;const queue=refreshQueue(signal=>{calls++;return new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));});const first=queue.request();queue.request();queue.close();await first;assert.equal(calls,1);await queue.request();assert.equal(calls,1);
});
