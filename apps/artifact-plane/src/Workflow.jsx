import React, {useMemo} from 'react';
import {ReactFlow,ReactFlowProvider,Background,Controls,Handle,Position} from '@xyflow/react';
import {workflowGraph} from './workflow-canvas.js';
const stateLabel = state => state === 'documented-complete' ? 'Documented complete' : state;
function WorktreeNode({data,selected}) {
 const w=data.worktree;
 return <div className={`workflow-group ${w.selected?'selected-worktree':''} ${selected?'selected':''}`}>
  <h3>{w.branch || (w.detached?'Detached HEAD':'Unknown branch')}</h3>
  <p title={w.path}>{w.path}</p>
  <small>{w.selected?'Selected worktree · ':''}{w.availability} · HEAD {w.head?.slice(0,8)||'No commits'}{w.locked?' · Locked':''}{w.prunable?' · Prunable':''}</small>
  {!w.changes.length && <p className="workflow-empty">{w.availability==='readable'?'No ADD changes discovered.':'Worktree unavailable. Select for details.'}</p>}
 </div>;
}
function ChangeNode({data,selected}) {
 const c=data.change;
 return <div className={`workflow-row ${selected?'selected':''}`}><strong>{c.artifact} / {c.name}</strong><span className="step-badge">{c.currentStep || (c.inferenceReason.startsWith('No distinguishable ongoing')?'Historical':'Unknown')}</span></div>;
}
function PhaseNode({data,selected}) {
 const {step,change}=data;
 return <div className={`workflow-phase ${selected?'selected':''} ${change.currentStep===step.name?'current':''}`}>
  <Handle type="target" position={Position.Left} isConnectable={false}/>
  <strong>{step.name}</strong><span>{stateLabel(step.state)}</span><small>{step.commits.length} associated commits{change.currentStep===step.name?' · Current':''}</small>
  <Handle type="source" position={Position.Right} isConnectable={false}/>
 </div>;
}
const nodeTypes={worktree:WorktreeNode,change:ChangeNode,phase:PhaseNode};
export function Workflow({workflow,selection,onSelect}) {
 const graph=useMemo(()=>workflowGraph(workflow,selection),[workflow,selection]);
 return <div className="workflow-view" aria-label="Local ADD workflows">
  <ReactFlowProvider><ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} onNodeClick={(_,node)=>onSelect(node.id)} fitView fitViewOptions={{padding:0.12}} minZoom={0.15} maxZoom={2} nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} colorMode="dark">
   <Background color="#334059" gap={24}/><Controls showInteractive={false}/>
  </ReactFlow></ReactFlowProvider>
  {!graph.nodes.length && <p className="workflow-no-data">{workflow?'No registered worktrees available.':'Workflow evidence unavailable. Refresh to retry.'}</p>}
  <div className="workflow-legend">Lines show phase order · States inferred from Git + Markdown · Select a node for evidence</div>
 </div>;
}
function Commit({commit}) {
 return <details className="workflow-commit"><summary><code>{commit.id.slice(0,8)}</code> {commit.subject}</summary><code className="full-commit">{commit.id}</code></details>;
}
export function WorkflowDetails({node,workflow,busy,onOpen,onClear}) {
 if(!node) return <div className="empty-details"><span className="eyebrow">Workflow inspector</span><h2>Explore workflow phases</h2><p>Select a worktree, change, or phase to inspect its evidence. Steps are inferred from Markdown and Git. Approval and running agents are not detected. Refresh reads again.</p><p>At most {workflow?.historyLimit || 200} artifact commits per worktree.</p>{workflow?.diagnostics.map((d,i)=><p className="workflow-diagnostic" key={i}>{d.message}</p>)}</div>;
 const {worktree:w,change:c,step:s}=node.data;
 return <div className="workflow-details">
  <div className="details-heading"><span className="eyebrow">{s?'Phase':c?'Change':'Worktree'} details</span><button aria-label="Clear workflow selection" onClick={onClear}>×</button></div>
  <h2>{s?.name || (c?`${c.artifact} / ${c.name}`:w.branch || 'Detached HEAD')}</h2>
  <div className="details-meta"><span>{w.branch || 'Detached HEAD'}</span><span>{w.path}</span>{c&&<span>{c.artifact} / {c.name}</span>}</div>
  {!c&&<><p className="muted">{w.availability}{w.selected?' · Selected worktree':''}{w.locked?' · Locked':''}{w.prunable?' · Prunable':''}</p>{w.head&&<><p className="tiny">Full HEAD ID</p><code className="full-commit">{w.head}</code></>}{!w.selected&&<button disabled={busy || w.availability!=='readable'} onClick={()=>onOpen(w.path)}>Open worktree</button>}{w.diagnostics.map((d,i)=><p className="workflow-diagnostic" key={i}>{d.message}</p>)}</>}
  {c&&<><p className="muted">{c.inferenceReason}</p>{c.declaredActive&&<p className="tiny">Declared change; this does not prove ongoing execution.</p>}</>}
  {s?<section><h3>{stateLabel(s.state)}</h3>{s.evidence.length?<ul>{s.evidence.map((e,i)=><li key={i}>{e.explanation}{e.file&&<small>{e.file}</small>}</li>)}</ul>:<p className="muted">No completion evidence available.</p>}{s.completionCommit?<><p className="tiny">Commit introducing completion evidence</p><Commit commit={s.completionCommit}/></>:<p className="tiny">Exact completion commit unknown.</p>}<h3>Associated commits</h3>{s.commits.length?s.commits.map(commit=><Commit key={commit.id} commit={commit}/>):<p className="muted">None.</p>}</section>:c&&<section><h3>Task evidence ({c.tasks.length})</h3>{c.tasks.map(task=><div className="workflow-task" key={task.path}><p>{task.path}</p><small>{task.checked} checked · {task.unchecked} unchecked · {task.state}{task.inherited?' · Inherited / historical':''}</small></div>)}</section>}
 </div>;
}
