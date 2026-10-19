import React, {useMemo, useState} from 'react';
import dagre from '@dagrejs/dagre';
import {useShell} from '../page-data.js';
import {PageHeader, Section, Notice} from '../ui.jsx';
import {GraphPanel} from '../GraphPanel.jsx';
import {useRuntime, useTaskRuntime} from '../Runtime.jsx';
import {unitCanvas} from '../unit-canvas.js';
import {stateLabels, elapsedLabel} from '../runtime-model.js';
import {taskNodeTypes, lightEdges} from './UnitPageGraph.jsx';
import './RecordedPage.css';

const UNCERTAINTY = 'A recorded execution context does not verify current knowledge, plan approval or version establishment.';
const when = value => new Date(value).toLocaleString();
const contextTitle = (c, units = []) => units.find(u => u.id === c.unit)?.title || c.unit || c.nodes.find(n => n.kind === 'task')?.artifact || 'Recorded task execution';

// The captured graph of one context in the shape that unitCanvas reads.
function recordedUnit(c) {
  return {worktree: {path: c.root, branch: 'Recorded source'}, unit: {id: c.id, title: c.unit || c.id, members: [], implementationGraph: {state: 'available', diagnostics: [],
    nodes: c.nodes.map(n => ({...n, markdown: '', recorded: {signature: n.task?.signature, contextId: c.id}})), edges: c.edges}}};
}

function TaskDetails({node}) {
  const runtime = useTaskRuntime(node.artifact, node.change, node.task?.path, node.recorded, node.sourceWorktree);
  return <div className="card recorded-task">
    <div className="eyebrow">{node.artifact}{node.change ? ` · ${node.change}` : ''}</div>
    <h3 className="section-title">{node.title}</h3>
    <p>{stateLabels[runtime.state] || 'Unknown'}</p>
    {runtime.attempts.length ? <ul>{runtime.attempts.map(a => <li key={a.id}>{a.agent || a.session} · {stateLabels[a.state] || 'Unknown'} · {elapsedLabel(a.elapsedMs)}{a.stale ? ` · last observed ${a.lastObservedState}` : ''}{a.binding === 'inferred' ? ' · Inferred from a task file read' : ' · Bound explicitly'}</li>)}</ul>
      : <p className="muted">No execution attempt was recorded for this task.</p>}
    <p className="tiny">Observations and reported validation do not establish versions.</p>
  </div>;
}

// Recorded executions: the captured contexts, and the graph of the selected one.
export default function RecordedPage({page}) {
  const {go, worktree} = useShell(), units = worktree?.unitsOfWork || [], runtime = useRuntime(), [selected, setSelected] = useState(null);
  const contexts = runtime.data?.contexts || [];
  const current = contexts.find(c => c.id === page.context) || null;
  const graph = useMemo(() => {
    if (!current) return null;
    const result = unitCanvas(recordedUnit(current), 'implementation', false, null, true);
    // Top to bottom, so that the panel shows the task titles at a readable size.
    const layout = new dagre.graphlib.Graph().setGraph({rankdir: 'TB', ranksep: 40, nodesep: 24}).setDefaultEdgeLabel(() => ({}));
    result.nodes.forEach(n => layout.setNode(n.id, {width: 220, height: 60}));result.edges.forEach(e => layout.setEdge(e.source, e.target));dagre.layout(layout);
    return {nodes: result.nodes.map(n => {const p = layout.node(n.id);return {...n, data: {...n.data, sourceWorktree: current.root}, style: {width: 220, height: 60}, position: {x: p.x - 110, y: p.y - 30}};}), edges: lightEdges(result.edges).map(e => ({...e, type: 'smoothstep'}))};
  }, [current]);
  const node = graph?.nodes.find(n => n.id === selected)?.data;

  return <section className="page" aria-label="Recorded executions"><div className="column">
    <PageHeader title={current ? contextTitle(current, units) : 'Recorded executions'} eyebrow={current ? <><button className="link" onClick={() => go({kind: 'recorded'})}>Recorded executions</button> · captured {when(current.capturedAt)}</> : null}
      subtitle={current ? null : 'Codex task attempts that the observer recorded on this machine.'}/>
    {runtime.status !== 'loaded' ? (runtime.status === 'error' ? <Notice tone="error" action={<button onClick={runtime.retry}>Retry</button>}>{runtime.error}</Notice> : <p className="muted" role="status">Reading recorded executions…</p>)
      : current ? <>
        <p className="muted">Revision {current.revision?.slice(0, 12) || 'unknown'} · {current.sourceMissing ? 'the original worktree is removed' : 'captured source; current files can differ'}. {UNCERTAINTY}</p>
        <Section title="Captured implementation graph">
          <GraphPanel label="Captured implementation graph"  nodes={graph.nodes} edges={graph.edges} nodeTypes={taskNodeTypes} flowKey={current.id}
            message={graph.nodes.length ? null : 'This context has no tasks.'} onNodeClick={(_, n) => setSelected(n.id)}
            legend={<><span><i/>Task prerequisite</span><span>Select a task to read its attempts.</span></>}/>
          {node && <TaskDetails node={node}/>}
        </Section>
      </> : page.context ? <p className="muted">This execution context is not recorded any more.</p>
      : contexts.length ? <ul className="doc-list">{contexts.map(c => <li key={c.id}>
        <button className="unstyled" onClick={() => go({kind: 'recorded', context: c.id})}>
          <span className="doc-title">{contextTitle(c, units)}</span>
          <span className="muted small">{when(c.capturedAt)}{c.sourceMissing ? ' · worktree removed' : ''}</span>
        </button>
      </li>)}</ul> : <p className="muted">No execution is recorded for this repository.</p>}
  </div></section>;
}
