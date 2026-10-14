import React,{createContext,useContext,useEffect,useState,useMemo} from 'react';
import {signatureFor,identityKey,taskRuntime,stateLabels,elapsedLabel} from './runtime-model.js';
const Context=createContext({data:null,connected:false,signatures:{},now:Date.now()});
export function useRuntime(){return useContext(Context);}
export function RuntimeProvider({snapshot,children,active=true}){
 const [data,setData]=useState(null),[connected,setConnected]=useState(false),[signatures,setSignatures]=useState({}),[now,setNow]=useState(Date.now());
 const path=snapshot?.repository.path;
 useEffect(()=>{let cancelled=false;const tasks=[];
  for(const w of snapshot?.workflow.worktrees||[]){for(const c of w.changes||[])for(const task of c.taskGraph?.tasks||[])tasks.push({artifact:c.artifact,change:c.name,task});for(const unit of w.unitsOfWork||[])for(const n of unit.implementationGraph.nodes||[])if(n.kind==='task')tasks.push({artifact:n.artifact,change:n.change,task:n.task});}
  Promise.all(tasks.map(async n=>[identityKey(n.artifact,n.change,n.task.path),await signatureFor(n.task)])).then(entries=>{if(!cancelled)setSignatures(Object.fromEntries(entries));});return()=>{cancelled=true;};
 },[snapshot]);
 useEffect(()=>{if(!active||!path){setConnected(false);return;}let cancelled=false,inFlight=false,again=false;const controller=new AbortController();setData(null);setConnected(false);
  const refresh=async()=>{if(inFlight){again=true;return;}inFlight=true;try{const res=await fetch('/api/runtime/query',{signal:controller.signal,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path})});const result=await res.json();if(!res.ok)throw Error('Runtime query failed');if(!cancelled){setData(result);if(!result.available)setConnected(false);}}catch{if(!cancelled)setConnected(false);}finally{inFlight=false;if(again&&!cancelled){again=false;refresh();}}};
  let events=null;
  const connect=()=>{events?.close();const source=new EventSource('/api/runtime/events');events=source;
   source.onopen=()=>{if(!cancelled&&events===source){setConnected(true);refresh();}};
   source.onmessage=e=>{if(cancelled||events!==source)return;try{const update=JSON.parse(e.data);setConnected(Boolean(update.available));refresh();}catch{setConnected(false);}};
   source.onerror=()=>{if(!cancelled&&events===source)setConnected(false);};
  };
  const offline=()=>{setConnected(false);events?.close();events=null;};
  const online=()=>{connect();refresh();};
  window.addEventListener('offline',offline);window.addEventListener('online',online);if(navigator.onLine){refresh();connect();}
  const clock=setInterval(()=>setNow(Date.now()),1000);return()=>{cancelled=true;controller.abort();events?.close();clearInterval(clock);window.removeEventListener('offline',offline);window.removeEventListener('online',online);};
 },[path,active]);
 const value=useMemo(()=>({data,connected,signatures,now}),[data,connected,signatures,now]);return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTaskRuntime(artifact,change,path,recorded){const runtime=useRuntime();return taskRuntime(runtime,{artifact,change,path,signature:recorded?.signature||runtime.signatures[identityKey(artifact,change,path)],contextId:recorded?.contextId});}
export function RuntimeBadge({value}){return <div className={`runtime-badge state-${value.state}`}><b>{stateLabels[value.state]||'Unknown'}</b>{value.attempts.length>0&&<span>{value.attempts.length>1?`${value.attempts.length} agents`:value.attempts[0].agent||value.attempts[0].session} · {elapsedLabel(Math.max(...value.attempts.map(a=>a.elapsedMs)))}</span>}{value.attempts.length===1&&<small>{value.attempts[0].stale?'Stale · last observed '+value.attempts[0].lastObservedState:value.attempts[0].activity}</small>}</div>;}
export function RuntimeDetails({value}){return <section className="runtime-details"><h3>Observed execution</h3><RuntimeBadge value={value}/>{!value.attempts.length&&<p className="muted">No matching execution attempt was recorded. Documented checklist results remain separate; no runtime readiness or approval is inferred.</p>}{value.mixed&&<p>Attempts have different results; no combined success is inferred.</p>}{value.attempts.map(a=><details key={a.id}><summary>{a.agent||a.session} · {stateLabels[a.state]||'Unknown'}</summary><p>Session: {a.session}{a.agent&&` · Agent: ${a.agent}`}</p><p>Attempt: {a.id}</p><p>Last observed: {new Date(a.updatedAt).toLocaleString()} · {a.activity}</p>{a.stale&&<p>Freshness expired or connection lost. Last observed state: {a.lastObservedState}</p>}{a.validation&&<p>Reported validation: {a.validation.method} · {a.validation.source}</p>}{value.events.filter(e=>e.attempt===a.id).map(e=><p key={e.id} className="tiny">{new Date(e.observedAt).toLocaleTimeString()} · {e.kind}{e.tool&&` · ${e.tool}`}</p>)}</details>)}<p className="muted">Observations and reported validation do not establish versions.</p></section>;}
export function RuntimeConnection(){const r=useRuntime();return <span className={`runtime-connection ${r.connected?'connected':''}`}>{r.connected?'Observer connected':'Observer disconnected / unavailable'}</span>;}
