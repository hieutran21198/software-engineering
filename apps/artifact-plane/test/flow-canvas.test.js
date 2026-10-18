import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flowCanvas,flowDiagram} from '../src/flow-canvas.js';
const flow={id:'f',steps:[{nodeId:'a'},{nodeId:'b'}]};
const graph={nodes:[{id:'a',kind:'step',title:'A'},{id:'b',kind:'step',title:'B'},{id:'s',kind:'element',title:'Shared'}],edges:[{id:'ab',source:'a',target:'b',flow:'f',kind:'transition'},{id:'ba',source:'b',target:'a',flow:'f',kind:'transition'},{id:'as',source:'a',target:'s',flow:'f',kind:'supports',basis:'static'},{id:'bs',source:'b',target:'s',flow:'f',kind:'supports',basis:'documented'}]};
test('behavior projection preserves loops and expands one shared node with separate supporting edges',()=>{const base=flowCanvas(graph,flow);assert.equal(base.nodes.length,2);assert.equal(base.edges.length,2);const full=flowCanvas(graph,flow,true,'s');assert.equal(full.nodes.length,3);assert.equal(full.edges.length,4);assert.equal(full.nodes.filter(n=>n.id==='s').length,1);assert.equal(full.nodes.find(n=>n.id==='s').selected,true);assert.ok(full.nodes.every(n=>Number.isFinite(n.position.x)&&Number.isFinite(n.position.y)));assert.equal(full.edges.find(e=>e.id==='as').label,'supports · static');});
test('document diagram places steps in rows of three and labels transitions without server resolution',()=>{
 const front={steps:[{id:'select',title:'Select'},{id:'copy',title:'Copy'},{id:'check',title:''},{id:'done',title:'Done'},{id:null},'bad'],transitions:[{from:'select',to:'copy',condition:'Valid'},{from:'copy',to:'select'},{from:'copy',to:'absent'},null]};
 const {nodes,edges}=flowDiagram(front);
 assert.deepEqual(nodes.map(n=>n.id),['select','copy','check','done']);
 assert.deepEqual(nodes.map(n=>[n.data.number,n.data.title]),[[1,'Select'],[2,'Copy'],[3,'check'],[4,'Done']]);
 assert.deepEqual(nodes.map(n=>[n.position.x,n.position.y]),[[0,0],[410,0],[820,0],[0,200]]);
 assert.deepEqual(edges.map(e=>[e.source,e.target,e.label]),[['select','copy','Valid'],['copy','select','']]);
 assert.ok(edges.every(e=>e.type==='readable'&&e.markerEnd.type==='arrowclosed'));
 assert.deepEqual(flowDiagram(null),{nodes:[],edges:[]});assert.deepEqual(flowDiagram({steps:'x',transitions:{}}),{nodes:[],edges:[]});
});
test('empty and malformed dangling endpoints remain safe',()=>{assert.deepEqual(flowCanvas(null,null),{nodes:[],edges:[]});const result=flowCanvas({...graph,edges:[...graph.edges,{id:'bad',source:'a',target:'absent',flow:'f',kind:'supports'}]},flow,true);assert.equal(result.edges.length,4);});
