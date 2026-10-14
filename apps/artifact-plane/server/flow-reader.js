import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {scanRepository,git,ExploreError} from './reader.js';
import {parseWorktrees} from './workflow.js';
import {unitBriefs} from './units-of-work.js';
import {buildFlowGraph,safeFlowSource} from './flow-model.js';

export const sourceDigest = bytes => createHash('sha256').update(bytes).digest('hex');
const contained = (root,path) => {const r=relative(root,path);return r!== '..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
export async function readFlowSource(root, source, tracked) {
  if(!safeFlowSource(source.path))throw new ExploreError(422,'Unsafe flow source.');
  const path=await realpath(resolve(root,source.path)).catch(()=>null);
  if(!path||!contained(root,path)||!safeFlowSource(relative(root,path).split(sep).join('/')))throw new ExploreError(422,'Flow source is missing or leaves its worktree.');
  if(['implementation','test','evidence'].includes(source.kind)&&(!tracked.has(source.path)||!tracked.has(relative(root,path).split(sep).join('/'))))throw new ExploreError(422,'Flow source must be a tracked file.');
  const info=await stat(path);if(!info.isFile()||info.size>1024*1024)throw new ExploreError(422,'Flow source must be a text file of at most 1 MiB.');
  const bytes=await readFile(path),text=bytes.toString('utf8');if(!bytes.equals(Buffer.from(text)))throw new ExploreError(422,'Flow source is not UTF-8 text.');
  return {...source,text,fingerprint:sourceDigest(bytes)};
}

export async function readFlowRepository(path, {worktree,knowledge='planning',roots}={}) {
  const base=await scanRepository(path,{metadata:true,full:p=>p.includes('/specifications/flows/')});
  const root=base.snapshot.repository.path;
  if(roots?.length){const allowed=await Promise.all(roots.map(p=>realpath(p).catch(()=>null)));if(!allowed.includes(root))throw new ExploreError(403,'Repository is not configured for this agent server.');}
  const worktrees=parseWorktrees(await git(root,['worktree','list','--porcelain','-z'],true));
  const target=worktree?await realpath(worktree).catch(()=>null):root;
  if(!target||!worktrees.some(w=>w.path===target))throw new ExploreError(422,'Select a registered readable worktree.');
  const scan=target===root?base:await scanRepository(target,{metadata:true,full:p=>p.includes('/specifications/flows/')});
  const snapshot=scan.snapshot;
  // Keep historical knowledge available without confusing it with current roots.
  const known=new Set(snapshot.artifacts.flatMap(a=>a.elements.map(e=>e.id)));
  for(const [file,markdown] of scan.files){
    const m=file.match(/^docs\/artifacts\/([^/]+)\/versions\/(\d+\.\d+\.\d+)\/((?:requirements|specifications|decisions)\/.+\.md)$/);
    if(!m)continue;const artifact=snapshot.artifacts.find(a=>a.id===m[1]),source='version:'+m[2],id=JSON.stringify([m[1],source,m[3]]);
    if(artifact&&!known.has(id)){artifact.elements.push({id,artifact:m[1],source,path:m[3],file,markdown});known.add(id);}
  }
  const graph=buildFlowGraph(snapshot,{context:target,knowledge});
  const tracked=new Set((await git(target,['ls-files','-z'],true)).split('\0').filter(Boolean));
  const sources=[];
  for(const source of graph.sources){
    try{sources.push(await readFlowSource(target,source,tracked));}
    catch(error){graph.diagnostics.push({code:'unavailable-flow-source',path:source.path,message:error.message});
      for(const edge of graph.edges.filter(e=>e.target===source.id&&e.kind==='supports'))edge.resolved=false;
      for(const f of graph.flows)for(const s of f.support.filter(s=>s.targetId===source.id))s.resolved=false;
    }
  }
  for(const flow of graph.flows)for(const support of flow.support)for(const path of support.evidence||[]){
    const source={id:JSON.stringify([target,'evidence',path]),path,kind:'evidence'};
    try{if(!sources.some(s=>s.id===source.id))sources.push(await readFlowSource(target,source,tracked));}
    catch(error){graph.diagnostics.push({code:'unavailable-flow-evidence',path,message:error.message});}
  }
  const units=unitBriefs(scan.files);
  for(const unit of units)for(const f of unit.affectedFlows||[])if(!snapshot.artifacts.some(a=>a.id===f.artifact))unit.diagnostics.push({code:'unknown-flow-owner',path:unit.path,message:'Affected flow owner does not exist.'});
  const head=await git(target,['rev-parse','HEAD']);
  const refs=await Promise.all(['main','master'].map(ref=>git(target,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null)));
  for(const flow of graph.flows){
    flow.sourcePublication={state:refs.some(Boolean)?'proposed':'unknown',reason:'Source bytes are not confirmed on an available protected ref; this is not an artifact-establishment verdict.'};
    for(const [i,ref] of ['main','master'].entries())if(refs[i]){
      const bytes=await git(target,['show',`${ref}:${flow.file}`],'bytes').catch(()=>null);
      if(bytes&&bytes.equals(Buffer.from(flow.markdown))){flow.sourcePublication={state:'published-source',ref,reason:'These flow-source bytes match the protected ref; full artifact establishment still requires applicable delivery evidence.'};break;}
    }
  }
  const fingerprint=sourceDigest(JSON.stringify([scan.revision,head,refs,sources.map(s=>[s.id,s.fingerprint]),graph.diagnostics,units.map(u=>[u.id,u.affectedFlows,u.flowAssessment])]));
  return {repository:base.snapshot.repository,worktree:target,snapshot,graph,sources,units,tracked,revision:fingerprint,knowledge,protectedRefs:refs};
}
