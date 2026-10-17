import React,{useEffect,useState} from 'react';
import CodePanel from './CodePanel.jsx';
import Markdown from './Markdown.jsx';
import {repositoryQuery} from './reload.js';

export function documentSummary(text=''){
 const body=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
 return body.split(/\n\s*\n/).find(block=>block.trim()&&!/^\s*#/.test(block))||'';
}

// Document body presenter: loads one contained source and renders it safely.
// onLoaded receives the loaded text so a page can offer editing later.
export default function Reader({entry,root,worktree,epoch,onNavigate,targets,onLoaded}){
 const [document,setDocument]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[nextLoad,setNextLoad]=useState(null);
 useEffect(()=>{setNextLoad(null);},[entry,epoch]);
 useEffect(()=>{
  const controller=new AbortController();setDocument(null);setError('');
  const read=nextLoad||entry.load;
  const load=read?read(controller.signal):repositoryQuery({path:root,worktree,section:'markdown',source:entry.source,...entry.scope},controller.signal).then(r=>({markdown:r.data.markdown,source:r.data.source,partial:r.completeness==='partial'}));
  load.then(value=>{if(!controller.signal.aborted){setDocument(value);onLoaded?.(value);}}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
  return()=>controller.abort();
 },[entry,root,worktree,epoch,retry,nextLoad]);
 return <section className="document-reader" aria-label="Document text">
  {error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Retry source</button></div>:!document?<p role="status">Loading source…</p>:<>
   {document.partial&&<p role="status">Partial source excerpt. Additional source text remains available in its source view.</p>}{document.next&&<button onClick={()=>{setDocument(null);setNextLoad(()=>document.next);}}>Next source excerpt</button>}
   {entry.source.endsWith('.md')?<Markdown text={document.markdown||''} source={entry.source} targets={entry.targets||targets} onNavigate={link=>onNavigate({...link,targets:entry.targets||targets})}/>:<CodePanel text={document.markdown||''} source={entry.source}/>}
  </>}
  <details className="reader-source"><summary>Source details</summary><code>{entry.source}</code><p>{worktree}</p></details>
 </section>;
}
