import {parseDocument} from 'yaml';
import {effectiveEdges} from '../src/graph.js';
export const unitNodeKey = (worktree, unit, artifact, change, kind, path = '') => JSON.stringify([worktree,unit,artifact,change,kind,path]);
function cyclic(edges) {
 const next=new Map(),seen=new Set(),visiting=new Set();
 for(const e of edges){if(!next.has(e.source))next.set(e.source,[]);next.get(e.source).push(e.target);}
 function visit(id){if(visiting.has(id))return true;if(seen.has(id))return false;visiting.add(id);for(const target of next.get(id)||[])if(visit(target))return true;visiting.delete(id);seen.add(id);return false;}
 return [...next.keys()].some(visit);
}
export function buildUnitGraphs(unit, snapshot, worktree, files = new Map()) {
 const members=new Map(unit.members.map(m=>[m.artifact,m]));
 const diagnostics=(unit.diagnostics || []).filter(d=>['invalid-unit','invalid-membership','duplicate-membership','missing-member','ambiguous-provenance','invalid-provenance','invalid-delivery-marker','missing-delivery-source','invalid-delivery-plan'].includes(d.code));
 // Explicit unit-selected changes supply their own proposals. External artifact
 // proposals retain the existing snapshot interpretation.
 let edges=snapshot.edges.filter(e=>e.status==='established' || !members.has(e.target));
 for(const member of unit.members){
  if(!member.retainedChangePath || member.deliveredVersion)continue;
  const path=`${member.retainedChangePath}dependencies.yaml`,text=files.get(path);if(text===undefined)continue;
  let doc;try{doc=parseDocument(text);}catch{doc=null;}
  const value=doc && !doc.errors.length ? doc.toJS():null;
  const validList=list=>Array.isArray(list)&&list.every(id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(id))&&new Set(list).size===list.length;
  if(!value || value.artifact!==member.artifact || !validList(value.add || []) || !validList(value.remove || []) || (value.add||[]).some(id=>(value.remove||[]).includes(id))) {diagnostics.push({code:'invalid-proposal',path,message:'Member dependency proposal is invalid.'});continue;}
  for(const [ids,status]of [[value.add||[],'proposed-add'],[value.remove||[],'proposed-remove']])for(const source of ids)edges.push({source,target:member.artifact,status});
 }
 function project(planning){
  const selected=effectiveEdges(edges,planning),included=new Set(members.keys()),queue=[...included];
  while(queue.length){const id=queue.shift();for(const e of selected)if(e.target===id&&!included.has(e.source)){included.add(e.source);queue.push(e.source);}}
  const graphEdges=selected.filter(e=>included.has(e.source)&&included.has(e.target));
  const graphDiagnostics=[...diagnostics];
  const nodes=[...included].sort().map(id=>{
   const artifact=snapshot.artifacts.find(a=>a.id===id);if(!artifact)graphDiagnostics.push({code:'missing-prerequisite',path:unit.path,message:`Prerequisite artifact ${id} is missing.`});
   return {id,title:artifact?.title || id,external:!members.has(id),artifact:artifact||null,member:members.get(id)||null};
  });
  if(cyclic(graphEdges))graphDiagnostics.push({code:'unit-artifact-cycle',path:unit.path,message:'Projected artifact dependencies contain a cycle.'});
  return {nodes,edges:graphEdges,diagnostics:graphDiagnostics,label:'Current artifact dependency knowledge'};
 }
 unit.artifactGraph={established:project(false),planning:project(true)};
 const projected=unit.artifactGraph.planning,nodes=[],internal=[],gateEdges=[],keys=new Map();let state='available';
 const graphDiagnostics=[...projected.diagnostics];
 const gateKey=artifact=>unitNodeKey(worktree,unit.id,artifact,members.get(artifact)?.change || '', 'gate');
 for(const node of projected.nodes){
  const member=members.get(node.id),id=gateKey(node.id);
  nodes.push({id,kind:'gate',artifact:node.id,change:member?.change||null,title:`${node.id} version establishment`,external:node.external,source:member?.sourcePath?`${member.sourcePath}README.md`:`docs/artifacts/${node.id}/README.md`,markdown:member?.markdown||node.artifact?.readme||'',establishmentEvidence:member?.establishmentEvidence||{state:'unknown',reasons:['External prerequisite publication is not verified by member evidence.'],sources:[]}});
 }
 for(const member of unit.members){
  const graph=member.taskGraph||{state:'unavailable',tasks:[],edges:[],diagnostics:[]};
  if(graph.state==='invalid')state='invalid';else if(graph.state!=='available'&&state==='available')state='unavailable';
  graphDiagnostics.push(...graph.diagnostics);
  const local=new Map();
  for(const task of graph.tasks){const id=unitNodeKey(worktree,unit.id,member.artifact,member.change,'task',task.path);local.set(task.id,id);nodes.push({id,kind:'task',artifact:member.artifact,change:member.change,title:task.title,source:task.path,markdown:task.body,task});}
  keys.set(member.artifact,local);
  if(graph.state!=='available')continue;
  for(const e of graph.edges)internal.push({source:local.get(e.source),target:local.get(e.target),kind:'task'});
  const sources=new Set(graph.edges.map(e=>e.source));
  for(const task of graph.tasks)if(!sources.has(task.id))gateEdges.push({source:local.get(task.id),target:gateKey(member.artifact),kind:'establishment'});
 }
 for(const e of projected.edges){
  const dependent=members.get(e.target);
  if(dependent){
   const graph=dependent.taskGraph;if(graph?.state!=='available')continue;
   const targets=new Set(graph.edges.map(edge=>edge.target));
   const roots=graph.tasks.filter(t=>!targets.has(t.id));
   if(!roots.length)gateEdges.push({source:gateKey(e.source),target:gateKey(e.target),kind:'establishment'});
   for(const task of roots)gateEdges.push({source:gateKey(e.source),target:keys.get(e.target).get(task.id),kind:'establishment'});
  }else gateEdges.push({source:gateKey(e.source),target:gateKey(e.target),kind:'establishment'});
 }
 if(graphDiagnostics.length)state='invalid';
 const combined=[...internal,...gateEdges];
 if(cyclic(combined)){state='invalid';graphDiagnostics.push({code:'unit-implementation-cycle',path:unit.path,message:'Combined task and establishment graph contains a cycle.'});}
 unit.implementationGraph={state,nodes,edges:diagnostics.length || graphDiagnostics.some(d=>d.code==='unit-implementation-cycle')?internal:combined,diagnostics:graphDiagnostics};
 return unit;
}
