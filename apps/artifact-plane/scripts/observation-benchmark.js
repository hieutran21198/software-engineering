// Idle observation on one large fixture for the same duration in both modes:
// "full" rereads every knowledge byte each poll (the previous behavior);
// "incremental" uses notifications with periodic full reconciliation.
// Usage: node scripts/observation-benchmark.js [--seconds 60] [--mode full|incremental|both]
import {EventEmitter} from 'node:events';
import {benchmarkFixture} from './reload-benchmark.js';
import {repositoryService,repositoryFingerprint} from '../server/repository-events.js';
import {gitMetrics} from '../server/reader.js';
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const seconds=Number(option('seconds','60')),modes=option('mode','both')==='both'?['full','incremental']:[option('mode')];
const f=await benchmarkFixture({files:5000,worktrees:10});
async function measure(mode){
 const samples=[];let bytes=0,initialBytes=null;
 const record=(start,result)=>{samples.push({ms:Math.round(performance.now()-start),files:result.files});};
 const service=repositoryService(mode==='full'
  ?{sample:async root=>{const start=performance.now(),result=await repositoryFingerprint(root);bytes+=result.bytes;initialBytes??=result.bytes;record(start,result);return result;}}
  :{sample:async(root,settings)=>{const start=performance.now(),result=await settings.base(settings);initialBytes??=result.bytes;record(start,result);return result;}});
 try{
  const req=new EventEmitter(),res=new EventEmitter();res.writeHead=()=>{};res.write=()=>{};res.end=()=>res.emit('close');
  const cpu=process.cpuUsage(),commands=gitMetrics.commands,start=performance.now();await service.subscribe(req,res,{},f.root);
  await new Promise(resolve=>setTimeout(resolve,seconds*1000));
  const observation=service.stats()[0].observation;req.emit('close');const elapsedMs=Math.round(performance.now()-start),usage=process.cpuUsage(cpu);
  if(observation)bytes=observation.bytesRead;
  const durations=samples.map(s=>s.ms).sort((a,b)=>a-b);
  return {mode,elapsedMs,knowledgeBytesRead:bytes,initialScanBytes:initialBytes,idleBytesAfterInitialScan:bytes-initialBytes,cpuMs:Math.round((usage.user+usage.system)/1000),samples:samples.length,medianSampleMs:durations[Math.floor(durations.length/2)],maxSampleMs:durations.at(-1),filesPerSample:samples[0]?.files,gitCommands:gitMetrics.commands-commands,observation,observersAfterDisconnect:service.observerCount,memory:process.memoryUsage().rss};
 }finally{service.close();}
}
try{
 const results=[];for(const mode of modes)results.push(await measure(mode));
 const [before,after]=results;
 console.log(JSON.stringify({fixture:{files:f.files,worktrees:f.roots.length+1},seconds,results,...(after?{knowledgeByteReduction:Math.round((1-after.knowledgeBytesRead/before.knowledgeBytesRead)*1000)/10,idleByteReductionAfterInitialScan:Math.round((1-after.idleBytesAfterInitialScan/before.idleBytesAfterInitialScan)*1000)/10,cpuReduction:Math.round((1-after.cpuMs/before.cpuMs)*1000)/10}:{}),limits:'One machine and one fixture; bytes count knowledge file reads, CPU is this process only (git children excluded).'},null,1));
}finally{await f.cleanup();}
