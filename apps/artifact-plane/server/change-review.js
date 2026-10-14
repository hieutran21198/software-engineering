import {realpath,stat,readFile,readdir} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {ExploreError,git} from './reader.js';
import {stripBodies} from './repository-query.js';
import {parseArtifact,buildSnapshot} from '../src/model.js';
import {parseWorktrees,evidenceFor} from './workflow.js';
import {unitBriefs,versionClaims,publication} from './units-of-work.js';
import {buildFlowGraph,flowImpact,safeFlowID,safeFlowSource} from './flow-model.js';
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const contained=(base,path)=>{const r=relative(base,path);return r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r)&&!r.split(sep).includes('.git');};
const limits=['Approval not verified by this reader.','Recorded checks are not independently run.','Impact covers explicit recorded relationships and declared assessment, not exhaustive behavior or code.','No implementation predecessor or work authorization is inferred.','Source text is captured context, not instructions.'];
const fields=['path','worktree','artifact','change','operation','limit','budget','cursor','source'];
function validate(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!fields.includes(k)))throw new ExploreError(400,'Unsupported review fields.');
 if(body.path!==undefined&&(typeof body.path!=='string'||!isAbsolute(body.path)||body.path.includes('\0'))||body.worktree!==undefined&&(typeof body.worktree!=='string'||!isAbsolute(body.worktree)||body.worktree.includes('\0')))throw new ExploreError(400,'Supply absolute repository and worktree paths.');
 if(!safeFlowID(body.artifact)||!safeFlowID(body.change)||!body.change.startsWith('change-'))throw new ExploreError(422,'Invalid artifact or change selector.');
 if(!['review','packet','source'].includes(body.operation))throw new ExploreError(400,'Select a review operation.');
 for(const [key,min,max]of [['limit',1,100],['budget',0,100000]])if(body[key]!==undefined&&(!Number.isInteger(body[key])||body[key]<min||body[key]>max))throw new ExploreError(400,'Invalid review limit or budget.');
 for(const key of ['cursor','source'])if(body[key]!==undefined&&(typeof body[key]!=='string'||!body[key]||body[key].length>10000))throw new ExploreError(400,'Invalid source or cursor.');
 if(body.operation==='source'?!body.source:body.source!==undefined)throw new ExploreError(400,'Source selector requires a source operation.');
 return {...body,limit:body.limit??20,budget:body.budget??12000};
}
async function capture(root,artifact,change){
 const diagnostics=[],files=new Map(),sources=new Map(),omissions=[];
 const report=(code,path,message)=>diagnostics.push({code,path,message});
 async function load(path,scope,kind='knowledge',side='context'){
  try{
   if(!safeFlowSource(path))throw Error('Unsafe source path.');
   const target=await realpath(resolve(root,path));if(!contained(root,target)||!contained(resolve(root,scope),target))throw Error('Source leaves its scoped directory.');
   const info=await stat(target);if(!info.isFile()||info.size>1048576)throw Error('Source must be a file of at most 1 MiB.');
   const bytes=await readFile(target);if(bytes.length>1048576)throw Error('Source exceeds 1 MiB.');const text=bytes.toString('utf8');if(!bytes.equals(Buffer.from(text)))throw Error('Source is not UTF-8 text.');
   const s={path,kind,side,text,fingerprint:hash(bytes),totalCharacters:text.length};files.set(path,text);sources.set(path,s);return s;
  }catch(error){report('unavailable-source',path,error.code==='ENOENT'?'Source is missing.':error.message);omissions.push({path,reason:'Source unavailable.'});return null;}
 }
 async function walk(path,scope,kind,side,visited=new Set()){
  let target;try{target=await realpath(resolve(root,path));}catch(error){if(error.code!=='ENOENT')report('unavailable-directory',path,'Directory cannot be read.');return;}
  if(!contained(root,target)||!contained(resolve(root,scope),target)){report('unsafe-directory',path,'Directory leaves its scope.');omissions.push({path,reason:'Unsafe directory.'});return;}
  if(visited.has(target)){report('ambiguous-directory',path,'Directory alias or cycle skipped.');return;}visited.add(target);
  let entries;try{entries=await readdir(target,{withFileTypes:true});}catch{report('unavailable-directory',path,'Directory cannot be read.');return;}
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){if(entry.name.startsWith('.'))continue;const p=path+'/'+entry.name;try{const t=await realpath(resolve(root,p)),s=await stat(t);if(s.isDirectory())await walk(p,scope,kind,side,visited);else if(p.endsWith('.md'))await load(p,scope,kind,side);}catch{await load(p,scope,kind,side);}}
 }
 const repository={path:root,head:await git(root,['rev-parse','HEAD']),branch:await git(root,['symbolic-ref','--short','HEAD']).catch(()=> 'detached'),status:await git(root,['status','--porcelain=v1','--untracked-files=normal'])};repository.dirty=!!repository.status;
 const refs=await Promise.all(['main','master'].map(ref=>git(root,['rev-parse','--verify','refs/heads/'+ref]).catch(()=>null)));
 const registered=await git(root,['worktree','list','--porcelain','-z'],true);
 const tracked=new Set((await git(root,['ls-files','-z'],true)).split('\0').filter(Boolean));
 const selected=`docs/artifacts/${artifact}/changes/${change}/`,artifactRoot=`docs/artifacts/${artifact}/README.md`;
 try{const t=await realpath(resolve(root,selected));if(!contained(resolve(root,`docs/artifacts/${artifact}/changes`),t)||!contained(root,t))throw Error();if(!(await stat(t)).isDirectory())throw Error();}catch{throw new ExploreError(404,'Selected change is missing or unsafe.');}
 const entries=await readdir(resolve(root,'docs/artifacts'),{withFileTypes:true}).catch(()=>{throw new ExploreError(404,'ADD knowledge is unavailable.');});
 let selectedArtifact,baseline;
 for(const entry of entries){if(!safeFlowID(entry.name)||entry.name==='units-of-work')continue;const prefix=`docs/artifacts/${entry.name}/`,r=await load(prefix+'README.md',prefix);if(!r)continue;const ds=[],a=parseArtifact(entry.name,r.text,ds);diagnostics.push(...ds);
  if(entry.name===artifact){selectedArtifact=a;baseline={kind:'declared-current',version:a.currentVersion,worktree:root,head:repository.head,state:ds.some(d=>d.code==='ambiguous-version')?'unavailable':a.currentVersion?'available':'initial'};}
  if(a.currentVersion){const version=prefix+'versions/'+a.currentVersion+'/';const exists=await stat(resolve(root,version)).catch(()=>null);const canonicalVersion=await realpath(resolve(root,version)).catch(()=>null);if(!exists?.isDirectory()||!canonicalVersion||!contained(resolve(root,version),canonicalVersion)){report('missing-baseline',version,'Declared current snapshot is missing.');if(entry.name===artifact)baseline.state='unavailable';}else{await load(version+'README.md',version,'scope','baseline');for(const category of ['requirements','specifications','decisions'])await walk(version+category,version+category,'knowledge','baseline');}}
  const changes=entry.name===artifact?[change]:[];
  if(entry.name===artifact)for(const name of await readdir(resolve(root,prefix+'changes')).catch(()=>[]))if(safeFlowID(name)&&name.startsWith('change-')&&name!==change){const path=prefix+'changes/'+name+'/README.md';files.set(path,'');}
  for(const name of changes){const cp=prefix+'changes/'+name+'/';await load(cp+'README.md',cp,'scope','change');for(const category of ['requirements','specifications','decisions','tasks'])await walk(cp+category,cp+category,category==='tasks'?'evidence':'knowledge','change');}
  // Provenance claims and publication readers need retained version headers.
  const versions=await readdir(resolve(root,prefix+'versions')).catch(()=>[]);for(const v of versions)if(/^\d+\.\d+\.\d+$/.test(v)&&!files.has(prefix+'versions/'+v+'/README.md'))await load(prefix+'versions/'+v+'/README.md',prefix+'versions/'+v,'provenance');
 }
 if(!selectedArtifact)throw new ExploreError(404,'Selected artifact is unavailable.');
 const unitsPath='docs/artifacts/units-of-work';for(const name of await readdir(resolve(root,unitsPath)).catch(()=>[]))if(safeFlowID(name))await load(unitsPath+'/'+name+'/README.md',unitsPath+'/'+name,'unit');
 const units=unitBriefs(files).filter(u=>u.members.some(m=>m.artifact===artifact&&m.change===change));
 if(units.length!==1)report(units.length?'ambiguous-unit':'missing-unit',selected,'No unique owning unit is available.');
 const unit=units.length===1?units[0]:null;if(unit){diagnostics.push(...unit.diagnostics);for(const e of unit.evidence)await load(e.source.split('#')[0],'docs/artifacts','evidence');}
 const currentPrefix=selectedArtifact.currentVersion?`docs/artifacts/${artifact}/versions/${selectedArtifact.currentVersion}/`:null;
 const projections=[];
 for(const side of ['baseline','change']){
  const projectionFiles=new Map([...files].filter(([p])=>(!p.includes('/changes/')||side==='change'&&p.startsWith(selected))));
  const snapshot=buildSnapshot(projectionFiles,repository,[]);for(const a of snapshot.artifacts)a.activeChange=side==='change'&&a.id===artifact?change:null;
  const graph=buildFlowGraph(snapshot,{context:root,knowledge:side==='change'?'planning':'established'});if(side==='change'){const explicitTargets=new Set(graph.edges.filter(e=>e.kind==='supports'&&e.resolved).map(e=>e.target));graph.flows=graph.flows.filter(f=>f.artifact!==artifact||f.source===`change:${change}`||explicitTargets.has(f.id));}diagnostics.push(...snapshot.diagnostics.filter(d=>!['invalid-active-change','multiple-changes'].includes(d.code)),...graph.diagnostics);
  projections.push({side,graph});
 }
 for(const {graph}of projections)for(const source of graph.sources){if(!['implementation','test'].includes(source.kind))continue;if(sources.has(source.path))continue;let canonical;try{canonical=await realpath(resolve(root,source.path));}catch{}if(!tracked.has(source.path)||!canonical||!tracked.has(relative(root,canonical).split(sep).join('/'))){report('untracked-support',source.path,'Support must be tracked at both path identities.');omissions.push({path:source.path,reason:'Untracked or missing support.'});continue;}await load(source.path,'.',source.kind,'support');}
 const snapshot=buildSnapshot(files,repository,[]);const filtered={snapshot:{...snapshot,artifacts:snapshot.artifacts.filter(a=>a.id===artifact).map(a=>({...a,changes:a.changes.filter(c=>c.name===change)}))},files,unsafeTaskPaths:new Set()};
 const workflow=(await evidenceFor(root,filtered,git,repository.head,diagnostics))[0]??null;
 if(workflow?.history)report('historical-current-comparison',selected,'Declared current is not a proven predecessor of this retained change.');
 const claims=versionClaims(files,artifact,change);const pub=claims.length===1?await publication(root,claims[0].prefix,files,git,'',null,selected):{state:'unknown',reasons:[claims.length?'Multiple version provenance claims.':'No unique version provenance claim.'],sources:[]};
 const registeredPaths=new Set(projections.flatMap(p=>p.graph.sources.map(s=>s.path)));
 for(const [path,source]of sources)if(!(path===artifactRoot||path.startsWith(selected)||currentPrefix&&path.startsWith(currentPrefix)||path===unit?.path||unit?.evidence.some(e=>e.source.split('#')[0]===path)||registeredPaths.has(path)||claims.some(claim=>path===claim.prefix+'README.md')))sources.delete(path);
 
 const revision=hash([repository,refs,registered,[...tracked].sort(),baseline,[...files].map(([p,text])=>[p,hash(text)]),diagnostics,unit&&[unit.affectedFlows,unit.flowAssessment],workflow,pub]);
 for(const source of sources.values())source.id=hash([revision,root,artifact,change,source.side,source.path]);
 return {repository,baseline,selected,currentPrefix,files,sources,diagnostics,omissions,projections,unit,workflow,pub,revision,artifactRoot};
}
const pointer=s=>s?{id:s.id,path:s.path,fingerprint:s.fingerprint,characterCount:s.totalCharacters,availability:'available'}:null;
function recordsFor(c){if(c.baseline.state==='unavailable')return [];const paths=new Set();for(const p of c.files.keys()){for(const prefix of [c.selected,c.currentPrefix].filter(Boolean))if(p.startsWith(prefix)&&/^(requirements|specifications|decisions)\/.+\.md$/.test(p.slice(prefix.length)))paths.add(p.slice(prefix.length));}
 return [...paths].filter(path=>!c.diagnostics.some(d=>d.code==='unavailable-source'&&[c.selected+path,c.currentPrefix&&c.currentPrefix+path].includes(d.path))).map(path=>{const before=c.currentPrefix?c.sources.get(c.currentPrefix+path):null,after=c.sources.get(c.selected+path);return {id:hash(path),path,category:path.split('/')[0],status:before?after?before.fingerprint===after.fingerprint?'unchanged':'modified':'removed':'added',baseline:pointer(before),change:pointer(after)};}).sort((a,b)=>['requirements','specifications','decisions'].indexOf(a.category)-['requirements','specifications','decisions'].indexOf(b.category)||(a.status==='unchanged')-(b.status==='unchanged')||(a.path.endsWith('/README.md')?0:1)-(b.path.endsWith('/README.md')?0:1)||a.path.localeCompare(b.path,undefined,{numeric:true}));
}
function cursorToken(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}
function cursorValue(token,binding){if(!token)return 0;try{const v=JSON.parse(Buffer.from(token,'base64url').toString('utf8'));if(JSON.stringify(v.binding)!==JSON.stringify(binding)||!Number.isSafeInteger(v.offset)||v.offset<0)throw Error();return v.offset;}catch{throw new ExploreError(422,'Cursor is invalid or stale; reload the context.');}}
export function createReviewService({roots=[],beforeRevalidate}={}){
 const observed=new Map(),knownSources=new Map();
 return {observedSources(root){return observed.get(root)||[];},async query(input){const body=validate(input);const configured=await Promise.all(roots.map(p=>realpath(p).catch(()=>null)));const path=body.path??(roots.length===1?roots[0]:null);if(!path)throw new ExploreError(400,'Select one repository path.');const root=await realpath(path).catch(()=>{throw new ExploreError(404,'Repository is unavailable.');});if(roots.length&&!configured.includes(root))throw new ExploreError(403,'Repository is not configured.');const top=await git(root,['rev-parse','--show-toplevel']).catch(()=>null);if(!top||await realpath(top)!==root)throw new ExploreError(422,'Select a Git worktree root.');const trees=parseWorktrees(await git(root,['worktree','list','--porcelain','-z'],true));const target=body.worktree?await realpath(body.worktree).catch(()=>null):root;if(!target||!trees.some(t=>t.path===target))throw new ExploreError(422,'Select a registered worktree.');
 const c=await capture(target,body.artifact,body.change);const knownKey=JSON.stringify([root,target,body.artifact,body.change]),previousIDs=knownSources.get(knownKey)||new Map();knownSources.set(knownKey,new Map([...previousIDs,...[...c.sources.values()].map(s=>[s.id,s.path])].slice(-10000)));if(knownSources.size>16)knownSources.delete(knownSources.keys().next().value);observed.set(root,[...new Map([...(observed.get(root)||[]),...[...c.sources.values()].map(s=>({worktree:target,path:s.path,kind:s.kind}))].map(s=>[JSON.stringify([s.worktree,s.path]),s])).values()].slice(-10000));if(observed.size>16)observed.delete(observed.keys().next().value);const context={artifact:body.artifact,change:body.change,head:c.repository.head,baseline:c.baseline};const binding={root,worktree:target,artifact:body.artifact,change:body.change,revision:c.revision,operation:body.operation,source:body.source??null,limit:body.operation==='source'?null:body.limit};const offset=cursorValue(body.cursor,binding);let data,pagination={},omissions=[...c.omissions];
 const page=(s,start,budget)=>{const text=s.text.slice(start,start+budget),end=start+text.length;return {...pointer(s),side:s.side,kind:s.kind,offset:start,totalCharacters:s.totalCharacters,text,omittedCharacters:s.totalCharacters-end,nextCursor:budget>0&&end<s.totalCharacters?cursorToken({binding:{...binding,operation:'source',source:s.id,limit:null},offset:end}):null};};
 if(body.operation==='source'){const s=[...c.sources.values()].find(s=>s.id===body.source);if(!s){const oldPath=previousIDs.get(body.source);throw new ExploreError(oldPath?c.sources.has(oldPath)?422:404:403,oldPath?c.sources.has(oldPath)?'Source revision changed; reload the context.':'Source no longer exists.':'Source is not registered in this context.');}if(offset>s.totalCharacters)throw new ExploreError(422,'Source offset is invalid.');data=page(s,offset,body.budget);pagination={nextCursor:data.nextCursor};}
 else{const records=recordsFor(c);if(offset>records.length)throw new ExploreError(422,'Record offset is invalid.');const changed=records.filter(r=>r.status!=='unchanged'),candidates=new Map();for(const {side,graph}of c.projections){const paths=changed.flatMap(r=>[r.baseline?.path,r.change?.path]).filter(Boolean);for(const f of flowImpact(graph,paths).flows){const entry=candidates.get(f.logicalId)??{logicalId:f.logicalId,artifact:f.artifact,title:f.title,sides:[]};entry.sides.push({side,snapshot:f.source,path:f.file,reason:'Explicit reverse relationship to changed knowledge.',impactPath:f.impactPath});candidates.set(f.logicalId,entry);}}
 const sourceOrder=new Map(),prioritize=path=>{if(path&&!sourceOrder.has(path))sourceOrder.set(path,sourceOrder.size);};prioritize(c.selected+'README.md');for(const record of changed){prioritize(record.change?.path);prioritize(record.baseline?.path);}prioritize(c.artifactRoot);for(const record of records.filter(r=>r.status==='unchanged')){prioritize(record.change?.path);prioritize(record.baseline?.path);}const orderedSources=[...c.sources.values()].sort((a,b)=>(sourceOrder.get(a.path)??Number.MAX_SAFE_INTEGER)-(sourceOrder.get(b.path)??Number.MAX_SAFE_INTEGER)||a.path.localeCompare(b.path,undefined,{numeric:true}));let remaining=body.budget;const excerpts=orderedSources.map(s=>{const value=page(s,0,remaining);remaining-=value.text.length;if(value.omittedCharacters)omissions.push({source:s.id,path:s.path,omittedCharacters:value.omittedCharacters,reason:'Excerpt budget.'});return value;});
 pagination={offset,totalRecords:records.length,nextCursor:offset+body.limit<records.length?cursorToken({binding,offset:offset+body.limit}):null};data={schema:'artifact-plane.change-context.v1',baseline:c.baseline,scope:{source:pointer(c.sources.get(c.selected+'README.md'))},records:records.slice(offset,offset+body.limit),governingSources:records.filter(r=>r.status==='unchanged').map(r=>r.change),impact:{coverage:'Explicit recorded relationships and declared assessment only.',candidates:[...candidates.values()].sort((a,b)=>a.logicalId.localeCompare(b.logicalId)),declaredAssessment:c.unit?{unit:c.unit.id,path:c.unit.path,affectedFlows:c.unit.affectedFlows,flowAssessment:c.unit.flowAssessment}:null},evidence:{approval:'Approval not verified by this reader.',workflow:stripBodies(c.workflow),publication:stripBodies(c.pub)},sources:excerpts,limits,unresolvedFacts:c.diagnostics};}
 await beforeRevalidate?.();let fresh;try{fresh=await capture(target,body.artifact,body.change);}catch{fresh=null;}const stale=!fresh||fresh.revision!==c.revision||await git(root,['worktree','list','--porcelain','-z'],true)!==await git(target,['worktree','list','--porcelain','-z'],true);const diagnostics=[...c.diagnostics];if(stale)diagnostics.push({code:'stale-response',path:'',message:'Inputs changed during reading; reload the context.'});const evidenceUnavailable=!c.workflow||['unknown','unverified','unavailable'].includes(c.pub?.state)||!c.pub;const incomplete=evidenceUnavailable||stale||diagnostics.length>0||omissions.length>0||!!pagination.nextCursor||data.omittedCharacters>0;
 return {repository:{...c.repository,path:root},worktree:target,context,revision:c.revision,freshness:stale?'stale':'fresh',completeness:incomplete?'partial':'complete',data,diagnostics,pagination,omissions};
 }};
}
export async function queryChangeReview(body,options){return createReviewService(options).query(body);}
