import {postJSON} from './request.js';
import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import Markdown from './Markdown.jsx';
import ReviewDiff from './ReviewDiff.jsx';
import {comparisonLimits} from './line-comparison.js';
import {formatContextMarkdown} from './context-packet.js';
const query=(body,signal)=>postJSON('/api/review/query',body,signal);
const json=value=>JSON.stringify(value,null,2);
export default function ChangeReview({root,contextKey,epoch,session,active,updating,repositoryFresh,inspector,onBack}){
 const [packet,setPacket]=useState(null),[status,setStatus]=useState('Loading'),[error,setError]=useState(''),[selected,setSelected]=useState(null),[sources,setSources]=useState({}),[sourceStatus,setSourceStatus]=useState('Loading'),[feedback,setFeedback]=useState(''),[request,setRequest]=useState({cursor:null,retry:0});
 const [fullComparison,setFullComparison]=useState(null),[comparisonLoading,setComparisonLoading]=useState(false),[comparisonError,setComparisonError]=useState('');
 const comparisonController=useRef(null);
 useEffect(()=>()=>comparisonController.current?.abort(),[root,contextKey,epoch,session,selected,active]);
 const identity=JSON.stringify([root,contextKey,epoch,session]),current=useRef(null),pageRef=useRef(null);
 const [worktree,artifact,change]=JSON.parse(contextKey),body={path:root,worktree,artifact,change};
 const ready=active&&!updating&&repositoryFresh&&status==='Loaded'&&packet?.freshness==='fresh'&&pageRef.current?.identity===identity&&pageRef.current?.request===request;
 current.current={identity,ready,revision:packet?.revision,selected};
 useEffect(()=>{
  setFeedback('');if(!active){setPacket(null);setSources({});setStatus('Not loaded');pageRef.current=null;return;}if(updating){setStatus('Updating');return;}
  const controller=new AbortController();setStatus('Loading');setError('');
  const previousIdentity=pageRef.current?.identity;
  let cursor=previousIdentity===identity?request.cursor:null;
  (async()=>{
   const first=await query({...body,operation:'packet',...(cursor?{cursor}:{})},controller.signal);
   let result=first;
   // Refreshes use new revision-bound cursors to retain a selected record even
   // when it is on a later page. Exports still contain only the loaded page.
   if(previousIdentity!==identity&&selected){
    while(!result.data.records.some(record=>record.id===selected)&&result.pagination.nextCursor&&result.freshness==='fresh'){
     cursor=result.pagination.nextCursor;
     result=await query({...body,operation:'packet',cursor},controller.signal);
     if(result.revision!==first.revision||result.freshness!=='fresh')throw Error('Review revision changed; reload the review.');
    }
    if(!result.data.records.some(record=>record.id===selected)){result=first;cursor=null;}
   }
   if(controller.signal.aborted||current.current.identity!==identity)return;
   pageRef.current={identity,cursor,request};setPacket(result);setSources({});setStatus(result.freshness==='fresh'?'Loaded':'Stale');setSelected(value=>result.data.records.some(r=>r.id===value)?value:result.data.records[0]?.id||null);
  })().catch(e=>{if(!controller.signal.aborted&&current.current.identity===identity){setError(e.message);setStatus('Error');}});
  return()=>controller.abort();
 },[identity,active,updating,request]);
 useEffect(()=>{
  if(!active||updating||status!=='Loaded'||!packet)return;
  const record=packet.data.records.find(r=>r.id===selected);if(!record){setSources({});return;}
  const controller=new AbortController(),revision=packet.revision;setSourceStatus('Loading');setSources({});
  Promise.all(['baseline','change'].map(async side=>{const pointer=record[side];if(!pointer)return [side,null];const result=await query({...body,operation:'source',source:pointer.id},controller.signal);if(result.revision!==revision||result.freshness!=='fresh')throw Error('Source revision changed; reload the review.');return [side,result.data];})).then(values=>{if(!controller.signal.aborted&&current.current.identity===identity&&current.current.selected===selected){setSources(Object.fromEntries(values));setSourceStatus('Loaded');}}).catch(e=>{if(!controller.signal.aborted&&current.current.identity===identity&&current.current.selected===selected){setSourceStatus('Error');setError(e.message);setStatus('Stale');}});
  return()=>controller.abort();
 },[packet?.revision,selected,active,updating,status,identity]);
 useEffect(()=>{setFullComparison(null);setComparisonError('');setComparisonLoading(false);},[identity,selected]);
 async function moreSource(side){setFullComparison(null);const source=sources[side];if(!ready||!source?.nextCursor)return;const captured=current.current;setSourceStatus('Loading');try{const result=await query({...body,operation:'source',source:source.id,cursor:source.nextCursor});if(current.current.identity!==captured.identity||current.current.revision!==captured.revision||current.current.selected!==captured.selected||!current.current.ready)return;if(result.revision!==captured.revision||result.freshness!=='fresh')throw Error('Source revision changed; reload the review.');setSources(value=>({...value,[side]:result.data}));setSourceStatus('Loaded');}catch(e){if(current.current.identity===captured.identity&&current.current.revision===captured.revision&&current.current.selected===captured.selected){setError(e.message);setStatus('Stale');}}}
 async function loadFullComparison(){
  if(!ready)return;const captured=current.current,record=packet.data.records.find(r=>r.id===selected);setComparisonLoading(true);setComparisonError('');
  const matches=()=>current.current.identity===captured.identity&&current.current.selected===captured.selected&&current.current.revision===captured.revision&&current.current.ready;
  const controller=new AbortController();comparisonController.current?.abort();comparisonController.current=controller;
  try{
   const texts={baseline:'',change:''};
   for(const side of ['baseline','change']){
    if(!record[side])continue;
    let cursor=null;
    do{
     const result=await query({...body,operation:'source',source:record[side].id,...(cursor?{cursor}:{})},controller.signal);
     if(!matches())return;if(result.revision!==captured.revision||result.freshness!=='fresh')throw Error('Source revision changed; reload the review.');
     const part=result.data;if(part.offset!==texts[side].length||(!part.text.length&&part.nextCursor))throw Error('Source excerpts do not form a complete comparison.');
     texts[side]+=part.text;cursor=part.nextCursor;
     if(texts.baseline.length+texts.change.length>comparisonLimits.characters||texts[side].split('\n').length>comparisonLimits.lines+1)throw Error('Comparison too large. Use raw source excerpts below.');
    }while(cursor);
   }
   if(matches())setFullComparison({selected,revision:captured.revision,texts});
  }catch(e){if(matches()&&!controller.signal.aborted)setComparisonError(e.message);}
  finally{if(matches())setComparisonLoading(false);}
 }
 async function exportPacket(format){if(!current.current.ready)return;const captured=current.current;try{const text=format==='json'?json(packet)+'\n':formatContextMarkdown(packet);if(format==='copy'){await navigator.clipboard.writeText(text);if(current.current.identity===captured.identity&&current.current.revision===captured.revision&&current.current.ready)setFeedback('Markdown copied.');}else{const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/markdown;charset=utf-8'})),link=document.createElement('a');try{link.href=url;link.download=`${artifact}-${change}-context.${format==='json'?'json':'md'}`;document.body.appendChild(link);link.click();setFeedback(`${format==='json'?'JSON':'Markdown'} download requested.`);}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}}}catch{if(current.current.identity===captured.identity&&current.current.revision===captured.revision&&current.current.ready)setFeedback(`${format==='copy'?'Copy':'Download'} failed. Retry when local browser access is available.`);}}
 const record=packet?.data.records.find(r=>r.id===selected);
 const full=fullComparison?.selected===selected&&fullComparison?.revision===packet?.revision?fullComparison.texts:null;
 const complete=Boolean(full)||Boolean(record&&sourceStatus==='Loaded'&&['baseline','change'].every(side=>!record[side]||(sources[side]?.id===record[side].id&&sources[side]?.offset===0&&!sources[side]?.nextCursor&&sources[side]?.text.length===sources[side]?.totalCharacters)));
 const displayStatus=updating?'Updating':!repositoryFresh&&packet?'Stale':status;
 const records=unchanged=>
<nav aria-label={unchanged?'Unchanged knowledge':'Changed knowledge'} className="review-records">{packet.data.records.filter(r=>(r.status==='unchanged')===unchanged).map(r=>
<button key={r.id} aria-pressed={selected===r.id} onClick={()=>setSelected(r.id)}>{r.status} · {r.path}</button>)}</nav>;
 const details=<div className="review-details">
<h2>Review evidence</h2>{packet&&<>
<p>{packet.data.evidence.approval}</p>
<p>Publication: {packet.data.evidence.publication.state}</p>{packet.data.evidence.publication.reasons.map((reason,i)=>
<p key={i}>{reason}</p>)}<details>
<summary>Publication sources</summary>
<pre>{json(packet.data.evidence.publication.sources)}</pre>
</details>
<details>
<summary>Recorded phase and task evidence</summary>
<pre>{json(packet.data.evidence.workflow)}</pre>
</details>
<h3>Candidate flow impact</h3>
<p>{packet.data.impact.coverage}</p>{packet.data.impact.candidates.length?packet.data.impact.candidates.map(flow=>
<section key={flow.logicalId}>
<h4>{flow.title} · {flow.logicalId}</h4>{flow.sides.map((side,i)=>
<div key={i}>
<p>{side.side} · {side.snapshot}</p>
<p>{side.reason}</p>
<code>{side.path}</code>
<details>
<summary>Recorded relationship path</summary>
<pre>{json(side.impactPath)}</pre>
</details>
</div>)}</section>):<p>No candidates in the evaluated recorded relationships. This does not cover all behavior.</p>}<details>
<summary>Declared flow assessment</summary>
<pre>{json(packet.data.impact.declaredAssessment)}</pre>
</details>
<h3>Unresolved facts</h3>{packet.data.unresolvedFacts.length?packet.data.unresolvedFacts.map((d,i)=>
<p key={i}>{d.message} {d.path}</p>):<p>No additional source diagnostics.</p>}<details>
<summary>Context limits</summary>{packet.data.limits.map((limit,i)=>
<p key={i}>{limit}</p>)}</details>
</>}</div>;
 return <>{active&&<section className="change-review" aria-label="Change review">
<div className="review-heading">
<button onClick={onBack}>Back to delivery</button>
<h2>{artifact} / {change}</h2>
</div>
<div role="status" aria-label="Review status">{displayStatus}</div>
{packet&&<>
{packet.data.baseline.kind==='protected-ref'?<p>Baseline: established on {String(packet.data.baseline.ref||'main').replace('refs/heads/','')} · {packet.data.baseline.baselineLayout==='legacy'?`legacy snapshot ${packet.data.baseline.version||''}`:`version ${packet.data.baseline.version||'none'}`} · {packet.data.baseline.state}{packet.data.baseline.reason?` · ${packet.data.baseline.reason}`:''}</p>:<p>Baseline: declared-current {packet.context.baseline.version||(packet.data.baseline.state==='initial'?'None (initial)':'Unavailable')} · {packet.data.baseline.state}</p>}
{packet.data.evidence.workflow?.layout==='in-place'&&<section aria-label="Declared evidence"><h3>Declared evidence</h3><ul>{packet.data.evidence.workflow.steps.map(s=><li key={s.name}>{s.name}: {s.state.replaceAll('-',' ')}</li>)}</ul><p>Remaining gate: {packet.data.evidence.workflow.currentStep||(packet.data.evidence.workflow.history?'None in this change record':'Team review and merge')}. {packet.data.evidence.approval}</p></section>}
<section aria-label="Proposed scope and purpose"><h3>Purpose and scope</h3><Markdown text={packet.data.sources.find(s=>s.id===packet.data.scope.source?.id)?.text||'No scope excerpt available.'}/></section>
<details className="review-context"><summary>Captured source details</summary><p className="review-path">Worktree: {worktree}</p><p>HEAD: {packet.context.head}</p><p>Captured revision: {packet.revision}</p></details>
</>}<details className="review-export"><summary>Export context · Loaded records page</summary><div className="review-actions">
<button disabled={!ready} onClick={()=>exportPacket('copy')}>Copy Markdown</button>
<button disabled={!ready} onClick={()=>exportPacket('markdown')}>Download Markdown</button>
<button disabled={!ready} onClick={()=>exportPacket('json')}>Download JSON</button>
</div></details>
<button disabled={updating} onClick={()=>setRequest({cursor:null,retry:request.retry+1})}>Reload review</button>
<p role="status" aria-label="Export feedback">{feedback}</p>{error&&<p role="alert">{error}</p>}
 {packet&&<>
<section className="review-warnings" aria-label="Review limitations">
 {packet.completeness==='partial'&&<p>
<strong>Partial context packet.</strong> Missing evidence, remaining pages and omitted text stay explicit in exports.</p>}
 {!!packet.pagination.nextCursor&&<p>More knowledge records remain. This packet contains the loaded page.</p>}
 <details>
<summary>{packet.diagnostics.length} diagnostics · {packet.omissions.length} omissions · {packet.data.sources.filter(s=>s.omittedCharacters>0).length} shortened sources</summary>
 {packet.diagnostics.map((d,i)=>
<p key={i}>{d.code}: {d.message} {d.path}</p>)}
 {packet.omissions.filter(o=>o.reason!=='Excerpt budget.').map((o,i)=>
<p key={i}>Omitted: {o.path} {o.reason}</p>)}
 {packet.data.sources.filter(s=>s.omittedCharacters>0).map(s=>
<p key={s.id}>Shortened: {s.path} · {s.omittedCharacters} characters omitted</p>)}
 </details>
</section>
 <h3>Changed knowledge</h3>{records(false)}{!packet.data.records.some(r=>r.status!=='unchanged')&&<p>No changed knowledge on this page.</p>}<details className="review-unchanged">
<summary>Unchanged governing knowledge</summary>{records(true)}</details>
<p>Loaded records {packet.data.records.length?packet.pagination.offset+1:0}–{packet.pagination.offset+packet.data.records.length} of {packet.pagination.totalRecords}.</p>
<div className="review-actions">{pageRef.current?.cursor&&<button disabled={!ready} onClick={()=>setRequest({cursor:null,retry:request.retry+1})}>First records page</button>}{packet.pagination.nextCursor&&<button disabled={!ready} onClick={()=>setRequest({cursor:packet.pagination.nextCursor,retry:request.retry+1})}>Next records page</button>}</div>{record&&<section aria-label="Knowledge comparison">
<h3>{record.path} · {record.status}</h3>
<p role="status" aria-label="Comparison status">{sourceStatus}</p>
<ReviewDiff before={record.status==='unchanged'&&!record.baseline?full?.change??(sources.change?.id===record.change?.id?sources.change?.text||'':''):full?.baseline??(sources.baseline?.id===record.baseline?.id?sources.baseline?.text||'':'')} after={full?.change??(sources.change?.id===record.change?.id?sources.change?.text||'':'')} complete={complete} canLoad={ready&&sourceStatus==='Loaded'} onLoad={loadFullComparison} loading={comparisonLoading} error={comparisonError}/>
<details className="raw-source-excerpts"><summary>Raw source excerpts</summary><div className="review-comparison">{['baseline','change'].map(side=>
<section key={side} aria-label={side==='baseline'?'Before':'After'}>
<h4>{side==='baseline'?'Before':'After'}</h4>{!record[side]?<p>No {side==='baseline'?'baseline':'change'} source ({record.status}).</p>:<>
<code>{record[side].path}</code>
<details><summary>Source details</summary><p className="review-path">SHA256: {record[side].fingerprint}</p></details>{sources[side]?.id===record[side].id&&<>
<p>Characters {sources[side].offset}–{sources[side].offset+sources[side].text.length} of {sources[side].totalCharacters}</p>
<pre>{sources[side].text}</pre>{sources[side].omittedCharacters>0&&<p>{sources[side].omittedCharacters} characters remain.</p>}{sources[side].nextCursor&&<button disabled={!ready||sourceStatus==='Loading'} onClick={()=>moreSource(side)}>Next {side==='baseline'?'before':'after'} excerpt</button>}</>}</>}</section>)}</div></details>
</section>}</>}
 </section>}{active&&inspector&&createPortal(details,inspector)}</>;
}
