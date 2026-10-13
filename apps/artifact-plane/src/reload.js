// One active reload and one trailing request; cancellation invalidates old work.
export function refreshQueue(load){
 let running=null,again=false,closed=false,controller=null;
 return {
  request(){if(closed)return Promise.resolve();if(running){again=true;return running;}
   running=(async()=>{do{again=false;controller=new AbortController();await load(controller.signal);}while(again&&!closed);})().finally(()=>{running=null;controller=null;});return running;
  },
  close(){closed=true;again=false;controller?.abort();},
  get active(){return Boolean(running);}
 };
}
export async function repositoryQuery(body,signal){const response=await fetch('/api/repository/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const result=await response.json();if(!response.ok)throw Error(result.error||'Repository could not be read.');return result;}
export function mergeUnit(snapshot,key,unit){const [path,id]=JSON.parse(key);return {...snapshot,workflow:{...snapshot.workflow,worktrees:snapshot.workflow.worktrees.map(w=>w.path!==path?w:{...w,unitsOfWork:w.unitsOfWork.map(u=>u.id===id?unit:u)})}};}
export function mergeChange(snapshot,key,change){const [path,artifact,name]=JSON.parse(key);return {...snapshot,workflow:{...snapshot.workflow,worktrees:snapshot.workflow.worktrees.map(w=>w.path!==path?w:{...w,changes:w.changes.map(c=>c.artifact===artifact&&c.name===name?change:c)})}};}
