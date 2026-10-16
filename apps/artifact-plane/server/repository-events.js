import {realpath,readdir,stat,readFile} from 'node:fs/promises';
import {watch} from 'node:fs';
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
// One walk rule serves the full reconciliation oracle and the incremental map:
// each node hash covers its relative path and its bytes or ordered children.
const KNOWLEDGE_FILE=/\.(md|yaml)$/i;
const METADATA=[['rev-parse','HEAD'],['symbolic-ref','--short','HEAD'],['status','--porcelain=v1','-z','--untracked-files=all'],['rev-parse','--is-shallow-repository'],['rev-parse','--verify','refs/heads/main'],['rev-parse','--verify','refs/heads/master']];
function nodeHash(tree,path,record){
 const local=createHash('sha256');local.update(JSON.stringify(relative(tree.target,path)));
 if(record.kind==='dir')for(const name of record.children)local.update(tree.nodes.get(resolve(path,name)).hash);
 else if(record.kind==='file')local.update(record.content);
 else if(record.kind!=='other')local.update(record.kind==='unreadable'?'unreadable:'+record.code:record.kind);
 return local.digest('hex');
}
// Walk one subtree, read its knowledge bytes, and record every node.
async function scanTree(tree,path,ancestors,signal){
 if(signal?.aborted)throw Error('Observation stopped');
 let record={kind:'other'};
 try{
  const resolved=await fsRead(()=>realpath(path));
  if(!contained(tree.target,resolved))record={kind:'unsafe'};
  else if(ancestors.has(resolved))record={kind:'cycle'};
  else{
   const info=await fsRead(()=>stat(resolved));
   if(info.isDirectory()){
    const next=new Set([...ancestors,resolved]);
    const entries=(await fsRead(()=>readdir(resolved,{withFileTypes:true}))).filter(e=>e.name!=='.git').sort((a,b)=>a.name.localeCompare(b.name));
    record={kind:'dir',resolved,ancestors,children:entries.map(e=>e.name)};
    for(let offset=0;offset<entries.length;offset+=8)await Promise.all(entries.slice(offset,offset+8).map(entry=>scanTree(tree,resolve(path,entry.name),next,signal)));
   }else if(info.isFile()&&KNOWLEDGE_FILE.test(path)){
    const bytes=await fsRead(()=>readFile(resolved));tree.metrics.bytes+=bytes.length;tree.metrics.reads++;
    record={kind:'file',content:createHash('sha256').update(bytes).digest('hex')};
   }
  }
 }catch(error){if(signal?.aborted)throw error;record={kind:'unreadable',code:error.code};}
 record.hash=nodeHash(tree,path,record);tree.nodes.set(path,record);
 if(record.kind==='dir')tree.onDirectory?.(path,record);
 return record.hash;
}
function removeSubtree(tree,path){
 for(const [key,record] of tree.nodes)if(key===path||key.startsWith(path+sep)){tree.nodes.delete(key);if(record.kind==='dir')tree.onRemove?.(key);}
}
const fileCount=tree=>{let n=0;for(const record of tree.nodes.values())if(record.kind==='file')n++;return n;};
async function worktreeTarget(path){try{const target=await realpath(path);await readdir(target);return target;}catch{return null;}}
// Full reconciliation oracle: reread every knowledge byte of every worktree.
export async function repositoryFingerprint(root,{signal}={}){
 const hash=createHash('sha256'),trees=await git(root,['worktree','list','--porcelain','-z'],true);hash.update(trees);
 let files=0,bytes=0;
 for(const worktree of parseWorktrees(trees)){
  hash.update(worktree.path);const target=await worktreeTarget(worktree.path);
  if(!target){hash.update('unavailable');continue;}
  hash.update(JSON.stringify(await Promise.all(METADATA.map(args=>git(target,args,true).catch(()=>null)))));
  const tree={target,nodes:new Map(),metrics:{bytes:0,reads:0}};
  hash.update(await scanTree(tree,resolve(target,'docs/artifacts'),new Set(),signal));files+=fileCount(tree);bytes+=tree.metrics.bytes;
 }
 return {fingerprint:hash.digest('hex'),files,bytes};
}
const defaultWatch=(path,listener,onError)=>{const handle=watch(path,{persistent:false},listener);handle.on('error',onError);return handle;};
// Incremental observation. Notifications are hints: they invalidate contained
// paths, whose bytes are reread regardless of size or timestamps. A full
// reconciliation runs at least fullMs after the previous one completes, or
// fallbackMs while observation is degraded, so missed events are recovered.
export function incrementalSampler(root,{wake=()=>{},debounceMs=250,fullMs=30000,fallbackMs=10000,maxWatches=4096,maxPending=256,now=Date.now,watchPath=defaultWatch,timers=globalThis}={}){
 const trees=new Map(),metrics={bytes:0,reads:0,fullScans:0,incrementalScans:0,collapses:0,lastScanMs:null};
 let watches=0,degraded=false,forceFull=true,lastFull=null,running=null,wakeTimer=null,closed=false;
 const notify=()=>{if(closed||wakeTimer)return;wakeTimer=timers.setTimeout(()=>{wakeTimer=null;if(!closed)wake();},debounceMs);wakeTimer?.unref?.();};
 function invalidate(tree,directory,name){
  if(tree.pending!=='all'){
   if(name===null||name.includes('/')||name.includes(sep)||name==='..'||name==='.')tree.pending.set(directory,null);
   else if(tree.pending.get(directory)!==null){const names=tree.pending.get(directory)||new Set();names.add(name);tree.pending.set(directory,names.size>64?null:names);}
   // Bound the queue: collapse to a worktree reconciliation instead of growing.
   if(tree.pending.size>maxPending){tree.pending='all';metrics.collapses++;}
  }
  notify();
 }
 function removeWatch(tree,path){const entry=tree.watchers.get(path);if(entry){entry.handle.close();tree.watchers.delete(path);watches--;}}
 function addWatch(tree,path,record){
  const current=tree.watchers.get(path);
  if(current?.resolved===record.resolved)return;
  if(current)removeWatch(tree,path);
  if(watches>=maxWatches){degraded=true;return;}
  const entry={resolved:record.resolved,handle:null};
  try{
   entry.handle=watchPath(record.resolved,(event,name)=>{if(!closed&&tree.watchers.get(path)===entry)invalidate(tree,path,name==null?null:String(name));},()=>{degraded=true;if(tree.watchers.get(path)===entry)removeWatch(tree,path);notify();});
   tree.watchers.set(path,entry);watches++;
  }catch{degraded=true;}
 }
 function dropTree(tree){for(const path of [...tree.watchers.keys()])removeWatch(tree,path);tree.nodes.clear();tree.pending=new Map();}
 function newTree(target){
  const tree={target,base:resolve(target,'docs/artifacts'),nodes:new Map(),watchers:new Map(),pending:new Map(),metadata:null,metrics,syncing:false};
  tree.onDirectory=(path,record)=>{if(!tree.syncing)addWatch(tree,path,record);};tree.onRemove=path=>{if(!tree.syncing)removeWatch(tree,path);};
  return tree;
 }
 async function full(tree,signal){
  // Events during the scan stay pending and are drained by the next sample.
  tree.pending=new Map();tree.syncing=true;tree.nodes=new Map();
  try{await scanTree(tree,tree.base,new Set(),signal);}finally{tree.syncing=false;}
  for(const path of [...tree.watchers.keys()])if(tree.nodes.get(path)?.kind!=='dir')removeWatch(tree,path);
  for(const [path,record] of tree.nodes)if(record.kind==='dir')addWatch(tree,path,record);
 }
 const parent=path=>path.slice(0,path.lastIndexOf(sep));
 const inside=(tree,path)=>path===tree.base||path.startsWith(tree.base+sep);
 async function rescanBase(tree,signal){removeSubtree(tree,tree.base);await scanTree(tree,tree.base,new Set(),signal);}
 async function refresh(tree,directory,name,signal){
  const record=tree.nodes.get(directory);
  if(!inside(tree,directory))return rescanBase(tree,signal);
  if(!record||record.kind!=='dir')return directory===tree.base?rescanBase(tree,signal):refresh(tree,parent(directory),directory.slice(directory.lastIndexOf(sep)+1),signal);
  let names=null;
  try{const resolved=await fsRead(()=>realpath(directory));if(resolved===record.resolved)names=(await fsRead(()=>readdir(resolved,{withFileTypes:true}))).filter(e=>e.name!=='.git').map(e=>e.name).sort((a,b)=>a.localeCompare(b));}catch{names=null;}
  if(names===null||name===null){
   // A replaced, unreadable or ambiguous directory is rescanned as a whole.
   return directory===tree.base?rescanBase(tree,signal):refresh(tree,parent(directory),directory.slice(directory.lastIndexOf(sep)+1),signal);
  }
  const next=new Set([...record.ancestors,record.resolved]);
  for(const child of record.children)if(!names.includes(child))removeSubtree(tree,resolve(directory,child));
  for(const child of names)if(!record.children.includes(child)||child===name){removeSubtree(tree,resolve(directory,child));await scanTree(tree,resolve(directory,child),next,signal);}
  record.children=names;
  for(let path=directory;inside(tree,path);path=parent(path)){const value=tree.nodes.get(path);value.hash=nodeHash(tree,path,value);if(path===tree.base)break;}
 }
 async function run({signal}={}){
  const start=now();
  const fullDue=forceFull||lastFull===null||start-lastFull>=(degraded?fallbackMs:fullMs);
  if(fullDue){forceFull=false;degraded=false;}
  const hash=createHash('sha256'),list=await git(root,['worktree','list','--porcelain','-z'],true);hash.update(list);
  const listed=parseWorktrees(list);
  for(const [path,tree] of trees)if(!listed.some(w=>w.path===path)){dropTree(tree);trees.delete(path);}
  let files=0;
  for(const worktree of listed){
   hash.update(worktree.path);const target=await worktreeTarget(worktree.path);
   if(!target){hash.update('unavailable');const tree=trees.get(worktree.path);if(tree){dropTree(tree);trees.delete(worktree.path);}continue;}
   const metadata=await Promise.all(METADATA.map(args=>git(target,args,true).catch(()=>null)));
   hash.update(JSON.stringify(metadata));
   let tree=trees.get(worktree.path);
   if(tree&&tree.target!==target){dropTree(tree);tree=null;}
   if(!tree){tree=newTree(target);trees.set(worktree.path,tree);}
   // HEAD, branch, shallow state and protected refs can replace checked-out knowledge.
   const refs=JSON.stringify(metadata.filter((_,i)=>i!==2));
   // An unreadable knowledge root has no watch, so it is checked on every sample.
   if(fullDue||tree.metadata!==refs||tree.pending==='all'||tree.nodes.get(tree.base)?.kind!=='dir')await full(tree,signal);
   else{const pending=tree.pending;tree.pending=new Map();for(const [directory,names] of pending){if(names===null)await refresh(tree,directory,null,signal);else for(const name of names)await refresh(tree,directory,name,signal);}}
   tree.metadata=refs;
   hash.update(tree.nodes.get(tree.base).hash);files+=fileCount(tree);
  }
  if(fullDue){metrics.fullScans++;lastFull=now();}else metrics.incrementalScans++;
  metrics.lastScanMs=now()-start;
  return {fingerprint:hash.digest('hex'),files,bytes:metrics.bytes,mode:degraded?'degraded':'watching'};
 }
 return {
  // At most one scan runs per observer; concurrent callers share it.
  sample(options){if(closed)return Promise.reject(Error('Observation stopped'));if(!running)running=run(options).finally(()=>{running=null;});return running;},
  requestFull(){forceFull=true;},
  close(){closed=true;if(wakeTimer)timers.clearTimeout(wakeTimer);wakeTimer=null;for(const tree of trees.values())dropTree(tree);trees.clear();},
  stats(){return {mode:degraded?'degraded':'watching',watches,bytesRead:metrics.bytes,fileReads:metrics.reads,fullScans:metrics.fullScans,incrementalScans:metrics.incrementalScans,collapses:metrics.collapses,lastScanMs:metrics.lastScanMs};},
 };
}
export function repositoryService({intervalMs=2000,debounceMs=250,heartbeatMs=15000,maxClients=16,sample,sampler=incrementalSampler,samplerOptions={}}={}){
 const observers=new Map();let clients=0,closed=false;
 const stop=observer=>{observer.stopped=true;observer.controller.abort();clearTimeout(observer.poll);clearTimeout(observer.debounce);clearInterval(observer.heartbeat);observer.sampler?.close();observers.delete(observer.root);};
 const message=observer=>'data: '+JSON.stringify({sequence:observer.sequence,available:observer.available,observation:observer.sampler?.stats().mode??'polling'})+'\n\n';
 const schedule=(observer,delay)=>{clearTimeout(observer.poll);observer.poll=setTimeout(()=>tick(observer),delay);observer.poll.unref();};
 // Notifications and new subscribers wake the observer; a running scan is never overlapped.
 const wakeObserver=observer=>{if(observer.stopped)return;if(observer.scanning)observer.woken=true;else schedule(observer,0);};
 const base=observer=>settings=>(observer.sampler??=sampler(observer.root,{debounceMs,...samplerOptions,wake:()=>wakeObserver(observer)})).sample(settings);
 async function tick(observer){
  if(observer.stopped||observer.scanning)return;
  observer.scanning=true;observer.woken=false;
  let state;try{const start=Date.now(),settings={signal:observer.controller.signal,base:base(observer)},value=sample?await sample(observer.root,settings):await settings.base(settings);state={available:true,fingerprint:value.fingerprint};observer.lastScanMs=Date.now()-start;observer.files=value.files;}catch{state={available:false,fingerprint:null};}
  observer.scanning=false;
  if(observer.stopped)return;
  const key=JSON.stringify(state);
  if(key!==observer.last){observer.last=key;observer.sequence++;observer.available=state.available;
   if(!observer.debounce)observer.debounce=setTimeout(()=>{observer.debounce=null;for(const res of observer.clients)res.write(message(observer));},debounceMs);
  }
  schedule(observer,observer.woken?0:intervalMs);
 }
 return {
  async subscribe(req,res,headers,path){
   const root=await readableRoot(path);if(closed)throw new ExploreError(503,'Observation is unavailable.');if(clients>=maxClients)throw new ExploreError(429,'Too many observation clients.');
   res.writeHead(200,{...headers,'Content-Type':'text/event-stream; charset=utf-8',Connection:'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 1500\n\n');
   let observer=observers.get(root);
   if(!observer){observer={root,clients:new Set(),sequence:0,last:null,available:false,stopped:false,scanning:false,woken:false,controller:new AbortController()};observers.set(root,observer);
    observer.heartbeat=setInterval(()=>{for(const client of observer.clients)client.write(': heartbeat\n\n');},heartbeatMs);observer.heartbeat.unref();
   }
   observer.clients.add(res);clients++;
   // A new subscriber (reconnect, focus, manual refresh) requests reconciliation now.
   if(observer.last!==null){res.write(message(observer));observer.sampler?.requestFull();wakeObserver(observer);}else if(observer.clients.size===1)tick(observer);
   let removed=false;const cleanup=()=>{if(removed)return;removed=true;observer.clients.delete(res);clients--;if(!observer.clients.size)stop(observer);};
   req.on('close',cleanup);res.on('close',cleanup);if(req.destroyed||res.destroyed)cleanup();
  },
  close(){closed=true;for(const observer of [...observers.values()]){stop(observer);for(const res of observer.clients)res.end();}},
  get clientCount(){return clients;},get observerCount(){return observers.size;},
  stats(){return [...observers.values()].map(o=>({root:o.root,sequence:o.sequence,available:o.available,lastScanMs:o.lastScanMs,files:o.files,observation:o.sampler?.stats()??null}));}
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
 return {fingerprint:hash.digest('hex'),files,bytes:base.bytes,mode:base.mode};
}
