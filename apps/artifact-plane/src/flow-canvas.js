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
// The step diagram of a flow document: steps in document order in rows of three, transitions
// as edges labelled with their condition. It needs no server resolution, so a page can draw
// it from the front matter before the detail reply arrives.
export function flowDiagram(flow) {
 const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
 const steps=(Array.isArray(flow?.steps)?flow.steps:[]).filter(s=>record(s)&&(typeof s.id==='string'||typeof s.id==='number'));
 const ids=new Set(steps.map(s=>String(s.id)));
 const nodes=steps.map((s,i)=>({id:String(s.id),type:'flow',data:{id:String(s.id),title:typeof s.title==='string'&&s.title.trim()?s.title:String(s.id),kind:'step',number:i+1},position:{x:(i%3)*410,y:Math.floor(i/3)*200},style:{width:250,height:80}}));
 const edges=(Array.isArray(flow?.transitions)?flow.transitions:[]).filter(t=>record(t)&&ids.has(String(t.from))&&ids.has(String(t.to)))
  .map((t,i)=>({id:`${t.from}->${t.to}:${i}`,source:String(t.from),target:String(t.to),type:'readable',label:typeof t.condition==='string'?t.condition:'',markerEnd:{type:'arrowclosed',color:'#8a8f96'},style:{stroke:'#8a8f96',strokeWidth:1.5}}));
 return {nodes,edges};
}
// Marks the steps an impact answer reached and dims the others. Without
// affected steps the diagram is returned unchanged.
export function highlightDiagram(diagram, stepIds) {
 if (!diagram || !stepIds?.length) return diagram;
 const affected=new Set(stepIds.map(String));
 return {...diagram,nodes:diagram.nodes.map(n=>({...n,className:affected.has(n.id)?'affected':'dimmed',data:{...n.data,affected:affected.has(n.id)}}))};
}
