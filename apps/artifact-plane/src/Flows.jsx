import {labelledEdgeTypes,GraphLabelLayout} from './GraphLabels.jsx';
import React,{useEffect,useMemo,useState,useRef,useId} from 'react';
import {ReactFlow,ReactFlowProvider,Background,Handle,Position} from '@xyflow/react';
import {createPortal} from 'react-dom';
import Markdown from './Markdown.jsx';
import SearchField, {normalizeName} from './SearchField.jsx';
import {flowCanvas} from './flow-canvas.js';
function FlowNode({data}){return <div className="flow-node"><Handle type="target" position={Position.Left} isConnectable={false}/><small>{data.kind}{data.artifact&&` · ${data.artifact}`}</small><strong>{data.title}</strong><Handle type="source" position={Position.Right} isConnectable={false}/></div>;}
const nodeTypes={flow:FlowNode};
async function query(body,signal){const response=await fetch('/api/flows/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error?.message||result.error||'Flow request failed'),{status:response.status});return result;}
function sourceName(id,sources=[]){
 const known=sources.find(source=>source.id===id);if(known)return known.path;
 try{const tuple=JSON.parse(id);if(Array.isArray(tuple)&&typeof tuple.at(-1)==='string')return tuple.at(-1);}catch{}
 return 'Source identity unavailable';
}
function diagnosticSummary(d){
 if(d.code==='flow-model-unavailable')return 'Semantic search is unavailable. Keyword search and graph discovery still work.';
 return d.message||d.code||'Flow diagnostic';
}
function Diagnostics({items=[]}){
 const unique=[...new Map(items.map(d=>[`${d.code}:${d.message}`,d])).values()];
 return unique.length>0&&<aside className="flow-diagnostics" aria-label="Flow diagnostics">{unique.map((d,i)=><div key={i}><p>{diagnosticSummary(d)}</p><details><summary>Technical details{unique.length>1?` · ${d.code}`:''}</summary><p><code>{d.code}</code>: {d.message}</p>{d.code==='flow-model-unavailable'&&<p>To enable semantic search, run <code>npm run flow:model-install</code> from the Artifact Plane app directory.</p>}</details></div>)}</aside>;
}
function Evidence({result,diagnostics=false}){
 if(!result)return null;
 const omissions=result.omissions||[];
 return <div className="flow-evidence"><div className="flow-status"><span>Freshness: {typeof result.freshness==='string'?result.freshness:JSON.stringify(result.freshness)}</span><span>Coverage: {typeof result.completeness==='string'?result.completeness:JSON.stringify(result.completeness)}</span><details><summary>Index details</summary><p>Generation {result.generation}</p></details></div>{diagnostics&&<Diagnostics items={result.diagnostics}/>} {!!omissions.length&&<details className="flow-omissions"><summary>{omissions.length} shortened source{omissions.length===1?'':'s'}</summary><p>Some source text was shortened to fit the response budget. Inspect a source to read further excerpts.</p><ul>{omissions.map((item,i)=><li key={i}><code>{sourceName(item.source,result.data?.sources)}</code><span>{item.characters.toLocaleString()} characters omitted</span>{sourceName(item.source,result.data?.sources)==='Source identity unavailable'&&<details><summary>Source identity</summary><code>{item.source}</code></details>}</li>)}</ul></details>}</div>;
}
export default function Flows({path,worktree,epoch,isActive,entry,knowledge,sidebar,inspector,artifacts=[]}){
 const artifactControl=useId(),modeControl=useId();
 const [text,setText]=useState(''),[search,setSearch]=useState(''),[match,setMatch]=useState('title'),[artifact,setArtifact]=useState('');
 const [impact,setImpact]=useState(null),[list,setList]=useState(null),[selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[source,setSource]=useState(null),[document,setDocument]=useState(null),[expanded,setExpanded]=useState(false),[node,setNode]=useState(null),[error,setError]=useState(''),[cursor,setCursor]=useState(null),[sourceCursor,setSourceCursor]=useState(null),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0),[sentinel,setSentinel]=useState(null),[options,setOptions]=useState(null);
 const latestList=useRef(null);latestList.current=list;
 const listScope=useRef(null),listCache=useRef(null),detailCache=useRef(null),sourceCache=useRef(null);
 const context=useMemo(()=>({path,worktree:worktree||undefined,knowledge}),[path,worktree,knowledge]);
 const optionScope=JSON.stringify([path,worktree]);
 useEffect(()=>{
  setSelected(null);setDetail(null);setSource(null);setDocument(null);setCursor(null);setSourceCursor(null);setNode(null);setExpanded(false);
  setText('');setSearch('');setMatch('title');setArtifact('');setImpact(null);setList(null);setOptions(null);
  listCache.current=detailCache.current=sourceCache.current=null;
 },[path,worktree]);
 useEffect(()=>{
  if(!entry)return;
  setSelected(entry.flow||null);setDetail(null);setSource(null);setDocument(null);setCursor(null);setSourceCursor(null);setNode(null);setExpanded(false);
  setText(entry.query||'');setSearch(normalizeName(entry.query));setMatch('title');setArtifact(entry.artifact||'');setImpact(entry.ids||null);setList(null);
  listCache.current=detailCache.current=sourceCache.current=null;
 },[entry]);
 const pending=match==='title'&&normalizeName(text)!==search;
 useEffect(()=>{
  if(!isActive||match!=='title'||!pending)return;
  const timer=setTimeout(()=>{setSearch(normalizeName(text));setCursor(null);},250);
  return()=>clearTimeout(timer);
 },[text,match,isActive,pending]);
 const scopeKey=JSON.stringify([context,search,impact,match,artifact]);
 const listKey=JSON.stringify([scopeKey,epoch]);
 const pageCursor=cursor?.key===listKey?cursor.value:null;
 const requestKey=JSON.stringify([listKey,pageCursor,retry,pending]);
 const latestRequest=useRef(null);latestRequest.current=requestKey;
 useEffect(()=>{
  if(!isActive||pending){setLoading(false);return;}if(listCache.current===requestKey)return;
  const controller=new AbortController();setError('');setLoading(true);
  const sameScope=listScope.current===scopeKey;
  if(!pageCursor&&!sameScope)setList(null);
  query({...context,operation:impact?'impact':'search',...(impact?{ids:impact}:{query:search,match}),artifact:artifact||undefined,limit:20,cursor:pageCursor||undefined},controller.signal).then(result=>{
   if(controller.signal.aborted||latestRequest.current!==requestKey)return;
   if(pageCursor&&latestList.current?.revision&&(latestList.current.revision!==result.revision||result.freshness!=='fresh')){setCursor(null);listCache.current=null;setRetry(n=>n+1);return;}
   setOptions({scope:optionScope,epoch,items:result.data.artifactOptions||artifacts});
   setList(previous=>{
    if(pageCursor&&previous)return {...result,data:{...result.data,flows:[...new Map([...(previous.data?.flows||[]),...(result.data?.flows||[])].map(f=>[f.id,f])).values()]}};
    if(previous?.revision&&previous.revision===result.revision&&previous.generation===result.generation&&previous.data.semantic===result.data.semantic&&sameScope)return {...result,data:previous.data,pagination:previous.pagination};
    return result;
   });listScope.current=scopeKey;listCache.current=requestKey;
  }).catch(e=>{
   if(e.name==='AbortError'||controller.signal.aborted||latestRequest.current!==requestKey)return;
   if(e.status===422&&pageCursor){setCursor(null);listCache.current=null;setRetry(n=>n+1);}else {setError(e.message);setList(null);}
  }).finally(()=>{if(!controller.signal.aborted&&latestRequest.current===requestKey)setLoading(false);});
  return()=>controller.abort();
 },[requestKey,isActive]);
 const loadMore=()=>{if(!pending&&!loading&&!error&&list?.freshness==='fresh'&&list?.pagination?.nextCursor)setCursor({key:listKey,value:list.pagination.nextCursor});};
 useEffect(()=>{if(!sentinel||!isActive||pending||loading||error||!list?.pagination?.nextCursor)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadMore();},{root:sidebar,rootMargin:'40px'});observer.observe(sentinel);return()=>observer.disconnect();},[sentinel,isActive,pending,loading,error,list,sidebar,listKey]);
 useEffect(()=>{setSource(null);setSourceCursor(null);setNode(null);detailCache.current=sourceCache.current=null;},[context,selected]);
 const detailKey=JSON.stringify([context,selected,epoch]),latestDetail=useRef(null);latestDetail.current=detailKey;
 useEffect(()=>{
  if(!isActive||!selected||detailCache.current===detailKey)return;
  const controller=new AbortController();setDetail(null);setDocument(null);
  query({...context,operation:'detail',flow:selected},controller.signal).then(result=>{if(!controller.signal.aborted&&latestDetail.current===detailKey){setSource(current=>result.data.sources?.some(item=>item.id===current)?current:null);setDetail(result);detailCache.current=detailKey;}}).catch(e=>{if(e.name!=='AbortError'&&!controller.signal.aborted&&latestDetail.current===detailKey){setError(e.message);if(e.status===422)setSelected(null);}});return()=>controller.abort();
 },[detailKey,isActive]);
 useEffect(()=>{setSourceCursor(null);sourceCache.current=null;},[context,selected,source,epoch]);
 const sourceKey=JSON.stringify([detailKey,source,sourceCursor]),latestSource=useRef(null);latestSource.current=sourceKey;
 useEffect(()=>{
  if(!isActive||!source||!detail||sourceCache.current===sourceKey)return;
  const controller=new AbortController();setDocument(null);
  query({...context,operation:'source',flow:detail.data.flow.id,source,cursor:sourceCursor||undefined},controller.signal).then(result=>{if(!controller.signal.aborted&&latestSource.current===sourceKey){setDocument(result);sourceCache.current=sourceKey;}}).catch(e=>{if(e.name!=='AbortError'&&!controller.signal.aborted&&latestSource.current===sourceKey)setError(e.message);});return()=>controller.abort();
 },[sourceKey,detail,isActive]);
 const changeText=value=>{setText(value);setCursor(null);if(match==='title'||!value){setImpact(null);if(!value)setSearch('');}};
 const submit=()=>{setSearch(match==='title'?normalizeName(text):text.trim());setImpact(null);setCursor(null);setRetry(n=>n+1);};
 const artifactOptions=options?.scope===optionScope&&options.epoch===epoch?options.items:(!worktree||worktree===path?artifacts:[]);
 const missingArtifact=artifact&&!artifactOptions.some(a=>a.id===artifact);
 const flow=detail?.data?.flow,graph=useMemo(()=>flowCanvas(detail?.data?.graph,flow,expanded,node),[detail,flow,expanded,node]);
 const supports=(flow?.support||[]).filter(s=>!node||s.targetId===node||(flow.steps||[]).find(t=>t.nodeId===node)?.supports.includes(s.id));
 if(!isActive)return null;
 const left=<section className="flow-list" aria-label="Flow browsing">
  <div className="flow-filter"><label htmlFor={artifactControl}>Artifact</label><select id={artifactControl} value={artifact} onChange={event=>{setArtifact(event.target.value);setImpact(null);setCursor(null);}}>
   <option value="">All artifacts</option>{missingArtifact&&<option value={artifact}>{artifact}{options?.scope===optionScope?' · unavailable':''}</option>}
   {artifactOptions.map(a=><option key={a.id} value={a.id}>{a.title} · {a.id}</option>)}
  </select></div>
  <div className="flow-filter"><label htmlFor={modeControl}>Search mode</label><select id={modeControl} value={match} onChange={event=>{const mode=event.target.value;setMatch(mode);setImpact(null);setCursor(null);setSearch(mode==='title'?normalizeName(text):'');}}>
   <option value="title">Title or ID</option><option value="discovery">Behavior discovery</option>
  </select></div>
  <SearchField label="Search flows" value={text} onChange={changeText} onSubmit={submit} placeholder={match==='title'?'Title or ID':'Describe a behavior or enter an ID'} submit={match==='discovery'}/>
  <p className="tiny">{impact?'Related flow candidates':!search?'Newest records first':match==='title'?'Title or ID matches':'Relevance first'}</p>
  {match==='discovery'&&<p className="tiny">Discovery ranks related candidates. Submit a behavior to search.</p>}
  {artifact&&<p className="tiny">Participation includes recorded relationships across flow owners.</p>}
  <div role="status" aria-label="Flow search status">{pending||loading?'Searching…':error?'Search failed':list?.freshness==='stale'?'Stale results — retry':list?`${list.data.flows?.length||0} of ${list.data.total??list.data.flows?.length??0} flows loaded`: 'Loading flows…'}</div>
  <nav aria-label="System flows">
   {list&&!pending&&!loading&&!(list.data?.flows||[]).length&&<p>No matching flows. No recorded match does not prove absence of behavior.</p>}
   {!pending&&(list?.data?.flows||[]).map(f=><button key={f.id} aria-pressed={selected===f.id||selected===f.logicalId} onClick={()=>{setError('');setSelected(f.id);}}><strong>{f.title}</strong><small>{f.logicalId} · {f.source} · {f.state}</small><small>{f.createdAt?`Created ${new Date(f.createdAt).toISOString().slice(0,10)}`:'Creation date unknown'}</small></button>)}
   <div ref={setSentinel}/>{list?.pagination?.nextCursor&&<button disabled={pending||loading} onClick={loadMore}>{loading?'Loading more…':'Load more'}</button>}
   {error&&<><p role="alert">{error}</p><button onClick={()=>{setError('');setRetry(n=>n+1);}}>Retry flow request</button></>}
  </nav>
 </section>;
 const right=<section className="flow-content" aria-label="Flow details">{!flow?<p role="status">{selected?'Loading flow…':'Select a flow to inspect its behavior and evidence.'}</p>:<><h2>{flow.title}</h2>{list&&!pending&&!loading&&!(list.data.flows||[]).some(f=>f.id===flow.id)&&<p className="flow-selection-note">Selected flow is outside the currently loaded results.</p>}<p><strong>Trigger:</strong> {flow.trigger}</p><p><strong>Outcome:</strong> {flow.outcome}</p><p>{flow.artifact} · {flow.logicalId} · {flow.source} · {flow.state}</p><p className="tiny">{flow.createdAt?`Created ${new Date(flow.createdAt).toISOString().slice(0,10)}`:'Creation date unknown'} · Date applies to this snapshot record.</p><Evidence result={detail}/>{flow.sourcePublication&&<p className="tiny">Source publication: {flow.sourcePublication.state}. {flow.sourcePublication.reason}</p>}
 <section aria-label="Flow evidence"><h3>Supporting knowledge</h3>{node&&<button onClick={()=>setNode(null)}>Show all support</button>}{supports.map(s=><div key={s.id} className="workflow-task"><strong>{s.kind} · {s.basis}</strong><p>{s.requires}</p><p>{s.file||s.element||s.path||s.flow} · {s.resolved?'Resolved':'Unresolved'}</p>{s.sourcePublication&&<p className="tiny">Source publication: {s.sourcePublication.state}. {s.sourcePublication.reason}</p>}</div>)}<h3>Gaps</h3>{(flow.gaps||[]).map((g,i)=><p key={i}>{g}</p>)}<h3>Exclusions</h3>{(flow.exclusions||[]).map((g,i)=><p key={i}>{g}</p>)}</section>
 <label>Inspect flow source<select value={source||''} onChange={e=>setSource(e.target.value||null)}><option value="">Select a referenced source</option>{(detail.data.sources||[]).map(s=><option key={s.id} value={s.id}>{s.path}</option>)}</select></label>{document&&<section aria-label="Flow source"><h3>{document.data.path}</h3><Evidence result={document}/>{document.data.path?.endsWith('.md')?<Markdown text={document.data.text||''}/>:<pre>{document.data.text}</pre>}{document.pagination?.nextCursor&&<button onClick={()=>setSourceCursor(document.pagination.nextCursor)}>Next source excerpt</button>}{sourceCursor&&<button onClick={()=>setSourceCursor(null)}>First source excerpt</button>}</section>}
 </>}</section>;
 return <>{sidebar&&createPortal(left,sidebar)}{inspector&&createPortal(right,inspector)}<section className="flows-view" aria-label="Flow exploration">
 {impact&&<p>Related flow candidates from explicit known relationships. Review contracts to determine change impact.</p>}<Diagnostics items={[...(list?.diagnostics||[]),...(detail?.diagnostics||[]),...(document?.diagnostics||[])]}/><Evidence result={list}/>
 {!flow?<p role="status">{selected?'Loading flow…':'Select a flow from the sidebar.'}</p>:flow.state==='invalid'?<p role="alert">Invalid flow record. No execution order is inferred.</p>:<><h2>{flow.title}</h2><label className="flow-support-toggle"><input type="checkbox" checked={expanded} onChange={e=>setExpanded(e.target.checked)}/>Show supporting nodes</label><div className="flow-surface"><ReactFlowProvider key={flow.id}><ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={labelledEdgeTypes} minZoom={0.1} onNodeClick={(_,n)=>setNode(n.id)} fitView nodesDraggable={false} nodesConnectable={false} deleteKeyCode={null} colorMode="dark"><GraphLabelLayout/><Background/></ReactFlow></ReactFlowProvider></div><p className="tiny">Arrows show behavior transitions and support. Participation does not create prerequisites or unit membership.</p></>}
 </section></>;
}
