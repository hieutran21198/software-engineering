import {benchmarkFixture} from './reload-benchmark.js';
import {queryRepository} from '../server/repository-query.js';
import {exploreRepository,gitMetrics,scanMetrics} from '../server/reader.js';
import {performance} from 'node:perf_hooks';
import {historyStats,clearHistory} from '../server/git-reads.js';
import assert from 'node:assert/strict';
export async function lazyBenchmark({files,worktrees}){
 const fixture=await benchmarkFixture({files,worktrees});
 try{
  clearHistory();global.gc?.();const baseline=process.memoryUsage();
  const started=performance.now(),commands=gitMetrics.commands,scans={...scanMetrics};
  let overview=await queryRepository({path:fixture.root,section:'overview'});
  const first={ms:Math.round(performance.now()-started),commands:gitMetrics.commands-commands,files:scanMetrics.files-scans.files,scans:scanMetrics.scans-scans.scans,bytes:Buffer.byteLength(JSON.stringify(overview)),memory:process.memoryUsage()};
  const source='docs/artifacts/artifact-0/changes/change-next/tasks/task.md';
  let detail=await queryRepository({path:fixture.root,section:'implementation',unit:'unit-0'});const selectedMemory=process.memoryUsage();
  await queryRepository({path:fixture.root,section:'markdown',unit:'unit-0',source});
  detail=null;overview=null;global.gc?.();const released=process.memoryUsage();
  let full=await exploreRepository(fixture.root);const fullBytes=Buffer.byteLength(JSON.stringify(full));full=null;global.gc?.();
  assert(first.bytes/fullBytes<=0.25);assert.equal(first.scans,1);
  return {files:fixture.files,worktrees,baseline,overview:first,selectedMemory,released,fullBytes,payloadRatio:first.bytes/fullBytes,history:historyStats()};
 }finally{await fixture.cleanup();}
}
if(process.argv[1]?.endsWith('lazy-benchmark.js')){for(const args of [{files:250,worktrees:2},{files:5000,worktrees:10}])console.log(JSON.stringify(await lazyBenchmark(args)));}
