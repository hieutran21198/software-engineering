import React from 'react';
import Markdown from '../Markdown.jsx';
import PageHeader from './PageHeader.jsx';
import {relationships} from '../graph.js';
import {ChangeList} from '../Delivery.jsx';
import {artifactDocuments} from '../work-model.js';
import {DependencyList, changeLabel, openChanges, sinceMain} from '../Relationships.jsx';

// The artifact page: purpose, current work, knowledge by kind, dependencies and
// delivery history. Task change-unit-pages adds the editing actions.
export default function ArtifactPage({snapshot, artifactId, worktree, document, project, planning, historiesOpen, onToggleHistories, onOpen, onGraph, onFlows}) {
  const artifact = snapshot.artifacts.find(a => a.id === artifactId);
  if (!artifact) return <section className="page" aria-label="Artifact page"><PageHeader project={project} title="Artifact not found" onNavigate={onOpen}/><p className="muted">This artifact is not in the selected worktree.</p></section>;
  const docs = artifactDocuments(artifact), open = openChanges(artifact), reach = relationships(artifact.id, snapshot.edges, planning);
  const versions = [artifact.currentVersion ? `Established v${artifact.currentVersion}` : 'No established version', artifact.proposedVersion && `Proposed v${artifact.proposedVersion}`, artifact.layout === 'in-place' ? 'In-place layout' : 'Legacy snapshot layout'].filter(Boolean).join(' · ');
  const row = d => <li key={d.file}><button className="document-link" onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: d.file, title: d.path, established: d.removed || undefined})}><span>{d.path}</span>{sinceMain(d.state) && <span className={`status-pill ${d.state === 'added' ? 'new' : d.state === 'modified' ? 'changed' : 'removed'}`}>{sinceMain(d.state)}</span>}</button></li>;
  return <section className="page artifact-page" aria-label="Artifact page">
    <PageHeader project={project} artifact={artifact.id} crumb="Overview" title={artifact.title} status={versions} onNavigate={onOpen}
      actions={<><button onClick={() => onGraph(artifact.id)}>Show in graph</button><button onClick={() => onFlows({artifact: artifact.id}, false)}>Find participating flows</button></>}/>
    {artifact.layout !== 'in-place' && <p className="notice">This artifact uses the legacy snapshot layout. Its knowledge is read-only here.</p>}
    <section className="page-section" aria-label="Purpose">
      <h2>Purpose</h2>
      {document?.status === 'Loaded' ? <Markdown text={document.markdown}/> : <p role="status" className="muted">{document?.status === 'Error' ? document.error : 'Loading overview…'}</p>}
      <button onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: `docs/artifacts/${artifact.id}/README.md`, title: artifact.title})}>Read overview</button>
    </section>
    <section className="page-section" aria-label="Current work">
      <h2>Current work</h2>
      <p>Open change: {changeLabel(artifact)}</p>
      <div className="inspector-actions">{open.map(name => <button key={name} onClick={() => onOpen({kind: 'change', artifact: artifact.id, change: name})}>Open {name}</button>)}</div>
    </section>
    <section className="page-section" aria-label="Knowledge">
      <h2>Knowledge</h2>
      <div className="kind-columns">
        {docs.groups.map(g => <div className="kind-list" key={g.kind}><h3>{g.label} <span className="type-count">{g.documents.length}</span></h3>{g.documents.length ? <ul>{g.documents.map(row)}</ul> : <p className="muted">None.</p>}</div>)}
        <div className="kind-list"><h3>Flows <span className="type-count">{docs.flows.length}</span></h3>{docs.flows.length ? <ul>{docs.flows.map(f => <li key={f.file}><button className="document-link" onClick={() => onOpen({kind: 'flow', artifact: artifact.id, flow: f.flow})}><span>{f.path.split('/').at(-1)}</span>{sinceMain(f.state) && <span className={`status-pill ${f.state === 'added' ? 'new' : 'changed'}`}>{sinceMain(f.state)}</span>}</button></li>)}</ul> : <p className="muted">None.</p>}
          <button onClick={() => onOpen({kind: 'flow', artifact: artifact.id, discover: true})}>Discover behavior</button></div>
      </div>
    </section>
    <section className="page-section" aria-label="Dependencies">
      <h2>{planning ? 'Planning' : 'Established'} dependencies</h2>
      <DependencyList title="Upstream" value={reach.upstream} onSelect={id => onOpen({kind: 'artifact', artifact: id})} onExplain={id => onGraph(artifact.id, {source: id, target: artifact.id})}/>
      <DependencyList title="Downstream" value={reach.downstream} onSelect={id => onOpen({kind: 'artifact', artifact: id})} onExplain={id => onGraph(id, {source: artifact.id, target: id})}/>
    </section>
    <section className="page-section" aria-label="Delivery">
      <ChangeList worktree={worktree} artifact={artifact.id} selected={null} onSelect={key => {const [, a, c] = JSON.parse(key);onOpen({kind: 'change', artifact: a, change: c});}} historiesOpen={historiesOpen} onToggleHistories={onToggleHistories}/>
    </section>
  </section>;
}
