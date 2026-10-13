export const stateLabels={waiting:'Waiting',processing:'Processing',validating:'Validating',done:'Done (reported)',blocked:'Blocked',failed:'Failed',interrupted:'Interrupted',unknown:'Unknown'};
export const identityKey=(artifact,change,path)=>JSON.stringify([artifact,change,path]);
export async function signatureFor(task){const bytes=new TextEncoder().encode(JSON.stringify([task.id,task.path,task.title,task.dependsOn,task.body]));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
export function taskRuntime(runtime,{artifact,change,path,signature,contextId}){
 const candidates=(runtime?.data?.attempts||[]).filter(a=>a.artifact===artifact&&a.change===change&&a.path===path&&a.signature===signature&&(!contextId||a.context===contextId));
 const latest=new Map();for(const a of candidates){const key=JSON.stringify([a.session,a.agent]);const previous=latest.get(key);if(!previous||a.startedAt>=previous.startedAt)latest.set(key,a);}
 const now=runtime?.now||Date.now();const attempts=[...latest.values()].filter(a=>a.state!=='superseded').map(a=>{
  const stale=['processing','blocked'].includes(a.state)&&(!runtime.connected||now-a.updatedAt>600000);return {...a,state:stale?'unknown':a.state,stale:stale||a.stale,elapsedMs:Math.max(0,(a.endedAt||now)-a.startedAt)};
 });
 const states=new Set(attempts.map(a=>a.state));let state='waiting';
 if(attempts.length){state=['processing','blocked','validating'].find(s=>states.has(s))|| (states.size===1?[...states][0]:'unknown');}
 return {state,attempts,events:(runtime?.data?.events||[]).filter(e=>attempts.some(a=>a.id===e.attempt)),mixed:states.size>1};
}
export const elapsedLabel=ms=>ms<60000?`${Math.floor(ms/1000)}s`:`${Math.floor(ms/60000)}m ${Math.floor(ms/1000)%60}s`;
