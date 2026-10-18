// Run the ground-truth impact cases against a repository and print precision, recall,
// step checks, negatives, unresolved checks, timings and output sizes.
// Usage: node scripts/impact-benchmark.mjs <repository> [--state-dir <dir>] [--json]
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createImpactService,compactText} from '../server/impact.js';

const args=process.argv.slice(2);const repository=resolve(args.find(a=>!a.startsWith('--'))||'.');
const stateDir=args.includes('--state-dir')?args[args.indexOf('--state-dir')+1]:mkdtempSync(join(tmpdir(),'plane-impact-bench-'));
const asJson=args.includes('--json');
const cases=JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)),'../test/fixtures/impact-cases.json'),'utf8')).cases;
const prf=(pred,truth)=>{const P=new Set(pred),Tt=new Set(truth);const tp=[...P].filter(x=>Tt.has(x)).length;return {tp,fp:P.size-tp,fn:Tt.size-tp,precision:P.size?+(tp/P.size).toFixed(2):null,recall:Tt.size?+(tp/Tt.size).toFixed(2):null};};
const service=createImpactService({stateDir});
const build=await service.index.update(repository);
const warm=await service.index.update(repository);
// Optional: measure one changed file by appending a line to a tracked module and restoring it.
let incremental=null;
if(args.includes('--measure-incremental')){const file=join(repository,'apps/artifact-plane/server/git-process.js');const original=readFileSync(file);try{writeFileSync(file,original+'\n// benchmark probe\n');const started=performance.now();const r=await service.index.update(repository);incremental={ms:+(performance.now()-started).toFixed(1),parsed:r.parsed,changed:r.changed};}finally{writeFileSync(file,original);await service.index.update(repository);}}
const rows=[];
for(const c of cases){
  let body={path:repository,depth:c.depth||2,limit:200};
  if(c.commit){const files=execFileSync('git',['-C',repository,'diff-tree','--no-commit-id','-r','-M','--name-only',c.commit],{encoding:'utf8'}).trim().split('\n').filter(f=>new RegExp(c.originFilter||'.').test(f));body.origins=files.map(path=>({path,commit:c.commit}));}
  else body.origins=c.origins;
  await service.query(body);const started=performance.now();const r=await service.query(body);const ms=performance.now()-started;
  const direct=r.data.direct.map(i=>i.entity),transitive=r.data.transitive.map(i=>i.entity),potential=r.data.potential.map(i=>i.entity);
  const all=[...direct,...transitive],expectAll=[...c.expect.direct,...(c.expect.transitive||[])];
  const negatives=[...(c.negatives||[]),...(c.negativesPattern?all.filter(e=>new RegExp(c.negativesPattern).test(e)):[])];
  const hit=negatives.filter(n=>all.includes(n));
  const steps=c.steps?Object.entries(c.steps).map(([flow,expected])=>{const it=r.data.direct.concat(r.data.transitive).find(i=>i.entity===flow);const got=(it?.steps||[]).filter(s=>s.hops===1).map(s=>s.step).sort();return {flow,ok:JSON.stringify(got)===JSON.stringify([...expected].sort()),got,expected};}):null;
  const text=compactText(r,1e9);
  rows.push({id:c.id,name:c.name,ms:+ms.toFixed(1),frontier:r.data.coverage.frontier,direct:prf(direct,c.expect.direct),all:prf(all,expectAll),flows:prf(all.filter(e=>e.startsWith('flow:')),expectAll.filter(e=>e.startsWith('flow:'))),negativesHit:hit,
    potential:c.expect.potential?prf(potential,c.expect.potential):null,potentialListed:potential.length,potentialTotal:r.data.potential_total,
    investigateRecall:c.expect.investigate?prf([...r.data.investigate.map(i=>i.entity),...potential],c.expect.investigate).recall:null,
    unresolvedOk:c.unresolved?c.unresolved.every(u=>r.data.unresolved.some(x=>x.entity===u)):null,steps,recallOnly:!!c.recallOnly,chars:text.length,verifyFlows:[...new Set(r.data.verify.map(v=>v.flow))].length});
}
await service.close();
if(!args.includes('--state-dir'))rmSync(stateDir,{recursive:true,force:true});
const summary={repository,head:build.head,index:{fullMs:build.timings.totalMs,noChangeMs:warm.timings.totalMs,incremental,parsed:build.parsed,historyCommits:build.historyCommits,goAvailable:build.goAvailable},cases:rows};
if(asJson){console.log(JSON.stringify(summary,null,1));}
else{
  console.log(`Repository ${repository} at ${build.head.slice(0,7)}; full index ${build.timings.totalMs} ms (parsed ${build.parsed} modules, ${build.historyCommits} history commits, go ${build.goAvailable?'available':'absent'}); no-change update ${warm.timings.totalMs} ms${incremental?`; one changed file ${incremental.ms} ms (parsed ${incremental.parsed})`:''}`);
  console.log('case  direct P/R  all P/R  flows P/R  negatives  steps  potential  unresolved  query ms  frontier  chars');
  for(const r of rows){const f=x=>x?`${x.precision??'—'}/${x.recall??'—'}`:'—';const steps=r.steps?r.steps.filter(s=>s.ok).length+'/'+r.steps.length:'—';
    console.log(`${r.id.padEnd(5)} ${f(r.direct).padEnd(11)} ${f(r.all).padEnd(8)} ${f(r.flows).padEnd(10)} ${String(r.negativesHit.length).padEnd(10)} ${steps.padEnd(6)} ${(r.potential?`${r.potential.tp}/${r.potential.tp+r.potential.fn} of ${r.potentialListed}`:String(r.potentialListed)).padEnd(10)} ${String(r.unresolvedOk??'—').padEnd(11)} ${String(r.ms).padEnd(9)} ${String(r.frontier).padEnd(9)} ${r.chars}${r.recallOnly?'  (recall-only)':''}`);
    for(const s of r.steps||[])if(!s.ok)console.log(`      step mismatch ${s.flow}: got ${s.got.join('+')} expected ${s.expected.join('+')}`);
    if(r.negativesHit.length)console.log(`      negatives hit: ${r.negativesHit.join(', ')}`);}
  const symbolCases=rows.filter(r=>!r.recallOnly);
  console.log(`\nThresholds: direct P/R 1.0 on symbol-seeded cases: ${symbolCases.filter(r=>r.direct.precision===1&&r.direct.recall===1).map(r=>r.id).join(',')||'none'}; step checks ${rows.flatMap(r=>r.steps||[]).filter(s=>s.ok).length}/${rows.flatMap(r=>r.steps||[]).length}; negatives hit ${rows.reduce((n,r)=>n+r.negativesHit.length,0)}; unresolved ok ${rows.filter(r=>r.unresolvedOk!==null).every(r=>r.unresolvedOk)}; max chars ${Math.max(...rows.map(r=>r.chars))}; max query ms ${Math.max(...rows.map(r=>r.ms))}`);
}
