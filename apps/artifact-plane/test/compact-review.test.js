import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createCompactReview} from '../server/compact-review.js';
import {createReviewService} from '../server/change-review.js';
import {fixtureRepository,rootReadme,git} from './fixtures.js';
const digest=s=>createHash('sha256').update(s).digest('hex');
const source=(path,text,revision='1')=>({id:digest(path+revision),path,side:'change',kind:'knowledge',fingerprint:digest(text),totalCharacters:text.length,text});
function input(overrides={}){return {root:'/repo',target:'/repo',body:{artifact:'demo',change:'change-next',operation:'packet',view:'compact',limit:20,budget:12000,maxResponseBytes:4096},c:{revision:'1',repository:{head:'abc'},sources:new Map([['a',source('a','hello')]]),diagnostics:[],omissions:[]},records:[],brief:{answers:[{question:'Why?',summary:'Preserve evidence.'}]},evidence:{approval:'Approval not verified by this reader.',publication:{state:'unknown'}},...overrides};}
function entries(service,args){const all=[];let cursor,token;do{const result=service.query({...args,body:{...args.body,...(cursor?{cursor}:{})}});assert.ok(Buffer.byteLength(JSON.stringify(result))<=args.body.maxResponseBytes-256);all.push(...result.data.entries);cursor=result.pagination.nextCursor;token=result.data.captureToken;}while(cursor);return {all,token};}
function values(items){const out=[],parts=new Map();for(const e of items){if(!e.encoding){out.push(e);continue;}const key=e.section;let part=parts.get(key)||'';assert.equal(e.offset,part.length);part+=e.text;if(part.length===e.totalCharacters){out.push({section:key,value:JSON.parse(part)});parts.delete(key);}else parts.set(key,part);}assert.equal(parts.size,0);return out;}
test('whole UTF-8 cap, JSON fragments and diagnostics survive paging and oversized Unicode entries',()=>{
 const service=createCompactReview(),args=input();args.c.diagnostics=[{code:'missing-proof',message:'界😀'.repeat(4000)}];args.records=Array.from({length:40},(_,i)=>({path:'requirements/'+i+'.md',status:'modified'}));
 const result=entries(service,args),decoded=values(result.all);assert.deepEqual(decoded.filter(e=>e.section==='diagnostics').map(e=>e.value),args.c.diagnostics);assert.deepEqual(decoded.filter(e=>e.section==='records').map(e=>e.value),args.records);assert.ok(decoded.find(e=>e.section==='sources'));assert.ok(result.token);
});
test('selected source pages reconstruct every character with excerpt budget, and zero budget is explicit',()=>{
 const service=createCompactReview(),args=input();args.body.operation='source';args.body.source=args.c.sources.get('a').id;args.body.budget=2;const result=values(entries(service,args).all).filter(e=>e.section==='source');assert.equal(result.map(e=>e.value.text).join(''),'hello');assert.deepEqual(result.map(e=>e.value.offset),[0,2,4]);
 args.body.budget=0;const r=service.query(args);assert.equal(r.pagination.nextCursor,null);assert.equal(r.data.entries.find(e=>e.section==='source').value.omittedCharacters,5);
});
test('delta compares digests rather than revision IDs and reports adds, edits, deletes and unchanged',()=>{
 const service=createCompactReview(),args=input();args.c.sources.set('remove',source('gone','old'));const seed=service.query(args).data.captureToken;
 args.body={...args.body,operation:'delta',captureToken:seed};args.c={...args.c,revision:'2',sources:new Map([['a',source('a','hello','2')],['new',source('new','new')]])};let delta=values(entries(service,args).all);assert.equal(delta.find(e=>e.section==='unchanged').value.count,1);assert.equal(delta.find(e=>e.section==='added').value.path,'new');assert.equal(delta.find(e=>e.section==='removed').value.path,'gone');assert.ok(!delta.some(e=>e.section==='modified'));
 args.c.sources.set('a',source('a','edited','2'));delta=values(entries(service,args).all);assert.equal(delta.find(e=>e.section==='modified').value.path,'a');
});
test('captures expire, evict, isolate repositories and reset on restart; cursors bind all selectors',()=>{
 let time=0;const service=createCompactReview({now:()=>time}),args=input();args.records=Array.from({length:30},()=>({text:'large'.repeat(200)}));const seed=service.query(args),token=seed.data.captureToken,cursor=seed.pagination.nextCursor;assert.ok(cursor);
 for(const change of [{budget:1},{maxResponseBytes:8192},{limit:1},{operation:'brief'}])assert.throws(()=>service.query({...args,body:{...args.body,...change,cursor}}),/Cursor/);
 assert.throws(()=>service.query({...args,c:{...args.c,revision:'changed'},body:{...args.body,cursor}}),/Cursor/);
 const delta={...args,body:{...args.body,operation:'delta',captureToken:token}};assert.throws(()=>service.query({...delta,root:'/another'}),/Capture/);
 time=600000;assert.throws(()=>service.query(delta),/expired/);assert.throws(()=>createCompactReview().query(delta),/expired/);
 time=0;const evicted=service.query(args).data.captureToken;for(let i=0;i<16;i++)service.query(args);assert.throws(()=>service.query({...delta,body:{...delta.body,captureToken:evicted}}),/Capture/);
});
test('mandatory oversized identity fails explicitly instead of exceeding the cap',()=>assert.throws(()=>createCompactReview().query(input({root:'/'+ 'x'.repeat(5000)})),/identity exceeds/));
async function fixture(t){const base='docs/artifacts/demo/';const f=await fixtureRepository(new Map([[base+'README.md',rootReadme('demo','1.0.0')],[base+'requirements/need.md','# Need\n\nOriginal rule.'],[base+'changes/change-next/README.md','# Next\n\nA focused revision.']]));t.after(f.cleanup);git(f.root,'switch','-qc','context-test');await writeFile(join(f.root,base+'requirements/need.md'),'# Need\n\nRevised rule.');return {...f,base,args:{path:f.root,artifact:'demo',change:'change-next',operation:'packet',view:'compact',budget:100,maxResponseBytes:4096}};}
test('service validates compact inputs and preserves legacy defaults; stale responses cannot seed delta',async t=>{
 const f=await fixture(t),service=createReviewService({roots:[f.root]});t.after(()=>service.close());const {args}=f;
 for(const fields of [{maxResponseBytes:1},{view:'unknown'},{operation:'description'},{captureToken:'x'},{operation:'delta'}])await assert.rejects(service.query({...args,...fields}),e=>e.status===400);
 const r=await service.query(args);assert.equal(r.freshness,'fresh');assert.ok(r.data.captureToken);assert.ok(Buffer.byteLength(JSON.stringify(r))<4096);assert.ok(!('description'in r.data));
 const legacy=await service.query({path:f.root,artifact:'demo',change:'change-next',operation:'packet'});assert.equal(legacy.data.schema,'artifact-plane.change-context.v1');assert.ok(legacy.data.description);
 const race=createReviewService({roots:[f.root],beforeRevalidate:()=>writeFile(join(f.root,f.base+'requirements/need.md'),'# Need\nRace!')});t.after(()=>race.close());const stale=await race.query(args);assert.equal(stale.freshness,'stale');assert.equal(stale.data.captureToken,null);assert.equal(stale.pagination.nextCursor,null);assert.ok(Buffer.byteLength(JSON.stringify(stale))<4096);
});
test('service delta detects repeated dirty edits, tracked deletions and protected ref movement',async t=>{
 const f=await fixture(t),service=createReviewService({roots:[f.root]});t.after(()=>service.close());const first=await service.query({...f.args,maxResponseBytes:65536});
 await writeFile(join(f.root,f.base+'requirements/need.md'),'# Need\nSecond dirty edit.');const delta=await service.query({...f.args,operation:'delta',captureToken:first.data.captureToken,maxResponseBytes:65536});assert.ok(delta.data.entries.some(e=>e.section==='modified'&&e.value.path.endsWith('need.md')));
 await unlink(join(f.root,f.base+'requirements/need.md'));const removed=await service.query({...f.args,operation:'delta',captureToken:delta.data.captureToken,maxResponseBytes:65536});assert.ok(removed.data.entries.some(e=>e.section==='removed'&&e.value.path.endsWith('need.md')));
 git(f.root,'add','.');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','change');git(f.root,'branch','-f','main');const moved=await service.query({...f.args,operation:'delta',captureToken:removed.data.captureToken,maxResponseBytes:65536});assert.notEqual(moved.revision,removed.revision);assert.equal(moved.freshness,'fresh');
});
