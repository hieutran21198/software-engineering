import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod/v4';
import {createFlowService} from './flow-index.js';
import {createReviewService} from './change-review.js';

// Both adapters pass selectors through the same read-only query service.
export function createFlowMcpServer({service,reviewService,roots=[],stateDir}={}){
 if(!service&&!roots.length)throw Error('Configure at least one repository root.');
 let flows=service,reviews=reviewService;
 const getService=()=>flows??=createFlowService({roots,stateDir});
 const getReviews=()=>reviews??=createReviewService({roots});
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
 ])server.registerTool(name,{description,inputSchema:z.strictObject({...reviewCommon,...selectors}),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}},async args=>{
  try{
   if(!roots.length)return {isError:true,content:[{type:'text',text:JSON.stringify({error:'Configure at least one repository root.',status:403})}]};
   const result=await getReviews().query({...args,operation});
   return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};
  }catch(error){return {isError:true,content:[{type:'text',text:JSON.stringify({error:error.status?error.message:'Change retrieval failed.',status:error.status||500})}]};}
 });
 return {server,get service(){return flows;},async close(){await server.close();await flows?.close();}};
}
