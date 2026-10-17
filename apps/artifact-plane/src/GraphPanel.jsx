// One inline graph panel for every page. Pages pass nodes, edges and node
// types; the panel adds the frame, zoom controls and the legend. Graphs show
// the working branch; proposed additions and removals keep their own styles.
import React, {useMemo} from 'react';
import {ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position} from '@xyflow/react';
import {labelledEdgeTypes, GraphLabelLayout} from './GraphLabels.jsx';
import {canvasGraph} from './canvas.js';

export function GraphPanel({label, nodes, edges, nodeTypes, edgeTypes, legend, onNodeClick, onEdgeClick, labelled = false, message, flowKey}) {
  // Enter or Space on a focused node or edge acts like a click, so graphs work by keyboard.
  const keys = event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const edgeId = event.target.closest?.('.react-flow__edge')?.dataset.id, nodeId = event.target.closest?.('.react-flow__node')?.dataset.id;
    const edge = edgeId && edges?.find(e => e.id === edgeId), node = !edge && nodeId && nodes?.find(n => n.id === nodeId);
    if (edge && onEdgeClick) {event.preventDefault();onEdgeClick(event, edge);}
    else if (node && onNodeClick) {event.preventDefault();onNodeClick(event, node);}
  };
  return <div className="graph-panel" role="group" aria-label={label} onKeyDown={keys}>
    {message ? <p className="graph-message">{message}</p> : <ReactFlowProvider key={flowKey}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes || (labelled ? labelledEdgeTypes : undefined)}
        onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} fitView fitViewOptions={{padding: 0.18}} minZoom={0.1} maxZoom={2}
        nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} selectionOnDrag={false} colorMode="light" proOptions={{hideAttribution: true}}>
        <Background color="#e1e0db" gap={24} size={1}/>
        {labelled ? <GraphLabelLayout/> : <Controls showInteractive={false}/>}
      </ReactFlow>
    </ReactFlowProvider>}
    {legend && <div className="graph-legend">{legend}</div>}
  </div>;
}

export const Handles = () => <><Handle type="target" position={Position.Left} isConnectable={false}/><Handle type="source" position={Position.Right} isConnectable={false}/></>;

function ArtifactNode({data}) {
  const a = data.artifact;
  return <div className={`graph-node ${data.current ? 'current' : ''}`}>
    <Handles/>
    <strong title={a.title}>{a.title}</strong>
    <small>{a.currentVersion ? `Version ${a.currentVersion}` : 'No version yet'}{a.proposedVersion ? ` · ${a.proposedVersion} prepared` : ''}</small>
  </div>;
}
function MissingNode({data}) {
  return <div className="graph-node external"><Handles/><small>Unresolved</small><strong>{data.label}</strong></div>;
}
const dependencyTypes = {artifact: ArtifactNode, missing: MissingNode, element: MissingNode};
const COLORS = {established: '#8a8f96', 'proposed-add': '#1e7b4f', 'proposed-remove': '#b42318'};

// Artifact dependencies on the working branch. focus limits the graph to one
// artifact and its direct prerequisites and dependents.
export function DependencyGraph({snapshot, focus = null, onOpen, onEdge}) {
  const graph = useMemo(() => {
    const near = focus ? new Set([focus, ...snapshot.edges.filter(e => e.target === focus).map(e => e.source), ...snapshot.edges.filter(e => e.source === focus).map(e => e.target)]) : null;
    const scope = near ? {...snapshot, artifacts: snapshot.artifacts.filter(a => near.has(a.id)), edges: snapshot.edges.filter(e => near.has(e.source) && near.has(e.target)), references: []} : {...snapshot, references: []};
    const result = canvasGraph(scope, new Set(), true);
    // The working view shows additions; removals proposed on this branch stay visible.
    const removed = scope.edges.filter(e => e.status === 'proposed-remove').map(e => ({
      id: `dependency:${e.source}:${e.target}:proposed-remove`, source: `artifact:${e.source}`, target: `artifact:${e.target}`, type: 'readable', label: 'removal proposed',
      data: {status: 'proposed-remove', dependency: {source: e.source, target: e.target, status: 'proposed-remove'}}, ariaLabel: `${e.target} no longer depends on ${e.source} (proposed)`,
    }));
    const edges = [...result.edges, ...removed].map(e => {const color = COLORS[e.data?.status] || COLORS.established;return {...e, style: {stroke: color, strokeWidth: 2, ...(e.data?.status !== 'established' ? {strokeDasharray: '6 4'} : {})}, markerEnd: {type: 'arrowclosed', color}};});
    const nodes = result.nodes.map(n => ({...n, style: {width: 240, height: 76}, data: {...n.data, current: n.data.artifact?.id === focus}}));
    return {nodes, edges};
  }, [snapshot, focus]);
  const proposed = graph.edges.some(e => e.data?.status !== 'established');
  return <GraphPanel label="Dependency graph" nodes={graph.nodes} edges={graph.edges} nodeTypes={dependencyTypes} labelled flowKey={`${snapshot.repository.path}:${focus || ''}`}
    message={snapshot.artifacts.length ? null : 'No artifacts found.'}
    onNodeClick={(_, node) => node.data.artifact && onOpen?.({kind: 'artifact', artifact: node.data.artifact.id})}
    onEdgeClick={(_, edge) => edge.data?.dependency && onEdge?.(edge.data.dependency)}
    legend={<><span><i/>Dependency</span>{proposed && <><span><i className="added"/>Addition proposed</span><span><i className="removed"/>Removal proposed</span></>}<span>Arrows point from prerequisite to dependent.</span></>}/>;
}
