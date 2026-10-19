import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {realpath} from 'node:fs/promises';
import {z} from 'zod/v4';
import {createFlowService} from './flow-index.js';
import {createReviewService} from './change-review.js';
import {createImpactService} from './impact.js';
import {readFlowRepository} from './flow-reader.js';
import {createKnowledgeService, OPERATION_NAMES} from './knowledge-operations.js';
import {errorBody as editError} from './knowledge-writer.js';

// Both adapters pass selectors through the same read-only query service.
export function createFlowMcpServer({service,reviewService,impactService,knowledgeService,roots=[],stateDir,allowWrites=false}={}){
 if(!service&&!roots.length)throw Error('Configure at least one repository root.');
 let flows=service,reviews=reviewService,impact=impactService;
 const sharedLoad=(path,settings)=>{const flowService=getService();return flowService.load?flowService.load(path,settings):readFlowRepository(path,settings);};
 const getImpact=()=>impact??=createImpactService({roots,stateDir,loader:sharedLoad});
 const getService=()=>flows??=createFlowService({roots,stateDir,impactService:getImpact()});
 const getReviews=()=>reviews??=createReviewService({roots,impactService:getImpact()});
 const server=new McpServer({name:'artifact-plane-flows',version:'1.12.2'});
 const common={path:z.string().optional(),worktree:z.string().optional(),knowledge:z.enum(['planning','established','all']).optional(),limit:z.number().int().min(1).max(100).optional(),budget:z.number().int().min(0).max(100000).optional(),cursor:z.string().max(10000).optional()};
 const tools=[
  ['search_flows','Filter flow titles and IDs, or rank by exact ID, keywords and local semantic similarity.','search',{query:z.string().max(4000).optional(),match:z.enum(['title','discovery']).optional(),artifact:z.string().optional()}],
  ['get_flow','Read a flow, its steps and explicit supporting relationships.','detail',{flow:z.string().min(1).max(10000)}],
  ['get_impact_context','Traverse all known reverse relationships independently of search ranking.','impact',{ids:z.array(z.string().max(10000)).min(1).max(100),artifact:z.string().optional()}],
  ['read_flow_source','Read a registered source belonging to the selected flow context.','source',{flow:z.string().min(1).max(10000),source:z.string().max(10000)}],
 ];
 for(const [name,description,operation,selectors] of tools)server.registerTool(name,{description,inputSchema:z.strictObject({...common,...selectors}),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},async args=>{
  try{
   const path=args.path??(roots.length===1?roots[0]:undefined);
   const result=await getService().query({...args,path,operation});
   return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
  }catch(error){return {isError:true,content:[{type:'text',text:JSON.stringify({error:error.status?error.message:'Flow retrieval failed.',status:error.status||500})}]};}
 });
 const reviewCommon={path:common.path,worktree:common.worktree,artifact:z.string().min(1).max(10000),change:z.string().min(1).max(10000),limit:common.limit,budget:common.budget,cursor:common.cursor};
 for(const [name,description,operation,selectors]of [
  ['get_change_review','Compare a change with established knowledge (the protected-ref tree for in-place artifacts, the declared-current snapshot for legacy artifacts) and recorded flow impact.','review',{}],
  ['get_change_context','Capture source-backed change context with evidence limits and explicit omissions.','packet',{}],
  ['read_change_context_source','Read bounded source pages registered to a captured change context.','source',{source:z.string().min(1).max(10000)}],
  ['get_change_brief','Summarize a change for review: seven answers, its claims with a verification step each, reached, declared and undecided flows, attention items and delivery facts. Approval is not verified by this reader.','brief',{}],
 ])server.registerTool(name,{description,inputSchema:z.strictObject({...reviewCommon,...selectors}),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},async args=>{
  try{
   if(!roots.length)return {isError:true,content:[{type:'text',text:JSON.stringify({error:'Configure at least one repository root.',status:403})}]};
   const result=await getReviews().query({...args,operation});
   return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
  }catch(error){return {isError:true,content:[{type:'text',text:JSON.stringify({error:error.status?error.message:'Change retrieval failed.',status:error.status||500})}]};}
 });
 // get_change_impact shares the impact service with HTTP; the text content is the compact answer.
 const origin=z.strictObject({path:z.string().min(1).max(2000).optional(),element:z.string().min(1).max(2000).optional(),flow:z.string().min(1).max(2000).optional(),step:z.string().min(1).max(2000).optional(),model:z.string().min(1).max(2000).optional(),symbols:z.array(z.string().max(200)).optional(),commit:z.string().max(200).optional()});
 const impactInput={path:common.path,worktree:common.worktree,knowledge:common.knowledge,origins:z.array(origin).min(1).max(100).optional(),commit:z.string().max(200).optional(),range:z.string().max(200).optional(),diff:z.strictObject({base:z.string().max(200).optional()}).optional(),depth:z.number().int().min(1).max(4).optional(),budget:common.budget,format:z.enum(['json','text']).optional(),limit:z.number().int().min(1).max(200).optional(),unit:z.string().max(200).optional()};
 server.registerTool('get_change_impact',{description:'Explain what a change affects: direct, transitive, potential and unresolved entities with typed paths, the tests to run, the places to look and the coverage of the analysis. Select one of origins, commit, range or diff.',inputSchema:z.strictObject(impactInput),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},async args=>{
  try{
   const path=args.path??(roots.length===1?roots[0]:undefined);
   if(!path)return {isError:true,content:[{type:'text',text:JSON.stringify({error:'Select one configured repository path.',status:400})}]};
   const result=await getImpact().query({...args,path,format:args.format??'text'});
   return {content:[{type:'text',text:result.text??JSON.stringify(result)}],structuredContent:result};
  }catch(error){return {isError:true,content:[{type:'text',text:JSON.stringify({error:error.status?error.message:'Impact retrieval failed.',status:error.status||500})}]};}
 });
 // Write tools exist only with --allow-writes. They share the HTTP operation service.
 if(allowWrites){
  let knowledge=knowledgeService;const getKnowledge=async()=>knowledge??=createKnowledgeService({roots:await Promise.all(roots.map(r=>realpath(r).catch(()=>r)))});
  const editInput={path:common.path,worktree:common.worktree,operation:z.enum(OPERATION_NAMES),input:z.record(z.string(),z.unknown()).optional(),expected:z.record(z.string(),z.string().regex(/^[a-f0-9]{64}$/)).optional()};
  for(const [name,description,dryRun] of [
   ['preview_knowledge_operation','Plan a knowledge operation, validate the result and return the file changes and the expected digests. Writes nothing.',true],
   ['apply_knowledge_operation','Apply a knowledge operation in docs/artifacts of a worktree with a non-protected branch. Pass the expected digests from the preview or from read_change_context_source fingerprints.',false],
  ])server.registerTool(name,{description,inputSchema:z.strictObject(editInput),annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:false}},async args=>{
   try{
    const path=args.path??(roots.length===1?roots[0]:undefined);
    if(!path)return {isError:true,content:[{type:'text',text:JSON.stringify({error:'Select one configured repository path.',status:400})}]};
    const result=await (await getKnowledge()).apply({...args,path,dryRun});
    return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
   }catch(error){const {status,body}=editError(error);return {isError:true,content:[{type:'text',text:JSON.stringify({...body,status})}]};}
  });
 }
 return {server,get service(){return flows;},get impactService(){return impact;},async close(){await server.close();await flows?.close();if(!impactService)await impact?.close();}};
}
