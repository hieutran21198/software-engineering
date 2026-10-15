import React,{useEffect,useState} from 'react';
import Markdown from './Markdown.jsx';
import {repositoryQuery} from './reload.js';

export function documentSummary(text=''){
 const body=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
 return body.split(/\n\s*\n/).find(block=>block.trim()&&!/^\s*#/.test(block))||'';
}

export default function Reader({entry,root,worktree,epoch,onBack,onClose,onNavigate,targets,backLabel}){
 const [document,setDocument]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[nextLoad,setNextLoad]=useState(null);
 useEffect(()=>{setNextLoad(null);},[entry,epoch]);
 useEffect(()=>{
  const controller=new AbortController();setDocument(null);setError('');
  const read=nextLoad||entry.load;
  const load=read?read(controller.signal):repositoryQuery({path:root,worktree,section:'markdown',source:entry.source,...entry.scope},controller.signal).then(r=>({markdown:r.data.markdown,source:r.data.source,partial:r.completeness==='partial'}));
  load.then(value=>{if(!controller.signal.aborted)setDocument(value);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
  return()=>controller.abort();
 },[entry,root,worktree,epoch,retry,nextLoad]);
 return <section className="document-reader" aria-label="Knowledge reader">
  <nav aria-label="Document navigation"><button onClick={onBack}>Back to {backLabel||entry.parent||'artifact'}</button><button onClick={onClose}>Back to graph</button></nav>
  <h2>{entry.title||entry.source}</h2><details className="reader-source"><summary>Source details</summary><code>{entry.source}</code><p>{worktree}</p></details>
  {error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Retry source</button></div>:!document?<p role="status">Loading source…</p>:<>
   {document.partial&&<p role="status">Partial source excerpt. Additional source text remains available in its source view.</p>}{document.next&&<button onClick={()=>{setDocument(null);setNextLoad(()=>document.next);}}>Next source excerpt</button>}
   <Markdown text={document.markdown||''} source={entry.source} targets={entry.targets||targets} onNavigate={link=>onNavigate({...link,targets:entry.targets||targets})}/>
  </>}
 </section>;
}
