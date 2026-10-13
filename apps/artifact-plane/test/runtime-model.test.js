import {test} from 'node:test';import assert from 'node:assert/strict';import {taskRuntime,signatureFor} from '../src/runtime-model.js';import {taskSignature} from '../server/runtime-store.js';
const task={id:'task',path:'tasks/task.md',title:'Task',dependsOn:[],body:'# Task'};
const attempt={id:'a',session:'session',agent:'',artifact:'demo',change:'change-live',path:task.path,signature:taskSignature(task),state:'processing',updatedAt:100,startedAt:100};
const identity={artifact:'demo',change:'change-live',path:task.path,signature:attempt.signature};
test('browser signatures match server; changed knowledge never inherits a stale attempt',async()=>{
 assert.equal(await signatureFor(task),taskSignature(task));const r={data:{attempts:[attempt]},connected:true,now:200};assert.equal(taskRuntime(r,identity).state,'processing');assert.equal(taskRuntime(r,{...identity,signature:'changed'}).state,'waiting');assert.equal(taskRuntime(r,{...identity,artifact:'other'}).state,'waiting');
});
test('concurrent attempts, stale/disconnected states, retries and mixed results are honest',()=>{
 const r={data:{attempts:[attempt,{...attempt,id:'b',session:'other',state:'done',endedAt:150}]},connected:true,now:200};assert.equal(taskRuntime(r,identity).attempts.length,2);assert.equal(taskRuntime(r,identity).state,'processing');assert.equal(taskRuntime({...r,connected:false},identity).state,'unknown');assert.equal(taskRuntime({...r,now:700000},identity).state,'unknown');
 const retries={...r,data:{attempts:[{...attempt,state:'failed'},{...attempt,id:'new',state:'done',startedAt:150}]}};assert.equal(taskRuntime(retries,identity).state,'done');assert.equal(taskRuntime(retries,identity).attempts.length,1);
 assert.equal(taskRuntime({...r,data:{attempts:[{...attempt,state:'done'},{...attempt,id:'b',session:'other',state:'failed'}]}},identity).state,'unknown');
});
