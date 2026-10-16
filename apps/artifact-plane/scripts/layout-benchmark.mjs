// Compare one repository in its legacy and migrated forms with the current
// readers: zero-excerpt packet bytes for one change, and git command count and
// elapsed time of one explore. Results are byte, command and time proxies.
// Usage: node scripts/layout-benchmark.mjs <repository> <legacy-rev> <migrated-rev>
//   [--main <rev>] [--artifact <id>] [--change <change>] [--worktrees <n>]
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {exploreRepository,gitMetrics} from '../server/reader.js';
import {queryChangeReview} from '../server/change-review.js';
import {clearHistory} from '../server/git-reads.js';

const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args.splice(i,2)[1];};
const main=option('main','origin/main'),artifact=option('artifact','artifact-driven'),change=option('change','change-agent-efficiency'),worktrees=Number(option('worktrees','0'));
const [repository,...revisions]=args;
if(!repository||revisions.length!==2){console.error('Usage: layout-benchmark.mjs <repository> <legacy-rev> <migrated-rev> [--main rev] [--artifact id] [--change name]');process.exit(2);}
const run=(cwd,...a)=>execFileSync('git',['-C',cwd,...a],{encoding:'utf8'}).trim();
const mainOid=run(repository,'rev-parse','--verify',main+'^{commit}');
async function measure(label,revision){
 const oid=run(repository,'rev-parse','--verify',revision+'^{commit}');
 const root=await mkdtemp(join(tmpdir(),'plane-layout-bench-'));
 try{
  // A local clone shares the object store, so any revision of the source exists.
  execFileSync('git',['clone','-q','--no-checkout',repository,root]);
  run(root,'checkout','-q','-B','benchmark',oid);run(root,'branch','-f','main',mainOid);
  // Extra registered worktrees at the same revision approximate a busy checkout.
  for(let i=0;i<worktrees;i++)run(root,'worktree','add','-q','-b','benchmark-'+i,join(root,'.worktrees',String(i)),oid);
  const files=run(root,'ls-tree','-r','-l','HEAD','--','docs/artifacts').split('\n').filter(Boolean);
  clearHistory();gitMetrics.commands=0;
  const packet=await queryChangeReview({path:root,artifact,change,operation:'packet',budget:0,limit:100});
  const packetCommands=gitMetrics.commands;
  clearHistory();gitMetrics.commands=0;
  const start=performance.now();await exploreRepository(root);const elapsed=performance.now()-start;
  return {label,revision:oid.slice(0,12),knowledgeFiles:files.length,knowledgeBytes:files.reduce((sum,row)=>sum+Number(row.split(/\s+/)[3]),0),
   packetBytes:Buffer.byteLength(JSON.stringify(packet)),packetRecords:packet.data.records?.length??0,packetSources:packet.data.sources?.length??0,packetCommands,
   exploreCommands:gitMetrics.commands,exploreMilliseconds:Math.round(elapsed)};
 }finally{await rm(root,{recursive:true,force:true});}
}
const results=[];for(const [i,revision] of revisions.entries())results.push(await measure(i?'migrated':'legacy',revision));
const [a,b]=results,change_=(x,y)=>Math.round((1-y/x)*1000)/10;
console.log(JSON.stringify({main:mainOid.slice(0,12),artifact,change,worktrees,results,
 reductionPercent:{packetBytes:change_(a.packetBytes,b.packetBytes),exploreCommands:change_(a.exploreCommands,b.exploreCommands),exploreMilliseconds:change_(a.exploreMilliseconds,b.exploreMilliseconds)},
 limits:'Byte, command and time proxies on one machine; not model-token or latency measurements.'},null,1));
