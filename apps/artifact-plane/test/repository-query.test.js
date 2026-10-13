import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,symlink,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,fingerprint,git} from './fixtures.js';
import {changeDeliveryFixture,unitPath} from './unit-fixtures.js';
import {queryRepository,validateQuery} from '../server/repository-query.js';
import {exploreRepository,gitMetrics} from '../server/reader.js';
test('overview defers bodies/publication; scoped graphs and conclusions match full evidence',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture()),before=await fingerprint(f.root);
 try{
  const count=gitMetrics.commands;const overview=await queryRepository({path:f.root,section:'overview'});
  assert(gitMetrics.commands-count<12);assert.equal(overview.data.unitsOfWork[0].completion.derivation,'not-loaded');assert(!JSON.stringify(overview).includes('Behavior checks passed.'));assert.equal(overview.data.workflow.worktrees[0].changes[0].loadState,'not-loaded');
  const full=await exploreRepository(f.root),unit=full.unitsOfWork[0];
  const graph=await queryRepository({path:f.root,section:'implementation',unit:'tenant-login'});
  assert.deepEqual(graph.data.implementationGraph.edges,unit.implementationGraph.edges);assert.equal(graph.data.implementationGraph.nodes.filter(n=>n.kind==='task').length,6);assert.equal(graph.data.completion.derivation,'not-loaded');assert(graph.data.implementationGraph.nodes.find(n=>n.kind==='task').task.signature);
  const complete=await queryRepository({path:f.root,section:'completion',unit:'tenant-login'});assert.deepEqual(complete.data.completion,unit.completion);
  const markdown=await queryRepository({path:f.root,section:'markdown',unit:'tenant-login',source:'docs/artifacts/authentication/changes/change-login/tasks/api.md'});assert.match(markdown.data.markdown,/Behavior checks passed/);
  const artifacts=await queryRepository({path:f.root,section:'artifacts',unit:'tenant-login'});assert.deepEqual(artifacts.data.artifactGraph.established.edges,unit.artifactGraph.established.edges);
  const workflow=await queryRepository({path:f.root,section:'workflow',unit:'tenant-login'});assert.deepEqual(workflow.data.members.map(m=>m.workflow.steps),unit.members.map(m=>m.workflow.steps));
  assert.deepEqual(await fingerprint(f.root),before);
  await writeFile(join(f.root,'docs/artifacts/authentication/changes/change-login/tasks/api.md'),'# Revised\n');
  const changed=await queryRepository({path:f.root,section:'completion',unit:'tenant-login'});assert.notEqual(changed.data.completion.derivation,'documented-complete');assert.notEqual(changed.revision,complete.revision);
 }finally{await f.cleanup();}
});
test('scoped sources and registered roots reject traversal, aliases and malformed queries',async()=>{
 for(const body of [{path:'/tmp',section:'unknown'},{path:'/tmp',section:'overview',unit:'x'},{path:'/tmp',section:'completion',artifact:'x',change:'change-x'},{path:'/tmp',section:'markdown',unit:'x',source:'../secret'},{path:'/tmp',section:'overview',surprise:true}])assert.throws(()=>validateQuery(body));
 const f=await fixtureRepository(changeDeliveryFixture());
 try{
  await assert.rejects(queryRepository({path:f.root,section:'overview',worktree:'/tmp'}),e=>e.status===422);
  await assert.rejects(queryRepository({path:f.root,section:'implementation',unit:'absent'}),e=>e.status===404);
  await assert.rejects(queryRepository({path:f.root,section:'markdown',unit:'tenant-login',source:'docs/artifacts/absent/README.md'}),e=>e.status===404);
  await writeFile(join(f.root,'docs/artifacts/authentication/changes/change-login/private.md'),'Not indexed knowledge');
  await assert.rejects(queryRepository({path:f.root,section:'markdown',unit:'tenant-login',source:'docs/artifacts/authentication/changes/change-login/private.md'}),e=>e.status===404);
  await symlink(join(f.root,unitPath),join(f.root,'docs/artifacts/authentication/changes/change-login/tasks/alias.md'));
  await assert.rejects(queryRepository({path:f.root,section:'markdown',unit:'tenant-login',source:'docs/artifacts/authentication/changes/change-login/tasks/alias.md'}),e=>e.status===422);
 }finally{await f.cleanup();}
});
test('registered worktree overviews load on demand and established artifact Markdown stays accessible',async()=>{
 const f=await fixtureRepository(changeDeliveryFixture()),other=f.root+'-other';git(f.root,'worktree','add','-qb','other',other);
 try{const initial=await queryRepository({path:f.root,section:'overview'});assert.equal(initial.data.workflow.worktrees.find(w=>w.path===other).loadState,'not-loaded');
 const selected=await queryRepository({path:f.root,worktree:other,section:'overview'});assert.equal(selected.worktree,other);assert.equal(selected.data.workflow.worktrees.find(w=>w.path===other).loadState,'loaded');
 const doc=await queryRepository({path:f.root,section:'markdown',artifact:'tenant',source:'docs/artifacts/tenant/README.md'});assert.match(doc.data.markdown,/# tenant/);
 }finally{git(f.root,'worktree','remove','--force',other);await f.cleanup();}
});
test('metadata overview preserves YAML dependency proposals and reference diagnostics',async()=>{
 const {sourceFixture}=await import('./fixtures.js');const f=await fixtureRepository(sourceFixture());
 try{const full=await exploreRepository(f.root),overview=await queryRepository({path:f.root,section:'overview'});assert.deepEqual(overview.data.edges,full.edges);assert.deepEqual(overview.data.references,full.references);assert(overview.data.edges.some(e=>e.status==='proposed-remove'));}finally{await f.cleanup();}
});
