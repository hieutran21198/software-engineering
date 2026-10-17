import React, {useEffect, useMemo, useRef, useState} from 'react';
import Markdown from '../Markdown.jsx';
import {useDocument, useShell} from '../page-data.js';
import {Notice, PageHeader, Section, StateBadge} from '../ui.jsx';
import {DependencyGraph} from '../GraphPanel.jsx';
import {ActionForm, OperationError, useEdit} from '../editing.jsx';
import {edit as previewEdit} from '../knowledge-api.js';
import {artifactDocuments, artifactTitle, changeTitle, currentChanges, currentUnits, phaseLabel} from '../work-model.js';
import {knowledgeTargets} from '../knowledge-navigation.js';
import {linkPage, purposeParts} from './DocumentPageParts.jsx';
import {DependencyExplanation} from './ArtifactPageParts.jsx';
import './ArtifactPage.css';

const SINGULAR = {requirements: 'requirement', specifications: 'specification', decisions: 'decision', flows: 'flow'};
// Open in-place changes have no version record; a legacy artifact declares one active change.
export const openChanges = artifact => !artifact ? [] : artifact.layout === 'in-place'
  ? artifact.changes.filter(c => c.layout !== 'legacy' && !c.version)
  : artifact.activeChange ? [{name: artifact.activeChange, title: artifact.changes.find(c => c.name === artifact.activeChange)?.title || null}] : [];

// The artifact page: purpose, current work, knowledge by kind and versions.
export default function ArtifactPage({page}) {
  const {snapshot, worktree, go} = useShell(), edit = useEdit();
  const artifact = snapshot.artifacts.find(a => a.id === page.artifact);
  if (!artifact) return <section className="page" aria-label="Artifact page"><div className="column">
    <PageHeader title="Artifact not found"/><p className="muted">This artifact is not in the selected worktree.</p>
  </div></section>;
  return <ArtifactView key={artifact.id} artifact={artifact} page={page} snapshot={snapshot} worktree={worktree} go={go} edit={edit}/>;
}

function ArtifactView({artifact, page, snapshot, worktree, go, edit}) {
  const [graph, setGraph] = useState(false), [dependency, setDependency] = useState(null), [editingDeps, setEditingDeps] = useState(false);
  const [depError, setDepError] = useState(null);
  const [starting, setStarting] = useState(false), [adding, setAdding] = useState(null), [expanded, setExpanded] = useState(() => new Set(page.section ? [page.section] : []));
  const depsButton = useRef(null), startButton = useRef(null);
  const inPlace = artifact.layout === 'in-place', writable = edit.editable && inPlace;
  const readme = `docs/artifacts/${artifact.id}/README.md`;
  const overview = useDocument(readme, {artifact: artifact.id});
  const purpose = useMemo(() => purposeParts(overview.markdown), [overview.markdown]);
  const targets = useMemo(() => knowledgeTargets(snapshot), [snapshot]);
  const docs = useMemo(() => artifactDocuments(artifact), [artifact]);
  const open = openChanges(artifact), current = open[0];
  const working = current && currentChanges(worktree).find(c => c.artifact === artifact.id && c.name === current.name);
  const declared = inPlace ? artifact.proposedDependsOn || artifact.dependsOn : artifact.dependsOn;
  const errors = snapshot.diagnostics.filter(d => d.severity === 'error' && String(d.path || '').startsWith(`docs/artifacts/${artifact.id}/`));

  // The sidebar's "Show all N" opens a section: expand it and bring it into view.
  useEffect(() => {
    if (!page.section) return;
    setExpanded(value => value.has(page.section) ? value : new Set([...value, page.section]));
    requestAnimationFrame(() => document.getElementById(`artifact-section-${page.section}`)?.scrollIntoView({block: 'start'}));
  }, [page.section]);
  const toggle = kind => setExpanded(value => {const next = new Set(value);next.has(kind) ? next.delete(kind) : next.add(kind);return next;});
  const refocus = ref => requestAnimationFrame(() => ref.current?.focus());

  // One click removes a dependency; Edit chooses several at once.
  const removeDependency = id => edit.run('artifact.dependencies.set', {artifact: artifact.id, dependsOn: declared.filter(d => d !== id)}).catch(failure => setDepError(failure));
  const subtitle = <>
    {artifact.currentVersion ? `Version ${artifact.currentVersion}` : 'No version yet'}
    {artifact.proposedVersion && ` · ${artifact.proposedVersion} prepared`}
    {' · '}{declared.length ? <>depends on {declared.map((id, i) => <React.Fragment key={id}>{i > 0 && ', '}<button className="link" onClick={() => go({kind: 'artifact', artifact: id})}>{artifactTitle(snapshot, id)}</button>{writable && !editingDeps && <button className="icon dependency-remove" aria-label={`Remove dependency on ${artifactTitle(snapshot, id)}`} title="Remove dependency" onClick={() => {setDepError(null);removeDependency(id);}}>×</button>}</React.Fragment>)}</> : 'no dependencies'}
    {writable && !editingDeps && <button ref={depsButton} className="quiet dependency-edit" aria-label="Edit dependencies" onClick={() => setEditingDeps(true)}>Edit</button>}
  </>;

  const sections = [...docs.groups.map(g => ({kind: g.kind, label: g.label, documents: g.documents})), {kind: 'flows', label: 'Flows', documents: docs.flows}];
  const openDocument = d => d.flow ? go({kind: 'flow', artifact: artifact.id, flow: d.flow}) : go({kind: 'document', artifact: artifact.id, source: d.file, ...(d.removed ? {established: true} : {})});
  const canAdd = writable && Boolean(current);

  return <section className="page artifact-page" aria-label="Artifact page"><div className="column">
    <PageHeader title={artifact.title} subtitle={subtitle}
      action={<button className="quiet" aria-expanded={graph} onClick={() => {setGraph(value => !value);setDependency(null);}}>{graph ? 'Hide dependencies' : 'Show dependencies'}</button>}/>
    <OperationError error={depError}/>
    {editingDeps && <ActionForm open title="Dependencies" submitLabel="Save dependencies" note="This artifact uses the knowledge of the selected artifacts."
      onClose={() => {setEditingDeps(false);refocus(depsButton);}}
      fields={[{name: 'dependsOn', label: 'Depends on', type: 'checks', value: declared, empty: 'No other artifact exists.',
        options: snapshot.artifacts.filter(a => a.id !== artifact.id).map(a => ({value: a.id, label: a.title}))}]}
      onSubmit={v => edit.run('artifact.dependencies.set', {artifact: artifact.id, dependsOn: v.dependsOn || []})}/>}
    {graph && <div className="artifact-graph">
      <DependencyGraph snapshot={snapshot} focus={artifact.id} onOpen={go} onEdge={setDependency}/>
      {dependency ? <DependencyExplanation snapshot={snapshot} dependency={dependency} onOpen={go} onClose={() => setDependency(null)}/>
        : <p className="tiny graph-hint">Select an arrow to see why the dependency exists.</p>}
    </div>}

    {errors.length > 0 && <Notice tone="error">
      <p>{errors.length === 1 ? 'This artifact has an error.' : `This artifact has ${errors.length} errors.`}</p>
      <ul>{errors.map((d, i) => {
        const element = artifact.elements.find(e => e.file === d.path && e.source === docs.source);
        return <li key={i}>{d.message}{element && <> <button className="link" aria-label={`Fix ${element.title}`} onClick={() => openDocument(element)}>Fix</button></>}</li>;
      })}</ul>
    </Notice>}

    {!inPlace && <Notice tone="warning" action={<Migration artifact={artifact}/>}>
      This artifact uses the legacy snapshot layout. Its knowledge is read-only until you migrate it.
    </Notice>}

    <div className="purpose">
      {overview.error && !overview.ready ? <p className="muted" role="alert">{overview.error} <button className="link" onClick={overview.retry}>Retry</button></p>
        : !overview.ready ? <p className="muted" role="status">Reading the overview…</p>
        : <>
          {purpose.lead && <div className="lead"><Markdown text={purpose.lead} source={readme} targets={targets} onNavigate={link => go(linkPage(link, artifact.id))}/></div>}
          <p className="muted purpose-more">
            {purpose.headings.length > 0 && `${purpose.headings.join(' · ')}. `}
            <button className="link" onClick={() => go({kind: 'document', artifact: artifact.id, source: readme})}>Read the overview</button>
          </p>
        </>}
    </div>

    {current ? <Notice><p>Open change: <button className="link" onClick={() => go({kind: 'change', artifact: artifact.id, change: current.name})}>{changeTitle(working || current)}</button>{working && ` · ${phaseLabel(working)}`}</p></Notice>
      : inPlace && <div className="no-change">
        {!starting && <Notice action={edit.editable && <button ref={startButton} onClick={() => setStarting(true)}>Start a change</button>}><p>No open change.</p></Notice>}
        {starting && <StartChange artifact={artifact} worktree={worktree} go={go} edit={edit} onClose={() => {setStarting(false);refocus(startButton);}}/>}
      </div>}

    {sections.map(s => {
      const all = expanded.has(s.kind), shown = all ? s.documents : s.documents.slice(0, 5), singular = SINGULAR[s.kind];
      return <Section key={s.kind} id={`artifact-section-${s.kind}`} label={s.label} title={s.label} summary={s.documents.length}
        actions={canAdd && adding !== s.kind && <button className="quiet" id={`artifact-add-${s.kind}`} onClick={() => setAdding(s.kind)}>+ New {singular}</button>}>
        {adding === s.kind && <AddDocument artifact={artifact} kind={s.kind} go={go} edit={edit}
          onClose={() => {setAdding(null);requestAnimationFrame(() => document.getElementById(`artifact-add-${s.kind}`)?.focus());}}/>}
        {shown.length ? <ul className="doc-list">{shown.map(d => <li key={d.file}>
          <button className="unstyled" onClick={() => openDocument(d)}><span className="doc-title">{d.title || d.path}</span><StateBadge state={d.state}/></button>
        </li>)}</ul> : <p className="muted empty-kind">No {s.label.toLowerCase()} yet.</p>}
        {s.documents.length > 5 && <button className="link show-all" aria-expanded={all} aria-label={all ? `Show first 5 ${s.label.toLowerCase()}` : `Show all ${s.documents.length} ${s.label.toLowerCase()}`} onClick={() => toggle(s.kind)}>{all ? 'Show first 5' : `Show all ${s.documents.length}`}</button>}
      </Section>;
    })}

    <Versions artifact={artifact} go={go}/>
  </div></section>;
}

function Versions({artifact, go}) {
  const [all, setAll] = useState(false);
  const versions = [...(artifact.versions || [])].reverse();
  const title = name => {const change = artifact.changes.find(c => c.name === name);return change ? changeTitle(change) : name;};
  const established = versions.find(v => v.version === artifact.currentVersion);
  const changeLink = v => v.sourceChange ? artifact.changes.some(c => c.name === v.sourceChange)
    ? <button className="link" onClick={() => go({kind: 'change', artifact: artifact.id, change: v.sourceChange})}>{title(v.sourceChange)}</button> : title(v.sourceChange) : 'an unrecorded change';
  return <Section id="artifact-section-versions" title="Versions" summary={versions.length}>
    {!versions.length ? <p className="muted">No version yet.</p> : <>
      <p className="muted">
        {established ? <>Latest: {established.version} from {changeLink(established)}.</> : artifact.currentVersion ? `Latest: ${artifact.currentVersion}.` : 'No established version.'}
        {artifact.proposedVersion && <> Version {artifact.proposedVersion} is prepared and not on main yet.</>}
        {' '}<button className="link" aria-expanded={all} onClick={() => setAll(value => !value)}>{all ? 'Hide versions' : 'Show versions'}</button>
      </p>
      {all && <ul className="doc-list version-list">{versions.map(v => <li key={v.version}>
        <button className="unstyled" onClick={() => go({kind: 'document', artifact: artifact.id, source: v.path})}>
          <span className="version-number">{v.version}</span>
          <span className="doc-title">{v.sourceChange ? title(v.sourceChange) : 'No source change recorded'}</span>
          {v.version === artifact.proposedVersion && <span className="badge new">Prepared</span>}
        </button>
      </li>)}</ul>}
    </>}
  </Section>;
}

function StartChange({artifact, worktree, go, edit, onClose}) {
  const units = currentUnits(worktree).map(u => ({value: u.id, label: `Join ${u.title}`}));
  return <ActionForm open title={`Start a change of ${artifact.title}`} submitLabel="Start change" onClose={onClose} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: 'What this change does'},
    {name: 'reason', label: 'Reason', type: 'textarea', rows: 3, required: true, placeholder: 'Why the change is necessary'},
    {name: 'unit', label: 'Unit of work', type: 'select', options: [{value: 'new', label: 'New unit with the change title'}, ...units, {value: '', label: 'No unit of work'}], value: 'new'},
  ]} onSubmit={async v => {
    const response = await edit.run('change.start', {artifact: artifact.id, title: v.title, reason: v.reason, ...(v.unit === 'new' ? {unit: {title: v.title}} : v.unit ? {unit: {id: v.unit}} : {})});
    go({kind: 'change', artifact: artifact.id, change: response.result.change});
  }}/>;
}

// New documents and flows open on their own page after the operation.
function AddDocument({artifact, kind, go, edit, onClose}) {
  if (kind === 'flows') return <ActionForm open title="New flow" submitLabel="Create flow" onClose={onClose} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: 'Name of the behavior'},
    {name: 'trigger', label: 'Starts when', required: true, placeholder: 'What starts the behavior'},
    {name: 'outcome', label: 'Ends with', required: true, placeholder: 'What the behavior produces'},
    {name: 'firstStep', label: 'First step', required: true, placeholder: 'Title of the first step'},
  ]} onSubmit={async v => {
    const response = await edit.run('flow.create', {artifact: artifact.id, ...v});
    go({kind: 'flow', artifact: artifact.id, flow: `${artifact.id}:${response.result.flow}`});
  }}/>;
  const singular = SINGULAR[kind];
  return <ActionForm open title={`New ${singular}`} submitLabel={`Add ${singular}`} onClose={onClose} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: `Name of the ${singular}`},
    {name: 'body', label: 'Text (optional)', type: 'textarea', rows: 4, placeholder: 'Leave empty to start from the template'},
  ]} onSubmit={async v => {
    const body = (v.body || '').trim();
    const response = await edit.run('document.add', {artifact: artifact.id, kind: singular, title: v.title, ...(body ? {body: v.body} : {})});
    go({kind: 'document', artifact: artifact.id, source: response.result.path, ...(body ? {} : {edit: true})});
  }}/>;
}

// A legacy artifact accepts one write: the migration, previewed before it applies.
function Migration({artifact}) {
  const edit = useEdit(), [preview, setPreview] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  if (!edit.editable) return null;
  const target = {path: edit.root, worktree: edit.worktree};
  async function plan() {setBusy(true);setError(null);try {setPreview(await previewEdit({...target, operation: 'artifact.migrate', input: {artifact: artifact.id}, dryRun: true}));} catch (failure) {setError(failure);} finally {setBusy(false);}}
  async function apply() {setBusy(true);setError(null);try {await edit.run('artifact.migrate', {artifact: artifact.id}, {expected: preview.expected});setPreview(null);} catch (failure) {setError(failure);} finally {setBusy(false);}}
  return <div className="migration">
    {!preview ? <button disabled={busy} aria-busy={busy} onClick={plan}>Migrate</button> : <section className="inline-form" aria-label="Migration plan">
      <div className="form-title">Migration plan</div>
      <p className="form-note">The migration writes these files. Nothing changes until you apply it.</p>
      <ul className="migration-files">{preview.files.map(f => <li key={f.path}><code>{f.path}</code> <span className="tiny">{f.action}</span></li>)}</ul>
      {preview.result?.review?.length > 0 && <p className="form-note">Review these README sections after the migration: {preview.result.review.join(', ')}.</p>}
      <OperationError error={error}/>
      <div className="form-actions"><button className="primary" disabled={busy} onClick={apply}>Apply migration</button><button onClick={() => setPreview(null)}>Cancel</button></div>
    </section>}
    {!preview && <OperationError error={error}/>}
  </div>;
}
