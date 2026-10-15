import {test} from 'node:test';import assert from 'node:assert/strict';
import {placeLabels} from '../src/label-placement.js';
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
test('measured blocked anchors, parallel/reverse labels and dense fallback remain disjoint',()=>{const nodes=[{x:-1000,y:-1000,width:2000,height:2000}],labels=Array.from({length:30},(_,i)=>({id:`e${i}`,x:0,y:0,width:180,height:60}));const out=placeLabels(labels,nodes);assert.deepEqual(out,placeLabels(labels,nodes));for(let i=0;i<out.length;i++){assert.ok(!nodes.some(n=>overlaps(out[i],n)));assert.ok(!out.slice(0,i).some(n=>overlaps(out[i],n)));assert.equal(out[i].id,labels[i].id);}});
