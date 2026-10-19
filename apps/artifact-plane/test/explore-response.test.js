import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createAppServer} from '../server/http.js';import {exploreRepository} from '../server/reader.js';import {exploreResponse} from '../server/explore-response.js';
import {fixtureRepository,git,rootReadme} from './fixtures.js';import {unitFixture,unitBrief,unitPath} from './unit-fixtures.js';

const notLoadedArtifacts={state:'not-loaded',established:{nodes:[],edges:[]},planning:{nodes:[],edges:[]}};
const notLoadedImplementation={state:'not-loaded',nodes:[],edges:[],diagnostics:[]};
// Four unit briefs; each unit has two member changes with tasks and delivered versions.
function unitsFixture(){
 const files=unitFixture();
 for(let i=2;i<=4;i++){
  const path=`docs/artifacts/units-of-work/unit-${i}/README.md`;
  for(const [source,body] of [...files])if(/^docs\/artifacts\/(tenant|authentication)\//.test(source))files.set(source.replace(/^docs\/artifacts\/(tenant|authentication)\//,`docs/artifacts/$1-${i}/`),body);
  files.set(`docs/artifacts/tenant-${i}/README.md`,rootReadme(`tenant-${i}`,'1.0.0'));
  files.set(`docs/artifacts/authentication-${i}/README.md`,rootReadme(`authentication-${i}`,'1.0.0',[`tenant-${i}`]));
  files.set(path,unitBrief([[`tenant-${i}`,'change-login'],[`authentication-${i}`,'change-login']]).replace('unit_of_work: tenant-login',`unit_of_work: unit-${i}`).replace('docs/artifacts/authentication/versions',`docs/artifacts/authentication-${i}/versions`).replace(`${unitPath}#`,`${path}#`));
 }
 return files;
}

test('POST /api/explore omits on-demand unit data and grows by at most the selected worktree for each added worktree',async t=>{
 const f=await fixtureRepository(unitsFixture()),stateDir=await mkdtemp(join(tmpdir(),'artifact-plane-state-')),others=[];
 const server=createAppServer({stateDir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.runtime?.close();server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));for(const p of others)await rm(p,{recursive:true,force:true});await f.cleanup();await rm(stateDir,{recursive:true,force:true});});
 const explore=async()=>{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/explore`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:f.root})});const text=await response.text();return {status:response.status,bytes:Buffer.byteLength(text),body:JSON.parse(text)};};

 const one=await explore();assert.equal(one.status,200);assert.equal(one.body.workflow.worktrees.length,1);
 for(let i=1;i<=11;i++){const other=`${f.root}-worktree-${i}`;others.push(other);git(f.root,'worktree','add','-q','-b',`work-${i}`,other);}
 const twelve=await explore();assert.equal(twelve.status,200);assert.equal(twelve.body.workflow.worktrees.length,12);

 const {worktrees}=twelve.body.workflow,selected=worktrees.find(w=>w.selected);assert.equal(worktrees.filter(w=>w.selected).length,1);
 for(const worktree of worktrees){
  assert.equal(worktree.unitsOfWork.length,4);
  for(const unit of worktree.unitsOfWork){
   assert.deepEqual(unit.artifactGraph,notLoadedArtifacts);
   const records=unit.members.flatMap(m=>m.knowledge);assert.ok(records.length&&records.every(r=>typeof r.path==='string'));
   if(worktree.selected){assert.notEqual(unit.implementationGraph.state,'not-loaded');assert.ok(unit.implementationGraph.nodes.some(n=>n.kind==='task'));assert.ok(records.every(r=>typeof r.markdown==='string'));}
   else{assert.deepEqual(unit.implementationGraph,notLoadedImplementation);assert.ok(records.every(r=>!('markdown' in r)));}
  }
 }
 assert.deepEqual(twelve.body.unitsOfWork,selected.unitsOfWork);
 // ESA1: each added worktree adds at most the size of the selected worktree record.
 const selectedBytes=Buffer.byteLength(JSON.stringify(selected));
 assert.ok(twelve.bytes-one.bytes<=11*selectedBytes,`${twelve.bytes} - ${one.bytes} > 11 * ${selectedBytes}`);

 // The readers keep complete records, and the response view does not change them.
 const snapshot=await exploreRepository(f.root),before=JSON.stringify(snapshot);
 const unit=snapshot.workflow.worktrees.find(w=>!w.selected).unitsOfWork[0];
 assert.ok(unit.artifactGraph.established.nodes.length);assert.ok(unit.implementationGraph.nodes.length);assert.ok(unit.members.every(m=>m.knowledge.every(r=>typeof r.markdown==='string')));
 const view=exploreResponse(snapshot);assert.equal(JSON.stringify(snapshot),before);assert.ok(JSON.stringify(view).length<before.length);
});
