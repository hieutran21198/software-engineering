import test from 'node:test';
import assert from 'node:assert/strict';
import {marked} from 'marked';
import {formatContextMarkdown} from '../src/context-packet.js';
const packet = () => ({
 repository: {path:'/repo',head:'abc',dirty:false}, worktree:'/repo/worktree',
 context:{artifact:'plane',change:'change-review',baseline:{kind:'declared-current',version:'1.0.0'}},
 revision:'revision-id', freshness:'fresh', completeness:'partial',
 data:{schema:'artifact-plane.change-context.v1',scope:{source:{path:'scope.md',id:'scope-id'}},
  records:[{path:'requirements/check.md',category:'requirements',status:'modified',baseline:{id:'before',fingerprint:'before-sha',characterCount:3},change:{id:'after',fingerprint:'after-sha',characterCount:5}}],
  governingSources:[{id:'unchanged',path:'same.md'}],impact:{coverage:'Recorded only.',candidates:[],declaredAssessment:null},
  evidence:{approval:'Approval not verified by this reader.',publication:{state:'unknown',reasons:['Missing review.']}},unresolvedFacts:[],
  sources:[{id:'after',path:'requirements/check.md',side:'change',fingerprint:'after-sha',offset:0,totalCharacters:5,text:'after',omittedCharacters:0,nextCursor:null}],
  limits:['No authorization.','Recorded checks are not independently run.']},
 diagnostics:[{code:'missing-review',path:'review.md',message:'Review missing.'}],pagination:{offset:0,totalRecords:1,nextCursor:null},omissions:[{source:'short',omittedCharacters:15,reason:'Excerpt budget.'}]
});
test('readable native sections retain context, source identities, differences, evidence and limits',()=>{
 const input=packet(),before=JSON.stringify(input),md=formatContextMarkdown(input),tokens=marked.lexer(md);
 for(const title of ['Context','Scope','Knowledge changes','Recorded flow impact','Evidence and unresolved facts','Sources','Omissions','Limits'])assert.ok(tokens.some(t=>t.type==='heading'&&t.text===title));
 assert.ok(tokens.filter(t=>t.type==='list').length>=8);assert.equal(tokens.filter(t=>t.type==='code').length,1);
 for(const fact of ['declared-current','1.0.0','scope-id','before-sha','after-sha','modified','unchanged','Approval not verified by this reader.','Review missing.','Excerpt budget.','15','No authorization.'])assert.ok(md.includes(fact),fact);
 assert.ok(md.includes('**character Count:** 3'));assert.equal(JSON.stringify(input),before);assert.equal(formatContextMarkdown(input),md);
});
test('metadata cannot inject Markdown or HTML; variable fences contain hostile source text exactly',()=>{
 const input=packet(),attack='<script>alert(1)</script>\n# Injected\n[Click](https://example.invalid)';input.data.scope.description=attack;input.data.sources[0].path=attack;input.data.sources[0].text='```\n</script><img src=x onerror=alert(1)>\n``````\n# Source heading';
 const md=formatContextMarkdown(input),tokens=marked.lexer(md),html=marked.parse(md);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img '));assert.ok(!html.includes('<a href='));
 const code=tokens.filter(t=>t.type==='code');assert.equal(code.length,1);assert.equal(code[0].text,input.data.sources[0].text);assert.ok(md.includes('```````text'));
 assert.ok(!tokens.some(t=>t.type==='heading'&&t.text==='Injected'));assert.ok(!tokens.some(t=>t.type==='heading'&&t.text==='Source heading'));
});
