import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {parseUnitBrief,frontMatter,readUnitsOfWork} from '../server/units-of-work.js';
import {exploreRepository,scanRepository} from '../server/reader.js';
import {checklist} from "../server/workflow.js";
import {fixtureRepository,fingerprint,git,rootReadme} from './fixtures.js';
import {unitPath,unitBrief,unitFixture,unitTask,changeDeliveryFixture} from './unit-fixtures.js';
const codes=unit=>unit.diagnostics.map(d=>d.code);
test('published delivered versions and documented shared checks support completion without writes',async t=>{
 const fixture=await fixtureRepository(unitFixture());t.after(fixture.cleanup);
 const before=await fingerprint(fixture.root);const view=await exploreRepository(fixture.root);await exploreRepository(fixture.root);
 assert.equal(view.unitsOfWork.length,1);const unit=view.unitsOfWork[0];
 assert.equal(unit.completion.derivation,'documented-complete');assert.deepEqual(unit.diagnostics,[]);
 assert.ok(unit.members.every(m=>m.deliveredVersion==='1.0.0' && m.establishmentEvidence.state==='established'));
 assert.equal(unit.members[0].taskGraph.tasks.length,3);assert.ok(unit.evidence.every(e=>e.resolved));
 assert.deepEqual(await fingerprint(fixture.root),before);
});
test('historical provenance survives removed changes and newer current versions',async t=>{
 const files=unitFixture({retained:false});
 for(const a of ['tenant','authentication']){
  files.set(`docs/artifacts/${a}/README.md`,rootReadme(a,'2.0.0',a==='authentication'?['tenant']:[]));
  files.set(`docs/artifacts/${a}/versions/2.0.0/README.md`,'---\nsource_change: change-later\n---\n# Later');
  files.set(`docs/artifacts/${a}/versions/2.0.0/tasks/new.md`,unitTask('new'));
 }
 const f=await fixtureRepository(files);t.after(f.cleanup);
 const unit=(await exploreRepository(f.root)).unitsOfWork[0];
 assert.equal(unit.completion.derivation,'documented-complete');
 assert.ok(unit.members.every(m=>m.retainedChangePath===null && m.deliveredVersion==='1.0.0' && m.workflow===null));
});
test('branch-only publication stays proposed and missing protected refs stays unknown',async t=>{
 const f=await fixtureRepository(unitFixture({delivered:false}));t.after(f.cleanup);git(f.root,'switch','-qc','feature');
 for(const [p,body] of unitFixture({retained:false}))if(p.includes('/versions/')){await mkdir(join(f.root,p,'..'),{recursive:true});await writeFile(join(f.root,p),body);}
 git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=f@example.invalid','commit','-qm','proposed versions');
 let unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.completion.derivation,'incomplete');assert.ok(unit.members.every(m=>m.establishmentEvidence.state==='proposed'));
 git(f.root,'branch','-D','main');unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.completion.derivation,'unknown');
});
test('modified published snapshot and unavailable required merge evidence cannot claim completion',async t=>{
 const files=unitFixture();for(const [p,body]of files)files.set(p,body.replaceAll('All required knowledge and implementation changes are in this repository.',''));
 const f=await fixtureRepository(files);t.after(f.cleanup);
 let unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.completion.derivation,'unknown');assert.ok(unit.members.every(m=>m.establishmentEvidence.state==='unverified'));
 await writeFile(join(f.root,'docs/artifacts/tenant/versions/1.0.0/tasks/api.md'),unitTask('api')+'Changed knowledge.');
 unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.members[0].establishmentEvidence.state,'proposed');
});
test('protected refs that disagree are diagnosed as unknown',async t=>{
 const f=await fixtureRepository(unitFixture());t.after(f.cleanup);git(f.root,'switch','-qc','master');
 await writeFile(join(f.root,'docs/artifacts/tenant/versions/1.0.0/tasks/api.md'),unitTask('api')+'Contradictory protected knowledge.');
 git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=f@example.invalid','commit','-qm','different snapshot');
 const m=(await exploreRepository(f.root)).unitsOfWork[0].members[0];assert.equal(m.establishmentEvidence.state,'unknown');assert.match(m.establishmentEvidence.reasons.join(' '),/disagree/);
});
test('duplicate membership, missing members and ambiguous version claims remain visible',async t=>{
 const records=unitFixture();records.set('docs/artifacts/units-of-work/second/README.md',unitBrief().replace('unit_of_work: tenant-login','unit_of_work: second'));
 records.set('docs/artifacts/tenant/versions/1.1.0/README.md','---\nsource_change: change-login\n---\n# Duplicate');
 const f=await fixtureRepository(records);t.after(f.cleanup);const units=(await exploreRepository(f.root)).unitsOfWork;
 assert.equal(units.length,2);assert.ok(units.every(u=>codes(u).includes('duplicate-membership') && codes(u).includes('ambiguous-provenance') && u.completion.derivation==='unknown'));
 await rm(join(f.root,'docs/artifacts/authentication'),{recursive:true});assert.ok(codes((await exploreRepository(f.root)).unitsOfWork[0]).includes('missing-member'));
});
for(const [label,alter,code] of [
 ['duplicate YAML',s=>s.replace('unit_of_work: tenant-login','unit_of_work: tenant-login\nunit_of_work: second'),'invalid-unit'],
 ['malformed YAML',s=>s.replace('changes:','changes: ['),'invalid-unit'],
 ['unsafe member',s=>s.replace('artifact: tenant','artifact: ../outside'),'invalid-membership'],
 ['missing membership',s=>s.replace(/changes:[\s\S]*?acceptance:/,'changes: []\nacceptance:'),'invalid-membership'],
 ['duplicate criteria',s=>s.replace('id: integration','id: login'),'invalid-acceptance'],
 ['wrong integration type',s=>s.replace('integration: true','integration: yes'),'invalid-acceptance'],
 ['no integration criterion',s=>s.replace('integration: true','integration: false'),'missing-integration-criterion'],
 ['unknown evidence criterion',s=>s.replace('criterion: login\n    method:','criterion: absent\n    method:'),'invalid-evidence'],
 ['unsafe evidence',s=>s.replace('source: docs/artifacts/authentication/versions/1.0.0/tasks/api.md#evidence','source: docs/artifacts/../outside.md'),'invalid-evidence'],
 ['invalid result',s=>s.replace('result: passed','result: ready'),'invalid-evidence'],
])test(`invalid brief ${label}`,()=>assert.ok(codes(parseUnitBrief(unitPath,alter(unitBrief()))).includes(code)));
test('failed/incomplete checks, missing headings and mutable task evidence cannot support historical completion',async t=>{
 const f=await fixtureRepository(unitFixture());t.after(f.cleanup);
 for(const result of ['failed','incomplete']){await writeFile(join(f.root,unitPath),unitBrief().replace('result: passed',`result: ${result}`));assert.equal((await exploreRepository(f.root)).unitsOfWork[0].completion.derivation,'incomplete');}
 await writeFile(join(f.root,unitPath),unitBrief().replace('#evidence','#absent'));let unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.ok(codes(unit).includes('missing-evidence'));assert.equal(unit.completion.derivation,'unknown');
 await writeFile(join(f.root,unitPath),unitBrief().replace('/versions/1.0.0/tasks/api.md','/changes/change-login/tasks/api.md'));unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.completion.derivation,'incomplete');
});
test('reserved directory is never an artifact and escaping evidence symlinks are not read',async t=>{
 const files=unitFixture();files.set('docs/artifacts/units-of-work/README.md','# Outcome index');const f=await fixtureRepository(files);const outside=await fixtureRepository(new Map([['secret.md','Private evidence']]));t.after(f.cleanup);t.after(outside.cleanup);
 await symlink(join(outside.root,'secret.md'),join(f.root,'docs/artifacts/units-of-work/tenant-login/outside.md'));
 await writeFile(join(f.root,unitPath),unitBrief().replace('docs/artifacts/authentication/versions/1.0.0/tasks/api.md#evidence','docs/artifacts/units-of-work/tenant-login/outside.md'));
 const view=await exploreRepository(f.root);assert.ok(!view.artifacts.some(a=>a.id==='units-of-work'));assert.ok(codes(view.unitsOfWork[0]).includes('missing-evidence'));assert.ok(view.diagnostics.some(d=>d.code==='unsafe-path'));assert.ok(!JSON.stringify(view).includes('Private evidence'));
});
test('legacy repositories and provenance-free versions do not gain invented units or origins',async t=>{
 const files=unitFixture();files.delete(unitPath);const f=await fixtureRepository(files);t.after(f.cleanup);assert.deepEqual((await exploreRepository(f.root)).unitsOfWork,[]);
 await mkdir(join(f.root,unitPath,".."),{recursive:true});await writeFile(join(f.root,unitPath),unitBrief());for(const a of ['tenant','authentication'])await writeFile(join(f.root,`docs/artifacts/${a}/versions/1.0.0/README.md`),'# Legacy');
 const unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.ok(unit.members.every(m=>m.deliveredVersion===null));assert.equal(unit.completion.derivation,'incomplete');
});
test('worktree membership and mutable files stay isolated',async t=>{
 const f=await fixtureRepository(unitFixture());const other=`${f.root}-other`;git(f.root,'worktree','add','-b','other',other);t.after(async()=>{git(f.root,'worktree','remove','--force',other);await f.cleanup();});
 await writeFile(join(other,unitPath),unitBrief([['tenant','change-login']],false));
 const before=await fingerprint(f.root),otherBefore=await fingerprint(other);const view=await exploreRepository(f.root);const worktrees=view.workflow.worktrees;
 assert.equal(worktrees.find(w=>w.selected).unitsOfWork[0].members.length,2);assert.equal(worktrees.find(w=>!w.selected).unitsOfWork[0].members.length,1);
 assert.deepEqual(await fingerprint(f.root),before);assert.deepEqual(await fingerprint(other),otherBefore);
});

test('duplicate member rows retain readable knowledge without duplicate node identities',async t=>{
 const records=unitFixture();records.set(unitPath,unitBrief([['tenant','change-login'],['tenant','change-login'],['authentication','change-login']]));const f=await fixtureRepository(records);t.after(f.cleanup);const unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.members.length,2);assert.ok(codes(unit).includes('invalid-membership'));assert.equal(unit.implementationGraph.state,'invalid');assert.ok(unit.implementationGraph.edges.every(e=>e.kind==='task'));assert.equal(new Set(unit.implementationGraph.nodes.map(n=>n.id)).size,unit.implementationGraph.nodes.length);
});

test('member-scoped review evidence supports published versions but cannot establish branch-only knowledge',async t=>{
 const files=unitFixture();for(const [p,body]of files)files.set(p,body.replaceAll('All required knowledge and implementation changes are in this repository.',''));files.set(unitPath,files.get(unitPath)+'\n## Publication review\n\ntenant 1.0.0: All required knowledge and implementation changes have landed on main.\n\nauthentication 1.0.0: All required knowledge and implementation changes have landed on main.\n');const f=await fixtureRepository(files);t.after(f.cleanup);let unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.completion.derivation,'documented-complete');assert.ok(unit.members.every(m=>m.establishmentEvidence.sources.some(s=>s.kind==='documented-merge-review')));git(f.root,'switch','-qc','proposed');await writeFile(join(f.root,'docs/artifacts/tenant/versions/1.0.0/tasks/api.md'),unitTask('api')+'Proposed difference');unit=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(unit.members[0].establishmentEvidence.state,'proposed');assert.equal(unit.completion.derivation,'incomplete');
});

test('change-owned delivery resolves exact task identities, shared evidence and published history without writes',async t=>{
 const files=changeDeliveryFixture();
 for(const a of ['tenant','authentication']){
  const p=`docs/artifacts/${a}/changes/change-next/`;
  files.set(`${p}README.md`,'# Next');files.set(`${p}tasks/README.md`,'---\ntasks: [new.md]\n---\n# New plan');files.set(`${p}tasks/new.md`,unitTask('new'));
 }
 const f=await fixtureRepository(files);t.after(f.cleanup);const before=await fingerprint(f.root),view=await exploreRepository(f.root),u=view.unitsOfWork[0];
 assert.equal(u.completion.derivation,'documented-complete');assert.deepEqual(u.diagnostics,[]);
 for(const m of u.members){assert.equal(m.deliveryPath,`docs/artifacts/${m.artifact}/changes/change-login/`);assert.match(m.sourcePath,/versions\/1.0.0\/$/);assert.deepEqual(m.taskGraph.tasks.map(t=>t.id).sort(),['api','integration','ui']);assert.ok(m.taskGraph.tasks.every(t=>t.path.startsWith(m.deliveryPath)));assert.equal(m.workflow.history,true);assert.equal(m.workflow.currentStep,null);assert.ok(m.workflow.steps.find(s=>s.name==='Version preparation').commits.length);}
 assert.ok(u.evidence.every(e=>e.deliveredSource));assert.deepEqual(await fingerprint(f.root),before);
});
for(const mutation of ['modified','deleted','added','membership','branch'])test(`change-owned ${mutation} task evidence cannot establish delivery`,async t=>{
 const f=await fixtureRepository(changeDeliveryFixture());t.after(f.cleanup);
 const p='docs/artifacts/authentication/changes/change-login/tasks/';
 if(mutation==='deleted')await rm(join(f.root,p,'ui.md'));
 else if(mutation==='added')await writeFile(join(f.root,p,'extra.md'),unitTask('extra'));
 else if(mutation==='membership')await writeFile(join(f.root,p,'README.md'),'---\ntasks: [api.md]\n---\n# Changed plan');
 else await writeFile(join(f.root,p,'api.md'),unitTask('api')+'\nDifferent evidence.\n');
 if(mutation==='branch'){git(f.root,'switch','-qc','branch');git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=f@example.invalid','commit','-qm','branch evidence');}
 const u=(await exploreRepository(f.root)).unitsOfWork[0],m=u.members.find(m=>m.artifact==='authentication');assert.notEqual(u.completion.derivation,'documented-complete');assert.equal(m.establishmentEvidence.state,'proposed');assert.equal(u.evidence[0].deliveredSource,false);
});
for(const marker of ['other','../change-login','null','[change]'])test(`invalid delivery marker ${marker} never falls back`,async t=>{
 const files=changeDeliveryFixture();const p='docs/artifacts/authentication/versions/1.0.0/README.md';files.set(p,files.get(p).replace('delivery_tasks: change',`delivery_tasks: ${marker}`));const f=await fixtureRepository(files);t.after(f.cleanup);const u=(await exploreRepository(f.root)).unitsOfWork[0];assert.ok(codes(u).includes('invalid-delivery-marker'));assert.equal(u.members[1].taskGraph.state,'unavailable');assert.equal(u.completion.derivation,'unknown');
});
test('missing retained source and missing retained plan never use newer tasks',async t=>{
 for(const missing of ['tasks/README.md','']){const f=await fixtureRepository(changeDeliveryFixture());t.after(f.cleanup);await rm(join(f.root,'docs/artifacts/authentication/changes/change-login',missing),{recursive:true});const u=(await exploreRepository(f.root)).unitsOfWork[0];assert.ok(codes(u).includes('missing-delivery-source'));assert.equal(u.completion.derivation,'unknown');assert.equal(u.members[1].deliveryPath,null);}
});
test('conflicting retained tasks on protected refs remain unknown',async t=>{
 const f=await fixtureRepository(changeDeliveryFixture());t.after(f.cleanup);git(f.root,'switch','-qc','master');await writeFile(join(f.root,'docs/artifacts/authentication/changes/change-login/tasks/ui.md'),unitTask('ui')+'Conflict');git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=f@example.invalid','commit','-qm','different tasks');const u=(await exploreRepository(f.root)).unitsOfWork[0];assert.equal(u.members[1].establishmentEvidence.state,'unknown');assert.equal(u.completion.derivation,'unknown');
});
test('unavailable publication, missing marker/source and invalid retained metadata cannot establish delivery',async t=>{
 const f=await fixtureRepository(changeDeliveryFixture());t.after(f.cleanup);
 const p='docs/artifacts/authentication/versions/1.0.0/README.md';
 await writeFile(join(f.root,p),'---\nsource_change: change-login\n---\n# Legacy layout without copied tasks');let u=(await exploreRepository(f.root)).unitsOfWork[0];assert.notEqual(u.completion.derivation,'documented-complete');assert.match(u.members[1].deliveryPath,/versions\/1.0.0/);
 await writeFile(join(f.root,p),'---\ndelivery_tasks: change\n---\n# Missing source');u=(await exploreRepository(f.root)).unitsOfWork[0];assert.ok(codes(u).includes('invalid-provenance'));assert.equal(u.completion.derivation,'unknown');
 const data=await scanRepository(f.root);const units=await readUnitsOfWork(f.root,data,[],async()=>{throw Error('Git unavailable');},checklist);assert.equal(units[0].completion.derivation,'unknown');
 const files=changeDeliveryFixture();files.set('docs/artifacts/authentication/changes/change-login/tasks/README.md','---\ntasks: [absent.md]\n---\n# Broken published plan');const bad=await fixtureRepository(files);t.after(bad.cleanup);u=(await exploreRepository(bad.root)).unitsOfWork[0];assert.ok(codes(u).includes('invalid-delivery-plan'));assert.equal(u.completion.derivation,'unknown');
});
test('retained evidence bytes remain distinct even when invalid UTF-8 decodes alike',async t=>{
 const files=changeDeliveryFixture(),p='docs/artifacts/authentication/changes/change-login/tasks/api.md';files.set(p,Buffer.concat([Buffer.from(unitTask('api')),Buffer.from([0xff])]));const f=await fixtureRepository(files);t.after(f.cleanup);await writeFile(join(f.root,p),unitTask('api')+'\uFFFD');const u=(await exploreRepository(f.root)).unitsOfWork[0];assert.notEqual(u.completion.derivation,'documented-complete');assert.equal(u.members[1].establishmentEvidence.state,'proposed');
});
test('ungrouped invalid delivery markers are diagnostic and publication failures keep history uncertain',async t=>{
 const files=changeDeliveryFixture();files.delete(unitPath);const p='docs/artifacts/authentication/versions/1.0.0/README.md';files.set(p,files.get(p).replace('delivery_tasks: change','delivery_tasks: elsewhere'));const f=await fixtureRepository(files);t.after(f.cleanup);let view=await exploreRepository(f.root);assert.ok(view.diagnostics.some(d=>d.code==='invalid-delivery-marker'));assert.ok(view.workflow.worktrees[0].diagnostics.some(d=>d.code==='invalid-delivery-marker'));
 await writeFile(join(f.root,p),files.get(p).replace('elsewhere','change'));await writeFile(join(f.root,'docs/artifacts/authentication/changes/change-login/tasks/api.md'),unitTask('api')+'Modified');view=await exploreRepository(f.root);const change=view.workflow.worktrees[0].changes.find(c=>c.artifact==='authentication'&&c.name==='change-login');assert.equal(change.history,false);assert.ok(view.workflow.worktrees[0].diagnostics.some(d=>d.code==='delivery-publication-unverified'));
});
