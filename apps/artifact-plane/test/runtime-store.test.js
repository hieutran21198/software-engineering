import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,symlink,stat,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {RuntimeStore,FRESHNESS_MS} from '../server/runtime-store.js';
import {fixtureRepository,fingerprint,git} from './fixtures.js';
import {taskRuntime} from '../src/runtime-model.js';
import {runtimeFixture,bind} from './runtime-fixtures.js';
const prefix='docs/artifacts/demo/changes/change-live/';
const event=(store,kind,fields={})=>store.observe({session_id:'session',hook_event_name:kind,turn_id:'turn-1',...fields});
test('binding, concurrent tasks, privacy, duplicate events and validation evidence',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});const before=await fingerprint(f.root);
 try{
  const a=await bind(s,f.root),b=await bind(s,f.root,'b.md','other');
  event(s,'UserPromptSubmit',{event_id:'duplicate',prompt:'secret prompt'});event(s,'PreToolUse',{tool_name:'Bash',tool_input:{command:'secret command'},tool_response:'secret output',transcript_path:'/secret'});
  s.observe({session_id:'other',hook_event_name:'UserPromptSubmit',turn_id:'other-turn'});
  assert.equal(s.query(f.root).attempts.filter(a=>a.state==='processing').length,2);
  const seq=s.sequence();event(s,'UserPromptSubmit',{event_id:'duplicate'});assert.equal(s.sequence(),seq);
  event(s,'PermissionRequest');assert.equal(s.query(f.root).attempts[0].state,'blocked');event(s,'PostToolUse');event(s,'Stop');assert.equal(s.query(f.root).attempts[0].state,'validating');
  await writeFile(join(f.root,'empty.md'),'---\nassertion: passed\n---\n# Evidence\n');assert.throws(()=>s.report({attempt:a.attempt,state:'validated',root:f.root,method:'suite',source:'empty.md'}),/details/);await rm(join(f.root,'empty.md'));
  assert.throws(()=>s.report({attempt:a.attempt,state:'validated',root:f.root,method:'suite',source:'missing.md'}));
  assert.throws(()=>s.report({attempt:a.attempt,state:'validated',root:f.root,method:'suite',source:'../evidence.md'}));
  s.report({attempt:a.attempt,state:'validated',root:f.root,method:'suite',source:'evidence.md#checks'});event(s,'PreToolUse');assert.equal(s.query(f.root).attempts[0].state,'done');
  s.report({attempt:b.attempt,state:'failed'});assert.equal(s.query(f.root).attempts[1].state,'failed');assert.ok(!JSON.stringify(s.query(f.root)).includes('secret'));assert.deepEqual(await fingerprint(f.root),before);
 }finally{s.close();await f.cleanup();}
});
test('late Stop, missing correlation, freshness, retry and child isolation',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});try{
  await bind(s,f.root);event(s,'UserPromptSubmit');event(s,'UserPromptSubmit',{turn_id:'new'});event(s,'Stop');assert.equal(s.query(f.root).attempts[0].state,'processing');assert.equal(s.query(f.root,{now:Date.now()+FRESHNESS_MS+1}).attempts[0].state,'unknown');
  event(s,'Interrupt',{turn_id:'new'});assert.equal(s.query(f.root).attempts[0].state,'interrupted');await bind(s,f.root);event(s,'PreToolUse',{turn_id:undefined});assert.equal(s.query(f.root).attempts.at(-1).state,'unknown');
  await bind(s,f.root,'b.md','session','child');event(s,'SubagentStart',{agent_id:'child'});event(s,'PreToolUse',{agent_id:'child'});assert.equal(s.query(f.root).attempts.at(-1).state,'processing');event(s,'SubagentStop',{agent_id:'child'});assert.equal(s.query(f.root).attempts.at(-1).state,'validating');
  assert.throws(()=>event(s,'SubagentStart'),/Subagent ID/);assert.throws(()=>event(s,'Unknown'),/Unsupported/);assert.equal(s.query(f.root).attempts.length,3);
 }finally{s.close();await f.cleanup();}
});
test('history survives removed worktree, restart and changed revision',async()=>{
 const f=await runtimeFixture(),other=f.root+'-worktree';git(f.root,'worktree','add','-qb','implementation',other);let s=new RuntimeStore({stateDir:f.stateDir});try{
  const first=await bind(s,other);event(s,'UserPromptSubmit');s.close();git(f.root,'worktree','remove','--force',other);s=new RuntimeStore({stateDir:f.stateDir,create:false});assert.equal(s.query(f.root).contexts[0].sourceMissing,true);assert.equal(s.query(f.root).attempts.length,1);s.close();s=new RuntimeStore({stateDir:f.stateDir});
  await writeFile(join(f.root,prefix+'tasks/a.md'),'---\nid: a\ndepends_on: []\n---\n# Changed task');const second=await bind(s,f.root);assert.notEqual(first.context,second.context);assert.equal(s.query(f.root).contexts.length,2);await assert.rejects(bind(s,f.root,'unlisted.md'),/listed/);
 }finally{s.close();await f.cleanup();}
});
test('containment, symlink aliases, private modes and schema rejection',async()=>{
 const f=await runtimeFixture();try{
  await chmod(f.stateDir,0o755);assert.throws(()=>new RuntimeStore({stateDir:f.stateDir}),/private/);assert.equal((await stat(f.stateDir)).mode&0o777,0o755);await chmod(f.stateDir,0o700);
  assert.throws(()=>new RuntimeStore({stateDir:join(f.root,'runtime')}),/outside/);const alias=join(f.stateDir,'alias');await symlink(f.root,alias);assert.throws(()=>new RuntimeStore({stateDir:join(alias,'runtime')}),/outside/);
  const s=new RuntimeStore({stateDir:f.stateDir});await bind(s,f.root);s.close();assert.equal((await stat(join(f.stateDir,'runtime.sqlite'))).mode&0o777,0o600);
  const db=new DatabaseSync(join(f.stateDir,'runtime.sqlite'));db.exec('PRAGMA user_version=99');db.close();assert.throws(()=>new RuntimeStore({stateDir:f.stateDir}),/newer/);
 }finally{await f.cleanup();}
});
test('startup waits for a schema lock before reading the version',async()=>{
 const f=await runtimeFixture(),initial=new RuntimeStore({stateDir:f.stateDir});initial.close();
 const setup=new DatabaseSync(join(f.stateDir,'runtime.sqlite'));setup.exec('PRAGMA journal_mode=DELETE');setup.close();
 const code=`import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(process.env.TEST_DATABASE);db.exec('BEGIN EXCLUSIVE');process.send('locked');setTimeout(()=>{db.exec('COMMIT');db.close();process.disconnect();},250);`;
 const writer=spawn(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TEST_DATABASE:join(f.stateDir,'runtime.sqlite')},stdio:['ignore','ignore','pipe','ipc']});
 let stderr='';writer.stderr.setEncoding('utf8');writer.stderr.on('data',chunk=>{stderr+=chunk;});
 const exited=new Promise((resolve,reject)=>{writer.on('error',reject);writer.on('close',n=>n===0?resolve():reject(Error(`Lock writer exit ${n}: ${stderr}`)));});
 try{
  await new Promise((resolve,reject)=>{writer.once('message',resolve);writer.once('error',reject);writer.once('exit',()=>reject(Error('Lock writer exited before ready: '+stderr)));});
  const store=new RuntimeStore({stateDir:f.stateDir});try{assert.equal(store.sequence(),0);}finally{store.close();}
  await exited;
 }finally{if(writer.exitCode===null)writer.kill();await exited.catch(()=>{});await f.cleanup();}
});

test('concurrent processes persist every event',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});try{
  await bind(s,f.root);s.close();const code=`import {RuntimeStore} from './server/runtime-store.js';const s=new RuntimeStore({stateDir:process.env.TEST_STATE});for(let i=0;i<20;i++)s.observe({session_id:'session',hook_event_name:'PreToolUse',turn_id:'turn'});s.close();`;
  await Promise.all([1,2,3].map(()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',code],{cwd:new URL('../',import.meta.url),env:{...process.env,TEST_STATE:f.stateDir},stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.setEncoding('utf8');p.stderr.on('data',chunk=>{stderr+=chunk;});p.on('error',reject);p.on('close',(n,signal)=>n!==0?reject(Error(`Writer exit ${n} (${signal||'no signal'}): ${stderr}`)):resolve());})));
  const read=new RuntimeStore({stateDir:f.stateDir,create:false});assert.equal(read.sequence(),61);read.close();
 }finally{await f.cleanup();}
});

test('separate repositories isolate equal task IDs and invalid plans cannot bind',async()=>{
 const a=await runtimeFixture(),b=await runtimeFixture(),s=new RuntimeStore({stateDir:a.stateDir});try{
  const first=await bind(s,a.root),second=await bind(s,b.root,'a.md','second-session');assert.notEqual(first.repository,second.repository);assert.equal(s.query(a.root).attempts.length,1);assert.equal(s.query(b.root).attempts.length,1);
  await writeFile(join(b.root,prefix+'tasks/README.md'),'---\ntasks: [missing.md]\n---\n# Invalid');await assert.rejects(bind(s,b.root),/unavailable/);
 }finally{s.close();await a.cleanup();await b.cleanup();}
});

test('identical worktree plans, aliases and captured revisions keep separate attribution',async()=>{
 const f=await runtimeFixture(),other=f.root+'-identity',alias=join(f.stateDir,'checkout-alias');
 git(f.root,'worktree','add','-qb','identity-test',other);
 const s=new RuntimeStore({stateDir:f.stateDir});
 try{
  const first=await bind(s,f.root,'a.md','first');
  const second=await bind(s,other,'a.md','second');
  assert.equal(first.repository,second.repository);assert.notEqual(first.context,second.context);
  s.observe({session_id:'first',hook_event_name:'UserPromptSubmit',turn_id:'one'});
  s.observe({session_id:'second',hook_event_name:'UserPromptSubmit',turn_id:'two'});
  const data=s.query(f.root),a=data.attempts.find(a=>a.id===first.attempt);
  const identity={artifact:a.artifact,change:a.change,path:a.path,signature:a.signature,sourceWorktree:f.root};
  const runtime={data,connected:true,now:Date.now()};
  assert.deepEqual(taskRuntime(runtime,identity).attempts.map(a=>a.id),[first.attempt]);
  assert.deepEqual(taskRuntime(runtime,{...identity,sourceWorktree:other}).attempts.map(a=>a.id),[second.attempt]);
  await symlink(f.root,alias);const aliased=await bind(s,alias,'a.md','alias');
  assert.equal(aliased.context,first.context);assert.equal(s.query(f.root).attempts.at(-1).sourceWorktree,f.root);
  await writeFile(join(f.root,'unrelated.txt'),'Unrelated HEAD change');git(f.root,'add','unrelated.txt');git(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Unrelated edit');
  const changedHead=await bind(s,f.root,'a.md','new-head');assert.notEqual(changedHead.context,first.context);
  const later=s.query(f.root),newAttempt=later.attempts.find(a=>a.id===changedHead.attempt);
  assert.notEqual(newAttempt.sourceRevision,a.sourceRevision);
  assert.ok(taskRuntime({...runtime,data:later},identity).attempts.some(attempt=>attempt.id===first.attempt&&attempt.sourceRevision===a.sourceRevision));
  await writeFile(join(f.root,prefix+'tasks/a.md'),'---\nid: a\ndepends_on: []\n---\n# Changed bytes');
  const changedBytes=await bind(s,f.root,'a.md','new-bytes');const changedAttempt=s.query(f.root).attempts.find(a=>a.id===changedBytes.attempt);
  assert.deepEqual(taskRuntime({...runtime,data:s.query(f.root)},{...identity,signature:changedAttempt.signature}).attempts.map(a=>a.id),[changedBytes.attempt]);
  git(f.root,'worktree','remove','--force',other);
  const archived=s.query(f.root);assert.equal(archived.contexts.find(c=>c.id===second.context).sourceMissing,true);
  assert.equal(taskRuntime({...runtime,data:archived},{...identity,contextId:second.context}).attempts[0].sourceWorktree,other);
  assert.ok(!taskRuntime({...runtime,data:archived},identity).attempts.some(a=>a.id===second.attempt));
 }finally{s.close();await f.cleanup();}
});

test('legacy attempt JSON stays readable only in explicit recorded context',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});try{
  const binding=await bind(s,f.root),attempt=s.query(f.root).attempts[0];
  delete attempt.sourceWorktree;delete attempt.sourceRevision;s.saveAttempt(attempt);
  const data=s.query(f.root),identity={artifact:attempt.artifact,change:attempt.change,path:attempt.path,signature:attempt.signature,sourceWorktree:f.root};
  assert.equal(taskRuntime({data,connected:true},identity).state,'waiting');
  assert.equal(taskRuntime({data,connected:true},{...identity,contextId:binding.context}).attempts[0].id,binding.attempt);
  assert.equal(s.db.prepare('PRAGMA user_version').get().user_version,1);
 }finally{s.close();await f.cleanup();}
});
