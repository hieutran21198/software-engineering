import React from 'react';
import {effectiveEdges} from './graph.js';

// In-place documents are labeled by their bytes against the protected branch.
export const sinceMain = state => ({added: 'new since main', modified: 'changed since main', removed: 'removed since main'})[state] || null;
export const workingLabel = e =>
  ({added: 'Working · proposed (new)', modified: 'Working · proposed (changed)', unchanged: 'Working · established'})[e.state] || 'Working · baseline unknown';
// Open in-place changes have no version record; legacy artifacts declare one active change.
export function openChanges(artifact) {
  if (!artifact) return [];
  if (artifact.layout === 'in-place') return artifact.changes.filter(c => c.layout !== 'legacy' && !c.version).map(c => c.name);
  return artifact.activeChange ? [artifact.activeChange] : [];
}
export function changeLabel(artifact) {
  if (artifact.activeChange) return artifact.activeChange;
  if (artifact.layout === 'in-place') return openChanges(artifact).length > 1 ? 'Several open changes' : 'No open change';
  return artifact.changes.length > 1 ? 'Several change candidates' : 'No open change';
}
export function DependencyList({title, value, onSelect, onExplain}) {
  return <div className="relationship">
    <h4>{title}</h4>
    <p className="tiny">Direct</p>
    <div className="chips">{value.direct.length ? value.direct.map(id => <React.Fragment key={id}>
      <button onClick={() => onSelect(id)}>{id}</button>
      {onExplain && <button className="explain-dependency" aria-label={`Explain ${title === 'Upstream' ? 'dependency on' : 'dependency of'} ${id}`} onClick={() => onExplain(id)}>Why?</button>}
    </React.Fragment>) : <span className="muted">None</span>}</div>
    {value.transitive.some(id => !value.direct.includes(id)) && <><p className="tiny">All reachable</p>
      <div className="chips">{value.transitive.map(id => <React.Fragment key={id}>
        <button onClick={() => onSelect(id)}>{id}</button>
        {onExplain && !value.direct.includes(id) && <button className="explain-dependency" aria-label={`Explain path ${title === 'Upstream' ? 'to' : 'from'} ${id}`} onClick={() => onExplain(id)}>Path</button>}
      </React.Fragment>)}</div></>}
  </div>;
}
// Supplier-to-consumer explanation: direct edges keep their statuses; a
// transitive selection shows its path with each direct edge explained.
function dependencyPath(edges, from, to) {
  const queue = [[from]], seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift(), last = path.at(-1);
    if (last === to) return path;
    for (const e of edges.filter(x => x.source === last && !seen.has(x.target))) {seen.add(e.target);queue.push([...path, e.target]);}
  }
  return null;
}
export function DependencyExplanation({snapshot, dependency, planning, onRead, onClear}) {
  const direct = snapshot.edges.filter(e => e.source === dependency.source && e.target === dependency.target);
  const path = direct.length ? [dependency.source, dependency.target] : dependencyPath(effectiveEdges(snapshot.edges, planning), dependency.source, dependency.target);
  const hops = path ? path.slice(1).map((target, i) => ({source: path[i], target})) : [];
  const elements = new Map(snapshot.artifacts.flatMap(a => a.elements.map(e => [e.id, e])));
  return <section className="dependency-explanation" aria-label="Dependency explanation">
    <div className="details-heading"><span className="eyebrow">Dependency</span><button aria-label="Clear dependency selection" onClick={onClear}>×</button></div>
    <h2>{dependency.target} depends on {dependency.source}</h2>
    {!path && <p className="muted">No dependency path exists in the {planning ? 'planning' : 'established'} view.</p>}
    {hops.length > 1 && <p className="tiny">Path: {path.join(' → ')}. Each direct edge is explained separately.</p>}
    {hops.map(hop => snapshot.edges.filter(e => e.source === hop.source && e.target === hop.target).map(edge => (
      <div className="dependency-edge" key={`${edge.source}:${edge.target}:${edge.status}`}>
        <h3>{edge.target} depends on {edge.source}</h3>
        <p className="tiny">Supplier {edge.source} → consumer {edge.target} · {edge.status} · declared in {edge.declaration || `docs/artifacts/${edge.target}/README.md`}</p>
        {edge.explanations?.length ? edge.explanations.map((x, i) => <div className="dependency-reason" key={i}>
          <p>{x.reason}</p>
          <p className="tiny">{x.consumerPath || x.consumer} → {edge.source}/{x.element} · {x.selector.status}{x.selector.source ? ` · ${x.selector.source}` : ''} · {x.resolved ? 'resolved' : `unresolved${x.diagnostic ? `: ${x.diagnostic}` : ''}`}</p>
          {x.source && <p className="tiny">Source: {x.source}</p>}
          {elements.has(x.consumer) && <button onClick={() => onRead(elements.get(x.consumer), dependency)}>Read consuming source</button>}
        </div>) : <p className="muted">Reason not documented. Declaration: {edge.declaration || `docs/artifacts/${edge.target}/README.md`}</p>}
      </div>)))}
    <p className="tiny">Recorded references explain consumption; resolution does not prove runtime behavior.</p>
  </section>;
}
export function ReferenceList({references, onTarget}) {
  return <div className="references">{references.length === 0 ? <p className="muted">No element references.</p> : references.map(r => <div className="reference" key={r.id}>
    <span className={`source-tag ${r.status === 'proposed' ? 'proposed' : ''}`}>{r.status} · {r.resolved ? 'resolved' : 'unresolved'}</span>
    <button className="reference-target" disabled={!r.resolved} onClick={() => onTarget(r)}>{r.artifact} / {r.element}</button>
    <p>{r.reason}</p>
    <small>{r.targetSource || 'No declared target source'}</small>
    {r.diagnostic && <p className="error-text">{r.diagnostic}</p>}
  </div>)}</div>;
}
