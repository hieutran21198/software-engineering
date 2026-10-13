import {realpath,stat,readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {scanRepository,git,gitMetrics,ExploreError} from './reader.js';
import {gitReads} from './git-reads.js';
import {parseWorktrees,evidenceFor,checklist} from './workflow.js';
import {unitBriefs,versionClaims,readUnitsOfWork,safeKnowledgePath} from './units-of-work.js';
import {buildUnitGraphs} from './unit-graphs.js';
const sections=['overview','artifacts','workflow','implementation','markdown','history','completion'];
const keys=['path','section','worktree','unit','artifact','change','source','dependencyMode'];
const safeID=value=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(value);
const deferred={state:'not-loaded',reasons:['Evidence not loaded.'],sources:[]};
const pending=()=>({state:'not-loaded',tasks:[],edges:[],diagnostics:[]});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateQuery(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!keys.includes(k))||!sections.includes(body.section)||typeof body.path!=='string')throw new ExploreError(400,'Supply a repository path and supported section.');
 if(body.worktree!==undefined&&typeof body.worktree!=='string'||body.dependencyMode!==undefined&&!['established','planning'].includes(body.dependencyMode)||body.dependencyMode!==undefined&&body.section!=='artifacts')throw new ExploreError(400,'Invalid worktree or dependency mode.');
 for(const key of ['unit','artifact','change'])if(body[key]!==undefined&&!safeID(body[key]))throw new ExploreError(400,'Invalid knowledge selector.');
 if(body.change!==undefined&&!body.change.startsWith('change-'))throw new ExploreError(400,'Invalid change selector.');
 const unit=body.unit!==undefined,change=body.artifact!==undefined||body.change!==undefined,artifactOnly=!!body.artifact&&!body.change&&['artifacts','markdown'].includes(body.section);
 if(unit&&change||change&&(!body.artifact||!body.change)&&!artifactOnly||body.section==='overview'&&(unit||change||body.source!==undefined)||body.section==='completion'&&!unit||body.section==='history'&&(!change||unit)||body.section!=='overview'&&!unit&&!change)throw new ExploreError(400,'Supply one appropriate unit or artifact/change context.');
 if(body.section==='markdown'&&!safeKnowledgePath(body.source)||body.section!=='markdown'&&body.source!==undefined)throw new ExploreError(400,'Invalid source selector.');
 return body;
}
export function stripBodies(value){
 if(Array.isArray(value))return value.map(stripBodies);
 if(!value||typeof value!=='object')return value;
 const result={};
 for(const [key,item]of Object.entries(value)){
  if(['markdown','readme','body'].includes(key)){
   if(key==='body'&&typeof value.id==='string'&&value.dependsOn)result.signature=createHash('sha256').update(JSON.stringify([value.id,value.path,value.title,value.dependsOn,item])).digest('hex');
   continue;
  }
  result[key]=stripBodies(item);
 }
 return result;
}
function unitSummary(unit,snapshot,root,files,graphs=true){
 unit.members=unit.members.map(m=>{const claims=versionClaims(files,m.artifact,m.change),claim=claims.length===1?claims[0]:null;return {...m,deliveredVersion:claim?.version||null,retainedChangePath:`docs/artifacts/${m.artifact}/changes/${m.change}/`,sourcePath:claim?.prefix||`docs/artifacts/${m.artifact}/changes/${m.change}/`,establishmentEvidence:{...deferred},taskGraph:pending(),knowledge:[]};});
 unit.completion={derivation:'not-loaded',reasons:['Completion evidence not loaded.'],sources:[]};
 const empty={nodes:[],edges:[],diagnostics:[],state:'not-loaded'};
 const result=graphs?buildUnitGraphs(unit,snapshot,root,files):{...unit,artifactGraph:{established:{...empty},planning:{...empty}},implementationGraph:{...empty}};
 result.loadState='not-loaded';return stripBodies(result);
}
async function worktreeList(root,run){
 const list=parseWorktrees(await run(root,['worktree','list','--porcelain','-z'],true));
 for(const entry of list){entry.selected=entry.path===root;entry.loadState='not-loaded';entry.unitsOfWork=[];
  try{const target=await realpath(entry.path);const knowledge=await realpath(resolve(target,'docs/artifacts'));const rel=relative(target,knowledge);entry.availability=rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel)&&(await stat(knowledge)).isDirectory()?'readable':'non-add';}catch{entry.availability='unavailable';}
 }
 return list;
}
function changeSummaries(snapshot){return snapshot.artifacts.flatMap(a=>a.changes.map(c=>({artifact:a.id,name:c.name,declaredActive:a.activeChange===c.name,history:a.activeChange!==c.name,currentStep:null,lastCommitAt:null,inferenceReason:'Phase evidence not loaded.',historyReason:'Retained change; evidence not loaded.',steps:[],tasks:[],taskGraph:pending(),loadState:'not-loaded'})));}
const flights=new Map();
export async function queryRepository(input){
 const validated=validateQuery(input);const root=await realpath(validated.path).catch(()=>validated.path);const body=Object.fromEntries(keys.filter(k=>validated[k]!==undefined).map(k=>[k,validated[k]]));body.path=root;if(body.worktree)body.worktree=await realpath(body.worktree).catch(()=>body.worktree);const key=JSON.stringify(keys.map(k=>[k,body[k]??(k==='worktree'?root:k==='dependencyMode'&&body.section==='artifacts'?'established':null)]));
 if(flights.has(key))return flights.get(key);
 const work=readQuery(body);flights.set(key,work);try{return await work;}finally{if(flights.get(key)===work)flights.delete(key);}
}
async function readQuery(body){
 const run=gitReads(git,()=>gitMetrics.commands++);
 try{
  const initial=await scanRepository(body.path,{metadata:true,indexOnly:body.section!=='overview',git:run});const root=initial.snapshot.repository.path;
  const worktrees=await worktreeList(root,run);
  const target=body.worktree===undefined?root:await realpath(body.worktree).catch(()=>null);
  if(!target||!worktrees.some(w=>w.path===target))throw new ExploreError(422,'Select a currently registered worktree.');
  const initialRefs=await Promise.all(['main','master'].map(ref=>run(target,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null)));
  let overview=target===root?initial:await scanRepository(target,{metadata:true,indexOnly:body.section!=='overview',git:run});
  const entry=worktrees.find(w=>w.path===target);entry.changes=changeSummaries(overview.snapshot);
  entry.unitsOfWork=unitBriefs(overview.files).map(unit=>unitSummary(unit,overview.snapshot,target,overview.files,false));entry.loadState='loaded';
  const context=Object.fromEntries(Object.entries(body).filter(([key])=>!['path','section'].includes(key)));
  let data,readState=overview,readFull=null,documentBytes=null;
  if(body.section==='overview'){
   data=stripBodies(overview.snapshot);data.workflow={worktrees,diagnostics:[],historyLimit:200};data.unitsOfWork=entry.unitsOfWork;data.loadState='loaded';
  }else{
   const unit=body.unit?unitBriefs(overview.files).find(u=>u.id===body.unit):null;
   if(body.unit&&!unit)throw new ExploreError(404,'Unit of work no longer exists.');
   const members=unit?.members||[{artifact:body.artifact,change:body.change}];
   if(!unit&&!overview.snapshot.artifacts.some(a=>a.id===body.artifact&&a.changes.some(c=>c.name===body.change)||!body.change&&['artifacts','markdown'].includes(body.section)))throw new ExploreError(404,'Change no longer exists.');
   const prefixes=members.flatMap(m=>[`docs/artifacts/${m.artifact}/changes/${m.change}/`,...versionClaims(overview.files,m.artifact,m.change).map(c=>c.prefix),...(overview.snapshot.artifacts.find(a=>a.id===m.artifact)?.currentVersion?[`docs/artifacts/${m.artifact}/versions/${overview.snapshot.artifacts.find(a=>a.id===m.artifact).currentVersion}/`]:[])]);
   const unitPath=unit?.path;
   const full=path=>prefixes.some(prefix=>path.startsWith(prefix))||path===unitPath||unit?.evidence.some(e=>e.source.split('#')[0]===path);
   if(body.section==='markdown'){
    // Metadata indexes establish scope; no arbitrary repository file endpoint.
    const artifacts=unit?unitSummary(unit,overview.snapshot,target,overview.files).artifactGraph.planning.nodes.map(n=>n.id):[body.artifact];
    if(overview.unsafeTaskPaths.has(body.source))throw new ExploreError(422,'Unsafe task source.');
    const declaredSource=body.source===unitPath||unit?.evidence.some(e=>e.source.split('#')[0]===body.source)||prefixes.some(prefix=>body.source===prefix+'README.md'||body.source.startsWith(prefix)&&/^(requirements|specifications|decisions|tasks)\/.+\.md$/.test(body.source.slice(prefix.length)));
    if(!declaredSource&&!artifacts.some(a=>body.source===`docs/artifacts/${a}/README.md`))throw new ExploreError(404,'Source is outside the selected knowledge context.');
    const path=await realpath(resolve(target,body.source)).catch(()=>{throw new ExploreError(404,'Knowledge source no longer exists.');});const rel=relative(target,path);
    if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)||rel.split(sep).includes('.git'))throw new ExploreError(422,'Unsafe knowledge source.');
    const taskBase=body.source.match(/^(.*\/(?:changes\/change-[^/]+|versions\/\d+\.\d+\.\d+)\/tasks)\//)?.[1];if(taskBase){const directory=await realpath(resolve(target,taskBase));const taskRel=relative(directory,path);if(taskRel==='..'||taskRel.startsWith('..'+sep)||isAbsolute(taskRel))throw new ExploreError(422,'Unsafe task source.');}
    const bytes=await readFile(path),markdown=bytes.toString('utf8');if(!bytes.equals(Buffer.from(markdown)))throw new ExploreError(422,'Knowledge is not valid UTF-8.');data={source:body.source,markdown};documentBytes=digest(markdown);
   }else{
    const detailed=body.section==='artifacts'?overview:await scanRepository(target,{metadata:true,indexOnly:true,full,git:run});
    readState=detailed;readFull=body.section==='artifacts'?null:full;
    const filtered={...detailed,snapshot:{...detailed.snapshot,artifacts:detailed.snapshot.artifacts.map(a=>({...a,changes:a.changes.filter(c=>members.some(m=>m.artifact===a.id&&m.change===c.name))}))}};
    const changes=['workflow','history'].includes(body.section)?await evidenceFor(target,filtered,run,detailed.snapshot.repository.head,entry.diagnostics):[];
    if(unit){
     const units=body.section==='artifacts'?[unitSummary(unit,detailed.snapshot,target,detailed.files)]:await readUnitsOfWork(target,detailed,changes,run,checklist,{unit:body.unit});
     const result=units[0];result.loadState='loaded';
     if(body.section!=='completion'){result.completion={derivation:'not-loaded',reasons:['Completion evidence not loaded.'],sources:[]};result.evidence=result.evidence.map(e=>({...e,markdown:undefined}));}
     if(body.section!=='workflow')for(const m of result.members){m.workflow=null;m.knowledge=[];}
     if(body.section!=='implementation')result.implementationGraph={state:'not-loaded',nodes:[],edges:[],diagnostics:[]};
     data=stripBodies(result);
    }else if(body.section==='artifacts'){data=stripBodies(detailed.snapshot);data.loadState='loaded';
    }else{
     let change=changes.find(c=>c.artifact===body.artifact&&c.name===body.change);
     if(!change){const prefix=`docs/artifacts/${body.artifact}/changes/${body.change}/`;const {buildTaskGraph}=await import('./task-graph.js');change={...entry.changes.find(c=>c.artifact===body.artifact&&c.name===body.change),taskGraph:buildTaskGraph(detailed.files,prefix,checklist,detailed.unsafeTaskPaths)};}
     data=stripBodies(change);data.loadState='loaded';
    }
   }
  }
  // Resolve protected refs fresh per request, never from immutable-byte cache.
  if(body.section!=='overview'){const current=await scanRepository(target,{metadata:true,indexOnly:true,full:readFull,git});if(current.revision!==readState.revision||current.snapshot.repository.head!==overview.snapshot.repository.head||current.snapshot.repository.status!==overview.snapshot.repository.status)entry.diagnostics.push({code:'stale-response',path:'',message:'Repository changed while loading; reload this section.'});}
  if(documentBytes!==null){try{const current=await readFile(await realpath(resolve(target,body.source)),'utf8');if(digest(current)!==documentBytes)entry.diagnostics.push({code:'stale-response',path:body.source,message:'Knowledge changed while loading; reload this section.'});}catch{entry.diagnostics.push({code:'stale-response',path:body.source,message:'Knowledge disappeared while loading; reload this section.'});}}
  const refs=await Promise.all(['main','master'].map(ref=>git(target,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null)));
  const currentTrees=await git(root,['worktree','list','--porcelain','-z'],true);
  const originalTrees=await run(root,['worktree','list','--porcelain','-z'],true);
  if(JSON.stringify(refs)!==JSON.stringify(initialRefs)){entry.diagnostics.push({code:'stale-response',path:'',message:'Protected refs changed while loading; reload this section.'});}
  if(currentTrees!==originalTrees){entry.diagnostics.push({code:'stale-response',path:'',message:'Registered worktrees changed while loading; reload this section.'});}
  if(entry.diagnostics.some(d=>d.code==='stale-response')&&data.completion)data.completion={derivation:'unknown',reasons:['Inputs changed while loading.'],sources:[]};
  const revision=digest([overview.snapshot.repository,refs,readState.revision,documentBytes]);
  const diagnostics=[...entry.diagnostics,...(data.diagnostics||[])];
  const incomplete=diagnostics.some(d=>/missing|unavailable|unsafe|invalid|ambiguous|stale/.test(d.code))||data.implementationGraph?.state==='invalid'||body.section==='implementation'&&data.implementationGraph?.state==='unavailable';
  return {repository:initial.snapshot.repository,worktree:target,section:body.section,context,revision,completeness:incomplete?'partial':'complete',data,diagnostics};
 }finally{run.close();}
}
