import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,symlink,stat,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {RuntimeStore,FRESHNESS_MS} from '../server/runtime-store.js';
import {fixtureRepository,fingerprint,git} from './fixtures.js';
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
test('concurrent processes persist every event',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});try{
  await bind(s,f.root);s.close();const code=`import {RuntimeStore} from './server/runtime-store.js';const s=new RuntimeStore({stateDir:process.env.TEST_STATE});for(let i=0;i<20;i++)s.observe({session_id:'session',hook_event_name:'PreToolUse',turn_id:'turn'});s.close();`;
  await Promise.all([1,2,3].map(()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',code],{cwd:new URL('../',import.meta.url),env:{...process.env,TEST_STATE:f.stateDir},stdio:'ignore'});p.on('error',reject);p.on('exit',n=>n?reject(Error('Writer exit '+n)):resolve());})));
  const read=new RuntimeStore({stateDir:f.stateDir,create:false});assert.equal(read.sequence(),61);read.close();
 }finally{await f.cleanup();}
});

test('separate repositories isolate equal task IDs and invalid plans cannot bind',async()=>{
 const a=await runtimeFixture(),b=await runtimeFixture(),s=new RuntimeStore({stateDir:a.stateDir});try{
  const first=await bind(s,a.root),second=await bind(s,b.root,'a.md','second-session');assert.notEqual(first.repository,second.repository);assert.equal(s.query(a.root).attempts.length,1);assert.equal(s.query(b.root).attempts.length,1);
  await writeFile(join(b.root,prefix+'tasks/README.md'),'---\ntasks: [missing.md]\n---\n# Invalid');await assert.rejects(bind(s,b.root),/unavailable/);
 }finally{s.close();await a.cleanup();await b.cleanup();}
});
