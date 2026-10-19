import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RuntimeStore,inferredBinding,taskFilePaths,worktreeChanges} from '../server/runtime-store.js';
import {run} from '../server/runtime-cli.js';
import {fixtureRepository,identity,versionRecord,git} from './fixtures.js';
import {runtimeFixture,bind} from './runtime-fixtures.js';
const prefix='docs/artifacts/demo/changes/change-live/';
const read=(cwd,file,fields={})=>({session_id:'session',hook_event_name:'PreToolUse',cwd,tool_name:'Read',tool_input:{file_path:file},...fields});
const cliBind=(f,fields=[])=>run(['bind','--state-dir',f.stateDir,'--root',f.root,'--artifact','demo','--change','change-live','--task','a.md','--session','session',...fields]);

test('bind stores explicit by default and inferred on request, and rejects an inferred bind over an open attempt',async()=>{
 const f=await runtimeFixture();try{
  const explicit=await cliBind(f);
  let s=new RuntimeStore({stateDir:f.stateDir});assert.equal(s.query(f.root).attempts.find(a=>a.id===explicit.attempt).binding,'explicit');s.close();
  await assert.rejects(cliBind(f,['--binding','inferred']),/open attempt/);
  await assert.rejects(cliBind(f,['--binding','guessed']),/Invalid binding/);
  s=new RuntimeStore({stateDir:f.stateDir});assert.equal(s.query(f.root).attempts.length,1);
  s.report({attempt:explicit.attempt,state:'failed'});s.close();
  const inferred=await cliBind(f,['--binding','inferred']);
  s=new RuntimeStore({stateDir:f.stateDir});try{
   assert.equal(s.query(f.root).attempts.find(a=>a.id===inferred.attempt).binding,'inferred');
   assert.equal(JSON.parse(s.db.prepare('SELECT json FROM attempts WHERE id=?').get(inferred.attempt).json).binding,'inferred');
  }finally{s.close();}
 }finally{await f.cleanup();}
});

test('an explicit bind supersedes an open inferred attempt, and attempts without the field read as explicit',async()=>{
 const f=await runtimeFixture(),s=new RuntimeStore({stateDir:f.stateDir});try{
  const inferred=await s.bind({root:f.root,artifact:'demo',change:'change-live',task:'a.md',session:'session',unit:'live',binding:'inferred'});
  const explicit=await bind(s,f.root,'b.md');
  const attempts=s.query(f.root).attempts;
  assert.deepEqual(attempts.map(a=>[a.id,a.state,a.binding]),[[inferred.attempt,'superseded','inferred'],[explicit.attempt,'unknown','explicit']]);
  const legacy=attempts[1];delete legacy.binding;s.saveAttempt(legacy);
  assert.equal(s.query(f.root).attempts[1].binding,'explicit');
  assert.equal(s.db.prepare('PRAGMA user_version').get().user_version,1);
 }finally{s.close();await f.cleanup();}
});

test('a task file path comes from file_path, path or command, and tasks/README.md is not a task',()=>{
 const task={artifact:'demo',change:'change-live',task:'a.md'};
 assert.deepEqual(taskFilePaths({file_path:'/abs/root/'+prefix+'tasks/a.md'}),[task]);
 assert.deepEqual(taskFilePaths({path:prefix+'tasks/a.md'}),[task]);
 assert.deepEqual(taskFilePaths({command:`sed -n 1,40p '${prefix}tasks/a.md'`}),[task]);
 assert.deepEqual(taskFilePaths({command:['cat',prefix+'tasks/a.md']}),[task]);
 assert.deepEqual(taskFilePaths({command:`cat ${prefix}tasks/README.md`}),[]);
 assert.deepEqual(taskFilePaths({command:`cat ${prefix}tasks/a.mdx ${prefix}tasks/a.md.bak`}),[]);
 assert.equal(taskFilePaths({command:`cat ${prefix}tasks/a.md ${prefix}tasks/b.md`}).length,2);
 assert.deepEqual(taskFilePaths(undefined),[]);
});

test('inferredBinding binds a subagent read and a linked worktree read',async()=>{
 const f=await runtimeFixture(),other=f.root+'-linked',s=new RuntimeStore({stateDir:f.stateDir});
 git(f.root,'worktree','add','-qb','linked',other);
 try{
  const file=prefix+'tasks/a.md';
  assert.deepEqual(await inferredBinding(read(f.root,file,{agent_id:'child'}),s),{root:f.root,artifact:'demo',change:'change-live',task:'a.md',session:'session',agent:'child',unit:'live'});
  const linked=await inferredBinding(read(other,file,{tool_name:'Bash',tool_input:{command:'cat '+file}}),s);
  assert.deepEqual(linked,{root:other,artifact:'demo',change:'change-live',task:'a.md',session:'session',agent:'',unit:'live'});
  // The returned arguments bind, and the open attempt then stops a second inference.
  await s.bind({...linked,binding:'inferred'});
  assert.equal(await inferredBinding(read(other,file),s),null);
  assert.equal(s.query(f.root).attempts[0].binding,'inferred');
 }finally{s.close();git(f.root,'worktree','remove','--force',other);await f.cleanup();}
});

test('inferredBinding returns null in the main worktree without agent_id, after SubagentStart, for tasks/README.md and for several paths',async()=>{
 const f=await runtimeFixture(),other=f.root+'-linked',s=new RuntimeStore({stateDir:f.stateDir});
 git(f.root,'worktree','add','-qb','linked',other);
 try{
  const file=prefix+'tasks/a.md';
  assert.equal(await inferredBinding(read(f.root,file),s),null);
  assert.equal(await inferredBinding(read(f.root+'/docs',file),s),null);
  assert.equal(await inferredBinding(read(other,prefix+'tasks/README.md'),s),null);
  assert.equal(await inferredBinding(read(other,file,{tool_input:{command:`cat ${file} ${prefix}tasks/b.md`}}),s),null);
  assert.equal(await inferredBinding(read(other,file,{session_id:''}),s),null);
  s.observe({session_id:'session',hook_event_name:'SubagentStart',agent_id:'child'});
  assert.equal(await inferredBinding(read(other,file),s),null);
  assert.ok(await inferredBinding(read(other,file,{agent_id:'child'}),s));
  assert.ok(await inferredBinding(read(other,file,{session_id:'other-session'}),s));
 }finally{s.close();git(f.root,'worktree','remove','--force',other);await f.cleanup();}
});

test('inferredBinding returns null for a change that is not current and uses no other worktree',async()=>{
 const plan='---\ntasks: [a.md]\n---\n# Plan\n',task='---\nid: a\ndepends_on: []\n---\n# Task A\n\n- [ ] Behavior\n';
 const f=await fixtureRepository(new Map([
  ['docs/artifacts/demo/README.md',identity('Demo','1.0.0')],['docs/artifacts/demo/requirements/need.md','# Need\n'],['docs/artifacts/demo/versions/1.0.0/README.md',versionRecord('change-initial')],
  ['docs/artifacts/demo/changes/change-initial/README.md','# Initial\n'],['docs/artifacts/demo/changes/change-initial/tasks/README.md',plan],['docs/artifacts/demo/changes/change-initial/tasks/a.md',task],
  [prefix+'README.md','# Live\n'],[prefix+'tasks/README.md',plan],[prefix+'tasks/a.md',task]]));
 const state=await runtimeFixture(),s=new RuntimeStore({stateDir:state.stateDir}),reads=[];
 const worktrees=cwd=>({root:cwd,roots:['/main']});
 const changes=root=>{reads.push(root);return worktreeChanges(root);};
 try{
  assert.equal(await inferredBinding(read(f.root,'docs/artifacts/demo/changes/change-initial/tasks/a.md',{agent_id:'child'}),s,{worktrees,changes}),null);
  assert.deepEqual(await inferredBinding(read(f.root,prefix+'tasks/a.md',{agent_id:'child'}),s,{worktrees,changes}),{root:f.root,artifact:'demo',change:'change-live',task:'a.md',session:'session',agent:'child',unit:null});
  assert.equal(await inferredBinding(read(f.root,'docs/artifacts/demo/changes/change-missing/tasks/a.md',{agent_id:'child'}),s,{worktrees,changes}),null);
  assert.deepEqual(reads,[f.root,f.root,f.root]);
 }finally{s.close();await state.cleanup();await f.cleanup();}
});
