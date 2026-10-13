import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {gitSlot} from './git-process.js';

// Immutable blob bytes only. Mutable refs, trees and status stay request-scoped.
const history = new Map();
let bytes = 0;
const MAX_BYTES = 32 * 1024 * 1024, MAX_ENTRIES = 4096;
export function historyStats(){return {bytes,entries:history.size,maxBytes:MAX_BYTES,maxEntries:MAX_ENTRIES};}
export function clearHistory(){history.clear();bytes=0;}
function remember(key, value){
 if(value.length>MAX_BYTES)return;
 if(history.has(key)){bytes-=history.get(key).length;history.delete(key);}
 history.set(key,value);bytes+=value.length;
 while(bytes>MAX_BYTES||history.size>MAX_ENTRIES){const oldest=history.keys().next().value;bytes-=history.get(oldest).length;history.delete(oldest);}
}
export function gitReads(execute, onSpawn=()=>{}){
 const requests=new Map(), batches=new Map(), starting=new Map();let closed=false;
 async function startBatch(root){
  const release=await gitSlot(true);
  onSpawn();
  const child=spawn('git',['-c','core.fsmonitor=false','-c','core.untrackedCache=false','-C',root,'cat-file','--batch'],{env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},stdio:['pipe','pipe','pipe']});
  let buffer=Buffer.alloc(0);const queue=[];
  const rejectAll=error=>{for(const item of queue.splice(0)){clearTimeout(item.timer);item.reject(error);}if(batches.get(root)?.child===child)batches.delete(root);};
  child.on('error',error=>{release();rejectAll(error);});child.on('exit',()=>{release();rejectAll(Error('Historical reader closed'));});child.stderr.resume();
  child.stdout.on('data',chunk=>{
   buffer=Buffer.concat([buffer,chunk]);
   while(queue.length){
    const end=buffer.indexOf(10);if(end<0)break;
    const header=buffer.subarray(0,end).toString();
    if(header.endsWith(' missing')){buffer=buffer.subarray(end+1);const item=queue.shift();clearTimeout(item.timer);item.reject(Error('Historical file missing'));continue;}
    const match=header.match(/^[a-f0-9]+ blob (\d+)$/);if(!match){rejectAll(Error('Invalid historical blob'));child.kill();return;}
    const size=Number(match[1]);if(buffer.length<end+1+size+1)break;
    const value=Buffer.from(buffer.subarray(end+1,end+1+size));buffer=buffer.subarray(end+size+2);
    const item=queue.shift();clearTimeout(item.timer);item.resolve(value);
   }
  });
  const service={child,read(expression){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{rejectAll(Error('Historical read timed out'));child.kill();},15000);queue.push({resolve,reject,timer});child.stdin.write(expression+'\n',error=>{if(error){rejectAll(error);child.kill();}});});}};
  batches.set(root,service);return service;
 }
 async function batch(root){if(batches.has(root))return batches.get(root);if(!starting.has(root))starting.set(root,startBatch(root).finally(()=>starting.delete(root)));return starting.get(root);}
 async function read(root,args,mode=false){
  if(closed)throw Error('Read session closed');
  const key=JSON.stringify([root,args,mode]);
  if(requests.has(key))return requests.get(key);
  const promise=(async()=>{
   if(args[0]==='show'&&args.length===2){
    const split=args[1].indexOf(':');const rev=args[1].slice(0,split),path=args[1].slice(split+1);
    if(split>0&&!/[\r\n\0]/.test(path)){
     const oid=/^[a-f0-9]{40,64}$/.test(rev)?rev:await read(root,['rev-parse','--verify',rev]);
     const identity=resolve(root,await read(root,['rev-parse','--git-common-dir']));
     const blobKey=JSON.stringify([identity,oid,path]);let value=history.get(blobKey);
     if(value){history.delete(blobKey);history.set(blobKey,value);}else{value=await (await batch(root)).read(oid+':'+path);remember(blobKey,value);}
     return mode==='bytes'?Buffer.from(value):mode?value.toString('utf8'):value.toString('utf8').trim();
    }
   }
   return execute(root,args,mode);
  })();
  requests.set(key,promise);promise.catch(()=>{const immutable=args[0]==='show'&&/^[a-f0-9]{40,64}(?:\^)?[:]/.test(args[1]||'')||args[0]==='rev-parse'&&/^[a-f0-9]{40,64}\^$/.test(args.at(-1)||'');if(!immutable)requests.delete(key);});return promise;
 }
 read.release=root=>{const item=batches.get(root);if(item){batches.delete(root);item.child.stdin.end();}};
 read.close=()=>{closed=true;for(const {child} of batches.values())child.stdin.end();requests.clear();};
 return read;
}
