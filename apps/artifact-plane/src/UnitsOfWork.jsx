import React,{useMemo,useState} from 'react';
import {ReactFlow,ReactFlowProvider,Background,Controls,Handle,Position} from '@xyflow/react';
import {unitCanvas,unitNode,unitKey} from './unit-canvas.js';
import Markdown from './Markdown.jsx';
import {checklistLabel} from './runtime-model.js';
import {useTaskRuntime,RuntimeBadge,RuntimeDetails,RuntimeConnection} from './Runtime.jsx';
export const completionLabel = completion => completion.derivation==='not-loaded'?'Completion evidence not loaded':completion.derivation==='documented-complete'?'Completion supported by documented evidence':completion.derivation==='incomplete'?'Incomplete':'Completion unknown';
function UnitNode({data,selected}) {
 const execution=useTaskRuntime(data.artifact,data.change,data.task?.path,data.recorded);
 const label=data.kind==='gate'?'Version establishment gate':data.kind==='task'?'Implementation task':data.kind==='phase'?'Workflow phase':data.kind==='member'?'Participating change':data.external?'External prerequisite':'Participating artifact';
 return <div className={`unit-node ${data.kind} ${data.kind==='task'?'state-'+execution.state:''} ${data.external?'external':''} ${selected?'selected':''}`}>
  <Handle type="target" position={Position.Left} isConnectable={false}/>
  <small>{label}</small>{['task','gate'].includes(data.kind)&&<><small className="artifact-label">{data.artifact}</small>{data.change&&<small className="change-label">{data.change}</small>}</>}<strong title={data.title}>{data.title}</strong>
  {data.kind==='task'&&<RuntimeBadge value={execution}/>}<span className="checklist-label">{data.kind==='phase'?data.step.state:data.kind==='gate'?data.establishmentEvidence.state:data.kind==='task'?checklistLabel(data.task):data.member?.deliveredVersion?`Delivered v${data.member.deliveredVersion}`:data.member?.change||data.artifact}</span>
  <Handle type="source" position={Position.Right} isConnectable={false}/>
 </div>;
}
const nodeTypes={unit:UnitNode};
export function UnitList({snapshot,worktreePath,selected,onSelect,filter}) {
 const worktrees=snapshot.workflow?.worktrees||[],worktree=worktrees.find(w=>w.path===worktreePath)||worktrees.find(w=>w.selected);
 return <section className="unit-list">
  <nav aria-label="Units of work">{(worktree?.unitsOfWork||[]).filter(u=>`${u.id} ${u.title}`.toLowerCase().includes(filter.toLowerCase())).map(unit=><button className={`artifact-list-item ${selected===unitKey(worktree,unit)?'active':''}`} key={unit.id} onClick={()=>onSelect(unitKey(worktree,unit))}><span>{unit.title}</span><small>{unit.members.length} participating changes · {completionLabel(unit.completion)}</small></button>)}</nav>
  {!worktree?.unitsOfWork?.length&&<p className="muted">No unit-of-work briefs in this worktree. Explore artifacts and delivery work in Dependencies.</p>}
 </section>;
}
export function UnitView({context,view,onView,planning,onPlanning,selection,onSelect,recorded=false,loading}) {
 const [showAll,setShowAll]=useState(false);
 const ready=context?.unit.loadState!=='not-loaded'&&(view==='workflow'?context?.unit.members.some(m=>m.workflow)||!context?.unit.members.length:view==='implementation'?context?.unit.implementationGraph.state!=='not-loaded':context?.unit.artifactGraph[planning?'planning':'established'].state!=='not-loaded');
 const graph=useMemo(()=>{const result=context&&ready?unitCanvas(context,view,planning,selection,showAll):{nodes:[],edges:[]};return {...result,nodes:result.nodes.map(node=>({...node,initialWidth:node.style.width,initialHeight:node.style.height}))};},[context,view,planning,selection,showAll,ready]);
 if(!context)return <div className="empty-canvas"><h2>Select a unit of work</h2><p>Choose an outcome to explore its participating changes and evidence.</p></div>;
 const {unit}=context;
 const diagnostics=view==='artifacts'?unit.artifactGraph[planning?'planning':'established'].diagnostics:view==='implementation'?unit.implementationGraph.diagnostics:unit.diagnostics;
 return <div className="unit-view" aria-label="Unit of work exploration">
  <div className="unit-toolbar"><strong>{unit.title}</strong><div role="group" aria-label="Unit view" className="view-toggle">{(recorded?['implementation']:['artifacts','workflow','implementation']).map(value=><button key={value} aria-pressed={view===value} className={view===value?'active':''} onClick={()=>onView?.(value)}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div>{view==='artifacts'&&<div role="group" aria-label="Unit dependency view" className="view-toggle"><button aria-pressed={!planning} onClick={()=>onPlanning(false)}>Established</button><button aria-pressed={planning} onClick={()=>onPlanning(true)}>Planning</button></div>}{view==='implementation'&&<><RuntimeConnection/><label className="prerequisite-toggle"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>Show all prerequisites</label></>}</div>
  <p className="tiny" role="status">{loading||'Loaded'}</p><div className="unit-surface">{ready?<ReactFlowProvider key={`${context.worktree.path}/${unit.id}/${view}`}><ReactFlow key={`${context.worktree.path}/${unit.id}/${view}`} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} onNodeClick={(_,n)=>onSelect(n.id)} fitView fitViewOptions={{padding:0.15}} minZoom={0.1} maxZoom={2} nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} colorMode="dark"><Background color="#334059" gap={24}/><Controls showInteractive={false}/></ReactFlow></ReactFlowProvider>:<p className="unit-graph-message">{loading||'Not loaded'} · {view} evidence</p>}</div>
  <div className="unit-legend">{view==='workflow'?'Lines show phase sequence, not dependencies or approval':view==='artifacts'?'Current artifact dependency knowledge · External prerequisites are not members':'Solid arrows: task prerequisites · Dashed arrows: version establishment gates · Plan approval remains required'}</div>
  {diagnostics.length>0&&<details className="unit-diagnostics"><summary>{diagnostics.length} graph diagnostics</summary>{diagnostics.map((d,i)=><p key={i}>{d.code}: {d.message}</p>)}</details>}
  {view==='implementation'&&unit.implementationGraph.state!=='available'&&<p className="unit-graph-message">Combined implementation graph {unit.implementationGraph.state}. Available components do not establish a complete execution order.</p>}
 </div>;
}
export function UnitDetails({context,view,planning,selection,onSelect,document,onCompletion,onDocument,onFlow}) {
 if(!context)return <div className="empty-details"><h2>Explore a shared outcome</h2><p>Select a unit of work to inspect scope, acceptance criteria, and evidence.</p></div>;
 const {unit,worktree}=context,node=unitNode(context,view,planning,selection);
 return <div className="workflow-details unit-details">
  <div className="details-heading"><span className="eyebrow">{node?`${node.kind} details`:'Unit of work'}</span>{node&&<button aria-label="Clear unit node selection" onClick={()=>onSelect(null)}>×</button>}</div>
  <h2>{node?.title||unit.title}</h2><div className="details-meta"><span>{worktree.branch||'Detached'}</span><span>{worktree.path}</span></div>
  {node?<>
   <section><h3>Governing knowledge</h3><p className="tiny">{node.source||`${node.member.artifact} / ${node.member.change}`}</p>{node.kind==='task'&&<p>Task ID: {node.task.id||'Invalid'} · Prerequisites: {node.task.dependsOn.join(', ')||'None within this plan'}</p>}
   {node.kind==='gate'&&<><p>{node.establishmentEvidence.state}</p>{node.establishmentEvidence.reasons.map((reason,i)=><p key={i}>{reason}</p>)}<p className="muted">Task checks alone do not establish this gate or authorize implementation.</p></>}
   {node.kind==='phase'&&<><p>Documented phase evidence: {node.step.state}</p>{node.step.evidence.map((e,i)=><div className="workflow-task" key={i}><p>{e.explanation}</p><p className="tiny">{e.file}</p><button onClick={()=>onDocument?.(e.file)}>Read evidence</button>{document?.source===e.file&&<Markdown text={document.markdown||''}/>}</div>)}{node.step.commits.map(c=><details key={c.id}><summary>{c.subject}</summary><code>{c.id}</code></details>)}{!node.step.evidence.length&&<p>No phase evidence available; no completion or approval is inferred.</p>}</>}
   {node.kind==='task'&&<UnitExecution node={node}/>}<p className="tiny">{document?.status||'Not loaded'}{document?.error&&`: ${document.error}`}</p><Markdown text={document?.markdown||node.markdown||''}/></section>
  </>:<>
   <section><h3>Completion evidence</h3>{onCompletion&&<button onClick={onCompletion}>Load completion evidence</button>}<p>{completionLabel(unit.completion)}</p>{unit.completion.reasons.map((reason,i)=><p key={i}>{reason}</p>)}<p className="muted">Recorded check results and publication evidence are shown; tests are not executed by this explorer.</p></section>
   <section><h3>Affected flows</h3><p>{unit.flowAssessment||"Legacy brief: flow impact was not recorded."}</p>{(unit.affectedFlows||[]).map(f=><button key={`${f.artifact}:${f.flow}`} onClick={()=>onFlow?.({flow:`${f.artifact}:${f.flow}`})}>{f.effect} · {f.artifact}:{f.flow}</button>)}</section>
   <section><h3>Participating changes</h3>{unit.members.map(m=><div className="workflow-task" key={`${m.artifact}/${m.change}`}><strong>{m.artifact} / {m.change}</strong><p>{m.deliveredVersion?`Delivered v${m.deliveredVersion}`:'No delivered version'} · {m.establishmentEvidence.state}</p><p className="tiny">{m.sourcePath||'Unresolved knowledge source'}</p></div>)}</section>
   <section><h3>Shared acceptance criteria</h3>{unit.acceptance.map(c=><div className="unit-criterion" key={c.id}><strong>{c.id}{c.integration?' · Integration':''}</strong><p>{c.criterion}</p>{unit.evidence.filter(e=>e.criterion===c.id).map((e,i)=><details key={i}><summary>{e.result} · {e.method}</summary><p className="tiny">{e.source}</p>{e.resolved?<><button onClick={()=>onDocument?.(e.source.split('#')[0])}>Read evidence</button>{document?.source===e.source.split('#')[0]?<Markdown text={document.markdown}/>:<p>Evidence details not loaded.</p>}</>:<p>Evidence details unavailable.</p>}</details>)}</div>)}</section>
   <section><h3>Brief</h3><p className="tiny">{unit.path}</p><p className="tiny">{document?.status||'Not loaded'}</p><Markdown text={document?.markdown||unit.markdown||''}/></section>
  </>}
  {unit.diagnostics.length>0&&<section><h3>Knowledge diagnostics</h3>{unit.diagnostics.map((d,i)=><p key={i}><strong>{d.code}</strong> · {d.path}<br/>{d.message}</p>)}</section>}
 </div>;
}

function UnitExecution({node}){const value=useTaskRuntime(node.artifact,node.change,node.task.path,node.recorded);return <RuntimeDetails value={value}/>;}
