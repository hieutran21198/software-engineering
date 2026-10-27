import React, {useMemo} from 'react';
import {artifactTitle, systemViews} from '../work-model.js';
import {Icon} from '../ui.jsx';

const STATUS = {established: 'Established', 'proposed-add': 'Addition proposed on this branch', 'proposed-remove': 'Removal proposed on this branch'};

// Why one artifact depends on another: the references of the consumer's
// documents to the supplier's documents, grouped by consuming document.
export function DependencyExplanation({snapshot, dependency, onOpen, onClose}) {
  const title = id => artifactTitle(snapshot, id);
  const elements = new Map(snapshot.artifacts.flatMap(a => a.elements.map(e => [e.id, e])));
  const edges = snapshot.edges.filter(e => e.source === dependency.source && e.target === dependency.target);
  const supplierTitle = (x, edge) => elements.get(x.supplier)?.title || `${title(edge.source)} / ${x.element}`;
  return <section className="dependency-explanation" aria-label="Dependency explanation">
    <div className="section-head">
      <h3 className="section-title">{title(dependency.target)} depends on {title(dependency.source)}</h3>
      <button className="quiet" onClick={onClose}>{Icon.close}Close explanation</button>
    </div>
    {!edges.length && <p className="muted">This dependency is not declared on the working branch.</p>}
    {edges.map(edge => {
      const groups = new Map();
      for (const x of edge.explanations || []) groups.set(x.consumer, [...(groups.get(x.consumer) || []), x]);
      const declaration = edge.declaration || `docs/artifacts/${edge.target}/README.md`;
      return <div key={`${edge.source}:${edge.target}:${edge.status}`} className="dependency-edge">
        <p className="tiny">{STATUS[edge.status] || edge.status} · declared in <code>{declaration}</code></p>
        {groups.size ? <div className="rows">{[...groups].map(([consumer, reasons]) => {
          const element = elements.get(consumer);
          return <div className="row" key={consumer}>
            <div className="grow">
              {element ? <button className="link" onClick={() => onOpen({kind: 'document', artifact: element.artifact, source: element.file})}>{element.title}</button>
                : <span className="row-title">{reasons[0].consumerPath || consumer}</span>}
              <ul className="dependency-reasons">{reasons.map((x, i) => <li key={i}>
                {x.reason}
                <span className="tiny">Uses {supplierTitle(x, edge)}{x.resolved ? '' : ` · unresolved${x.diagnostic ? `: ${x.diagnostic}` : ''}`}</span>
              </li>)}</ul>
            </div>
          </div>;
        })}</div> : <p className="muted">No reference explains this dependency. It is declared in <code>{declaration}</code>.</p>}
      </div>;
    })}
    <p className="tiny">Recorded references explain consumption; resolution does not prove runtime behavior.</p>
  </section>;
}

// The links after "Read the overview" to the system view documents of the repository; nothing when it has none.
export function SystemViewLinks({snapshot, go}) {
  const views = useMemo(() => systemViews(snapshot), [snapshot]);
  if (!views.length) return null;
  return <> · {views.length === 1 ? 'System view: ' : 'System views: '}{views.map((v, i) => <React.Fragment key={v.file}>{i > 0 && ', '}
    <button className="link" onClick={() => go({kind: 'document', artifact: v.artifact, source: v.file})}>{v.title || v.path}</button>
  </React.Fragment>)}</>;
}
