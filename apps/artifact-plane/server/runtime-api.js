import {RuntimeStore,observedAttempt} from './runtime-store.js';
export function runtimeService({stateDir,maxClients=16,intervalMs=1000}={}){
 const startedAt=Date.now(),clients=new Set();let timer=null,last=-1;
 function read(root){const store=new RuntimeStore({stateDir,create:false});try{
  const data=store.query(root);data.attempts=data.attempts.map(a=>observedAttempt(a,Date.now(),a.updatedAt>=startedAt));
  return {...data,available:true};
 }finally{store.close();}}
 function tick(){let payload;try{const store=new RuntimeStore({stateDir,create:false});try{payload={sequence:store.sequence(),available:true};}finally{store.close();}}catch{payload={sequence:null,available:false};}
  const key=JSON.stringify(payload);if(key!==last){last=key;for(const client of clients)client.write('data: '+key+'\n\n');}
 }
 return {
  query(root,context){try{const data=read(root);if(context&&!data.contexts.some(c=>c.id===context))return {...data,diagnostic:'Recorded execution context not found.'};return data;}catch{return {available:false,contexts:[],attempts:[],events:[],sequence:null,diagnostic:'Runtime observations unavailable. Knowledge exploration remains available.'};}},
  subscribe(req,res,headers){if(clients.size>=maxClients)return false;
   res.writeHead(200,{...headers,'Content-Type':'text/event-stream; charset=utf-8','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('retry: 1500\n\n');clients.add(res);last=-1;tick();
   if(!timer){timer=setInterval(tick,intervalMs);timer.unref();}
   const cleanup=()=>{clients.delete(res);if(!clients.size&&timer){clearInterval(timer);timer=null;}};req.on('close',cleanup);res.on('close',cleanup);return true;
  },
  close(){if(timer)clearInterval(timer);timer=null;for(const res of clients)res.end();clients.clear();},
  get clientCount(){return clients.size;},get watching(){return Boolean(timer);}
 };
}
