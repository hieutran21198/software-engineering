import test from 'node:test';
import {request} from 'node:http';
import assert from 'node:assert/strict';
import {writeFile,utimes,symlink,rm,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {createAppServer} from '../server/http.js';
import {createReviewService} from '../server/change-review.js';
import {fixtureRepository,git,fingerprint} from './fixtures.js';
const base='docs/artifacts/demo/',change=base+'changes/change-review/',version=base+'versions/1.0.0/';
const content='export const source = "captured evidence";\n';
function files(){
 const flow={artifact:'demo',id:'behavior',title:'Behavior',trigger:'Begin',outcome:'Done',entry_steps:['start'],steps:[{id:'start',title:'Start',supports:['contract','code']}],transitions:[],support:[{id:'contract',kind:'element',artifact:'demo',element:'requirements/contract.md',requires:'Contract',basis:'documented'},{id:'code',kind:'implementation',path:'src/check.js',requires:'Read captured support',basis:'static'}]};
 return new Map([[base+'README.md','---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Demo'],[version+'README.md','# Baseline'],[version+'requirements/contract.md','Before\n'],[change+'README.md','# Scope'],[change+'requirements/contract.md','After\n'],[change+'requirements/added.md','Added\n'],[change+'tasks/README.md','---\ntasks: []\n---\n# Plan'],[change+'specifications/flows/behavior.md','---\n'+JSON.stringify({flow})+'\n---\n# Behavior'],['src/check.js',content]]);
}
async function setup(t,{roots}={}){
 // A private state directory: the stdio child does not inherit ARTIFACT_PLANE_STATE_DIR.
 const stateDir=await mkdtemp(join(tmpdir(),'plane-review-state-'));
 const fixture=await fixtureRepository(files()),other=await fixtureRepository(files()),reviewService=createReviewService({roots:[fixture.root],stateDir});
 const server=createAppServer({reviewService,repositoryObservation:{intervalMs:20,debounceMs:5}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const client=new Client({name:'review-stdio-test',version:'1'}),configured=roots?roots(fixture,other):[fixture.root];
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../server/flow-mcp-stdio.js',import.meta.url)),...configured.flatMap(root=>['--repository',root]),'--state-dir',stateDir],stderr:'pipe'});
 let stderr='';transport.stderr?.on('data',chunk=>stderr+=chunk);
 await client.connect(transport);
 t.after(async()=>{await client.close();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));await fixture.cleanup();await other.cleanup();await reviewService.close();await rm(stateDir,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 const selectors={path:fixture.root,artifact:'demo',change:'change-review'};
 const http=async(body,headers={})=>{const response=await fetch(url+'/api/review/query',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 return {fixture,other,server,reviewService,client,url,selectors,http,stderr:()=>stderr};
}
test('real stdio MCP and HTTP return identical review/packet facts, pages and omissions without writes',async t=>{
 const {fixture,client,http,selectors,stderr}=await setup(t),before=await fingerprint(fixture.root);
 assert.equal((await client.listTools()).tools.length,14);
 const implicit=await client.callTool({name:'get_change_context',arguments:{artifact:'demo',change:'change-review',budget:0}});assert.equal(implicit.structuredContent.repository.path,fixture.root);assert.ok(implicit.structuredContent.data.sources.every(s=>s.text===''&&s.nextCursor===null));
 for(const [operation,name]of [['review','get_change_review'],['packet','get_change_context']]){
  const args={...selectors,budget:7,limit:1};let cursor;const records=[];
  do{const request={...args,...(cursor?{cursor}:{})},response=await http({...request,operation}),mcp=await client.callTool({name,arguments:request});
   assert.equal(response.status,200);assert.equal(mcp.isError,undefined);assert.deepEqual(mcp.structuredContent,response.body);assert.deepEqual(JSON.parse(mcp.content[0].text),response.body);
   assert.equal(response.body.data.schema,'artifact-plane.change-context.v1');assert.equal(response.body.completeness,'partial');assert.ok(response.body.omissions.length);records.push(...response.body.data.records);cursor=response.body.pagination.nextCursor;
  }while(cursor);
  assert.equal(records.length,3);assert.ok(records.some(r=>r.status==='modified'));
 }
 const args={...selectors,budget:7},packet=await http({...args,operation:'packet'}),source=packet.body.data.sources.find(s=>s.path==='src/check.js');
 assert.ok(source);let cursor,text='';
 do{const request={...args,source:source.id,...(cursor?{cursor}:{})},response=await http({...request,operation:'source'}),mcp=await client.callTool({name:'read_change_context_source',arguments:request});assert.equal(response.status,200);assert.deepEqual(mcp.structuredContent,response.body);assert.equal(response.body.data.offset,text.length);text+=response.body.data.text;cursor=response.body.pagination.nextCursor;}while(cursor);
 assert.equal(text,content);assert.deepEqual(await fingerprint(fixture.root),before);assert.ok(!stderr().includes('SyntaxError'));
});
test('review adapters reject arbitrary roots/sources, foreign requests and stale revisions',async t=>{
 const {fixture,other,client,http,selectors,url}=await setup(t);
 for(const [extra,status,name]of [[{path:other.root},403,'get_change_context'],[{worktree:other.root},422,'get_change_context'],[{source:'/etc/passwd'},403,'read_change_context_source'],[{change:'../../etc'},422,'get_change_context']]){
  const args={...selectors,...extra},operation=name==='read_change_context_source'?'source':'packet';assert.equal((await http({...args,operation})).status,status);const result=await client.callTool({name,arguments:args});assert.equal(result.isError,true);assert.equal(JSON.parse(result.content[0].text).status,status);
 }
 assert.equal((await http({...selectors,operation:'packet'},{Origin:'https://foreign.invalid'})).status,403);
 assert.equal(await new Promise((resolve,reject)=>{const req=request(url+'/api/review/query',{method:'POST',headers:{Host:'foreign.invalid','Content-Type':'application/json'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end(JSON.stringify({...selectors,operation:'packet'}));}),403);
 assert.equal((await http({...selectors,operation:'packet'},{'Sec-Fetch-Site':'cross-site'})).status,403);
 assert.equal((await fetch(url+'/api/review/query')).status,405);
 assert.equal((await fetch(url+'/api/review/query',{method:'POST',body:'{}'})).status,415);
 assert.equal((await fetch(url+'/api/review/query',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
 assert.equal((await http({...selectors,operation:'packet',extra:'x'.repeat(17000)})).status,413);
 assert.equal((await http({...selectors,operation:'packet',unknown:true})).status,400);
 const args={...selectors,limit:1,budget:7},response=await http({...args,operation:'packet'}),mcp=await client.callTool({name:'get_change_context',arguments:args});
 const source=response.body.data.sources.find(s=>s.path==='src/check.js'),sourcePage=await http({...args,operation:'source',source:source.id});const mcpPage=await client.callTool({name:'read_change_context_source',arguments:{...args,source:source.id}});assert.deepEqual(sourcePage.body,mcpPage.structuredContent);assert.ok(sourcePage.body.pagination.nextCursor);await writeFile(join(fixture.root,'src/check.js'),'changed support');
 for(const [name,extra]of [['get_change_context',{cursor:response.body.pagination.nextCursor}],['read_change_context_source',{source:source.id}],['read_change_context_source',{source:source.id,cursor:sourcePage.body.pagination.nextCursor}]]){const request={...args,...extra},operation=name==='get_change_context'?'packet':'source';assert.equal((await http({...request,operation})).status,422);const result=await client.callTool({name,arguments:request});assert.equal(JSON.parse(result.content[0].text).status,422);}
 assert.equal(mcp.structuredContent.revision,response.body.revision);
});
test('configured stdio roots require explicit selection and permit registered worktree aliases',async t=>{
 const {fixture,other,client,selectors,http}=await setup(t,{roots:(f,o)=>[f.root,o.root]}),worktree=fixture.root+'-review';
 git(fixture.root,'worktree','add','-qb','review-worker',worktree);
 const alias=worktree+'-alias';await symlink(worktree,alias);try{
 const {path,...args}=selectors;let result=await client.callTool({name:'get_change_context',arguments:args});assert.equal(JSON.parse(result.content[0].text).status,400);
 result=await client.callTool({name:'get_change_context',arguments:{...selectors,worktree:alias}});assert.equal(result.structuredContent.worktree,worktree);
 const response=await http({...selectors,worktree,operation:'packet'});assert.deepEqual(result.structuredContent,response.body);
 result=await client.callTool({name:'get_change_review',arguments:{...selectors,path:other.root}});assert.equal(result.isError,undefined);
 }finally{await rm(alias);git(fixture.root,'worktree','remove','--force',worktree);}
});
test('repository observer invalidates repeated dirty support edits registered by review only',async t=>{
 const {fixture,http,selectors,url,reviewService}=await setup(t);
 await writeFile(join(fixture.root,'src/check.js'),'dirty initial');await http({...selectors,operation:'packet'});
 assert.ok(reviewService.observedSources(fixture.root).some(s=>s.path==='src/check.js'));
 const controller=new AbortController();t.after(()=>controller.abort());const response=await fetch(url+'/api/repository/events?path='+encodeURIComponent(fixture.root),{signal:controller.signal}),reader=response.body.getReader();
 let pending='';async function next(){for(;;){const match=pending.match(/data: (.+)\n\n/);if(match){pending=pending.slice(match.index+match[0].length);return JSON.parse(match[1]);}const read=await reader.read();assert.ok(!read.done);pending+=new TextDecoder().decode(read.value);}}
 const initial=await next();await writeFile(join(fixture.root,'src/check.js'),'dirty changed');await utimes(join(fixture.root,'src/check.js'),1,1);const first=await next();assert.ok(first.sequence>initial.sequence);
 await writeFile(join(fixture.root,'src/check.js'),'dirty another');await utimes(join(fixture.root,'src/check.js'),1,1);const second=await next();assert.ok(second.sequence>first.sequence);controller.abort();
});
test('unexpected review failures are sanitized across HTTP and MCP',async t=>{
 const {createFlowMcpServer}=await import('../server/flow-mcp.js'),{InMemoryTransport}=await import('@modelcontextprotocol/sdk/inMemory.js');
 const fixture=await fixtureRepository(files()),reviewService={query:async()=>{throw Error('private failure /secret/password');},observedSources:()=>[]};
 const server=createAppServer({reviewService}),app=createFlowMcpServer({roots:[fixture.root],reviewService}),client=new Client({name:'failure-test',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));await app.server.connect(b);await client.connect(a);
 t.after(async()=>{await client.close();await app.close();await new Promise(resolve=>server.close(resolve));await fixture.cleanup();});
 const selectors={path:fixture.root,artifact:'demo',change:'change-review'},response=await fetch('http://127.0.0.1:'+server.address().port+'/api/review/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...selectors,operation:'packet'})});assert.equal(response.status,500);assert.ok(!(await response.text()).includes('private failure'));
 const result=await client.callTool({name:'get_change_context',arguments:selectors});assert.equal(result.isError,true);assert.equal(JSON.parse(result.content[0].text).status,500);assert.ok(!result.content[0].text.includes('private failure'));
});
test('HTTP and stdio MCP return the same tiered change impact in the packet',async t=>{
 const {client,http,selectors}=await setup(t);
 const response=await http({...selectors,operation:'packet'}),mcp=await client.callTool({name:'get_change_context',arguments:selectors});
 assert.equal(response.status,200);assert.ok(response.body.data.impact.tiers?.counts,JSON.stringify(response.body.data.impact.tiers?.coverage));
 assert.deepEqual(mcp.structuredContent.data.impact.tiers,response.body.data.impact.tiers);
 assert.ok(response.body.data.impact.tiers.direct.some(i=>i.entity==='flow:demo:behavior'));
});

// Capture and cursor tokens are service-local, so compare semantic fields, not opaque tokens.
test('compact HTTP/MCP parity, byte cap, concise text and delta registration',async t=>{
 const {client,http,selectors}=await setup(t);
 const args={...selectors,view:'compact',maxResponseBytes:4096};
 const h=await http({...args,operation:'packet'}),m=await client.callTool({name:'get_change_context',arguments:args});
 assert.equal(h.status,200);assert.equal(m.isError,undefined);
 const normalize=r=>({...r,data:{...r.data,captureToken:null},pagination:{...r.pagination,nextCursor:!!r.pagination.nextCursor}});
 assert.deepEqual(normalize(h.body),normalize(m.structuredContent));assert.ok(m.content[0].text.length<100);assert.ok(Buffer.byteLength(JSON.stringify(m))<=4096);
 const delta=await client.callTool({name:'get_change_context_delta',arguments:{...args,captureToken:m.structuredContent.data.captureToken}});assert.equal(delta.isError,undefined);assert.ok(delta.structuredContent.data.entries.some(e=>e.section==='unchanged'));
 const bad=await client.callTool({name:'get_change_context_delta',arguments:{...args,captureToken:h.body.data.captureToken}});assert.equal(bad.isError,true);
});
