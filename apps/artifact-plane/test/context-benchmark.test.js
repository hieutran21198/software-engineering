import test from 'node:test';
import assert from 'node:assert/strict';
import {usageFromEvents,summarize,checkAnswer} from '../scripts/context-benchmark.mjs';
const rows=()=>['contained','multi-artifact','resumed'].flatMap(scenario=>Array.from({length:3},(_,repetition)=>['baseline','optimized'].map(mode=>({scenario,repetition,mode,model:'same',settings:'fixed',correct:true,usage:{input_tokens:mode==='baseline'?100:70}}))).flat());
test('benchmark requires actual complete paired usage and every correctness oracle',()=>{
 assert.equal(summarize(rows()).status,'passed');assert.equal(summarize(rows().slice(1)).status,'incomplete');const bad=rows();bad[0].correct=false;assert.equal(summarize(bad).status,'incomplete');
 const regression=rows();for(const r of regression)if(r.scenario==='resumed'&&r.mode==='optimized')r.usage.input_tokens=111;assert.equal(summarize(regression).status,'failed');
 const model=rows();model[0].model='different';assert.equal(summarize(model).status,'incomplete');
});
test('usage parser separates cached input and rejects partial or unaccounted child usage',()=>{
 const e={type:'turn.completed',usage:{input_tokens:100,cached_input_tokens:80,output_tokens:20}};assert.deepEqual(usageFromEvents([e,e]),{input_tokens:200,cached_input_tokens:160,output_tokens:40,child_input_tokens:0,child_output_tokens:0});assert.equal(usageFromEvents([]),null);assert.equal(usageFromEvents([{...e,usage:{input_tokens:100}}]),null);assert.equal(usageFromEvents([e,{item:{type:'collab_tool_call'}}]),null);
});
test('correctness oracle refuses stale rules, missing checks and missing approval uncertainty',()=>{
 const expected={rules:[{id:'R1',text:'Signed evidence'}],checks:['Check signatures'],canImplement:false};assert.equal(checkAnswer({...expected,blockingReason:'Approval missing'},expected),true);assert.equal(checkAnswer({...expected,blockingReason:'ready'},expected),false);assert.equal(checkAnswer({...expected,checks:[],blockingReason:'Approval missing'},expected),false);assert.equal(checkAnswer({...expected,rules:[{id:'R1',text:'Unsigned evidence'}],blockingReason:'Approval missing'},expected),false);
});

test('benchmark prepares 18 isolated matched working trees, including missing baseline fallback, and stops on missing usage',async t=>{
 const {mkdtemp,readFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {runBenchmark}=await import('../scripts/context-benchmark.mjs');const output=await mkdtemp(join(tmpdir(),'context-driver-test-'));t.after(()=>rm(output,{recursive:true,force:true}));let calls=0;const prompts=new Map();
 const result=await runBenchmark({model:'test-only',baseline:'missing-benchmark-baseline-ref',output,run:async(root,prompt,model)=>{
  calls++;assert.equal(model,'test-only');const scenario=root.match(/(contained|multi-artifact|resumed)-\d-/)[1];if(prompts.has(scenario))assert.equal(prompt,prompts.get(scenario));else prompts.set(scenario,prompt);
  const requirement=await readFile(join(root,'docs/artifacts/demo/requirements/rules.md'),'utf8');assert.ok(requirement.includes('Preserve signed evidence.'));if(scenario==='resumed')assert.ok(requirement.includes('No user approval'));
  const rules=[{id:'R1',text:'Preserve signed evidence.'}],checks=['Verify evidence signature.'];if(scenario==='multi-artifact'){rules.push({id:'R2',text:'Use the established identity contract.'});checks.push('Check identity compatibility.');}
  return {status:0,answer:{rules,checks,canImplement:scenario!=='resumed',blockingReason:'Approval missing'},events:[],usage:{input_tokens:100,cached_input_tokens:0,output_tokens:10}};
 }});assert.equal(calls,18);assert.equal(result.runs.length,18);assert.equal(result.summary.status,'failed'); // Synthetic equal usage must not satisfy savings.
 const missing=await runBenchmark({model:'test-only',output:join(output,'missing'),run:async()=>({status:1,events:[],usage:null})});assert.equal(missing.summary.status,'incomplete');assert.equal(missing.runs.length,1);
});
