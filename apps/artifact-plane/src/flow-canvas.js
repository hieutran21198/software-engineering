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
// The step diagram of a flow document: a left-to-right layered layout of the transitions, with
// each condition label given its own space beside its edge, so lines and labels do not cross
// the steps. It needs no server resolution, so a page can draw it from the front matter
// before the detail reply arrives.
const STEP={width:250,height:80},LABEL_WIDTH=180;
// A label wraps at about 26 characters a line in the 180-pixel edge label.
const labelHeight=text=>text?Math.ceil(text.length/26)*17+10:0;
export function flowDiagram(flow) {
 const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
 const steps=(Array.isArray(flow?.steps)?flow.steps:[]).filter(s=>record(s)&&(typeof s.id==='string'||typeof s.id==='number'));
 const ids=new Set(steps.map(s=>String(s.id)));
 const nodes=steps.map((s,i)=>({id:String(s.id),type:'flow',data:{id:String(s.id),title:typeof s.title==='string'&&s.title.trim()?s.title:String(s.id),kind:'step',number:i+1},position:{x:0,y:0},style:{...STEP}}));
 const edges=(Array.isArray(flow?.transitions)?flow.transitions:[]).filter(t=>record(t)&&ids.has(String(t.from))&&ids.has(String(t.to)))
  .map((t,i)=>({id:`${t.from}->${t.to}:${i}`,source:String(t.from),target:String(t.to),type:'readable',label:typeof t.condition==='string'?t.condition:'',markerEnd:{type:'arrowclosed',color:'#8a8f96'},style:{stroke:'#8a8f96',strokeWidth:1.5}}));
 const layout=new dagre.graphlib.Graph({multigraph:true}).setGraph({rankdir:'LR',ranksep:36,nodesep:40,edgesep:24,marginx:20,marginy:20}).setDefaultEdgeLabel(()=>({}));
 nodes.forEach(n=>layout.setNode(n.id,{...STEP}));
 // A loop on one step is drawn as an arc above the step after the layout.
 edges.filter(e=>e.source!==e.target).forEach(e=>layout.setEdge(e.source,e.target,{width:e.label?LABEL_WIDTH:0,height:labelHeight(e.label),labelpos:'c'},e.id));
 dagre.layout(layout);
 nodes.forEach(n=>{const p=layout.node(n.id);n.position={x:p.x-STEP.width/2,y:p.y-STEP.height/2};});
 edges.forEach(e=>{
  if (e.source===e.target) {
   const {x,y}=layout.node(e.source),top=y-STEP.height/2,rise=48;
   e.data={points:[{x:x+40,y:top},{x:x+40,y:top-rise},{x:x-40,y:top-rise},{x:x-40,y:top}],labelX:x,labelY:top-rise-12-labelHeight(e.label)/2};
  } else {
   const l=layout.edge(e.source,e.target,e.id),points=l.points.map(({x,y})=>({x,y})),middle=points[Math.floor(points.length/2)];
   e.data={points,labelX:l.x??middle.x,labelY:l.y??middle.y};
  }
 });
 return {nodes,edges};
}
// Marks the steps an impact answer reached and dims the others. Without
// affected steps the diagram is returned unchanged.
export function highlightDiagram(diagram, stepIds) {
 if (!diagram || !stepIds?.length) return diagram;
 const affected=new Set(stepIds.map(String));
 return {...diagram,nodes:diagram.nodes.map(n=>({...n,className:affected.has(n.id)?'affected':'dimmed',data:{...n.data,affected:affected.has(n.id)}}))};
}
