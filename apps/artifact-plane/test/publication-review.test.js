import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixtureRepository, fingerprint} from './fixtures.js';
import {exploreRepository} from '../server/reader.js';
import {unitFixture} from './unit-fixtures.js';
import {publication} from '../server/units-of-work.js';
const prefix='docs/artifacts/tenant/versions/1.0.0/';
const unitPath='docs/artifacts/units-of-work/login/README.md';
const assertion='All required knowledge and implementation changes have landed on main.';
const metadata='---\nsource_change: change-login\n---\n';
const brief='---\nunit_of_work: login\nchanges:\n  - artifact: tenant\n    change: change-login\nacceptance:\n  - id: login\n    criterion: Works\n---\n';
async function inspect(readme,extra=new Map(),reviewSource=null) {
 const files=new Map([[prefix+'README.md',metadata+readme],...extra]);
 const git=async (_root,args)=>args[0]==='rev-parse'?(args.at(-1).endsWith('master')?Promise.reject(Error('missing')):'sha'):args[0]==='ls-tree'?[...files.keys()].filter(p=>p.startsWith(prefix)).join('\n'):Buffer.from(files.get(args[1].slice(args[1].indexOf(':')+1)));
 return publication('/fixture',prefix,files,git,reviewSource?files.get(reviewSource):'',reviewSource);
}
test('instructional specification and location prose never supply publication review',async()=>{
 const result=await inspect('# Version\n',new Map([[prefix+'specifications/unit.md','# Contract\n\nAll required knowledge and implementation changes have landed on main.\n'],[prefix+'tasks/task.md','# Task\nAll required knowledge and implementation changes are in this repository.']]));
 assert.equal(result.state,'unverified');
});
test('actual version review returns exact scoped assertion and source',async()=>{
 const result=await inspect('# Version\n\n## Publication review\n\n'+assertion);
 assert.equal(result.state,'established');assert.deepEqual(result.sources.find(s=>s.kind==='documented-merge-review'),{kind:'documented-merge-review',path:prefix+'README.md',heading:'publication-review',artifact:'tenant',version:'1.0.0',assertion});
});
for(const text of [
 assertion,
 '## Other\n\n'+assertion,
 '## Publication review\n\n```md\n'+assertion+'\n```',
 '## Publication review\n\n> '+assertion,
 '## Publication review\n\n- '+assertion,
 '## Publication review\n\n"'+assertion+'"',
 '## Publication review\n\nExample: '+assertion,
 '## Publication review\n\nIf '+assertion,
 '## Publication review\n\n'+assertion.replace('have landed','have not landed'),
 '## Publication review\n\n'+assertion.replace('have landed','will have landed'),
 '## Publication review\n\nAll required knowledge and implementation changes are in this repository.',
 '## Publication review\n\n'+assertion+' But implementation has not merged.',
 '## Publication review\n\n'+assertion+'\n\nBut all required code changes have not merged.',
 '## Publication review\n\n'+assertion+'\n\nImplementation is pending.',
 '## Publication review\n\n'+assertion+'\n\nThis assertion is false.',
 '## Publication review\n\n'+assertion+'\n\nThey have not landed.',
 '## Publication review\n\n## Another section\n\n'+assertion,
 '## Publication review\n\n'+assertion+'\n\nAll required implementation changes have not landed on main.',
 '## Publication review\n\n### Example\n\n'+assertion,
 '## Examples\n\n### Publication review\n\n'+assertion,
 '## Publication review\n\n### Examples\n\n#### Publication review\n\n'+assertion,
 '## Publication review\n\nRecord the assertion: '+assertion,
 '## Publication review\n\n'+assertion+' This is an example.',
])test('reject nonaffirmative or unscoped review '+JSON.stringify(text),async()=>assert.equal((await inspect('# Version\n\n'+text)).state,'unverified'));
test('unit reviews require exact member version prefix and owning change',async()=>{
 for(const [member,change,expected] of [['tenant 1.0.0','change-login','established'],['tenant 2.0.0','change-login','unverified'],['other 1.0.0','change-login','unverified'],['tenant 1.0.0','change-other','unverified']]) {
  const body=brief.replace('change-login',change)+'\n## Publication review\n\n'+member+': '+assertion;
  const result=await inspect('# Version',new Map([[unitPath,body]]),unitPath);assert.equal(result.state,expected);
 }
});
test('arbitrary linked source and bare legacy assertion arguments cannot supply review',async()=>{
 const path=prefix+'specifications/review.md';const files=new Map([[path,'## Publication review\n\n'+assertion]]);
 assert.equal((await inspect('# Version',files,path)).state,'unverified');
});

test('real specification review instructions cannot establish published fixture knowledge; repository stays unchanged',async t=>{
 const specification=await readFile(new URL('../../../docs/artifacts/artifact-plane/versions/1.11.1/specifications/units-of-work.md',import.meta.url),'utf8');
 assert.match(specification,/all required knowledge and implementation/i);
 const files=unitFixture();
 for(const [path,body] of files) files.set(path,body.replaceAll(assertion,''));
 for(const artifact of ['tenant','authentication']) files.set(`docs/artifacts/${artifact}/versions/1.0.0/specifications/units-of-work.md`,specification);
 const fixture=await fixtureRepository(files);t.after(fixture.cleanup);
 const before=await fingerprint(fixture.root),unit=(await exploreRepository(fixture.root)).unitsOfWork[0];
 assert.ok(unit.members.every(member=>member.establishmentEvidence.state==='unverified'));
 assert.deepEqual(await fingerprint(fixture.root),before);
});

test('section boundaries and other members cannot supply or contradict a selected review',async()=>{
 const body=brief+'\n## Publication review\n\ntenant 1.0.0: '+assertion+'\n\nother 1.0.0: All required changes have not landed on main.\n\n## Instructions\n\nAll required changes have not landed on main.';
 assert.equal((await inspect('# Version',new Map([[unitPath,body]]),unitPath)).state,'established');
});
test('version and brief contradictions keep evidence unverified',async()=>{
 const body=brief+'\n## Publication review\n\ntenant 1.0.0: All required implementation changes have not landed on main.';
 assert.equal((await inspect('# Version\n\n## Publication review\n\n'+assertion,new Map([[unitPath,body]]),unitPath)).state,'unverified');
});
for(const wording of ['All required knowledge and code changes have merged into master.','All required implementation and knowledge merges are merged on main.']) test('accept scoped affirmative wording '+wording,async()=>assert.equal((await inspect('# Version\n\n## Publication review\n\n'+wording)).state,'established'));

test('real flow-discovery review retains its affirmative PR provenance and exact assertion',async()=>{
 const source=await readFile(new URL('../../../docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md',import.meta.url),'utf8');
 const paragraph=source.split('\n\n').find(text=>text.startsWith('artifact-plane 1.11.0: '));
 assert.ok(paragraph);
 const scoped=paragraph.replace('artifact-plane 1.11.0: ','tenant 1.0.0: ');
 const body=brief+'\n## Publication review\n\n'+scoped;
 const result=await inspect('# Version',new Map([[unitPath,body]]),unitPath);
 assert.equal(result.state,'established');
 assert.equal(result.sources.find(item=>item.kind==='documented-merge-review').assertion,'All required knowledge and implementation changes have landed on main through PR #21.');
});
for(const clause of ['through PR #21','after PR #13','via PR #20']) test('accept bounded provenance '+clause,async()=>{
 const statement=assertion.replace('main.','main '+clause+'.');
 assert.equal((await inspect('# Version\n\n## Publication review\n\n'+statement)).state,'established');
});
for(const clause of ['through PR #21 if tests pass','after PR #13 as an example','via PR #20 which has not merged','through PR #21 or future PR #22']) test('reject qualified PR provenance '+clause,async()=>{
 const statement=assertion.replace('main.','main '+clause+'.');
 assert.equal((await inspect('# Version\n\n## Publication review\n\n'+statement)).state,'unverified');
});

test('real story-driven review accepts unrelated flow-format dependency explanation',async()=>{
 const source=await readFile(new URL('../../../docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md',import.meta.url),'utf8');
 const paragraph=source.split('\n\n').find(text=>text.startsWith('story-driven 1.1.0: '));
 assert.ok(paragraph);
 const scoped=paragraph.replace('story-driven 1.1.0: ','tenant 1.0.0: ');
 const result=await inspect('# Version',new Map([[unitPath,brief+'\n## Publication review\n\n'+scoped]]),unitPath);
 assert.equal(result.state,'established');
 assert.equal(result.sources.find(item=>item.kind==='documented-merge-review').assertion,'All required knowledge and implementation changes have landed on main through PR #21.');
});

test('a separate flow-format explanation does not contradict the affirmative merge assertion',async()=>{
 const body='# Version\n\n## Publication review\n\n'+assertion+'\n\nIts flow-format dependency on established ADD 2.1.0 is knowledge-only.';
 assert.equal((await inspect(body)).state,'established');
});

// In-place members: version record and retained tasks on the protected ref,
// the introducing commit as snapshot, and structured publication_reviews.
import {inPlaceFixture} from './fixtures.js';
import {execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const inPlaceUnit=(reviews='')=>{
 const files=inPlaceFixture();
 if(reviews)files.set('docs/artifacts/tenant/README.md',`---\ncurrent_version: 1.0.0\ndepends_on: []\npublication_reviews:\n${reviews}---\n# Tenant\n`);
 files.set('docs/artifacts/units-of-work/initial/README.md','---\nunit_of_work: initial\nchanges:\n  - artifact: tenant\n    change: change-initial\nacceptance:\n  - id: works\n    criterion: Works\nevidence: []\n---\n# Initial\n\n## Publication review\n\nThe tenant 1.0.0 knowledge, retained tasks and implementation landed on main through PR #1.\n\n'+assertion+'\n');
 return files;
};
const review=(source='docs/artifacts/units-of-work/initial/README.md#publication-review',version='1.0.0')=>`  - artifact: tenant\n    version: ${version}\n    source: ${source}\n    required_changes:\n      - repository: https://example.invalid/org/repo\n        scope: Knowledge, implementation and retained tasks\n        pull_request: https://example.invalid/org/repo/pull/1\n`;
const member=async files=>{const f=await fixtureRepository(files);try{const view=await exploreRepository(f.root);return view.unitsOfWork.find(u=>u.id==='initial').members[0];}finally{await f.cleanup();}};
test('L4: in-place members without publication_reviews are published but unverified; prose is legacy-only',async()=>{
 const m=await member(inPlaceUnit());
 assert.equal(m.deliveryPath,'docs/artifacts/tenant/changes/change-initial/');
 assert.equal(m.establishmentEvidence.state,'unverified');
 assert.ok(m.establishmentEvidence.reasons[0].includes('publication_reviews'));
});
test('L4: structured publication_reviews establish an in-place member with its snapshot commit',async()=>{
 const m=await member(inPlaceUnit(review()));
 assert.equal(m.establishmentEvidence.state,'established',JSON.stringify(m.establishmentEvidence));
 const snapshot=m.establishmentEvidence.sources.find(s=>s.kind==='version-snapshot');
 assert.match(snapshot.commit,/^[a-f0-9]{40}$/);assert.equal(snapshot.path,'docs/artifacts/tenant/versions/1.0.0/README.md');
 assert.ok(m.establishmentEvidence.sources.some(s=>s.kind==='publication-review'&&s.requiredChanges[0].pullRequest.endsWith('/pull/1')));
});
test('L4: invalid or unresolvable publication_reviews never fall back to prose',async()=>{
 for(const reviews of [review().replace('https://example.invalid/org/repo/pull/1','https://other.invalid/org/repo/pull/1'),review('docs/artifacts/units-of-work/initial/README.md#missing'),'  artifact: tenant\n'])
  assert.equal((await member(inPlaceUnit(reviews))).establishmentEvidence.state,'unknown',reviews);
});
test('L4: a shallow clone cannot resolve an in-place version snapshot',async t=>{
 const f=await fixtureRepository(inPlaceUnit(review()));t.after(f.cleanup);
 const clone=await mkdtemp(join(tmpdir(),'plane-shallow-'));t.after(()=>rm(clone,{recursive:true,force:true}));
 execFileSync('git',['clone','-q','--depth','1','file://'+f.root,clone]);
 const m=(await exploreRepository(clone)).unitsOfWork.find(u=>u.id==='initial').members[0];
 assert.equal(m.establishmentEvidence.state,'unknown');assert.ok(m.establishmentEvidence.reasons[0].includes('Shallow'));
});
