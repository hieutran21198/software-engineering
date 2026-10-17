import React, {useMemo,useState} from 'react';
import {ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position} from '@xyflow/react';
import {taskCanvas} from './task-canvas.js';
import {checklistLabel} from './runtime-model.js';
import {useTaskRuntime,RuntimeBadge,RuntimeDetails,RuntimeConnection} from './Runtime.jsx';
function TaskNode({data, selected}) {
 const task = data.task;
 const execution=useTaskRuntime(data.artifact,data.change,task.path,undefined,data.sourceWorktree);
 return <div className={'task-node state-'+execution.state + (selected ? ' selected' : '')}>
  <Handle type="target" position={Position.Left} isConnectable={false}/>
  <small className="artifact-label">{data.artifact}</small><small className="change-label">{data.change}</small><strong title={task.title}>{task.title}</strong>
  <RuntimeBadge value={execution}/><span className="checklist-label">{checklistLabel(task)}</span>
  <Handle type="source" position={Position.Right} isConnectable={false}/>
 </div>;
}
const nodeTypes = {task: TaskNode};
function GraphMessages({graph}) {
 if(graph?.state==='not-loaded')return <p>Task evidence not loaded.</p>;
 if (!graph || graph.state === 'unavailable') return <p>Task graph unavailable. This legacy plan has no task membership declaration.</p>;
 if (graph.state === 'invalid') return <><p>Invalid task graph. No execution order is shown.</p>{graph.diagnostics.map((d,i)=><p className="workflow-diagnostic" key={i}><strong>{d.code}</strong> · {d.path}<br/>{d.message}</p>)}</>;
 if (!graph.tasks.length) return <p>No planned tasks.</p>;
 return <p>{graph.tasks.length} planned tasks · {graph.edges.length} prerequisites</p>;
}
export function TaskGraph({context, selection, onSelect, onBack}) {
 const {worktree, change} = context;
 const [showAll,setShowAll]=useState(false);
 const graph = useMemo(()=>{const graph=taskCanvas(worktree, change, selection,showAll);return {...graph,nodes:graph.nodes.map(n=>({...n,data:{...n.data,sourceWorktree:worktree.path},initialWidth:n.style.width,initialHeight:n.style.height}))};},[worktree, change, selection,showAll]);
 return <div className="task-graph-view" aria-label="Implementation task graph">
  <div className="task-graph-toolbar">{onBack&&<button onClick={onBack}>Back to dependencies</button>}<strong>{change.artifact} / {change.name}</strong><RuntimeConnection/><label className="prerequisite-toggle"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/>Show all prerequisites</label></div>
  <div className="task-graph-surface">{change.taskGraph?.state!=='not-loaded'?<ReactFlowProvider><ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} onNodeClick={(_,node)=>onSelect(node.id)} fitView fitViewOptions={{padding:0.15}} minZoom={0.15} maxZoom={2} nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} colorMode="dark">
   <Background color="#334059" gap={24}/><Controls showInteractive={false}/>
  </ReactFlow></ReactFlowProvider>:<p>Loading task graph…</p>}</div>
  {!graph.nodes.length && <div className="task-graph-empty"><GraphMessages graph={change.taskGraph}/></div>}
  <div className="workflow-legend">Arrows show task prerequisites · Redundant task edges hidden unless all prerequisites are shown · Checklists are documented evidence</div>
 </div>;
}
export function TaskGraphDetails({context, onClear, document, onRead}) {
 const {worktree, change, task} = context;
 const inherited = task && change.tasks.find(t => t.path === task.path)?.inherited;
 const execution=useTaskRuntime(change.artifact,change.name,task?.path,undefined,worktree.path);
 return <div className="workflow-details task-details">
  <div className="details-heading"><span className="eyebrow">{task ? 'Task details' : 'Implementation task graph'}</span>{task && <button aria-label="Clear task selection" onClick={onClear}>×</button>}</div>
  <h2>{task?.title || change.artifact + ' / ' + change.name}</h2>
  <div className="details-meta"><span>{worktree.branch || 'Detached HEAD'}</span><span>{worktree.path}</span><span>{change.artifact} / {change.name}</span></div>
  <section><GraphMessages graph={change.taskGraph}/></section>
  {task ? <>
   <section><h3>Task metadata</h3><p>ID: {task.id || 'Invalid declaration'}</p><p className="tiny">{task.path}</p><p>Prerequisites: {task.dependsOn.length ? task.dependsOn.join(', ') : change.taskGraph.state === 'invalid' ? 'See declaration and diagnostics' : 'None within this plan'}</p></section>
   <section><h3>Documented checklist</h3><p>{task.checked} checked · {task.unchecked} unchecked · {task.state}{inherited ? ' · Inherited / historical evidence' : ''}</p><p className="muted">This evidence does not verify completion, plan approval, or running agents. External artifact gates still apply.</p></section>
   <RuntimeDetails value={execution}/><p className="tiny">{document?.status||'Not loaded'}</p><button onClick={onRead}>Read task</button>
  </> : <p className="muted">Select a task to inspect its scope, prerequisites, DoD, and evidence.</p>}
 </div>;
}
