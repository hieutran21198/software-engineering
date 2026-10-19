#!/usr/bin/env node
import {RuntimeStore,repositoryIdentity} from './runtime-store.js';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';

export async function run(args,input){
 const command=args.shift(),options={};for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||args[i+1]===undefined)throw Error('Use --name value pairs');options[args[i].slice(2)]=args[i+1];}
 if(command==='hook'){
  let store;try{
   const data=JSON.parse(input);if(typeof data.cwd!=='string')throw Error('Hook cwd missing');
   const identity=repositoryIdentity(data.cwd,{allowNested:true});store=new RuntimeStore({stateDir:options['state-dir'],roots:identity.roots});
   const event=store.observe({...data,event_id:randomUUID()});
   if(data.hook_event_name==='SessionStart')return {hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:`Artifact Plane observer session: ${event.session}. Before implementing an approved ADD task, explicitly bind this session (and each child agent separately) using runtime-cli bind --root <checkout> --unit <unit> --artifact <artifact> --change <change> --task <listed-task> --session ${event.session}. Observations do not approve work or validate DoD.`}};
   return {};
  }catch{process.stderr.write('Artifact Plane observer unavailable; execution continues.\n');return {};}
  finally{store?.close();}
 }
 const store=new RuntimeStore({stateDir:options['state-dir'],roots:options.root?repositoryIdentity(options.root).roots:[]});
 try{
  if(command==='register'){if(!options.root)throw Error('--root required');return store.repository(options.root,true);}
  if(command==='bind')return await store.bind({root:options.root,unit:options.unit||null,artifact:options.artifact,change:options.change,task:options.task,session:options.session,agent:options.agent||'',binding:options.binding||'explicit'});
  if(command==='report')return store.report({attempt:options.attempt,state:options.state,root:options.root,method:options.method,source:options.source,reason:options.reason});
  if(command==='query')return store.query(options.root);
  throw Error('Commands: register, bind, report, query, hook');
 }finally{store.close();}
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const hook=process.argv[2]==='hook';try{
  // Codex hooks have bounded execution time. Do not retry forever or block agent work.
  const input=hook?readFileSync(0,'utf8'):null;
  if(input&&Buffer.byteLength(input)>1024*1024)throw Error('Hook input too large');
  console.log(JSON.stringify(await run(process.argv.slice(2),input)));
 }catch(error){if(hook){console.log('{}');process.stderr.write('Artifact Plane observer input unavailable; execution continues.\n');}else{process.stderr.write(error.message+'\n');process.exitCode=1;}}
}
