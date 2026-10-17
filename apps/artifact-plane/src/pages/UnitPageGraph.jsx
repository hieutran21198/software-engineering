// Light graph nodes for unit graphs: the artifact graph of the unit page and
// the captured implementation graph of the recorded executions page.
import React from 'react';
import {Handle, Position} from '@xyflow/react';
import {Handles} from '../GraphPanel.jsx';

// Top and bottom handles for graphs laid out from top to bottom.
const Vertical = () => <><Handle type="target" position={Position.Top} isConnectable={false}/><Handle type="source" position={Position.Bottom} isConnectable={false}/></>;
import {useTaskRuntime} from '../Runtime.jsx';
import {stateLabels} from '../runtime-model.js';

const EDGE = '#8a8f96', GATE = '#b08a3e';
// Same layout as unitCanvas, with the light edge colors of the graph panel.
export const lightEdges = edges => edges.map(e => {
  const color = e.data?.kind === 'establishment' ? GATE : EDGE;
  return {...e, markerEnd: {type: 'arrowclosed', color}, style: {...e.style, stroke: color, strokeWidth: 1.5}};
});

function ArtifactNode({data}) {
  const version = data.version;
  return <div className={`graph-node ${data.external ? 'external' : ''}`}>
    <Handles/>
    <small>{data.external ? 'Prerequisite, not in this unit' : 'In this unit'}</small>
    <strong title={data.title}>{data.title}</strong>
    <small>{version ? `Version ${version}` : 'No version yet'}</small>
  </div>;
}

function TaskNode({data}) {
  const runtime = useTaskRuntime(data.artifact, data.change, data.task?.path, data.recorded, data.sourceWorktree);
  if (data.kind === 'gate') return <div className="graph-node external task-node"><Vertical/><small>Version gate · {data.artifact}</small><strong title={data.title}>{data.title}</strong></div>;
  return <div className="graph-node task-node"><Vertical/>
    <strong title={data.title}>{data.title}</strong>
    <small>{stateLabels[runtime.state] || 'Unknown'}{runtime.attempts.length ? ` · ${runtime.attempts.length} ${runtime.attempts.length === 1 ? 'attempt' : 'attempts'}` : ''}</small>
  </div>;
}

export const artifactNodeTypes = {unit: ArtifactNode};
export const taskNodeTypes = {unit: TaskNode};
