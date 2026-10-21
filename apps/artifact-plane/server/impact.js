// Change impact service: resolves origins, propagates through typed declared and
// derived relationships with the ADD change-impact rules, and explains every entity.
// Declared knowledge comes from the flow reader; derived relations from the impact index.
import {realpath,readFile} from 'node:fs/promises';
import {resolve,isAbsolute,posix} from 'node:path';
import {createHash} from 'node:crypto';
import {ExploreError} from './reader.js';
import {parseWorktrees} from './workflow.js';
import {readFlowRepository} from './flow-reader.js';
import {createImpactIndex,git,parseModule,isTestFile} from './impact-index.js';
import {gitReads} from './git-reads.js';
import {defaultStateDir} from './runtime-store.js';

const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const RECORD=/^docs\/artifacts\/[^/]+\/(changes|versions)\//;
const KNOWLEDGE=/^docs\/artifacts\/([^/]+)\/(requirements|specifications|decisions)\/(.+\.md)$/;
export const STRENGTHS=['declared+observed','declared+documented','declared+static','static+symbol','static','declared+inferred','historical','lexical'];
const RANK=Object.fromEntries(STRENGTHS.map((s,i)=>[s,i]));
const FIELDS=['path','worktree','knowledge','origins','commit','range','diff','depth','budget','format','limit','unit'];
const safeId=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(v);
const safeRef=v=>typeof v==='string'&&v.length<=200&&/^[\w./^~-]+$/.test(v)&&!v.startsWith('-');

export function validateQuery(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!FIELDS.includes(k)))throw new ExploreError(400,'Unsupported impact query fields.');
  if(typeof body.path!=='string'||!isAbsolute(body.path)||body.path.includes('\0'))throw new ExploreError(400,'Select an absolute repository path.');
  if(body.worktree!==undefined&&(typeof body.worktree!=='string'||!isAbsolute(body.worktree)||body.worktree.includes('\0')))throw new ExploreError(400,'Select an absolute worktree.');
  const modes=['origins','commit','range','diff'].filter(k=>body[k]!==undefined);
  if(modes.length!==1)throw new ExploreError(422,'Select exactly one of origins, commit, range or diff.');
  if(body.origins!==undefined&&(!Array.isArray(body.origins)||!body.origins.length||body.origins.length>100||!body.origins.every(o=>o&&typeof o==='object'&&!Array.isArray(o)&&['path','element','flow','step','model'].filter(k=>o[k]!==undefined).length===1&&Object.keys(o).every(k=>['path','element','flow','step','model','symbols','commit'].includes(k))&&(o.symbols===undefined||Array.isArray(o.symbols)&&o.symbols.every(s=>typeof s==='string'&&s.length<200))&&(o.commit===undefined||safeRef(o.commit))&&Object.entries(o).filter(([k])=>k!=='symbols'&&k!=='commit').every(([,v])=>typeof v==='string'&&v.length>0&&v.length<2000&&!v.includes('\0')))))throw new ExploreError(422,'Select up to 100 origins, each with one of path, element, flow, step or model.');
  if(body.commit!==undefined&&!safeRef(body.commit)||body.range!==undefined&&!safeRef(body.range))throw new ExploreError(422,'Select a safe commit or range.');
  if(body.diff!==undefined&&(!body.diff||typeof body.diff!=='object'||Object.keys(body.diff).some(k=>k!=='base')||body.diff.base!==undefined&&body.diff.base!=='protected'&&!safeRef(body.diff.base)))throw new ExploreError(422,'diff takes base: protected or a safe ref.');
  const depth=body.depth??2,budget=body.budget??8000,limit=body.limit??25,format=body.format??'json';
  if(!Number.isInteger(depth)||depth<1||depth>4||!Number.isInteger(budget)||budget<0||budget>100000||!Number.isInteger(limit)||limit<1||limit>200||!['json','text'].includes(format))throw new ExploreError(422,'Invalid depth, budget, limit or format.');
  if(body.unit!==undefined&&!safeId(body.unit))throw new ExploreError(422,'Invalid unit selector.');
  const knowledge=body.knowledge??'planning';
  if(!['planning','established','all'].includes(knowledge))throw new ExploreError(422,'Invalid knowledge selector.');
  return {...body,knowledge,depth,budget,limit,format};
}

// Contract vocabulary of a document: code spans, snake_case and camelCase tokens, front matter keys.
export function knowledgeTerms(text){
  const out=new Set();
  for(const m of text.matchAll(/`([^`\n]{2,60})`/g))for(const t of m[1].match(/[A-Za-z_][\w-]{2,}/g)||[])out.add(t);
  for(const m of text.matchAll(/\b[a-z]+_[a-z_]+\b|\b[a-z]+[A-Z][A-Za-z]+\b/g))out.add(m[0]);
  const front=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);if(front)for(const m of front[1].matchAll(/^\s*([A-Za-z_][\w-]*)\s*:/gm))out.add(m[1]);
  return [...out].filter(t=>t.length>=3);
}
export function changedSections(text,lines){
  const out=new Set();let current='(top)';const all=text.split('\n');
  for(let i=0;i<all.length;i++){const h=all[i].match(/^#{1,6}[ \t]+(.+?)[ \t]*\r?$/);if(h)current=h[1];if(lines.has(i+1))out.add(current);}
  return [...out];
}
// One unified diff (-U0, -M) for all files: status, rename source, added and removed line numbers, added text.
export function parseUnifiedDiff(text){
  const files=new Map();let current=null;let oldLine=0,newLine=0;
  const unquote=p=>{p=p.replace(/^"|"$/g,'');return p.replace(/^[ab]\//,'');};
  for(const line of text.split('\n')){
    if(line.startsWith('diff --git ')){const m=line.match(/^diff --git (?:"?a\/[^"]*"?) ("?b\/.*"?)$/);const path=m?unquote(m[1]):line.slice(11).split(' b/').pop();current={path,status:'modified',from:null,added:new Set(),removed:new Set(),addedLines:[]};files.set(path,current);continue;}
    if(!current)continue;
    if(line.startsWith('rename from ')){current.from=unquote(line.slice(12));current.status='renamed';continue;}
    if(line.startsWith('rename to ')){const to=unquote(line.slice(10));if(to!==current.path){files.delete(current.path);current.path=to;files.set(to,current);}continue;}
    if(line.startsWith('new file mode')){current.status='added';continue;}
    if(line.startsWith('deleted file mode')){current.status='deleted';continue;}
    if(line.startsWith('+++ ')){const p=line.slice(4).trim();if(p!=='/dev/null'){const to=unquote(p);if(to!==current.path){files.delete(current.path);current.path=to;files.set(to,current);}}continue;}
    if(line.startsWith('--- ')||line.startsWith('index ')||line.startsWith('similarity ')||line.startsWith('old mode')||line.startsWith('new mode')||line.startsWith('Binary files'))continue;
    const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if(h){oldLine=+h[1];newLine=+h[3];continue;}
    if(line.startsWith('+')){current.added.add(newLine);current.addedLines.push(line.slice(1));newLine++;continue;}
    if(line.startsWith('-')){current.removed.add(oldLine);oldLine++;continue;}
  }
  for(const c of files.values()){c.addedText=c.addedLines.join('\n');delete c.addedLines;}
  return files;
}
function declarationsHit(text,lines,path){const {declarations,failed}=parseModule(text,path);if(failed)return null;const hit=new Set();for(const d of declarations)for(const line of lines)if(line>=d.start&&line<=d.end){hit.add(d.name);break;}return [...hit];}

// Affected exports of one module when the given local names are affected (in-file closure).
export function affectedExports(declarations,affectedLocals){
  if(!declarations)return new Set(['*']);
  if(affectedLocals.has('*'))return new Set(['*']);
  const affected=new Set(),names=new Set(affectedLocals);let grew=true;
  while(grew){grew=false;for(const d of declarations){if(affected.has(d.name))continue;if(d.mentions.some(m=>names.has(m))){affected.add(d.name);if(!d.name.startsWith('('))names.add(d.name);grew=true;}}}
  const out=new Set();
  for(const d of declarations){if(!affected.has(d.name))continue;
    if(d.name==='(statement)'||d.name==='(export all)')return new Set(['*']);
    if(d.name==='(export list)'){for(const x of d.exportNames)if(names.has(x.local))out.add(x.exported);}
    else if(d.exported){for(const x of d.exportNames.length?d.exportNames:[{exported:d.name}])out.add(x.exported);}}
  return out;
}

export function createImpactService({stateDir=defaultStateDir(),roots=[],loader=readFlowRepository,index}={}){
  const impactIndex=index??createImpactIndex({stateDir,roots});
  const knowledgeCache=new Map();
  async function snapshotState(worktree){const [heads,status]=await Promise.all([git(worktree,['show-ref','--heads','--head'],true).catch(()=>''),git(worktree,['status','--porcelain=v1','-z','--untracked-files=no'],true).catch(()=>'')]);const head=heads.split('\n').find(l=>l.endsWith(' HEAD'))?.split(' ')[0]||'';return {head,status,print:digest([heads,status])};}
  const graphCache=new Map();
  async function knowledge(root,worktree,print,selector='planning'){const key=digest([root,worktree,print,selector]);if(knowledgeCache.has(key))return knowledgeCache.get(key);const record=await loader(root,{worktree,knowledge:selector,roots});if(knowledgeCache.size>=4)knowledgeCache.delete(knowledgeCache.keys().next().value);knowledgeCache.set(key,record);return record;}
  async function protectedRef(worktree){for(const ref of ['main','master'])if(await git(worktree,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null))return ref;return null;}

  // Origins: what changed, with declarations, sections, terms, renames and deletions.
  // One unified diff per query; texts through the batch reader.
  async function resolveOrigins(body,worktree,relations,record){
    const origins=[],unresolved=[];
    const tracked=relations.files;
    const reads=gitReads(git);
    try{
      const diffs=new Map(); // key -> {files: Map(path -> change), oldRev, newRev, working}
      const addDiff=async(key,args,oldRev,newRev,working)=>{if(diffs.has(key))return diffs.get(key);const text=await git(worktree,args,true).catch(()=>{throw new ExploreError(422,`${key} cannot be read.`);});const value={files:parseUnifiedDiff(text),oldRev,newRev,working};diffs.set(key,value);return value;};
      const statusOf=c=>c.status;
      if(body.origins){
        for(const o of body.origins){
          if(o.path!==undefined){const path=o.path.replace(/^\.\//,'');const entry={path,status:'modified',symbols:o.symbols};
            if(o.commit){const d=await addDiff('commit:'+o.commit,['show','-U0','-M','--src-prefix=a/','--dst-prefix=b/','--format=',o.commit],o.commit+'^',o.commit,false);const c=d.files.get(path);if(c){entry.status=statusOf(c);entry.from=c.from;entry.change=c;entry.diff=d;}}
            origins.push(entry);continue;}
          if(o.element){const [artifact,...rest]=o.element.split(':');const el=record.snapshot.artifacts.find(a=>a.id===artifact)?.elements.find(e=>e.source==='working'&&e.path===rest.join(':'));if(el)origins.push({path:el.file,status:'modified',id:o.element});else unresolved.push({entity:o.element,reason:'Element is not in the working knowledge of this worktree.'});continue;}
          if(o.flow||o.step){const logical=o.flow||o.step.split(':').slice(0,2).join(':');const flow=record.graph.flows.find(f=>f.logicalId===logical);if(!flow){unresolved.push({entity:o.flow||o.step,reason:'Flow does not exist in the selected knowledge.'});continue;}
            if(o.step){const stepId=o.step.split(':')[2];if(!flow.steps.some(s=>s.id===stepId)){unresolved.push({entity:o.step,reason:'Step does not exist in the flow.'});continue;}origins.push({path:flow.file,status:'modified',id:o.step,step:stepId,sections:[stepId]});}
            else origins.push({path:flow.file,status:'modified',id:o.flow});continue;}
          if(o.model){const logical=o.model.replace(/^model:/,''),node=record.graph.nodes.find(n=>n.kind==='model'&&n.logicalId===logical);if(node)origins.push({path:`model:${logical}`,status:'modified',id:o.model,model:logical});else unresolved.push({entity:o.model,reason:'Model is not declared in the selected knowledge.'});}
        }
      }else{
        let d;
        if(body.commit)d=await addDiff('commit:'+body.commit,['show','-U0','-M','--src-prefix=a/','--dst-prefix=b/','--format=',body.commit],body.commit+'^',body.commit,false);
        else if(body.range){const three=body.range.indexOf('...'),two=body.range.indexOf('..');let oldRev,newRev,working=false;
          if(three>=0){const [a,b]=[body.range.slice(0,three),body.range.slice(three+3)||'HEAD'];oldRev=await git(worktree,['merge-base',a,b]).catch(()=>a);newRev=b;}
          else if(two>=0){oldRev=body.range.slice(0,two);newRev=body.range.slice(two+2)||'HEAD';}
          else{oldRev=body.range;newRev=null;working=true;}
          d=await addDiff('range:'+body.range,['diff','-U0','-M','--src-prefix=a/','--dst-prefix=b/',body.range],oldRev,newRev,working);}
        else{const base=body.diff.base&&body.diff.base!=='protected'?body.diff.base:await protectedRef(worktree);if(!base)throw new ExploreError(422,'No protected branch is available for the difference.');d=await addDiff('diff:'+base,['diff','-U0','-M','--src-prefix=a/','--dst-prefix=b/',base],base,null,true);}
        for(const [path,c] of d.files)origins.push({path,status:statusOf(c),from:c.from,ref:d.oldRev,change:c,diff:d});
      }
      // Detail per origin: declarations and sections from the change, or the whole document. Texts come from one batch reader.
      // A model origin starts at its model entity, not at its declaring document.
      await Promise.all(origins.map(async o=>{
        if(o.model)return;
        const known=tracked.has(o.path);
        if(!known&&o.status!=='deleted'){let hint='not tracked at this revision';try{const log=await git(worktree,['log','-1','-M','--diff-filter=DR','--name-status','--format=%h','--',o.path]);if(log){const [h,row]=log.split('\n');const parts=(row||'').split('\t');hint=parts[0]?.startsWith('R')?`renamed to ${parts[2]} in ${h}`:`deleted in ${h}`;}}catch{}o.status='unknown';o.reason=`Path is ${hint}.`;return;}
        const js=/\.(m?js|jsx)$/.test(o.path),md=o.path.endsWith('.md');
        const text=async(rev,path)=>rev===null?readFile(resolve(worktree,path),'utf8').catch(()=>null):reads(worktree,['show',`${rev}:${path}`],true).catch(()=>null);
        if(o.change&&o.status!=='deleted'&&(js||md)){const c=o.change,d=o.diff;
          if(js&&o.symbols===undefined){const [newText,oldText]=await Promise.all([text(d.working?null:d.newRev,o.path),c.status==='added'?null:text(d.oldRev,o.from||o.path)]);
            const names=new Set();for(const [t,lines] of [[newText,c.added],[oldText,c.removed]]){if(t===null||t===undefined)continue;const hit=declarationsHit(t,lines,o.path);if(hit===null){names.add('*');break;}for(const n of hit)names.add(n);}o.symbols=[...names];}
          if(md){const t=await text(d.working?null:d.newRev,o.path);o.sections=changedSections(t||'',c.added);o.terms=knowledgeTerms(c.addedText);}
        }else if(md&&o.status!=='deleted'&&!o.terms){const t=await readFile(resolve(worktree,o.path),'utf8').catch(()=>'');o.terms=knowledgeTerms(t);if(!o.sections)o.sections=[...new Set((t.match(/^#{1,6}[ \t]+[^\n]+/gm)||[]).map(h=>h.replace(/^#+[ \t]+/,'').trim()))];}
        if(js&&o.symbols?.includes('*'))o.symbols=undefined;
      }));
    }finally{reads.close();}
    for(const o of origins){delete o.change;delete o.diff;if(o.ref===undefined)delete o.ref;}
    return {origins,unresolved};
  }

  function buildGraph(relations,record){
    const rev=new Map(),nodes=new Map();
    const node=(id,kind,extra={})=>{if(!nodes.has(id))nodes.set(id,{id,kind,...extra});return nodes.get(id);};
    const add=(dep,dependent,kind,evidence={})=>{if(!rev.has(dep))rev.set(dep,[]);rev.get(dep).push({dependent,kind,evidence});};
    for(const [f,kind] of relations.files)node(f,kind);
    for(const e of relations.imports)add(e.to,e.from,'imports',{names:e.names,locals:e.locals,dynamic:e.dynamic});
    for(const p of relations.packages){node(p.dir,'go-package');for(const i of p.imports){node(i.dir,'go-package');add(i.dir,p.dir,'go-imports',{test:i.test});}}
    for(const e of relations.embeds)add(e.target,e.file,'embeds',{pattern:e.pattern});
    for(const [hash,paths] of relations.mirrors)for(const a of paths)for(const b of paths)if(a!==b)add(a,b,'mirror',{hash:hash.slice(0,12),same:!relations.diverged.has(a)&&!relations.diverged.has(b)});
    const goFiles=[...relations.files.keys()].filter(f=>f.endsWith('.go'));
    for(const f of goFiles){const dir=posix.dirname(f);node(dir,'go-package');add(f,dir,'package-of',{});if(/_test\.go$/.test(f))for(const g of goFiles.filter(g=>posix.dirname(g)===dir&&!/_test\.go$/.test(g)))add(g,f,'same-package-test',{});}
    const elements=new Map();for(const a of record.snapshot.artifacts)for(const e of a.elements)if(e.source==='working'||!a.layout||a.layout==='legacy')elements.set(e.id,e);
    for(const r of record.snapshot.references||[]){if(!r.resolved)continue;const consumer=elements.get(r.consumer),target=elements.get(r.targetId);if(!consumer||!target)continue;node(consumer.file,'element',{artifact:consumer.artifact,element:consumer.logicalId||`${consumer.artifact}:${consumer.path}`});node(target.file,'element',{artifact:target.artifact});add(target.file,consumer.file,'references',{reason:r.reason,status:r.status});}
    const flowFile=new Map(record.graph.flows.map(f=>[f.logicalId,f.file]));
    for(const f of record.graph.flows){
      node(f.file,'element',{artifact:f.artifact});node(`flow:${f.logicalId}`,'flow',{title:f.title,file:f.file,artifact:f.artifact});
      for(const st of f.steps)node(`step:${f.logicalId}:${st.id}`,'step',{flow:f.logicalId,title:st.title,artifact:f.artifact});
      for(const sp of f.support){const target=sp.kind==='flow'?flowFile.get(`${sp.artifact}:${sp.flow}`):(sp.file||sp.path);if(!target)continue;
        if(['implementation','test'].includes(sp.kind))node(target,isTestFile(target)?'test':'module');else node(target,'element',{artifact:sp.artifact});
        for(const st of f.steps.filter(s=>s.supports.includes(sp.id)))add(target,`step:${f.logicalId}:${st.id}`,'supports',{support:sp.id,supportKind:sp.kind,basis:sp.basis,requires:sp.requires,symbol:sp.symbol,resolved:sp.resolved!==false});}
      for(const p of f.participants||[]){const id=`model:${p.artifact}:${p.model}`;node(id,'model',{artifact:p.artifact});add(id,`flow:${f.logicalId}`,'participates',{requires:p.requires,resolved:p.resolved!==false});}
    }
    for(const n of record.graph.nodes.filter(n=>n.kind==='model')){const id=`model:${n.logicalId}`;node(id,'model',{artifact:n.artifact}).title=n.title;if(n.file)add(n.file,id,'declares',{});for(const s of n.sources||[]){const file=`docs/artifacts/${n.artifact}/${s}`;node(file,'element',{artifact:n.artifact});add(file,id,'describes',{});}}
    return {rev,nodes,flowFile};
  }

  function propagate({origins,graph,relations,depth}){
    const {rev}=graph;const reached=new Map(),notes=[],verify=[],unresolved=[];const originIds=new Set();
    for(const o of origins){if(o.status==='unknown')continue;originIds.add(o.path);
      const locals=o.symbols?.length?new Set(o.symbols):new Set(['*']);const decls=relations.declarations.get(o.path);
      const exports=decls?affectedExports(decls,locals):new Set(['*']);
      reached.set(o.path,{hop:0,paths:[[]],via:new Set([o.path]),origin:o,exports});
      if(o.symbols?.length&&exports.size===0)notes.push({entity:o.path,note:`changed declarations (${o.symbols.join(', ')}) reach no export; importers are not affected`});
      if(o.path.endsWith('.go')){const dir=posix.dirname(o.path);if(!reached.has(dir)){reached.set(dir,{hop:0,paths:[[{from:o.path,to:dir,kind:'package-of',evidence:{}}]],via:new Set([o.path]),origin:o});}}}
    const queue=[...reached.keys()];let frontier=0;
    for(let i=0;i<queue.length;i++){
      const id=queue[i],cur=reached.get(id);
      for(const e of rev.get(id)||[]){
        if(e.kind==='mirror'&&cur.hop>0)continue;
        if(cur.hop>=depth){frontier++;continue;}
        const hop=cur.hop+1,evidence={...e.evidence};let exportsNext=new Set(['*']);
        if(e.kind==='imports'){const ex=cur.exports||new Set(['*']);
          if(!ex.has('*')){const matched=e.evidence.names.map((n,k)=>({n,local:e.evidence.locals?.[k]||n})).filter(x=>x.n==='*'||x.n==='default'||ex.has(x.n));
            if(!matched.length){notes.push({entity:e.dependent,note:`imports ${e.evidence.names.join(', ')} from ${id}; affected exports are ${[...ex].join(', ')||'none'}`});continue;}
            evidence.symbolMatch=true;evidence.matched=matched.map(x=>x.n);exportsNext=affectedExports(relations.declarations.get(e.dependent),new Set(matched.map(x=>x.n==='*'||x.n==='default'?'*':x.local)));}
          else{evidence.symbolMatch=false;exportsNext=affectedExports(relations.declarations.get(e.dependent),new Set(['*']));}}
        else if(cur.exports&&!cur.exports.has('*')&&cur.exports.size===0)continue;
        if(e.kind==='supports'&&e.evidence.supportKind==='test'){const parts=e.dependent.split(':');verify.push({flow:'flow:'+parts.slice(1,-1).join(':'),step:parts.at(-1),test:id,hops:hop,basis:e.evidence.basis,requires:e.evidence.requires});continue;}
        if(e.kind==='supports'&&e.evidence.resolved===false){unresolved.push({entity:e.dependent,reason:`support ${e.evidence.support} on ${id} does not resolve.`});continue;}
        if(e.kind==='supports'&&cur.hop===0&&e.evidence.symbol){const syms=cur.origin?.symbols;if(syms?.length&&!syms.includes(e.evidence.symbol)){notes.push({entity:e.dependent,potential:true,note:`declared symbol ${e.evidence.symbol} is not among the changed declarations (${syms.join(', ')})`,path:[...cur.paths[0],{from:id,to:e.dependent,kind:'supports',evidence}]});continue;}}
        const step={from:id,to:e.dependent,kind:e.kind,evidence};const entry=reached.get(e.dependent);
        if(!entry){reached.set(e.dependent,{hop,paths:[[...cur.paths[0],step]],via:new Set(cur.via),exports:exportsNext});queue.push(e.dependent);}
        else{if(entry.hop===hop&&entry.paths.length<3)entry.paths.push([...cur.paths[0],step]);for(const v of cur.via)entry.via.add(v);if(entry.exports&&!entry.exports.has('*'))for(const x of exportsNext)entry.exports.add(x);}
        const lift=(flowId,extra)=>{const file=graph.flowFile.get(flowId.slice(5));if(!reached.has(flowId)){reached.set(flowId,{hop,paths:[[...cur.paths[0],step,...extra]],via:new Set(cur.via)});queue.push(flowId);}if(file&&!reached.has(file)){reached.set(file,{hop,paths:[[...cur.paths[0],step,...extra,{from:flowId,to:file,kind:'defines',evidence:{}}]],via:new Set(cur.via),virtual:true});queue.push(file);}};
        if(e.dependent.startsWith('step:'))lift('flow:'+e.dependent.split(':').slice(1,-1).join(':'),[{from:e.dependent,to:'flow:'+e.dependent.split(':').slice(1,-1).join(':'),kind:'contains',evidence:{}}]);
        else if(e.dependent.startsWith('flow:'))lift(e.dependent,[]);
      }
    }
    return {reached,notes,verify,unresolved,frontier,originIds};
  }

  const strength=edge=>edge.kind==='supports'?`declared+${edge.evidence.basis}`:['references','participates','describes','declares'].includes(edge.kind)?'declared':edge.kind==='imports'?(edge.evidence.symbolMatch?'static+symbol':'static'):'static';
  const describe=p=>p.map(x=>({via:x.kind,from:x.from,to:x.to,...(x.evidence.requires?{reason:x.evidence.requires}:{}),...(x.evidence.basis?{basis:x.evidence.basis}:{}),...(x.evidence.matched?{symbols:x.evidence.matched}:x.evidence.names?{imports:x.evidence.names}:{}),...(x.evidence.reason?{reason:x.evidence.reason}:{}),...(x.kind==='mirror'?{sameBytes:x.evidence.same!==false}:{}),...(x.evidence.pattern?{pattern:x.evidence.pattern}:{}),...(x.evidence.status?{status:x.evidence.status}:{})}));

  async function execute(raw){
    const body=validateQuery(raw);const started=performance.now();const phases={};let phase=started;const mark=k=>{phases[k]=+(performance.now()-phase).toFixed(1);phase=performance.now();};
    const root=await realpath(body.path).catch(()=>{throw new ExploreError(404,'Repository path does not exist or cannot be read.');});
    if(roots.length){const allowed=await Promise.all(roots.map(p=>realpath(p).catch(()=>null)));if(!allowed.includes(root))throw new ExploreError(403,'Repository is not configured for this agent server.');}
    const worktrees=parseWorktrees(await git(root,['worktree','list','--porcelain','-z'],true).catch(()=>{throw new ExploreError(422,'Select a readable Git worktree root.');}));
    const worktree=body.worktree?await realpath(body.worktree).catch(()=>null):root;
    if(!worktree||!worktrees.some(w=>w.path===worktree))throw new ExploreError(422,'Select a registered readable worktree.');
    mark('validateMs');const state=await snapshotState(worktree);const print=state.print;mark('stateMs');
    const update=await impactIndex.update(root,worktree,{head:state.head,status:state.status});const relations=impactIndex.relations(root,worktree);mark('indexMs');
    const record=await knowledge(root,worktree,print,body.knowledge);mark('knowledgeMs');
    const {origins,unresolved:unresolvedOrigins}=await resolveOrigins(body,worktree,relations,record);mark('originsMs');
    const graphKey=digest([relations.context,relations.generation,record.revision,body.knowledge]);if(!graphCache.has(graphKey)){if(graphCache.size>=4)graphCache.delete(graphCache.keys().next().value);graphCache.set(graphKey,buildGraph(relations,record));}const graph=graphCache.get(graphKey);
    const {reached,notes,verify,unresolved:propagationUnresolved,frontier,originIds}=propagate({origins,graph,relations,depth:body.depth});mark('propagateMs');
    const unresolved=[...unresolvedOrigins,...origins.filter(o=>o.status==='unknown').map(o=>({entity:o.path,reason:o.reason+' Declared supports that name it are stale.'})),...propagationUnresolved];
    const items=[];
    for(const [id,r] of reached){if(r.hop===0||r.virtual)continue;const n=graph.nodes.get(id)||{id,kind:'file'};const last=r.paths[0].at(-1);const s=strength(last);
      items.push({entity:id,kind:n.kind,artifact:n.artifact||null,title:n.title||null,tier:r.hop===1?'direct':'transitive',hops:r.hop,strength:s,origins:[...r.via],affected_exports:r.exports&&!r.exports.has('*')?[...r.exports]:undefined,reason:last.evidence.requires||last.evidence.reason||null,paths:r.paths.map(describe)});}
    const stepsByFlow=new Map();for(const it of items)if(it.kind==='step'){const f=it.entity.split(':').slice(1,-1).join(':');if(!stepsByFlow.has(f))stepsByFlow.set(f,[]);stepsByFlow.get(f).push(it);}
    for(const it of items)if(it.kind==='flow'){const steps=stepsByFlow.get(it.entity.slice(5))||[];it.steps=steps.map(s=>({step:s.entity.split(':').at(-1),tier:s.tier,hops:s.hops,strength:s.strength,reason:s.reason})).sort((a,b)=>a.hops-b.hops);if(steps.length){it.hops=Math.min(it.hops,...steps.map(s=>s.hops));it.strength=STRENGTHS[Math.min(RANK[it.strength],...steps.map(s=>RANK[s.strength]))];}it.tier=it.hops===1?'direct':'transitive';}
    const affectedIds=new Set(items.map(i=>i.entity));
    // Verify: every test that supports an affected step. Investigate: implementation supports of affected steps that were not reached.
    const investigate=[];
    for(const it of items.filter(i=>i.kind==='step')){const parts=it.entity.split(':');const stepId=parts.at(-1),logical=parts.slice(1,-1).join(':');const flow=record.graph.flows.find(f=>f.logicalId===logical);const st=flow?.steps.find(s=>s.id===stepId);if(!st)continue;
      for(const sp of flow.support.filter(s=>st.supports.includes(s.id)&&['implementation','test'].includes(s.kind))){const target=sp.file||sp.path;
        if(sp.kind==='test'){if(!verify.some(v=>v.flow==='flow:'+logical&&v.test===target&&v.step===stepId))verify.push({flow:'flow:'+logical,step:stepId,test:target,hops:it.hops,basis:sp.basis,requires:sp.requires});continue;}
        if(affectedIds.has(target)||originIds.has(target)||investigate.some(x=>x.entity===target))continue;investigate.push({entity:target,kind:'module',for_step:it.entity,hops:it.hops,basis:sp.basis,requires:sp.requires,symbol:sp.symbol||null});}}
    investigate.sort((a,b)=>a.hops-b.hops||a.entity.localeCompare(b.entity));verify.sort((a,b)=>a.hops-b.hops||a.test.localeCompare(b.test));
    const potential=[];
    for(const id of originIds)for(const p of relations.history.get(id)||[]){if(p.support<2||p.confidence<0.5||RECORD.test(p.b)||/package(-lock)?\.json$/.test(p.b)||(id.endsWith('.md')&&p.b.endsWith('.md'))||affectedIds.has(p.b)||originIds.has(p.b)||!relations.files.has(p.b))continue;potential.push({entity:p.b,kind:graph.nodes.get(p.b)?.kind||'file',tier:'potential',strength:'historical',origins:[id],score:p.confidence,evidence:{co_changed:`${p.support} of ${p.total} commits that changed ${id}`,confidence:p.confidence}});}
    for(const o of origins){if(!o.terms?.length)continue;const terms=new Set(o.terms);for(const [f,ids] of relations.vocabulary){if(f===o.path||affectedIds.has(f)||originIds.has(f))continue;const shared=ids.filter(t=>terms.has(t));if(shared.length>=2)potential.push({entity:f,kind:graph.nodes.get(f)?.kind||'module',tier:'potential',strength:'lexical',origins:[o.path],score:shared.length,evidence:{shared_terms:shared.slice(0,8),count:shared.length}});}}
    for(const n of notes.filter(n=>n.potential))potential.push({entity:n.entity,kind:'step',tier:'potential',strength:'declared+static',origins:[n.path[0]?.from].filter(Boolean),score:0,evidence:{note:n.note},paths:[describe(n.path)]});
    const merged=new Map();for(const p of potential){const k=p.strength+'|'+p.entity;const m=merged.get(k);if(!m)merged.set(k,p);else{m.score=Math.max(m.score,p.score);m.origins=[...new Set([...m.origins,...p.origins])];if(p.evidence.shared_terms)m.evidence.shared_terms=[...new Set([...(m.evidence.shared_terms||[]),...p.evidence.shared_terms])].slice(0,8);}}
    const allPotential=[...merged.values()].sort((a,b)=>RANK[a.strength]-RANK[b.strength]||b.score-a.score||a.entity.localeCompare(b.entity));
    const capped=[...allPotential.filter(p=>p.strength==='historical').slice(0,10),...allPotential.filter(p=>p.strength==='lexical').slice(0,10),...allPotential.filter(p=>p.strength!=='historical'&&p.strength!=='lexical')];
    // Artifact prerequisites without any declared relationship to a changed element.
    for(const o of origins){const m=o.path.match(KNOWLEDGE);if(!m||o.status==='unknown')continue;for(const a of record.snapshot.artifacts)if(a.dependsOn.includes(m[1])||a.proposedDependsOn?.includes(m[1])){const touched=[...reached.keys()].some(id=>id.startsWith(`docs/artifacts/${a.id}/`)||graph.nodes.get(id)?.artifact===a.id);if(!touched&&!unresolved.some(u=>u.entity===`artifact:${a.id}`&&u.for===o.path))unresolved.push({entity:`artifact:${a.id}`,for:o.path,reason:`depends on ${m[1]} but declares no reference, flow support or model source for ${o.path}; impact unknown, not absent.`});}}
    items.sort((a,b)=>(a.tier==='direct'?0:1)-(b.tier==='direct'?0:1)||RANK[a.strength]-RANK[b.strength]||a.hops-b.hops||b.origins.length-a.origins.length||a.entity.localeCompare(b.entity));
    // Declared assessment comparison.
    let declared=null;
    const changedArtifacts=[...new Set(origins.map(o=>o.path.match(KNOWLEDGE)?.[1]).filter(Boolean))];
    let unit=body.unit?record.units.find(u=>u.id===body.unit):null;
    if(!unit&&!body.unit){const owners=record.units.filter(u=>u.members.some(m=>changedArtifacts.includes(m.artifact)&&record.snapshot.artifacts.find(a=>a.id===m.artifact)?.activeChange===m.change));if(owners.length===1)unit=owners[0];}
    if(body.unit&&!unit)unresolved.push({entity:`unit:${body.unit}`,reason:'Unit does not exist.'});
    if(unit){const computed=new Set(items.filter(i=>i.kind==='flow').map(i=>i.entity.slice(5)));const declaredFlows=(unit.affectedFlows||[]).map(f=>`${f.artifact}:${f.flow}`);declared={unit:unit.id,path:unit.path,affected_flows:unit.affectedFlows||[],declared_not_reached:declaredFlows.filter(f=>!computed.has(f)),reached_not_declared:[...computed].filter(f=>!declaredFlows.includes(f))};}
    mark('explainMs');const after=(await snapshotState(worktree)).print;const stale=after!==print;mark('finishMs');
    const diagnostics=[...relations.diagnostics.map(d=>({code:d.code,path:d.path,message:d.message})),...record.graph.diagnostics.filter(d=>d.code!=='flow-evidence-gap'&&d.severity!=='info').slice(0,50)];
    if(stale)diagnostics.push({code:'stale-response',path:'',message:'Repository changed while answering; ask again.'});
    for(const it of items)for(const p of it.paths)for(const edge of p)if(edge.via==='mirror'&&edge.sameBytes===false&&!diagnostics.some(d=>d.code==='mirror-diverged'&&d.path===it.entity))diagnostics.push({code:'mirror-diverged',path:it.entity,message:`${it.entity} is a copy whose bytes now differ from the changed file.`});
    const sections={changed:origins.map(o=>({path:o.path,status:o.status,from:o.from||null,id:o.id||null,symbols:o.symbols||null,sections:o.sections||null,terms:o.terms?o.terms.length:0})),direct:items.filter(i=>i.tier==='direct'&&i.kind!=='step'),transitive:items.filter(i=>i.tier==='transitive'&&i.kind!=='step'),steps:items.filter(i=>i.kind==='step'),verify:[...new Map(verify.map(v=>[v.flow+v.test,v])).values()],investigate,potential:capped,unresolved};
    const omissions=[];for(const key of ['direct','transitive','steps','verify','investigate','potential','unresolved']){const total=sections[key].length;if(total>body.limit){omissions.push({section:key,total,shown:body.limit});sections[key]=sections[key].slice(0,body.limit);}}
    const coverage={sources_used:['declared knowledge: references, flow supports, models, units','ESM imports with named specifiers and in-module declaration closure',relations.goAvailable?'Go package imports, same-package tests, go:embed':'(Go not analyzed: go command unavailable)','identical-content mirrors','co-change history (last 500 non-merge commits, bulk commits skipped)','contract vocabulary shared with source files'],
      not_analyzed:['dynamic calls, injected functions, HTTP and process boundaries',...(relations.goAvailable?['Go and CSS symbol changes']:['Go packages (go command unavailable)','CSS symbol changes']),'semantic similarity (search only, never impact)'],
      depth:body.depth,frontier,symbol_level:origins.some(o=>o.symbols?.length)?'JS top-level declarations and their in-file closure':'file level',history_window:'last 500 non-merge commits',freshness:stale?'stale':'fresh',completeness:stale||unresolved.length||omissions.length||relations.diagnostics.length?'partial':'complete',declared};
    const data={...sections,potential_total:allPotential.length,declared,coverage};
    const result={repository:{path:root},worktree,context:{knowledge:body.knowledge,origins:body.origins||null,commit:body.commit||null,range:body.range||null,diff:body.diff||null,depth:body.depth,unit:unit?.id||null},revision:digest([print,update.generation,record.revision]),generation:update.generation,freshness:coverage.freshness,completeness:coverage.completeness,data,diagnostics,omissions,metrics:{totalMs:+(performance.now()-started).toFixed(1),phases,index:update.timings}};
    if(body.format==='text')result.text=compactText(result,body.budget);
    return result;
  }
  let serial=Promise.resolve(),closing=false;
  return {
    query(body){if(closing)return Promise.reject(new ExploreError(503,'Impact service is closed'));const work=serial.then(()=>execute(body));serial=work.catch(()=>{});return work;},
    index:impactIndex,
    close(){closing=true;return serial.then(()=>index?undefined:impactIndex.close());},
  };
}

// Compact text for agents: the eight sections, one line per entity, cut to the budget.
export function compactText(result,budget=8000){
  const d=result.data,L=[];const line=s=>L.push(s);
  line(`Changed: ${d.changed.map(c=>c.path+(c.status!=='modified'?` (${c.status}${c.from?' from '+c.from:''})`:'')+(c.symbols?.length?` [${c.symbols.join(', ')}]`:'')+(c.sections?.length&&c.path.endsWith('.md')?` §${c.sections.slice(0,3).join('; ')}`:'')).join('; ')||'none'}`);
  const why=it=>{const p=it.paths?.[0]||[];return p.map(s=>s.via+(s.reason?` "${String(s.reason).slice(0,60)}"`:s.symbols?` (${s.symbols.join(',')})`:'')).join(' → ');};
  const show=(title,items,extra=()=>'')=>{line(`\n${title} (${items.length})`);for(const it of items)line(`- ${it.entity}${it.steps?.length?` · steps ${it.steps.map(s=>s.step).join(', ')}`:''} · ${it.strength}${it.hops>1?` · ${it.hops} hops`:''}${it.affected_exports?` · exports ${it.affected_exports.join(',')}`:''}${why(it)?` · ${why(it)}`:''}${extra(it)}`);};
  show('Direct',d.direct);show('Transitive',d.transitive);
  line(`\nVerify: tests that support flows (${d.verify.length})`);for(const v of d.verify)line(`- ${v.test} → ${v.flow} step ${v.step} · ${v.basis}`);
  show('Potential (confirm before acting)',d.potential,it=>it.evidence?` · ${Object.values(it.evidence).filter(v=>typeof v!=='number').map(v=>Array.isArray(v)?v.join(','):v).join('; ')}`:'');
  line(`\nInvestigate: code and tests supporting affected steps (${d.investigate.length})`);for(const i of d.investigate)line(`- ${i.entity} · ${i.for_step} · ${i.basis} · "${String(i.requires).slice(0,70)}"`);
  line(`\nUnresolved (${d.unresolved.length})`);for(const u of d.unresolved)line(`- ${u.entity}: ${u.reason}`);
  if(d.declared)line(`\nDeclared assessment (${d.declared.unit}): declared not reached ${d.declared.declared_not_reached.join(', ')||'none'}; reached not declared ${d.declared.reached_not_declared.join(', ')||'none'}`);
  const c=d.coverage;line(`\nCoverage: depth ${c.depth}, ${c.frontier} relationships beyond it; ${c.symbol_level}; ${c.history_window}; ${c.freshness}, ${c.completeness}. Not analyzed: ${c.not_analyzed.join('; ')}.`);
  for(const o of result.omissions||[])line(`(${o.section}: ${o.shown} of ${o.total} shown)`);
  const text=L.join('\n');return text.length>budget?text.slice(0,Math.max(0,budget-24))+'\n… (cut to budget)':text;
}
