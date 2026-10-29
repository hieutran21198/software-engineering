// Run outside the product: disposable fixtures and private logs, never hosted repository content.
// node scripts/context-benchmark.mjs --model <model> [--baseline <git-ref>] [--output <private-dir>]
// --payload-only measures response bytes, not model-token savings.
import {mkdtemp,mkdir,writeFile,readFile,rm,cp,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {createReviewService} from '../server/change-review.js';
const repository=fileURLToPath(new URL('../../..',import.meta.url));
export const median=xs=>{const s=[...xs].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
export function summarize(runs){
 const groups=['contained','multi-artifact','resumed'],pairs=[],scenarios=[];
 for(const scenario of groups){const rows=runs.filter(r=>r.scenario===scenario),savings=[];
  for(let repetition=0;repetition<3;repetition++){
   const b=rows.find(r=>r.mode==='baseline'&&r.repetition===repetition),o=rows.find(r=>r.mode==='optimized'&&r.repetition===repetition);
   if(!b||!o||!b.correct||!o.correct||!b.usage||!o.usage||b.model!==o.model||b.settings!==o.settings||b.usage.input_tokens<=0)return {status:'incomplete',reason:'Need 18 matched live runs with usage and passing scenario oracles.'};
   const saving=1-o.usage.input_tokens/b.usage.input_tokens;savings.push(saving);pairs.push(saving);
  }
  scenarios.push({scenario,medianReduction:median(savings)});
 }
 const reduction=median(pairs),passed=reduction>=.25&&scenarios.every(s=>s.medianReduction>=-.10);
 return {status:passed?'passed':'failed',medianReduction:reduction,scenarios,threshold:.25,maxScenarioRegression:.10,limits:'Provider-reported model input includes cached input; cached input and output are reported separately. Payload bytes are not token counts.'};
}
export function usageFromEvents(events){
 const turns=events.filter(e=>e.type==='turn.completed'&&e.usage);
 if(!turns.length)return null;
 // No delegation in this protocol. Refuse to count a parent-only trace as complete child accounting.
 if(events.some(e=>/spawn_agent|delegate_task|collab_tool_call/.test(JSON.stringify(e.item??{}))))return null;
 const usage={input_tokens:0,cached_input_tokens:0,output_tokens:0,child_input_tokens:0,child_output_tokens:0};
 for(const {usage:u}of turns){for(const k of ['input_tokens','cached_input_tokens','output_tokens'])if(!Number.isSafeInteger(u[k])||u[k]<0)return null;else usage[k]+=u[k];}
 return usage;
}
export function checkAnswer(answer,expected){return !!answer&&JSON.stringify(answer.rules)===JSON.stringify(expected.rules)&&JSON.stringify(answer.checks)===JSON.stringify(expected.checks)&&answer.canImplement===expected.canImplement&&typeof answer.blockingReason==='string'&&(expected.canImplement||/approval/i.test(answer.blockingReason));}
const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
export async function scenarioFixture(scenario,parent){
 const root=await mkdtemp(join(parent,'fixture-')),base='docs/artifacts/demo/',change=base+'changes/change-context/';
 const expected={rules:[{id:'R1',text:'Preserve signed evidence.'}],checks:['Verify evidence signature.'],canImplement:scenario!=='resumed',blockingReason:scenario==='resumed'?'Approval is missing.':''};
 if(scenario==='multi-artifact'){expected.rules.push({id:'R2',text:'Use the established identity contract.'});expected.checks.push('Check identity compatibility.');}
 const put=async(p,s)=>{await mkdir(dirname(join(root,p)),{recursive:true});await writeFile(join(root,p),s);};
 await put(base+'README.md','---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Demo\n');
 await put(change+'README.md','# Context change\n\n## Reason\n\nPreserve evidence during the planned revision.\n');
 await put(base+'requirements/rules.md','# Rules\n\n'+expected.rules.map(r=>`${r.id}: ${r.text}`).join('\n')+'\n');
 await put(base+'specifications/contract.md','# Contract\n\n'+expected.checks.join('\n')+'\n');
 await put(change+'tasks/README.md','---\ntasks: [01-check.md]\ncompatibility: minor\n---\n# Plan\n');
 await put(change+'tasks/01-check.md','---\nid: check\ndepends_on: []\ncovers:\n  - element: requirements/rules.md\n    ids: [R1]\n---\n# Check\n\n## Scope\n\nEvidence check.\n\n## Definition of Done\n\n'+expected.checks.map(c=>'- [ ] '+c).join('\n')+'\n');
 for(let i=0;i<12;i++)await put(base+`specifications/support-${i}.md`,'# Supporting background\n\n'+('Historical context; not an additional governing rule.\n'.repeat(60)));
 if(scenario==='multi-artifact'){
  await put('docs/artifacts/identity/README.md','---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Identity\n');
  await put('docs/artifacts/identity/specifications/contract.md','# Identity\n\nUse the established identity contract.\n');
  await put(base+'specifications/contract.md','---\nreferences:\n  - artifact: identity\n    element: specifications/contract.md\n    requires: Established identity contract\n---\n# Contract\n\n'+expected.checks.join('\n'));
 }
 git(root,'init','-q','-b','main');git(root,'add','.');git(root,'-c','user.name=Benchmark','-c','user.email=benchmark@example.invalid','commit','-qm','baseline');git(root,'switch','-qc','context-task');
 if(scenario==='resumed')await put(base+'requirements/rules.md','# Rules\n\nR1: Preserve signed evidence.\n\nPrior handoff said unsigned evidence was acceptable. That statement is stale. No user approval is available for implementation.\n');
 const prompt=`Analyze artifact demo, change change-context in this repository. Read governing requirements, specifications, task DoD and applicable ADD instructions. Report the exact requirement IDs/text and DoD checks in their document order. Determine whether implementation may start; do not edit files, start subagents, commit or request approvals. ${scenario==='resumed'?'This is a resumed task: the previous handoff claimed unsigned evidence was acceptable and approval was available. Recheck both claims against current sources.':'The user has approved this analysis and the documented implementation plan; required upstream contracts are established on main.'} Return only JSON with rules [{id,text}], checks [string], canImplement boolean, blockingReason string. Do not include source text or other commentary in the final JSON.`;
 return {root,expected,prompt};
}
async function codexRun(root,prompt,model,output){
 const server=fileURLToPath(new URL('../server/flow-mcp-stdio.js',import.meta.url));
 const mcpArgs=[server,'--repository',root,'--state-dir',join(output,'state')];
 const args=['exec','--ephemeral','--json','--sandbox','read-only','--ignore-user-config','-C',root,'--model',model,'-c','model_reasoning_effort="medium"','-c','mcp_servers.artifact-plane.command="node"','-c','mcp_servers.artifact-plane.args='+JSON.stringify(mcpArgs),'--output-last-message',join(output,'answer.json'),prompt];
 await writeFile(join(output,'answer.json'),'',{mode:0o600});
 const chunks=[],errors=[];const status=await new Promise((accept,reject)=>{const p=spawn('codex',args,{stdio:['ignore','pipe','pipe']});p.stdout.on('data',c=>chunks.push(c));p.stderr.on('data',c=>errors.push(c));const timeout=setTimeout(()=>p.kill('SIGTERM'),600000);p.on('error',error=>{clearTimeout(timeout);reject(error);});p.on('close',code=>{clearTimeout(timeout);accept(code);});});
 const raw=Buffer.concat(chunks).toString();await writeFile(join(output,'events.jsonl'),raw,{mode:0o600});await writeFile(join(output,'stderr.log'),Buffer.concat(errors),{mode:0o600});
 const events=raw.split('\n').filter(Boolean).flatMap(s=>{try{return [JSON.parse(s)];}catch{return [];}});
 let answer;try{answer=JSON.parse(await readFile(join(output,'answer.json'),'utf8'));}catch{}
 return {status,answer,events,usage:usageFromEvents(events)};
}
export async function runBenchmark({payloadOnly=false,model,baseline='fe44680',output,run=codexRun}={}){
 if(!payloadOnly&&!model)throw Error('--model is required for comparable live runs.');
 output=output?resolve(output):await mkdtemp(join(tmpdir(),'plane-context-benchmark-'));await mkdir(output,{recursive:true,mode:0o700});
 const runs=[],payload=[];
 for(const scenario of ['contained','multi-artifact','resumed']){
  const template=await scenarioFixture(scenario,output);
  try{
   const service=createReviewService({roots:[template.root],stateDir:join(output,'plane-state')});
   try{const request={path:template.root,artifact:'demo',change:'change-context',operation:'packet'};const full=await service.query(request),compact=await service.query({...request,view:'compact'});payload.push({scenario,legacyBytes:Buffer.byteLength(JSON.stringify(full)),compactFirstPageBytes:Buffer.byteLength(JSON.stringify(compact)),compactHasContinuation:!!compact.pagination.nextCursor,limits:'First-page response bytes only, not model tokens or equal coverage.'});}finally{await service.close();}
   if(payloadOnly)continue;
   for(let repetition=0;repetition<3;repetition++)for(const mode of repetition%2?['optimized','baseline']:['baseline','optimized']){
    const location=join(output,`${scenario}-${repetition}-${mode}`);await mkdir(location,{mode:0o700});const target=join(location,'repo');git(output,'clone','-q','--local','--no-hardlinks',template.root,target);
    // Local clones omit dirty files; restore exactly the template working tree for each pair.
    await cp(join(template.root,'docs'),join(target,'docs'),{recursive:true});
    const bundle=join(target,'docs/artifact-driven');
    if(mode==='baseline'){
     const archive=execFileSync('git',['-C',repository,'archive',baseline,'docs/artifact-driven','AGENTS.md','.codex/agents']);execFileSync('tar',['-x','-C',target],{input:archive});
    }else{
     await cp(join(repository,'docs/artifact-driven'),bundle,{recursive:true,filter:source=>!source.endsWith('/tools/add-validate.mjs')});await cp(join(repository,'AGENTS.md'),join(target,'AGENTS.md'));await cp(join(repository,'.codex/agents'),join(target,'.codex/agents'),{recursive:true});
    }
    await mkdir(join(target,'.agents/skills'),{recursive:true});
    for(const role of ['add-coordinator','add-product-owner','add-technical-lead','add-implementer'])await symlink('../../docs/artifact-driven/03-execution/skills/'+role,join(target,'.agents/skills',role));
    for(const role of ['kiss','asd-ste-100'])await symlink('../../docs/artifact-driven/required-skills/'+role,join(target,'.agents/skills',role));
    await mkdir(join(target,'.codex'),{recursive:true});
    const server=fileURLToPath(new URL('../server/flow-mcp-stdio.js',import.meta.url));
    await writeFile(join(target,'.codex/config.toml'),`[mcp_servers.artifact-plane]\ncommand = "node"\nargs = ${JSON.stringify([server,'--repository',target,'--state-dir',join(location,'state')])}\n`);
    const execution=await run(target,template.prompt,model,location);
    const result={scenario,repetition,mode,model,settings:'reasoning=medium;sandbox=read-only;no-delegation',correct:execution.status===0&&checkAnswer(execution.answer,template.expected),usage:execution.usage,exitCode:execution.status,toolCalls:execution.events.filter(e=>e.type==='item.completed'&&/tool_call|command_execution/.test(e.item?.type??'')).length,observedToolResultBytes:execution.events.filter(e=>e.type==='item.completed'&&/tool_call|command_execution/.test(e.item?.type??'')).reduce((n,e)=>n+Buffer.byteLength(JSON.stringify(e.item.result??e.item.output??null)),0),limits:'Tool result bytes are observed event payloads, not proven model visibility. No child usage accepted; delegation invalidates accounting. Inspect private events to determine MCP rendering.'};runs.push(result);
    await writeFile(join(output,'report.json'),JSON.stringify({runs,payload,summary:summarize(runs)},null,2));
    // A failed runtime prerequisite is a blocker, not eighteen useful repeats of the same failure.
    if(!execution.usage)return {output,runs,payload,summary:{status:'incomplete',reason:'Live runtime supplied no complete usage. Inspect private run logs; restore access before retrying.'}};
   }
  }finally{await rm(template.root,{recursive:true,force:true});}
 }
 const report={output,runs,payload,summary:payloadOnly?{status:'incomplete',reason:'Payload-only run; actual model usage and correctness acceptance are unmeasured.'}:summarize(runs)};await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 try{const result=await runBenchmark({payloadOnly:args.includes('--payload-only'),model:value('--model'),baseline:value('--baseline'),output:value('--output')});process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.summary.status!=='passed'&&!args.includes('--payload-only'))process.exitCode=1;}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
