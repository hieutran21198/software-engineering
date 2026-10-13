import {benchmarkFixture} from './reload-benchmark.js';
import {queryRepository} from '../server/repository-query.js';
for(const options of [{files:250,worktrees:2},{files:5000,worktrees:10}]){
 const fixture=await benchmarkFixture(options);
 try{
  global.gc?.();const baseline=process.memoryUsage(),peak={...baseline};let samples=0;
  const sample=()=>{samples++;const current=process.memoryUsage();for(const key of Object.keys(peak))peak[key]=Math.max(peak[key],current[key]);};
  const timer=setInterval(sample,20);
  let overview,detail;
  try{overview=await queryRepository({path:fixture.root,section:'overview'});sample();detail=await queryRepository({path:fixture.root,section:'implementation',unit:'unit-0'});sample();}finally{clearInterval(timer);}
  const afterDetail=process.memoryUsage();overview=null;detail=null;global.gc?.();
  console.log(JSON.stringify({initialRecords:fixture.files,worktrees:options.worktrees,intervalMs:20,samples,baseline,sampledPeak:peak,afterDetail,released:process.memoryUsage()}));
 }finally{await fixture.cleanup();}
}
