import {test} from 'node:test';import assert from 'node:assert/strict';import {prerequisiteView} from '../src/prerequisite-view.js';
const edge=(source,target,kind='task')=>({source,target,kind});
test('redundant edges disappear without changing reachability or input declarations',()=>{
 const edges=[edge('a','b'),edge('b','c'),edge('a','c'),edge('c','d'),edge('a','d')],before=structuredClone(edges);
 assert.deepEqual(prerequisiteView(edges),[edges[0],edges[1],edges[3]]);assert.deepEqual(edges,before);assert.equal(prerequisiteView(edges,true),edges);
});
test('fork/join paths remain; gates cannot remove a task prerequisite; cycles stay unreduced',()=>{
 const fork=[edge('a','b'),edge('a','c'),edge('b','d'),edge('c','d')];assert.deepEqual(prerequisiteView(fork),fork);
 const gates=[edge('a','g','establishment'),edge('g','b','establishment'),edge('a','b')];assert.deepEqual(prerequisiteView(gates),gates);
 const cycle=[edge('a','b'),edge('b','a'),edge('a','c')];assert.equal(prerequisiteView(cycle),cycle);
});
