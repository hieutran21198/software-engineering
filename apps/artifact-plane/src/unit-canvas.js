import dagre from '@dagrejs/dagre';
import {prerequisiteView} from './prerequisite-view.js';
export const unitKey = (worktree, unit) => JSON.stringify([worktree.path,unit.id]);
export function unitContext(snapshot, key, selection) {
 let identity;try{identity=JSON.parse(key);}catch{return null;}
 if(!Array.isArray(identity)||identity.length!==2)return null;
 const worktree=snapshot?.workflow?.worktrees.find(w=>w.path===identity[0]);
 const unit=worktree?.unitsOfWork?.find(u=>u.id===identity[1]);if(!unit)return null;
 return {worktree,unit,selection};
}
export function unitCanvas(context, view, planning, selection, showAll = false) {
 const {unit,worktree}=context;
 let records=[],connections=[];
 if(view==='workflow'){
  const phases=['Requirement','Specification','Plan','Implementation','Validation','Version preparation'];
  for(const [row,member] of unit.members.entries()){
   const identity=JSON.stringify([worktree.path,unit.id,member.artifact,member.change,'member']);
   records.push({id:identity,kind:'member',title:`${member.artifact} / ${member.change}`,artifact:member.artifact,member,source:`${member.sourcePath||''}README.md`,markdown:member.markdown,position:{x:0,y:row*170}});
   let previous;
   for(const [col,name]of phases.entries()){
    const step=member.workflow?.steps.find(s=>s.name===name)||{name,state:'unknown',evidence:[],commits:[]};
    const id=JSON.stringify([worktree.path,unit.id,member.artifact,member.change,'phase',name]);
    records.push({id,kind:'phase',title:name,artifact:member.artifact,member,step,position:{x:(col+1)*290,y:row*170}});
    if(previous)connections.push({source:previous,target:id,kind:'sequence'});previous=id;
   }
  }
 }else if(view==='artifacts'){
  const graph=unit.artifactGraph[planning?'planning':'established'];
  records=graph.nodes.map(n=>({...n,id:JSON.stringify([worktree.path,unit.id,'artifact',n.id]),kind:'artifact',artifact:n.id,source:`docs/artifacts/${n.id}/README.md`,markdown:n.artifact?.readme||''}));
  const keys=new Map(records.map(n=>[n.artifact,n.id]));connections=graph.edges.map(e=>({...e,source:keys.get(e.source),target:keys.get(e.target),kind:'artifact'}));
 }else{
  records=unit.implementationGraph.nodes;connections=unit.implementationGraph.state==='available'?prerequisiteView(unit.implementationGraph.edges,showAll):unit.implementationGraph.edges;
 }
 const nodes=records.map(record=>({id:record.id,type:'unit',selected:selection===record.id,data:record,position:record.position||{x:0,y:0},style:view==='implementation'?{width:300,height:240}:{width:250,height:120}}));
 const edges=connections.map((edge,i)=>({id:JSON.stringify([edge.kind,edge.source,edge.target,i]),source:edge.source,target:edge.target,type:'smoothstep',data:{kind:edge.kind},markerEnd:{type:'arrowclosed',color:edge.kind==='establishment'?'#edbd75':'#a99bea'},style:{stroke:edge.kind==='establishment'?'#edbd75':'#a99bea',strokeWidth:2,...(edge.kind==='establishment'?{strokeDasharray:'6 4'}:{})}}));
 if(view!=='workflow' && nodes.length){const layout=new dagre.graphlib.Graph().setGraph({rankdir:'LR',ranksep:90,nodesep:45}).setDefaultEdgeLabel(()=>({}));for(const n of nodes)layout.setNode(n.id,view==='implementation'?{width:300,height:240}:{width:250,height:120});for(const e of edges)layout.setEdge(e.source,e.target);dagre.layout(layout);for(const n of nodes){const p=layout.node(n.id);n.position=view==='implementation'?{x:p.x-150,y:p.y-120}:{x:p.x-125,y:p.y-60};}}
 return {nodes,edges};
}
export function unitNode(context, view, planning, selection) {
 return context && unitCanvas(context,view,planning,selection).nodes.find(n=>n.id===selection)?.data || null;
}
