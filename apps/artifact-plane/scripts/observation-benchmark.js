import {EventEmitter} from 'node:events';
import {benchmarkFixture} from './reload-benchmark.js';
import {repositoryService,repositoryFingerprint} from '../server/repository-events.js';
import {gitMetrics} from '../server/reader.js';
const f=await benchmarkFixture({files:5000,worktrees:10});
const samples=[];const service=repositoryService({sample:async root=>{const start=performance.now();const result=await repositoryFingerprint(root);samples.push({ms:Math.round(performance.now()-start),files:result.files,memory:process.memoryUsage()});return result;}});
try{
 const req=new EventEmitter(),res=new EventEmitter();res.writeHead=()=>{};res.write=()=>{};res.end=()=>res.emit('close');
 const cpu=process.cpuUsage(),memory=process.memoryUsage(),commands=gitMetrics.commands,start=performance.now();await service.subscribe(req,res,{},f.root);
 await new Promise(resolve=>setTimeout(resolve,60000));req.emit('close');const elapsedMs=performance.now()-start;
 console.log(JSON.stringify({elapsedMs,cpu:process.cpuUsage(cpu),baselineMemory:memory,afterMemory:process.memoryUsage(),gitCommands:gitMetrics.commands-commands,samples,observersAfterDisconnect:service.observerCount}));
}finally{service.close();await f.cleanup();}
