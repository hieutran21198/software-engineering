import {mkdir,writeFile,rm,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {fixtureRepository,git,rootReadme} from '../test/fixtures.js';
import {unitTask} from '../test/unit-fixtures.js';
import {exploreRepository,gitMetrics} from '../server/reader.js';
import {clearHistory,historyStats} from '../server/git-reads.js';
export async function benchmarkFixture({files=250,worktrees=2}={}){
 const records=new Map();
 for(let a=0;a<10;a++){
  const id='artifact-'+a,base='docs/artifacts/'+id+'/';
  records.set(base+'README.md',rootReadme(id,'1.0.0'));
  records.set(base+'versions/1.0.0/README.md','---\nsource_change: change-next\ndelivery_tasks: change\n---\n# Delivered\nAll required knowledge and implementation changes are in this repository.\n');
  records.set(base+'changes/change-next/README.md','# Next');
  records.set(base+'changes/change-next/tasks/README.md','---\ntasks: [task.md]\n---\n# Plan');
  records.set(base+'changes/change-next/tasks/task.md',unitTask('task'));
  records.set('docs/artifacts/units-of-work/unit-'+a+'/README.md',`---\nunit_of_work: unit-${a}\nchanges:\n  - artifact: ${id}\n    change: change-next\nacceptance:\n  - id: check\n    criterion: Validate outcome\nevidence: []\n---\n# Unit ${a}\n`);
 }
 for(let i=0;i<files;i++){
  const base='docs/artifacts/artifact-'+(i%10)+'/';
  for(const source of ['changes/change-next','versions/1.0.0'])records.set(base+source+'/requirements/file-'+i+'.md','# Requirement '+i+'\n\n'+'Required behavior. '.repeat(20));
 }
 const fixture=await fixtureRepository(records);
 for(let i=0;i<100;i++){
  await writeFile(join(fixture.root,'docs/artifacts/artifact-0/changes/change-next/requirements/history.md'),'# History\n\nRevision '+i);
  git(fixture.root,'add','docs');git(fixture.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','history '+i);
 }
 const container=await mkdtemp(join(tmpdir(),'plane-bench-worktrees-'));const roots=[];
 for(let i=1;i<worktrees;i++){const path=join(container,'worktree-'+i);git(fixture.root,'worktree','add','-qb','bench-'+i,path);roots.push(path);}
 return {...fixture,roots,files:records.size,cleanup:async()=>{for(const path of roots)git(fixture.root,'worktree','remove','--force',path);await fixture.cleanup();await rm(container,{recursive:true,force:true});}};
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
export async function runBenchmark(fixture){
 const output={corpusHead:git(fixture.root,'rev-parse','HEAD'),files:fixture.files,worktrees:fixture.roots.length+1,conditions:{}};
 for(const condition of ['cold','warm','task-edit']){
  const results={};let expected;
  for(const legacy of [true,false]){
   clearHistory();const times=[],commands=[];
   if(condition!=='cold')await exploreRepository(fixture.root,{legacy});
   for(let i=0;i<5;i++){
    if(condition==='cold')clearHistory();
    if(condition==='task-edit')await writeFile(join(fixture.root,'docs/artifacts/artifact-0/changes/change-next/tasks/task.md'),unitTask('task').replace('[x]',i%2?'[x]':'[ ]'));
    const before=gitMetrics.commands,start=performance.now();const snapshot=await exploreRepository(fixture.root,{legacy});
    times.push(performance.now()-start);commands.push(gitMetrics.commands-before);
    if(legacy){expected??=[];expected[i]=snapshot;}else assert.deepEqual(snapshot,expected[i]);
   }
   process.stderr.write(condition+' '+(legacy?'before':'after')+' '+JSON.stringify({times,commands})+'\n');
   results[legacy?'before':'after']={medianMs:Math.round(median(times)),medianGitCommands:median(commands)};
  }
  output.conditions[condition]={...results,timeReduction:1-results.after.medianMs/results.before.medianMs,commandReduction:1-results.after.medianGitCommands/results.before.medianGitCommands};
 }
 output.history=historyStats();return output;
}
if(process.argv[1]?.endsWith('reload-benchmark.js')){const fixture=await benchmarkFixture();try{console.log(JSON.stringify(await runBenchmark(fixture),null,2));}finally{await fixture.cleanup();}}
