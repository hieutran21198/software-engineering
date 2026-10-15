import dagre from '@dagrejs/dagre';
// A flow is a behavior graph. Preserve loops and joins; never infer prerequisites.
export function flowCanvas(graph, flow, expanded=false, selection=null) {
 const steps=new Set((flow?.steps||[]).map(s=>s.nodeId));
 const edges=(graph?.edges||[]).filter(e=>e.flow===flow?.id&&(e.kind==='transition'||expanded&&e.kind==='supports'));
 const ids=new Set(steps);edges.forEach(e=>{ids.add(e.source);ids.add(e.target);});
 const nodes=(graph?.nodes||[]).filter(n=>ids.has(n.id)).map(n=>({id:n.id,type:'flow',data:n,selected:n.id===selection,position:{x:0,y:0}}));
 const valid=new Set(nodes.map(n=>n.id));
 const projected=edges.filter(e=>valid.has(e.source)&&valid.has(e.target)).map(e=>({...e,type:'readable',label:e.condition||[e.kind,e.basis].filter(Boolean).join(' · '),markerEnd:{type:'arrowclosed'},style:{stroke:e.kind==='transition'?'#a99bea':'#72c6c1',strokeDasharray:e.kind==='transition'?undefined:'5 4'}}));
 const layout=new dagre.graphlib.Graph({multigraph:true}).setGraph({rankdir:'LR',ranksep:80,nodesep:40}).setDefaultEdgeLabel(()=>({}));
 nodes.forEach(n=>layout.setNode(n.id,{width:260,height:100}));projected.forEach(e=>layout.setEdge(e.source,e.target,{},e.id));dagre.layout(layout);
 nodes.forEach(n=>{const p=layout.node(n.id);n.position={x:p.x-130,y:p.y-50};});
 return {nodes,edges:projected};
}
