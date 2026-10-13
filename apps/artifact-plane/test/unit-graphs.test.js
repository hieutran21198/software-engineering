import test from 'node:test';import assert from 'node:assert/strict';
import {buildUnitGraphs} from '../server/unit-graphs.js';
const graph=(tasks=['api','ui','integration'],edges=[{source:'api',target:'integration'},{source:'ui',target:'integration'}])=>({state:'available',tasks:tasks.map(id=>({id,path:`tasks/${id}.md`,title:id,body:'# Task'})),edges,diagnostics:[]});
const member=artifact=>({artifact,change:'change-login',taskGraph:graph(),sourcePath:`docs/artifacts/${artifact}/changes/change-login/`,retainedChangePath:`docs/artifacts/${artifact}/changes/change-login/`,establishmentEvidence:{state:'proposed',sources:[],reasons:[]}});
const unit=()=>({id:'login',path:'brief',members:[member('tenant'),member('auth')]});
const snapshot=()=>({artifacts:['tenant','auth','identity','external','unrelated'].map(id=>({id,title:id})),edges:[{source:'external',target:'identity',status:'established'},{source:'identity',target:'tenant',status:'established'},{source:'tenant',target:'auth',status:'established'},{source:'auth',target:'unrelated',status:'established'}]});
test('projection retains transitive external prerequisites and excludes unrelated downstream nodes',()=>{
 const u=buildUnitGraphs(unit(),snapshot(),'/repo');const g=u.artifactGraph.established;
 assert.deepEqual(g.nodes.map(n=>n.id),['auth','external','identity','tenant']);assert.deepEqual(g.nodes.filter(n=>n.external).map(n=>n.id),['external','identity']);assert.equal(g.edges.length,3);
});
test('combined fork/join connects task sinks to establishment and gates all dependent roots',()=>{
 const g=buildUnitGraphs(unit(),snapshot(),'/repo').implementationGraph;assert.equal(g.state,'available');assert.equal(g.nodes.filter(n=>n.kind==='task').length,6);assert.equal(g.nodes.filter(n=>n.kind==='gate').length,4);
 const tenantGate=g.nodes.find(n=>n.kind==='gate'&&n.artifact==='tenant');
 const roots=g.nodes.filter(n=>n.kind==='task'&&n.artifact==='auth'&&n.task.id!=='integration');
 assert.ok(roots.every(root=>g.edges.some(e=>e.source===tenantGate.id&&e.target===root.id&&e.kind==='establishment')));
 assert.ok(g.edges.some(e=>g.nodes.find(n=>n.id===e.source)?.artifact==='tenant'&&g.nodes.find(n=>n.id===e.source)?.task?.id==='integration'&&e.target===tenantGate.id));
 assert.equal(tenantGate.establishmentEvidence.state,'proposed');assert.ok(g.edges.filter(e=>e.kind==='task').every(e=>g.nodes.find(n=>n.id===e.source).artifact===g.nodes.find(n=>n.id===e.target).artifact));
});
test('empty and disconnected plans retain gates; unavailable and invalid components stay honest',()=>{
 const u=unit();u.members[0].taskGraph=graph([],[]);u.members[1].taskGraph=graph(['api','ui'],[]);let g=buildUnitGraphs(u,snapshot(),'/repo').implementationGraph;assert.equal(g.state,'available');assert.equal(g.nodes.filter(n=>n.kind==='task').length,2);
 u.members[0].taskGraph.state='unavailable';g=buildUnitGraphs(u,snapshot(),'/repo').implementationGraph;assert.equal(g.state,'unavailable');
 u.members[1].taskGraph.state='invalid';u.members[1].taskGraph.edges=[{source:'api',target:'ui'}];g=buildUnitGraphs(u,snapshot(),'/repo').implementationGraph;assert.equal(g.state,'invalid');assert.ok(!g.edges.some(e=>e.kind==='task'));
});
test('namespaces isolate equal local task IDs across members, units and worktrees',()=>{
 const first=buildUnitGraphs(unit(),snapshot(),'/repo').implementationGraph;const second=buildUnitGraphs({...unit(),id:'other'},snapshot(),'/repo').implementationGraph;const third=buildUnitGraphs(unit(),snapshot(),'/other').implementationGraph;
 const ids=[first,second,third].flatMap(g=>g.nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
});
test('member proposals modify only the planning projection and never invent membership edges',()=>{
 const u=unit(),s=snapshot(),files=new Map([['docs/artifacts/auth/changes/change-login/dependencies.yaml','artifact: auth\nadd: [external]\nremove: [tenant]']]);
 const g=buildUnitGraphs(u,s,'/repo',files);assert.ok(g.artifactGraph.established.edges.some(e=>e.source==='tenant'&&e.target==='auth'));assert.ok(!g.artifactGraph.planning.edges.some(e=>e.source==='tenant'&&e.target==='auth'));assert.ok(g.artifactGraph.planning.edges.some(e=>e.source==='external'&&e.target==='auth'));
 const disconnected=buildUnitGraphs(unit(),{artifacts:s.artifacts,edges:[]},'/repo');assert.deepEqual(disconnected.artifactGraph.established.edges,[]);assert.ok(!disconnected.implementationGraph.edges.some(e=>{const a=disconnected.implementationGraph.nodes.find(n=>n.id===e.source),b=disconnected.implementationGraph.nodes.find(n=>n.id===e.target);return a.artifact!==b.artifact;}));
});
test('artifact/combined cycles and missing prerequisites are diagnostic failures',()=>{
 const s=snapshot();s.edges.push({source:'auth',target:'tenant',status:'established'});let u=buildUnitGraphs(unit(),s,'/repo');assert.equal(u.implementationGraph.state,'invalid');assert.ok(u.implementationGraph.diagnostics.some(d=>d.code==='unit-implementation-cycle'));assert.ok(u.implementationGraph.edges.every(e=>e.kind==='task'));
 s.edges=[{source:'absent',target:'tenant',status:'established'}];u=buildUnitGraphs(unit(),s,'/repo');assert.equal(u.implementationGraph.state,'invalid');assert.ok(u.artifactGraph.established.nodes.some(n=>n.id==='absent'&&n.external));
});
