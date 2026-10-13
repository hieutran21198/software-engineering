import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {RuntimeStore} from '../server/runtime-store.js';
import {run} from '../server/runtime-cli.js';
import {runtimeFixture,bind} from './runtime-fixtures.js';
test('hook command is nonblocking, valid JSON and allowlists lifecycle fields',async()=>{
 const f=await runtimeFixture();try{
  let s=new RuntimeStore({stateDir:f.stateDir});await bind(s,f.root);s.close();
  const invoke=data=>JSON.parse(execFileSync(process.execPath,['server/runtime-cli.js','hook','--state-dir',f.stateDir],{cwd:new URL('../',import.meta.url),input:JSON.stringify(data),encoding:'utf8',stdio:['pipe','pipe','ignore']}));
  const common={session_id:'session',cwd:f.root,turn_id:'turn'};
  assert.match(invoke({...common,hook_event_name:'SessionStart'}).hookSpecificOutput.additionalContext,/session/);
  for(const kind of ['UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','Stop','Interrupt','SessionEnd'])assert.deepEqual(invoke({...common,hook_event_name:kind,tool_name:'Bash',prompt:'SECRET',tool_input:'SECRET'}),{});
  for(const kind of ['SubagentStart','SubagentStop'])assert.deepEqual(invoke({...common,hook_event_name:kind,agent_id:'child'}),{});
  assert.deepEqual(invoke({cwd:'/missing',hook_event_name:'Stop'}),{});
  s=new RuntimeStore({stateDir:f.stateDir,create:false});assert.ok(!JSON.stringify(s.query(f.root)).includes('SECRET'));s.close();
 }finally{await f.cleanup();}
});
test('CLI binding/reporting uses explicit identity and returns stored attempts',async()=>{
 const f=await runtimeFixture();try{
  const result=await run(['bind','--state-dir',f.stateDir,'--root',f.root,'--unit','live','--artifact','demo','--change','change-live','--task','a.md','--session','cli-session']);
  assert.ok(result.attempt);await run(['report','--state-dir',f.stateDir,'--attempt',result.attempt,'--state','execution-returned']);
  const query=await run(['query','--state-dir',f.stateDir,'--root',f.root]);assert.equal(query.attempts[0].state,'validating');
 }finally{await f.cleanup();}
});
