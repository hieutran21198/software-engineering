import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readWorkspace,writeWorkspace,closeTab,storageKey} from '../src/project-tabs.js';
test('workspace preference round trip stores only paths, order, and active project',()=>{let raw;const storage={getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,storageKey);raw=value;}};writeWorkspace(storage,[{id:'a',path:'/a',snapshot:'secret'},{id:'b',path:'/b'},{id:'c'}],'b');assert.deepEqual(readWorkspace(storage),{projects:['/a','/b'],activeProject:'/b'});assert.ok(!raw.includes('secret'));});
test('invalid preferences and storage failures recover',()=>{for(const raw of ['{','null','{"version":2,"projects":[]}'])assert.ok(readWorkspace({getItem:()=>raw}).warning);assert.ok(readWorkspace({getItem:()=>{throw Error();}}).warning);assert.ok(writeWorkspace({setItem:()=>{throw Error();}},[],'a'));assert.deepEqual(readWorkspace({getItem:()=>JSON.stringify({version:1,projects:['/a','relative',null,'/a','/b'],activeProject:'/missing'})}),{projects:['/a','/b'],activeProject:null});});
test('closing active, inactive, and last tabs picks a surviving project',()=>{const tabs=[{id:'a'},{id:'b'},{id:'c'}],empty={id:'empty'};assert.equal(closeTab(tabs,'b','b',empty).activeId,'c');assert.equal(closeTab(tabs,'c','c',empty).activeId,'b');assert.equal(closeTab(tabs,'a','b',empty).activeId,'a');assert.deepEqual(closeTab([{id:'a'}],'a','a',empty),{tabs:[empty],activeId:'empty'});});

test('equal project basenames receive shortest unique visible suffixes',async()=>{
 const {projectLabels}=await import('../src/project-tabs.js');
 assert.deepEqual(projectLabels([{id:'a',path:'/one/same/repo'},{id:'b',path:'/two/same/repo'}]),['repo · one/same','repo · two/same']);
 assert.deepEqual(projectLabels([{id:'a',path:'/one/repo'}]),['repo']);
});
