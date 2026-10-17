import React, {useState} from 'react';
import Markdown from '../Markdown.jsx';
import PageHeader from './PageHeader.jsx';
import {relationships} from '../graph.js';
import {ChangeList} from '../Delivery.jsx';
import {artifactDocuments} from '../work-model.js';
import {DependencyList, changeLabel, openChanges, sinceMain} from '../Relationships.jsx';
import {ActionForm, OperationError, useEdit} from '../editing.jsx';
import {edit as previewEdit} from '../knowledge-api.js';
import {StartChangeForm, AddDocumentForm, AddFlowForm} from './forms.jsx';
import {RemoveButton} from './DocumentPage.jsx';

const KIND = {requirements: 'requirement', specifications: 'specification', decisions: 'decision'};
// Legacy artifacts accept one write: the migration, previewed before it applies.
function Migration({artifact}) {
  const edit = useEdit(), [preview, setPreview] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  if (!edit.editable) return null;
  const target = {path: edit.root, worktree: edit.worktree};
  async function plan() {setBusy(true);setError(null);try {setPreview(await previewEdit({...target, operation: 'artifact.migrate', input: {artifact: artifact.id}, dryRun: true}));} catch (failure) {setError(failure);} finally {setBusy(false);}}
  async function apply() {setBusy(true);setError(null);try {await edit.run('artifact.migrate', {artifact: artifact.id}, {expected: preview.expected});setPreview(null);} catch (failure) {setError(failure);} finally {setBusy(false);}}
  return <div className="migration">
    {!preview ? <button disabled={busy} onClick={plan}>Migrate to in-place</button> : <section aria-label="Migration plan">
      <h3>Migration plan</h3>
      <ul>{preview.files.map(f => <li key={f.path}><code>{f.path}</code> <small>{f.action}</small></li>)}</ul>
      {preview.result?.review?.length > 0 && <p className="tiny">Review these README sections after the migration: {preview.result.review.join(', ')}.</p>}
      <div className="form-actions"><button className="primary" disabled={busy} onClick={apply}>Apply migration</button><button onClick={() => setPreview(null)}>Cancel</button></div>
    </section>}
    <OperationError error={error}/>
  </div>;
}

// The artifact page: purpose, current work, knowledge by kind, dependencies and
// delivery history, with the actions that create and change them.
export default function ArtifactPage({snapshot, artifactId, worktree, document, project, planning, historiesOpen, onToggleHistories, onOpen, onGraph, onFlows, add}) {
  const edit = useEdit();
  const artifact = snapshot.artifacts.find(a => a.id === artifactId);
  if (!artifact) return <section className="page" aria-label="Artifact page"><PageHeader project={project} title="Artifact not found" onNavigate={onOpen}/><p className="muted">This artifact is not in the selected worktree.</p></section>;
  const docs = artifactDocuments(artifact), open = openChanges(artifact), reach = relationships(artifact.id, snapshot.edges, planning);
  const inPlace = artifact.layout === 'in-place', declared = inPlace ? artifact.proposedDependsOn || artifact.dependsOn : artifact.dependsOn;
  const versions = [artifact.currentVersion ? `Established v${artifact.currentVersion}` : 'No established version', artifact.proposedVersion && `Proposed v${artifact.proposedVersion}`, inPlace ? 'In-place layout' : 'Legacy snapshot layout'].filter(Boolean).join(' · ');
  const readme = `docs/artifacts/${artifact.id}/README.md`;
  const row = d => <li key={d.file}><button className="document-link" onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: d.file, title: d.path, established: d.removed || undefined})}><span>{d.path}</span>{sinceMain(d.state) && <span className={`status-pill ${d.state === 'added' ? 'new' : d.state === 'modified' ? 'changed' : 'removed'}`}>{sinceMain(d.state)}</span>}</button></li>;
  const setDependencies = dependsOn => edit.run('artifact.dependencies.set', {artifact: artifact.id, dependsOn});
  const candidates = snapshot.artifacts.filter(a => a.id !== artifact.id && !declared.includes(a.id));
  return <section className="page artifact-page" aria-label="Artifact page">
    <PageHeader project={project} artifact={artifact.id} crumb="Overview" title={artifact.title} status={versions} onNavigate={onOpen}
      actions={<><button onClick={() => onGraph(artifact.id)}>Show in graph</button><button onClick={() => onFlows({artifact: artifact.id}, false)}>Find participating flows</button></>}/>
    {!inPlace && <div className="notice"><p>This artifact uses the legacy snapshot layout. Its knowledge is read-only until you migrate it.</p><Migration artifact={artifact}/></div>}
    <section className="page-section" aria-label="Purpose">
      <h2>Purpose</h2>
      {document?.status === 'Loaded' ? <Markdown text={document.markdown}/> : <p role="status" className="muted">{document?.status === 'Error' ? document.error : 'Loading overview…'}</p>}
      <div className="inspector-actions">
        <button onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: readme, title: artifact.title})}>Read overview</button>
        {inPlace && edit.editable && <button onClick={() => onOpen({kind: 'document', artifact: artifact.id, source: readme, title: artifact.title, edit: true})}>Edit purpose</button>}
      </div>
    </section>
    <section className="page-section" aria-label="Current work">
      <h2>Current work</h2>
      <p>Open change: {changeLabel(artifact)}</p>
      <div className="inspector-actions">{open.map(name => <button key={name} onClick={() => onOpen({kind: 'change', artifact: artifact.id, change: name})}>Open {name}</button>)}</div>
      {inPlace && !open.length && <StartChangeForm snapshot={snapshot} worktree={worktree} artifact={artifact.id} onOpen={onOpen} open={add === 'change'}/>}
    </section>
    <section className="page-section" aria-label="Knowledge">
      <h2>Knowledge</h2>
      <div className="kind-columns">
        {docs.groups.map(g => <div className="kind-list" key={g.kind} aria-label={g.label} role="group"><h3>{g.label} <span className="type-count">{g.documents.length}</span></h3>{g.documents.length ? <ul>{g.documents.map(row)}</ul> : <p className="muted">None.</p>}
          {inPlace && <AddDocumentForm artifact={artifact.id} kind={KIND[g.kind]} onOpen={onOpen} open={add === KIND[g.kind]}/>}</div>)}
        <div className="kind-list" aria-label="Flows" role="group"><h3>Flows <span className="type-count">{docs.flows.length}</span></h3>{docs.flows.length ? <ul>{docs.flows.map(f => <li key={f.file}><button className="document-link" onClick={() => onFlows({artifact: artifact.id, flow: f.flow}, true)}><span>{f.path.split('/').at(-1)}</span>{sinceMain(f.state) && <span className={`status-pill ${f.state === 'added' ? 'new' : 'changed'}`}>{sinceMain(f.state)}</span>}</button></li>)}</ul> : <p className="muted">None.</p>}
          <button onClick={() => onOpen({kind: 'flow', artifact: artifact.id, discover: true})}>Discover behavior</button>
          {inPlace && <AddFlowForm artifact={artifact.id} onFlow={onFlows} open={add === 'flow'}/>}</div>
      </div>
    </section>
    <section className="page-section" aria-label="Dependencies">
      <h2>{planning ? 'Planning' : 'Established'} dependencies</h2>
      <DependencyList title="Upstream" value={reach.upstream} onSelect={id => onOpen({kind: 'artifact', artifact: id})} onExplain={id => onGraph(artifact.id, {source: id, target: artifact.id})}/>
      <DependencyList title="Downstream" value={reach.downstream} onSelect={id => onOpen({kind: 'artifact', artifact: id})} onExplain={id => onGraph(id, {source: artifact.id, target: id})}/>
      {inPlace && <div className="declared-dependencies" role="group" aria-label="Declared dependencies">
        <h3>Declared in this worktree</h3>
        {declared.length ? <ul>{declared.map(id => <li key={id}><span>{id}</span>{edit.editable && <RemoveButton label={`Remove dependency on ${id}`} onRemove={() => setDependencies(declared.filter(d => d !== id))}/>}</li>)}</ul> : <p className="muted">No dependencies.</p>}
        {edit.editable && candidates.length > 0 && <ActionForm label="Add dependency" submitLabel="Add dependency" fields={[{name: 'artifact', label: 'Artifact', type: 'select', options: candidates.map(a => ({value: a.id, label: `${a.title} · ${a.id}`})), value: candidates[0].id}]}
          onSubmit={v => setDependencies([...declared, v.artifact])}/>}
      </div>}
    </section>
    <section className="page-section" aria-label="Delivery">
      <ChangeList worktree={worktree} artifact={artifact.id} selected={null} onSelect={key => {const [, a, c] = JSON.parse(key);onOpen({kind: 'change', artifact: a, change: c});}} historiesOpen={historiesOpen} onToggleHistories={onToggleHistories}/>
    </section>
  </section>;
}
