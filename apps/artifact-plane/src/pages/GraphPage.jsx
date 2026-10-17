import React, {useMemo, useRef} from 'react';
import {ReactFlow, Background, Handle, Position} from '@xyflow/react';
import {labelledEdgeTypes, GraphLabelLayout} from '../GraphLabels.jsx';
import {canvasGraph} from '../canvas.js';
import {relationships} from '../graph.js';
import {knowledgeGroups} from '../elements.js';
import Markdown from '../Markdown.jsx';
import {documentSummary} from '../Reader.jsx';
import PageHeader from './PageHeader.jsx';
import {RailDivider} from './Rail.jsx';
import {DependencyList, DependencyExplanation, ReferenceList, workingLabel, changeLabel, openChanges} from '../Relationships.jsx';

function Handles() {
  return <><Handle type="target" position={Position.Left} isConnectable={false}/><Handle type="source" position={Position.Right} isConnectable={false}/></>;
}
function ArtifactNode({data, selected}) {
  const a = data.artifact;
  return <div className={`artifact-node ${data.open ? 'expanded' : ''} ${selected ? 'selected' : ''}`}>
    <Handles/>
    <div className="node-head">
      <span className="eyebrow">Artifact</span>
      <button className="node-expand nodrag nopan" aria-label={`${data.open ? 'Collapse' : 'Expand'} ${a.title}`} onClick={e => {e.stopPropagation();data.toggle(a.id);}}>{data.open ? '−' : '+'}</button>
    </div>
    <strong title={a.title}>{a.title}</strong>
    <div className="node-meta">
      <span>{a.currentVersion ? `v${a.currentVersion}` : 'No established version'}{a.proposedVersion ? ` → v${a.proposedVersion} proposed` : ''}</span>
      <span>{a.elements.length} elements</span>
    </div>
    {data.open && data.groups.map(group => <React.Fragment key={group.key}>
      <button className="type-toggle canvas-type nodrag nopan" style={{top: group.y, left: 16 + group.depth * 8, width: 328 - group.depth * 8}}
        aria-label={group.ariaLabel.replace('Change histories', 'Historical documents') + ' in ' + a.title} aria-expanded={group.open}
        onClick={event => {event.stopPropagation();data.toggleType(a.id, group.key);}}>
        <span>{group.open ? '▾' : '▸'} {group.label === 'Change histories' ? 'Historical documents' : group.label}</span>
        <span className="type-count">{group.count}</span>
      </button>
      {group.headings.map(heading => <div className="canvas-source-heading" key={heading.label} style={{top: heading.y}}>{heading.label}</div>)}
    </React.Fragment>)}
    {data.open && a.elements.length === 0 && <p className="empty-node">No knowledge elements found.</p>}
  </div>;
}
function ElementNode({data, selected}) {
  const e = data.element;
  return <div className={`element-node ${selected ? 'selected' : ''}`}>
    <Handles/>
    <span className={`source-tag ${e.source.startsWith('change:') || ['added', 'modified'].includes(e.state) ? 'proposed' : ''}`}>{e.source === 'working' ? workingLabel(e) : e.source.replace(':', ' · ')}</span>
    <strong title={e.path}>{e.path}</strong>
  </div>;
}
function MissingNode({data}) {
  return <div className="missing-node"><Handles/><span className="eyebrow">Unresolved target</span><strong>{data.label}</strong></div>;
}
const nodeTypes = {artifact: ArtifactNode, element: ElementNode, missing: MissingNode};

// The dependency canvas with Established and Planning, element expansion and a
// details rail. The page stays mounted so the viewport survives other pages.
export default function GraphPage({snapshot, active, project, planning, onPlanning, expanded, expandedTypes, listTypes, selection, onSelection, toggle, toggleType, toggleList, revealElement, document, onOpen, onRead, onReadEstablished, onFlows, rail, tabId}) {
  const body = useRef(null);
  const graph = useMemo(() => {
    const result = canvasGraph(snapshot, expanded, planning, expandedTypes);
    result.nodes = result.nodes.map(n => ({...n,
      selected: n.type === 'artifact' ? selection?.artifact === n.data.artifact.id && !selection?.element : n.type === 'element' && selection?.element === n.data.element.id,
      data: {...n.data, toggle, toggleType}}));
    return result;
  }, [snapshot, expanded, expandedTypes, planning, selection, toggle, toggleType]);
  const artifact = snapshot.artifacts.find(a => a.id === selection?.artifact);
  const element = artifact?.elements.find(e => e.id === selection?.element);
  const refs = snapshot.references.filter(r => element ? r.consumer === element.id : r.consumerArtifact === artifact?.id);
  const reachability = artifact && relationships(artifact.id, snapshot.edges, planning);
  const selectArtifact = id => onSelection({artifact: id});
  const selectDependency = dependency => onSelection({artifact: dependency.target, dependency});
  const onNodeClick = (_, node) => {
    if (node.type === 'artifact') selectArtifact(node.data.artifact.id);
    else if (node.type === 'element') onSelection({artifact: node.data.element.artifact, element: node.data.element.id});
  };
  const open = openChanges(artifact);
  const details = Boolean(artifact);
  return <section className="page canvas-page graph-page" aria-label="Graph page" hidden={!active}>
    <PageHeader project={project} title="Dependency graph" onNavigate={onOpen} status="Arrows point from prerequisite to dependent artifact."
      actions={<div className="view-toggle" role="group" aria-label="Dependency view">
        <button aria-pressed={!planning} className={!planning ? 'active' : ''} onClick={() => onPlanning(false)}>Established</button>
        <button aria-pressed={planning} className={planning ? 'active' : ''} onClick={() => onPlanning(true)}>Planning</button>
      </div>}/>
    <div className={`page-body with-rail ${details ? '' : 'without-rail'}`} ref={body} style={{'--rail-width': rail.width + 'px'}}>
      <div className="canvas-area">
        {snapshot.artifacts.length === 0 ? <div className="empty-canvas"><div className="empty-symbol">◇ → ◇</div><h2>No artifacts found</h2><p>Add artifact root READMEs under docs/artifacts in your repository.</p></div> :
          <div className="canvas-surface" onKeyDown={event => {
            // Focused dependency edges open their explanation with Enter or Space.
            if (!['Enter', ' '].includes(event.key)) return;
            const id = event.target.closest?.('.react-flow__edge')?.dataset.id, edge = id && graph.edges.find(e => e.id === id);
            if (edge?.data?.dependency) {event.preventDefault();selectDependency(edge.data.dependency);}
          }}>
            <ReactFlow key={snapshot.repository.path} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={labelledEdgeTypes}
              onNodeClick={onNodeClick} onEdgeClick={(_, edge) => edge.data?.dependency && selectDependency(edge.data.dependency)}
              fitView fitViewOptions={{padding: 0.18}} onInit={instance => requestAnimationFrame(() => requestAnimationFrame(() => instance.fitView({padding: 0.18})))}
              nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} selectionOnDrag={false} minZoom={0.1} maxZoom={2} colorMode="dark" proOptions={{}}>
              <GraphLabelLayout/>
              <Background color="#334059" gap={24} size={1}/>
            </ReactFlow>
          </div>}
        {snapshot.artifacts.length > 0 && <div className="canvas-legend">
          <span><i className="line established"/>Established</span>
          <span><i className="line added"/>Proposed addition</span>
          <span><i className="line removed"/>Proposed removal</span>
          <span><i className="line reference-line"/>Element reference</span>
        </div>}
        {snapshot.diagnostics.length > 0 && <details className="diagnostics">
          <summary>{snapshot.diagnostics.length} repository diagnostic{snapshot.diagnostics.length === 1 ? '' : 's'}</summary>
          <div>{snapshot.diagnostics.map((d, i) => <p key={i}><strong>{d.code}</strong>{d.layout && <span>{d.layout === 'in-place' ? 'In-place layout' : 'Legacy layout'}</span>}<span>{d.path}</span>{d.message}</p>)}</div>
        </details>}
      </div>
      <RailDivider width={rail.width} max={rail.max} onResize={rail.onResize} controls={`details-panel-${tabId}`} edge={() => body.current.getBoundingClientRect().right}/>
      <aside id={`details-panel-${tabId}`} className="details-panel" hidden={!details} aria-label="Selection details">
        {artifact && <>
          <div className="details-heading">
            <span className="eyebrow">{element ? 'Element details' : 'Artifact details'}</span>
            <button aria-label="Clear selection" onClick={() => onSelection(null)}>×</button>
          </div>
          <h2>{element ? element.path : artifact.title}</h2>
          <div className="details-meta">
            <span>{element ? element.source === 'working' ? workingLabel(element) : element.source : artifact.currentVersion ? `Established v${artifact.currentVersion}` : 'No established version'}</span>
            {!element && artifact.proposedVersion && <span>Proposed v{artifact.proposedVersion}</span>}
            {!element && <span>{artifact.layout === 'in-place' ? 'In-place layout' : 'Legacy snapshot layout'}</span>}
            {!element && <span>Open change: {changeLabel(artifact)}</span>}
          </div>
          {!element && selection?.dependency && <DependencyExplanation snapshot={snapshot} dependency={selection.dependency} planning={planning} onRead={onRead} onClear={() => onSelection({artifact: artifact.id})}/>}
          {!element && <section aria-label="Artifact overview">
            <Markdown text={documentSummary(document?.markdown)}/>
            <div className="inspector-actions">
              <button onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: `docs/artifacts/${artifact.id}/README.md`, title: artifact.title})}>Read overview</button>
              <button onClick={() => onOpen({kind: 'artifact', artifact: artifact.id})}>Open artifact page</button>
              {open.length === 1 && <button onClick={() => onOpen({kind: 'change', artifact: artifact.id, change: open[0]})}>Open {open[0]}</button>}
            </div>
          </section>}
          {!element && <>
            <button className="expand-details" onClick={() => toggle(artifact.id)}>{expanded.has(artifact.id) ? 'Collapse' : 'Expand'} elements on canvas</button>
            <details className="relationships"><summary>Dependencies</summary>
              <h3>{planning ? 'Planning' : 'Established'} dependencies</h3>
              <DependencyList title="Upstream" value={reachability.upstream} onSelect={selectArtifact} onExplain={id => selectDependency({source: id, target: artifact.id})}/>
              <DependencyList title="Downstream" value={reachability.downstream} onSelect={selectArtifact} onExplain={id => selectDependency({source: artifact.id, target: id})}/>
            </details>
            <section>
              <h3>Knowledge elements</h3>
              {artifact.elements.length ? knowledgeGroups(artifact, listTypes).map(group => <div className="knowledge-type" key={group.key}>
                <button className="type-toggle inspector-type" aria-label={group.ariaLabel.replace('Change histories', 'Historical documents') + ' in inspector'} aria-expanded={group.open} onClick={() => toggleList(group.key)}>
                  <span>{group.open ? '▾' : '▸'} {group.label === 'Change histories' ? 'Historical documents' : group.label}</span>
                  <span className="type-count">{group.count}</span>
                </button>
                {group.open && group.sources.map(source => <div className="knowledge-source" key={source.source}>
                  <h4>{source.label}</h4>
                  {source.elements.map(e => <button className="element-list-item" data-reader-return={e.id} key={e.id} onClick={() => onRead(e)}><span>{e.path}</span><small>{e.source}</small></button>)}
                </div>)}
              </div>) : <p className="muted">No elements found.</p>}
            </section>
          </>}
          {refs.length > 0 && <section><h3>References</h3><ReferenceList references={refs} onTarget={ref => revealElement(ref.artifact, ref.targetId)}/></section>}
          <section>
            <button onClick={() => onFlows({artifact: artifact.id, ...(element ? {ids: [element.id]} : {})}, element?.source?.startsWith('change:'))}>Find participating flows</button>
            {element && <button onClick={() => onRead(element)}>Read document</button>}
            {element?.state === 'modified' && <button onClick={() => onReadEstablished(element)}>Read established on {String(artifact.baseline?.ref || 'main').replace('refs/heads/', '')}</button>}
          </section>
        </>}
      </aside>
    </div>
  </section>;
}
