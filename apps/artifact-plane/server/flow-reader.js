import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {scanRepository,git,ExploreError} from './reader.js';
import {parseWorktrees} from './workflow.js';
import {unitBriefs} from './units-of-work.js';
import {buildFlowGraph,safeFlowSource} from './flow-model.js';
import {parseArtifact,buildSnapshot} from '../src/model.js';

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
  if(roots?.length){const selected=await realpath(path).catch(()=>null),allowed=await Promise.all(roots.map(p=>realpath(p).catch(()=>null)));if(!selected||!allowed.includes(selected))throw new ExploreError(403,'Repository is not configured for this agent server.');}
  const base=await scanRepository(path,{metadata:true,historicalKnowledge:true,full:p=>p.includes('/specifications/flows/')});
  const root=base.snapshot.repository.path;
  const worktrees=parseWorktrees(await git(root,['worktree','list','--porcelain','-z'],true));
  const target=worktree?await realpath(worktree).catch(()=>null):root;
  if(!target||!worktrees.some(w=>w.path===target))throw new ExploreError(422,'Select a registered readable worktree.');
  const scan=target===root?base:await scanRepository(target,{metadata:true,historicalKnowledge:true,full:p=>p.includes('/specifications/flows/')});
  let snapshot=scan.snapshot;
  const head=await git(target,['rev-parse','HEAD']);
  const refs=await Promise.all(['main','master'].map(ref=>git(target,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null)));
  if(knowledge==='established'){
    const files=new Map(scan.files),diagnostics=[];
    // Root declarations and reference resolution use the same protected context.
    // A branch's proposed DAG index cannot override protected root declarations.
    files.delete('docs/artifacts/dag.yaml');
    for(const artifact of snapshot.artifacts){
      const declarations=[];
      for(const [i,ref] of ['main','master'].entries())if(refs[i]){
        const body=await git(target,['show',`${ref}:docs/artifacts/${artifact.id}/README.md`]).catch(()=>null);
        if(body){const errors=[],parsed=parseArtifact(artifact.id,body,errors);declarations.push({body,parsed,errors});}
      }
      const signatures=declarations.map(d=>JSON.stringify([d.parsed.currentVersion,[...d.parsed.dependsOn].sort()]));
      const path=`docs/artifacts/${artifact.id}/README.md`;
      if(declarations.length&&new Set(signatures).size===1&&!declarations.some(d=>d.errors.length))files.set(path,declarations[0].body);
      else{files.set(path,`---\ncurrent_version: null\ndepends_on: []\n---\n# ${artifact.id}\n`);diagnostics.push({code:'unavailable-flow-baseline',path,message:'No unambiguous protected-ref flow baseline is available.'});}
    }
    snapshot=buildSnapshot(files,snapshot.repository,diagnostics);
  }
  // Keep historical knowledge available without confusing it with current roots.
  const known=new Set(snapshot.artifacts.flatMap(a=>a.elements.map(e=>e.id)));
  for(const [file,markdown] of scan.files){
    const m=file.match(/^docs\/artifacts\/([^/]+)\/versions\/(\d+\.\d+\.\d+)\/((?:requirements|specifications|decisions)\/.+\.md)$/);
    if(!m)continue;const artifact=snapshot.artifacts.find(a=>a.id===m[1]),source='version:'+m[2],id=JSON.stringify([m[1],source,m[3]]);
    if(artifact&&!known.has(id)){artifact.elements.push({id,artifact:m[1],source,path:m[3],file,markdown});known.add(id);}
  }
  const graph=buildFlowGraph(snapshot,{context:target,knowledge});
  graph.diagnostics.push(...snapshot.diagnostics.filter(d=>d.code!=='redundant-proposal'));
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
  const paths=[...new Set([...graph.flows.map(f=>f.file),...sources.map(s=>s.path)])],trees=[];
  for(const [i,ref] of ['main','master'].entries())if(refs[i]&&paths.length){
    const tree=await git(target,['ls-tree','-r','-z','--format=%(objectname)%x09%(path)',ref,'--',...paths],true).catch(()=>null);
    if(tree!==null)trees.push({ref,entries:new Map(tree.split('\0').filter(Boolean).map(row=>{const i=row.indexOf('\t');return [row.slice(i+1),row.slice(0,i)];}))});
  }
  const publication=(path,text)=>{
    for(const {ref,entries} of trees){const hash=entries.get(path);if(!hash)continue;const bytes=Buffer.from(text),blob=createHash(hash.length===64?'sha256':'sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if(blob===hash)return {state:'published-source',ref,reason:'Source bytes match the protected ref; full artifact establishment still requires applicable delivery evidence.'};}
    return {state:trees.length?'proposed':'unknown',reason:'Source bytes are not confirmed on an available protected ref; source changes require reassessment, not an inferred workflow state.'};
  };
  for(const flow of graph.flows)flow.sourcePublication=publication(flow.file,flow.markdown);
  for(const source of sources)source.sourcePublication=publication(source.path,source.text);
  if(knowledge==='established')for(const flow of graph.flows)if(flow.sourcePublication.state!=='published-source')graph.diagnostics.push({code:'unpublished-flow-source',path:flow.file,message:'Declared version flow bytes differ from the protected baseline; do not treat this as confirmed established knowledge.'});
  const fingerprint=sourceDigest(JSON.stringify([scan.revision,head,refs,sources.map(s=>[s.id,s.fingerprint]),graph.diagnostics,units.map(u=>[u.id,u.affectedFlows,u.flowAssessment])]));
  return {repository:base.snapshot.repository,worktree:target,snapshot,graph,sources,units,tracked,revision:fingerprint,knowledge,protectedRefs:refs};
}
