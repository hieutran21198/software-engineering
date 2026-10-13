import test from 'node:test';
import assert from 'node:assert/strict';
import {taskCanvas,taskNodeKey,taskSelection} from '../src/task-canvas.js';
const w={path:'/repo'},tasks=['api','ui','integration','validation','independent'].map(id=>({id,path:'tasks/'+id+'.md'}));
const c={artifact:'demo',name:'change-next',taskGraph:{state:'available',tasks,edges:[{source:'api',target:'integration'},{source:'ui',target:'integration'},{source:'integration',target:'validation'}]}};
test('fork/join includes disconnected tasks with deterministic prerequisite arrows',()=>{
 const g=taskCanvas(w,c);assert.equal(g.nodes.length,5);assert.equal(g.edges.length,3);assert.deepEqual(taskCanvas(w,c),g);
 for(const e of g.edges){assert.ok(g.nodes.find(n=>n.id===e.source).position.x<g.nodes.find(n=>n.id===e.target).position.x);assert.equal(e.markerEnd.type,'arrowclosed');}
});
test('identical local IDs remain isolated by worktree/change/path; lost sources clear selection',()=>{
 const key=JSON.stringify(['/repo','demo','change-next']),id=taskNodeKey(w,c,tasks[0]),workflow={worktrees:[{...w,changes:[c]}]};
 assert.equal(taskSelection(workflow,key,id).task,tasks[0]);assert.notEqual(id,taskNodeKey({...w,path:'/other'},c,tasks[0]));assert.notEqual(id,taskNodeKey(w,{...c,name:'change-other'},tasks[0]));assert.equal(taskSelection(workflow,key,'gone').task,undefined);assert.equal(taskSelection(workflow,'bad',id),null);
});
test('invalid plans suppress edges; empty, unavailable, and single-task graphs remain valid views',()=>{
 assert.equal(taskCanvas(w,{...c,taskGraph:{...c.taskGraph,state:'invalid'}}).edges.length,0);
 for(const state of ['available','unavailable'])assert.equal(taskCanvas(w,{...c,taskGraph:{state,tasks:[],edges:[]}}).nodes.length,0);
 assert.equal(taskCanvas(w,{...c,taskGraph:{state:'available',tasks:[tasks[0]],edges:[]}}).nodes.length,1);
});
