import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir,symlink,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {stringify} from 'yaml';
import {parseFlow,buildFlowGraph,flowImpact,safeFlowSource} from '../server/flow-model.js';
import {readFlowRepository} from '../server/flow-reader.js';
import {buildSnapshot} from '../src/model.js';
import {parseUnitBrief} from '../server/units-of-work.js';
import {fixtureRepository,rootReadme,git,fingerprint} from './fixtures.js';

export const flowFixture = (id='login',extra={}) => ({id,artifact:'tenant',title:'Tenant login',trigger:'A member signs in.',outcome:'A session is issued or denied.',entry_steps:['check'],steps:[{id:'check',title:'Check identity',supports:['identity']},{id:'issue',title:'Issue session',supports:['identity']}],transitions:[{from:'check',to:'issue',condition:'Identity is valid.'},{from:'issue',to:'check',condition:'Recheck requested.'}],support:[{id:'identity',kind:'element',artifact:'tenant',element:'specifications/identity.md',requires:'Use tenant identity rules.',basis:'documented'}],...extra});
export const flowMarkdown = flow => '---\n'+stringify({flow})+'---\n# '+flow.title+'\n';
export function flowFiles() {
  return new Map([
    ['docs/artifacts/tenant/README.md',rootReadme('Tenant','1.0.0')],
    ['docs/artifacts/tenant/versions/1.0.0/README.md','# Tenant 1.0.0'],
    ['docs/artifacts/tenant/versions/1.0.0/specifications/identity.md','# Identity\nTenant identifiers are stable.'],
    ['docs/artifacts/tenant/versions/1.0.0/specifications/flows/login.md',flowMarkdown(flowFixture())],
    ['docs/artifacts/tenant/versions/1.0.0/specifications/flows/reporting.md',flowMarkdown(flowFixture('reporting',{title:'Tenant reports'}))],
    ['docs/artifacts/dag.yaml','artifacts:\n  tenant: {path: tenant, depends_on: []}\n'],
  ]);
}
test('shared elements, joins, loops and disconnected flows are knowledge, not execution DAGs',()=>{
 const graph=buildFlowGraph(buildSnapshot(flowFiles()),{context:'/repo',knowledge:'established'});
 assert.equal(graph.flows.length,2);assert.equal(graph.diagnostics.length,0);
 assert.equal(graph.nodes.filter(n=>n.kind==='element'&&n.title==='specifications/identity.md').length,1);
 const result=flowImpact(graph,['docs/artifacts/tenant/versions/1.0.0/specifications/identity.md']);
 assert.deepEqual(result.flows.map(f=>f.localId),['login','reporting']);
 assert.equal(result.unresolved.length,0);assert.ok(result.flows.every(f=>f.impactPath.some(e=>e.reason)));
});
test('same-owner source resolution and context IDs keep proposed and worktree knowledge separate',()=>{
 const files=flowFiles();files.set('docs/artifacts/tenant/changes/change-login/README.md','# Login');
 files.set('docs/artifacts/tenant/changes/change-login/specifications/identity.md','# Changed identity');
 files.set('docs/artifacts/tenant/changes/change-login/specifications/flows/login.md',flowMarkdown(flowFixture()));
 const snapshot=buildSnapshot(files),a=buildFlowGraph(snapshot,{context:'/a'}),b=buildFlowGraph(snapshot,{context:'/b'});
 const f=a.flows.find(f=>f.localId==='login');assert.equal(f.source,'change:change-login');
 assert.ok(f.support[0].targetId.includes('change:change-login'));assert.notEqual(f.id,b.flows.find(f=>f.localId==='login').id);
 assert.equal(buildFlowGraph(snapshot,{knowledge:'established'}).flows.find(f=>f.localId==='login').source,'version:1.0.0');
 const all=buildFlowGraph(snapshot,{knowledge:'all'});assert.equal(all.flows.length,3);assert.equal(new Set(all.flows.map(f=>f.id)).size,3);
});
for(const [name,mutate] of [
 ['owner',f=>({...f,artifact:'wrong'})],['duplicate step',f=>({...f,steps:[f.steps[0],f.steps[0]]})],
 ['entry',f=>({...f,entry_steps:['missing']})],['transition',f=>({...f,transitions:[{from:'check',to:'missing'}]})],
 ['support endpoint',f=>({...f,steps:[{id:'check',title:'Check',supports:['missing']}]})],
 ['basis',f=>({...f,support:[{...f.support[0],basis:'verified'}]})],
 ['unsafe source',f=>({...f,support:[{id:'identity',kind:'implementation',path:'../outside.js',requires:'code',basis:'static'}]})],
 ['observed without evidence',f=>({...f,support:[{...f.support[0],basis:'observed'}]})],
 ['ambiguous proposed',f=>({...f,support:[{...f.support[0],status:'proposed'}]})],
])test('invalid flow diagnoses '+name,()=>{
 const element={id:'e',artifact:'tenant',source:'version:1.0.0',path:'specifications/flows/login.md',file:'flow.md',markdown:flowMarkdown(mutate(flowFixture()))};
 assert.equal(parseFlow(element).state,'invalid');
});
test('duplicate YAML keys and aliases cannot become valid graph inputs',()=>{
 const e={artifact:'tenant',source:'version:1.0.0',path:'specifications/flows/login.md',file:'f.md',markdown:'---\nflow: {}\nflow: {}\n---\n'};
 assert.equal(parseFlow(e).state,'invalid');e.markdown='---\nflow: &f\n  id: *f\n---\n';assert.equal(parseFlow(e).state,'invalid');
});
test('source guards deny metadata/credential paths while allowing token specifications',()=>{
 for(const path of ['.git/config','.aws/credentials','/tmp/code.js','src/../code.js','src/code\\x.js','credentials.json','src/.env.js'])assert.equal(safeFlowSource(path),false,path);
 assert.equal(safeFlowSource('specifications/tokens.md'),true);assert.equal(safeFlowSource('.github/workflows/ci.yml'),true);
});
test('unit flow assessment is additive and empty assessments need an explanation',()=>{
 const path='docs/artifacts/units-of-work/login/README.md';const data={unit_of_work:'login',changes:[{artifact:'tenant',change:'change-login'}],acceptance:[{id:'login',criterion:'Sign in.'}]};
 assert.equal(parseUnitBrief(path,'---\n'+stringify(data)+'---\n').diagnostics.length,0);
 const withFlows={...data,affected_flows:[],flow_assessment:'Documentation-only change.'};
 assert.equal(parseUnitBrief(path,'---\n'+stringify(withFlows)+'---\n').diagnostics.length,0);
 delete withFlows.flow_assessment;assert.ok(parseUnitBrief(path,'---\n'+stringify(withFlows)+'---\n').diagnostics.some(d=>d.code==='invalid-flow-assessment'));
});
test('reader preserves bytes, checks tracked sources and refuses symlink escapes',async t=>{
 const files=flowFiles(),flow=flowFixture();flow.support=[{id:'identity',kind:'implementation',path:'src/identity.js',requires:'Check identity.',basis:'static'}];
 files.set('src/identity.js','export function identity() {}\n');files.set('docs/artifacts/tenant/versions/1.0.0/specifications/flows/login.md',flowMarkdown(flow));
 const fixture=await fixtureRepository(files);t.after(fixture.cleanup);const before=await fingerprint(fixture.root);
 const first=await readFlowRepository(fixture.root,{knowledge:'established'});assert.ok(first.sources.some(s=>s.path==='src/identity.js'));assert.deepEqual(await fingerprint(fixture.root),before);
 await writeFile(join(fixture.root,'src/identity.js'),'export function changed() {}\n');assert.notEqual((await readFlowRepository(fixture.root)).revision,first.revision);
 const outside=await mkdtemp(join(tmpdir(),'flow-source-'));t.after(()=>rm(outside,{recursive:true,force:true}));await writeFile(join(outside,'private.js'),'DO NOT EXPOSE');
 await rm(join(fixture.root,'src/identity.js'));await symlink(join(outside,'private.js'),join(fixture.root,'src/identity.js'));
 const escaped=await readFlowRepository(fixture.root);assert.ok(escaped.graph.diagnostics.some(d=>d.code==='unavailable-flow-source'));assert.ok(!JSON.stringify(escaped).includes('DO NOT EXPOSE'));
});

test('established flow selection uses protected declarations and flags modified source bytes',async t=>{
 const fixture=await fixtureRepository(flowFiles());t.after(fixture.cleanup);
 await writeFile(join(fixture.root,'docs/artifacts/tenant/README.md'),rootReadme('Tenant','2.0.0'));
 await mkdir(join(fixture.root,'docs/artifacts/tenant/versions/2.0.0/specifications/flows'),{recursive:true});
 await writeFile(join(fixture.root,'docs/artifacts/tenant/versions/2.0.0/specifications/flows/login.md'),flowMarkdown(flowFixture('login',{title:'Proposed login'})));
 await writeFile(join(fixture.root,'docs/artifacts/tenant/versions/2.0.0/specifications/identity.md'),'# Proposed identity');
 const planning=await readFlowRepository(fixture.root),established=await readFlowRepository(fixture.root,{knowledge:'established'});
 assert.equal(planning.graph.flows[0].source,'version:2.0.0');assert.equal(planning.graph.flows[0].sourcePublication.state,'proposed');
 assert.equal(established.graph.flows.length,2);assert.ok(established.graph.flows.every(f=>f.source==='version:1.0.0'&&f.sourcePublication.state==='published-source'));
 await writeFile(join(fixture.root,'docs/artifacts/tenant/versions/1.0.0/specifications/flows/login.md'),flowMarkdown(flowFixture('login',{title:'Modified historical source'})));
 const dirty=await readFlowRepository(fixture.root,{knowledge:'established'});assert.ok(dirty.graph.diagnostics.some(d=>d.code==='unpublished-flow-source'));
});

test('YAML task examples do not create reference diagnostics in a flow context',()=>{
 const files=flowFiles();files.set('docs/artifacts/tenant/versions/1.0.0/specifications/examples.md','# Task examples\n\n```yaml\n---\nid: first\n---\n---\nid: second\n---\n```\n');
 const snapshot=buildSnapshot(files);assert.equal(snapshot.diagnostics.length,0);assert.equal(snapshot.references.length,0);
});
