import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,rm,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createImpactService,validateQuery,affectedExports,knowledgeTerms,changedSections,compactText} from '../server/impact.js';
import {readFlowRepository} from '../server/flow-reader.js';
import {impactRepository} from './impact-fixtures.js';
import {git} from './fixtures.js';

const service=(f,extra={})=>{const s=createImpactService({stateDir:f.stateDir,...extra});return s;};
const names=items=>items.map(i=>i.entity);
const flowSteps=(r,flow)=>(r.data.direct.concat(r.data.transitive).find(i=>i.entity===flow)?.steps||[]).map(s=>s.step).sort();

test('validation rejects unknown fields, missing or doubled modes and bad limits',()=>{
  assert.throws(()=>validateQuery({path:'/r',origins:[{path:'a'}],extra:1}),{status:400});
  assert.throws(()=>validateQuery({path:'r',origins:[{path:'a'}]}),{status:400});
  assert.throws(()=>validateQuery({path:'/r'}),{status:422});
  assert.throws(()=>validateQuery({path:'/r',origins:[{path:'a'}],commit:'abc'}),{status:422});
  assert.throws(()=>validateQuery({path:'/r',origins:[{path:'a',flow:'b'}]}),{status:422});
  assert.throws(()=>validateQuery({path:'/r',origins:[{path:'a'}],depth:5}),{status:422});
  assert.throws(()=>validateQuery({path:'/r',commit:'--output=x'}),{status:422});
  assert.throws(()=>validateQuery({path:'/r',diff:{base:'x',other:1}}),{status:422});
  const ok=validateQuery({path:'/r',diff:{}});assert.equal(ok.depth,2);assert.equal(ok.budget,8000);assert.equal(ok.limit,25);assert.equal(ok.format,'json');
});

test('affected exports follow the in-module closure and module-level effects',()=>{
  const decls=[{name:'helper',exported:false,exportNames:[],mentions:['imported']},{name:'api',exported:true,exportNames:[],mentions:['helper']},{name:'other',exported:true,exportNames:[],mentions:[]},{name:'(export list)',exported:true,exportNames:[{local:'helper',exported:'h'}],mentions:['helper']}];
  assert.deepEqual([...affectedExports(decls,new Set(['imported']))].sort(),['api','h']);
  assert.deepEqual([...affectedExports(decls,new Set(['nothing']))],[]);
  assert.deepEqual([...affectedExports(decls,new Set(['*']))],['*']);
  assert.deepEqual([...affectedExports([...decls,{name:'(statement)',exported:false,exportNames:[],mentions:['imported']}],new Set(['imported']))],['*']);
  assert.deepEqual([...affectedExports(null,new Set(['x']))],['*']);
  assert.deepEqual(knowledgeTerms('---\nmodels: []\n---\nUse `entry_steps` and snake_case and camelCase here.').sort(),['camelCase','entry_steps','models','snake_case']);
  assert.deepEqual(changedSections('# A\n\ntext\n\n## B\n\nmore\n',new Set([3,7])),['A','B']);
});

test('declared and derived rules: references, supports by kind, models, imports with symbols, mirrors, prerequisites',async t=>{
  const f=await impactRepository();t.after(f.cleanup);const s=service(f,{index:undefined});t.after(()=>s.close());
  // A changed contract element: reference, step supports, model sources, prerequisite without reference.
  let r=await s.query({path:f.root,origins:[{element:'a:specifications/contract.md'}]});
  assert.equal(r.freshness,'fresh');
  assert.ok(names(r.data.direct).includes('docs/artifacts/b/specifications/consumer.md'),'reference consumer is direct');
  assert.deepEqual(flowSteps(r,'flow:a:login'),['check'],'only the citing step is affected');
  assert.ok(names(r.data.transitive).includes('flow:b:report'),'the referencing element supports a step of report');
  assert.ok(names(r.data.direct).includes('model:a:identity'),'a model declared in the element is direct');
  assert.ok(r.data.unresolved.some(u=>u.entity==='artifact:c'&&/declares no reference/.test(u.reason)),'prerequisite without reference is unresolved');
  assert.ok(!r.data.unresolved.some(u=>u.entity==='artifact:b'));
  assert.ok(r.data.declared&&r.data.declared.unit==='outcome');
  assert.deepEqual(r.data.declared.declared_not_reached,['a:ghost']);
  assert.ok(r.data.declared.reached_not_declared.includes('b:report'));
  const login=r.data.direct.find(i=>i.entity==='flow:a:login');
  assert.equal(login.strength,'declared+documented');assert.ok(login.paths[0].some(e=>e.via==='supports'&&e.reason==='Define the identity rules.'));
  assert.ok(r.data.potential.some(p=>p.entity==='src/vocab.js'&&p.strength==='lexical'),'shared contract vocabulary is potential');
  // A model source element reaches the model and then the participating flow.
  r=await s.query({path:f.root,origins:[{path:'docs/artifacts/a/specifications/identity.md'}]});
  assert.ok(names(r.data.direct).includes('model:a:identity'));assert.ok(names(r.data.transitive).includes('flow:a:login'));
  // Imports with symbols: only importers of affected exports; closure through a re-export; test support goes to Verify.
  r=await s.query({path:f.root,origins:[{path:'src/util.js',symbols:['helper']}]});
  assert.ok(names(r.data.direct).includes('src/check.js'));
  const check=r.data.direct.find(i=>i.entity==='src/check.js');assert.deepEqual(check.affected_exports,['check']);assert.equal(check.strength,'static+symbol');
  assert.ok(names(r.data.transitive).includes('src/index.js'),'re-export is transitive');
  assert.ok(!names(r.data.direct).concat(names(r.data.transitive)).includes('src/only-unrelated.js'),'importer of an unrelated export is excluded');
  assert.ok(r.data.verify.some(v=>v.test==='test/check.test.js'&&v.flow==='flow:a:login'),'test support is verification');
  assert.ok(!r.data.steps.some(st=>st.entity==='step:a:login:check'&&st.hops===1),'the test support does not make the step direct');
  const loginSteps=r.data.direct.concat(r.data.transitive).find(i=>i.entity==='flow:a:login').steps;
  assert.deepEqual(loginSteps.map(s=>s.step+':'+s.hops).sort(),['audit:1','check:2','issue:2'],'audit through its helper support, check and issue through check.js');
  assert.equal(r.data.coverage.symbol_level,'JS top-level declarations and their in-file closure');
  // Depth 3 reaches app.js through index.js; depth 2 reports the frontier.
  const deeper=await s.query({path:f.root,origins:[{path:'src/util.js',symbols:['helper']}],depth:3});
  assert.ok(names(deeper.data.transitive).includes('src/app.js'));assert.ok(r.data.coverage.frontier>0);
  // Implementation support with a symbol not among the changed declarations is potential.
  r=await s.query({path:f.root,origins:[{path:'src/check.js',symbols:['unrelated']}]});
  assert.ok(r.data.potential.some(p=>p.entity==='step:a:login:check'&&/declared symbol check/.test(p.evidence.note)));
  assert.ok(names(r.data.direct).includes('src/only-unrelated.js'));
  // A bare import (stylesheet) is file level.
  r=await s.query({path:f.root,origins:[{path:'src/styles.css'}]});
  assert.ok(names(r.data.direct).includes('src/main.jsx'));
  // Mirrors: one hop from a changed file only; a dirty copy is diverged.
  r=await s.query({path:f.root,origins:[{path:'docs/bundle/page.md'}]});
  assert.ok(names(r.data.direct).includes('mirror/page.md'));assert.equal(r.data.direct.find(i=>i.entity==='mirror/page.md').paths[0][0].sameBytes,true);
  await f.write('docs/bundle/page.md','# Page\n\nDiverged.\n');
  r=await s.query({path:f.root,origins:[{path:'docs/bundle/page.md'}]});
  assert.ok(r.diagnostics.some(d=>d.code==='mirror-diverged'&&d.path==='mirror/page.md'));
  // History: pairs above the thresholds are potential; a single co-change and bulk commits are not.
  r=await s.query({path:f.root,origins:[{path:'hist/a.js'}]});
  assert.ok(r.data.potential.some(p=>p.entity==='hist/b.js'&&p.strength==='historical'&&p.evidence.confidence===0.75));
  assert.ok(!r.data.potential.some(p=>p.entity==='hist/c.js'));
  // Transitions never propagate: issue is reached only through its own support.
  r=await s.query({path:f.root,origins:[{step:'a:login:issue'}]});
  assert.ok(!r.data.steps.some(st=>st.entity==='step:a:login:check'));
});

test('origins from commits, ranges and the protected difference carry declarations, sections, renames and deletions',async t=>{
  const f=await impactRepository();t.after(f.cleanup);const s=service(f);t.after(()=>s.close());
  await f.write('src/util.js','export function helper(){return 10;}\nexport function other(){return 2;}\n');f.commit('change helper');
  const head=git(f.root,'rev-parse','HEAD');
  let r=await s.query({path:f.root,commit:head});
  assert.deepEqual(r.data.changed.map(c=>[c.path,c.status,c.symbols]),[['src/util.js','modified',['helper']]]);
  assert.ok(names(r.data.direct).includes('src/check.js'));
  r=await s.query({path:f.root,origins:[{path:'src/util.js',commit:head}]});
  assert.deepEqual(r.data.changed[0].symbols,['helper']);
  await rename(join(f.root,'src/vocab.js'),join(f.root,'src/vocab2.js'));await rm(join(f.root,'src/broken.js'));f.commit('rename and delete');
  r=await s.query({path:f.root,range:head+'..HEAD'});
  const renamed=r.data.changed.find(c=>c.path==='src/vocab2.js');assert.equal(renamed.status,'renamed');assert.equal(renamed.from,'src/vocab.js');
  r=await s.query({path:f.root,origins:[{path:'src/broken.js'}]});
  assert.ok(r.data.unresolved.some(u=>u.entity==='src/broken.js'&&/deleted in/.test(u.reason)));
  r=await s.query({path:f.root,origins:[{path:'src/never.js'}]});
  assert.ok(r.data.unresolved.some(u=>u.entity==='src/never.js'&&/not tracked/.test(u.reason)));
  git(f.root,'checkout','-q','-b','feature');
  await f.write('docs/artifacts/a/specifications/contract.md','---\nmodels:\n  - id: identity\n    title: Identity\n    description: The identity of a member.\n    sources: [specifications/identity.md]\n---\n# Contract\n\n## Rules\n\nThe identity_format changed.\n\n## New section\n\nAdded `new_rule`.\n');
  r=await s.query({path:f.root,diff:{base:'protected'}});
  const changed=r.data.changed.find(c=>c.path==='docs/artifacts/a/specifications/contract.md');
  assert.deepEqual(changed.sections,['Rules','New section']);assert.ok(changed.terms>0);
  assert.ok(names(r.data.direct).includes('docs/artifacts/b/specifications/consumer.md'));
  r=await s.query({path:f.root,origins:[{flow:'a:missing'},{model:'a:nothing'},{element:'z:specifications/x.md'}]});
  assert.equal(r.data.unresolved.length,3);assert.equal(r.data.direct.length,0);
});

test('stale input, limits, budget, text format and the envelope',async t=>{
  const f=await impactRepository();t.after(f.cleanup);
  let touched=false;
  const loader=async(root,options)=>{const record=await readFlowRepository(root,options);if(!touched){touched=true;await writeFile(join(root,'src/util.js'),'export function helper(){return 99;}\n');}return record;};
  const s=createImpactService({stateDir:f.stateDir,loader});t.after(()=>s.close());
  let r=await s.query({path:f.root,origins:[{path:'src/util.js'}]});
  assert.equal(r.freshness,'stale');assert.equal(r.completeness,'partial');assert.ok(r.diagnostics.some(d=>d.code==='stale-response'));
  r=await s.query({path:f.root,origins:[{path:'src/util.js'}],limit:1,format:'text',budget:300});
  assert.ok(r.omissions.some(o=>o.section==='direct'&&o.shown===1&&o.total>=2));
  assert.ok(r.text.startsWith('Changed: src/util.js'));assert.ok(r.text.length<=300&&r.text.endsWith('… (cut to budget)'));
  for(const key of ['repository','worktree','context','revision','generation','freshness','completeness','data','diagnostics','omissions'])assert.ok(key in r,key);
  for(const key of ['changed','direct','transitive','steps','verify','investigate','potential','potential_total','unresolved','declared','coverage'])assert.ok(key in r.data,key);
  for(const key of ['sources_used','not_analyzed','depth','frontier','symbol_level','history_window','freshness','completeness'])assert.ok(key in r.data.coverage,key);
  const full=compactText(r,100000);
  for(const section of ['Direct','Transitive','Verify','Potential (confirm before acting)','Investigate','Unresolved','Coverage'])assert.ok(full.includes(section),section);
  await assert.rejects(s.query({path:join(f.root,'src'),origins:[{path:'x'}]}),{status:422});
  await assert.rejects(s.query({path:f.root,worktree:'/nonexistent/worktree',origins:[{path:'x'}]}),{status:422});
  const restricted=createImpactService({stateDir:f.stateDir,roots:['/some/other/root']});t.after(()=>restricted.close());
  await assert.rejects(restricted.query({path:f.root,origins:[{path:'x'}]}),{status:403});
});

test('investigate lists the code supports of affected steps that were not reached, ranked by hops',async t=>{
  const f=await impactRepository();t.after(f.cleanup);const s=service(f);t.after(()=>s.close());
  const r=await s.query({path:f.root,origins:[{element:'a:specifications/contract.md'}]});
  assert.ok(r.data.investigate.some(i=>i.entity==='src/check.js'&&i.for_step==='step:a:login:check'&&i.symbol==='check'));
  assert.ok(r.data.verify.some(v=>v.test==='test/check.test.js'&&v.step==='check'),'a test support of an affected step is verification');assert.ok(!r.data.investigate.some(i=>i.entity==='test/check.test.js'));
  const ranks=r.data.direct.map(i=>i.tier);assert.ok(ranks.every(x=>x==='direct'));
});
