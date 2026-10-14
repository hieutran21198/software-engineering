import {realpath,readdir,stat,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {git,ExploreError} from './reader.js';
import {parseWorktrees} from './workflow.js';
import {readFlowSource} from './flow-reader.js';
let fsActive=0;const fsWaiting=[];
async function fsRead(work){if(fsActive>=8)await new Promise(resolve=>fsWaiting.push(resolve));else fsActive++;try{return await work();}finally{const next=fsWaiting.shift();if(next)next();else fsActive--;}}
const contained=(root,path)=>{const rel=relative(root,path);return rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel)&&!rel.split(sep).includes('.git');};
export async function readableRoot(path){
 if(typeof path!=='string'||!isAbsolute(path)||path.includes('\0'))throw new ExploreError(400,'Enter an absolute repository path.');
 const root=await realpath(path).catch(()=>{throw new ExploreError(404,'Repository path does not exist or cannot be read.');});
 const top=await git(root,['rev-parse','--show-toplevel']).catch(()=>{throw new ExploreError(422,'Select a readable Git worktree root.');});
 if(await realpath(top)!==root)throw new ExploreError(422,'Select the worktree root.');
 const base=await realpath(resolve(root,'docs/artifacts')).catch(()=>null);
 if(!base||!contained(root,base)||!(await stat(base)).isDirectory())throw new ExploreError(404,'Repository has no readable docs/artifacts directory.');
 return root;
}
export async function repositoryFingerprint(root,{signal}={}){
 const hash=createHash('sha256'),trees=await git(root,['worktree','list','--porcelain','-z'],true);hash.update(trees);
 let files=0;
 for(const worktree of parseWorktrees(trees)){
  hash.update(worktree.path);let target;
  try{target=await realpath(worktree.path);await readdir(target);}catch{hash.update('unavailable');continue;}
  const metadata=await Promise.all([['rev-parse','HEAD'],['symbolic-ref','--short','HEAD'],['status','--porcelain=v1','-z','--untracked-files=all'],['rev-parse','--is-shallow-repository'],['rev-parse','--verify','refs/heads/main'],['rev-parse','--verify','refs/heads/master']].map(args=>git(target,args,true).catch(()=>null)));
  hash.update(JSON.stringify(metadata));
  async function walk(path,ancestors=new Set()){
   if(signal?.aborted)throw Error('Observation stopped');
   const local=createHash('sha256');local.update(JSON.stringify(relative(target,path)));
   try{
    const resolved=await fsRead(()=>realpath(path));if(!contained(target,resolved)){local.update('unsafe');return local.digest('hex');}if(ancestors.has(resolved)){local.update('cycle');return local.digest('hex');}
    const info=await fsRead(()=>stat(resolved));
    if(info.isDirectory()){
     const next=new Set([...ancestors,resolved]);const entries=(await fsRead(()=>readdir(resolved,{withFileTypes:true}))).filter(e=>e.name!=='.git').sort((a,b)=>a.name.localeCompare(b.name));
     for(let offset=0;offset<entries.length;offset+=8){const hashes=await Promise.all(entries.slice(offset,offset+8).map(entry=>walk(resolve(path,entry.name),next)));for(const value of hashes)local.update(value);}
    }else if(info.isFile()&&/\.(md|yaml)$/i.test(path)){
     const value=await fsRead(async()=>createHash('sha256').update(await readFile(resolved)).digest('hex'));local.update(value);files++;
    }
   }catch(error){if(signal?.aborted)throw error;local.update('unreadable:'+error.code);}
   return local.digest('hex');
  }
  hash.update(await walk(resolve(target,'docs/artifacts')));
 }
 return {fingerprint:hash.digest('hex'),files};
}
export function repositoryService({intervalMs=2000,debounceMs=250,heartbeatMs=15000,maxClients=16,sample=repositoryFingerprint}={}){
 const observers=new Map();let clients=0,closed=false;
 const stop=observer=>{observer.stopped=true;observer.controller.abort();clearTimeout(observer.poll);clearTimeout(observer.debounce);clearInterval(observer.heartbeat);observers.delete(observer.root);};
 async function tick(observer){
  if(observer.stopped)return;
  let state;try{const start=Date.now(),value=await sample(observer.root,{signal:observer.controller.signal});state={available:true,fingerprint:value.fingerprint};observer.lastScanMs=Date.now()-start;observer.files=value.files;}catch{state={available:false,fingerprint:null};}
  if(observer.stopped)return;
  const key=JSON.stringify(state);
  if(key!==observer.last){observer.last=key;observer.sequence++;observer.available=state.available;
   if(!observer.debounce)observer.debounce=setTimeout(()=>{observer.debounce=null;for(const res of observer.clients)res.write('data: '+JSON.stringify({sequence:observer.sequence,available:observer.available})+'\n\n');},debounceMs);
  }
  observer.poll=setTimeout(()=>tick(observer),intervalMs);observer.poll.unref();
 }
 return {
  async subscribe(req,res,headers,path){
   const root=await readableRoot(path);if(closed)throw new ExploreError(503,'Observation is unavailable.');if(clients>=maxClients)throw new ExploreError(429,'Too many observation clients.');
   res.writeHead(200,{...headers,'Content-Type':'text/event-stream; charset=utf-8',Connection:'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 1500\n\n');
   let observer=observers.get(root);
   if(!observer){observer={root,clients:new Set(),sequence:0,last:null,available:false,stopped:false,controller:new AbortController()};observers.set(root,observer);
    observer.heartbeat=setInterval(()=>{for(const client of observer.clients)client.write(': heartbeat\n\n');},heartbeatMs);observer.heartbeat.unref();
   }
   observer.clients.add(res);clients++;
   if(observer.last!==null)res.write('data: '+JSON.stringify({sequence:observer.sequence,available:observer.available})+'\n\n');else if(observer.clients.size===1)tick(observer);
   let removed=false;const cleanup=()=>{if(removed)return;removed=true;observer.clients.delete(res);clients--;if(!observer.clients.size)stop(observer);};
   req.on('close',cleanup);res.on('close',cleanup);if(req.destroyed||res.destroyed)cleanup();
  },
  close(){closed=true;for(const observer of [...observers.values()]){stop(observer);for(const res of observer.clients)res.end();}},
  get clientCount(){return clients;},get observerCount(){return observers.size;},
  stats(){return [...observers.values()].map(o=>({root:o.root,sequence:o.sequence,available:o.available,lastScanMs:o.lastScanMs,files:o.files}));}
 };
}

// Read only sources that a flow context registered. Git status alone misses a
// second edit to an already dirty implementation file.
export async function registeredSourceFingerprint(root, base, sources, {signal}={}){
 if(!sources.length)return base;
 const hash=createHash('sha256').update(base.fingerprint),trees=new Set(parseWorktrees(await git(root,['worktree','list','--porcelain','-z'],true)).map(t=>t.path)),tracked=new Map();
 let files=base.files;
 for(const source of [...sources].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))){
  if(signal?.aborted)throw Error('Observation stopped');
  hash.update(JSON.stringify([source.worktree,source.path,source.kind]));
  if(!trees.has(source.worktree)){hash.update('unavailable');continue;}
  try{
   if(!tracked.has(source.worktree))tracked.set(source.worktree,new Set((await git(source.worktree,['ls-files','-z'],true)).split('\0').filter(Boolean)));
   const value=await readFlowSource(source.worktree,source,tracked.get(source.worktree));hash.update(value.fingerprint);files++;
  }catch{hash.update('unavailable');}
 }
 return {fingerprint:hash.digest('hex'),files};
}
