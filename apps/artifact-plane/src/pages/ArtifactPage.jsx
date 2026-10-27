import React, {useEffect, useMemo, useRef, useState} from 'react';
import Markdown from '../Markdown.jsx';
import {useDocument, useShell} from '../page-data.js';
import {Icon, Notice, PageHeader, Section, StateBadge, StatusBadge} from '../ui.jsx';
import {termOnce} from './guidance.jsx';
import {DependencyGraph} from '../GraphPanel.jsx';
import {ActionForm, OperationError, useEdit} from '../editing.jsx';
import {edit as previewEdit} from '../knowledge-api.js';
import {artifactDocuments, artifactTitle, changeStatus, changeTitle, currentChanges, currentUnits, phaseLabel, isError} from '../work-model.js';
import {knowledgeTargets} from '../knowledge-navigation.js';
import {diagramName, diagramType} from '../diagram-labels.js';
import {linkPage, purposeParts} from './DocumentPageParts.jsx';
import {DependencyExplanation, SystemViewLinks} from './ArtifactPageParts.jsx';
import {conceptPage, firstSentence, useConcepts} from './ConceptLinks.jsx';
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
  const [depError, setDepError] = useState(null), [removing, setRemoving] = useState(null);
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
  const waiting = !current && currentChanges(worktree).find(c => c.artifact === artifact.id && c.version);
  const declared = inPlace ? artifact.proposedDependsOn || artifact.dependsOn : artifact.dependsOn;
  const errors = snapshot.diagnostics.filter(d => isError(d) && String(d.path || '').startsWith(`docs/artifacts/${artifact.id}/`));

  // The sidebar's "Show all N" opens a section: expand it and bring it into view.
  useEffect(() => {
    if (!page.section) return;
    setExpanded(value => value.has(page.section) ? value : new Set([...value, page.section]));
    requestAnimationFrame(() => document.getElementById(`artifact-section-${page.section}`)?.scrollIntoView({block: 'start'}));
  }, [page.section]);
  const toggle = kind => setExpanded(value => {const next = new Set(value);next.has(kind) ? next.delete(kind) : next.add(kind);return next;});
  const refocus = ref => requestAnimationFrame(() => ref.current?.focus());

  // Remove asks for a confirmation in the page; Edit chooses several at once.
  const removeDependency = id => {setRemoving(null);edit.run('artifact.dependencies.set', {artifact: artifact.id, dependsOn: declared.filter(d => d !== id)}).catch(failure => setDepError(failure));};
  const keepDependency = id => {setRemoving(null);requestAnimationFrame(() => document.querySelector(`[data-dependency="${CSS.escape(id)}"]`)?.focus());};
  // Version labels: the established version, and the prepared one with the change that prepared it.
  const terms = termOnce(), preparedBy = artifact.proposedVersion && (artifact.versions || []).find(v => v.version === artifact.proposedVersion)?.sourceChange;
  const preparing = preparedBy && (worktree?.changes || []).find(c => c.artifact === artifact.id && c.name === preparedBy);
  const subtitle = <>
    {artifact.currentVersion ? <StatusBadge status="established">Version {artifact.currentVersion} {terms('established')}</StatusBadge> : 'No version yet'}
    {artifact.proposedVersion && <>{' · '}<StatusBadge status="prepared">{artifact.proposedVersion} {terms('prepared')} by</StatusBadge>{' '}
      {preparing ? <button className="link" onClick={() => go({kind: 'change', artifact: artifact.id, change: preparedBy})}>{changeTitle(preparing)}</button> : preparedBy || 'an unrecorded change'}</>}
    {' · '}{declared.length ? <>depends on {declared.map((id, i) => <React.Fragment key={id}>{i > 0 && ', '}<button className="link" onClick={() => go({kind: 'artifact', artifact: id})}>{artifactTitle(snapshot, id)}</button>{writable && !editingDeps && <button className="danger dependency-remove" data-dependency={id} aria-label={`Remove dependency on ${artifactTitle(snapshot, id)}`} aria-expanded={removing === id} onClick={() => {setDepError(null);setRemoving(id);}}>Remove</button>}</React.Fragment>)}</> : 'no dependencies'}
    {writable && !editingDeps && <button ref={depsButton} className="quiet dependency-edit" aria-label="Edit dependencies" onClick={() => setEditingDeps(true)}>{Icon.pen}Edit</button>}
  </>;

  const sections = [...docs.groups.map(g => ({kind: g.kind, label: g.label, documents: g.documents})), {kind: 'flows', label: 'Flows', documents: docs.flows}];
  const openDocument = d => d.flow ? go({kind: 'flow', artifact: artifact.id, flow: d.flow}) : go({kind: 'document', artifact: artifact.id, source: d.file, ...(d.removed ? {established: true} : {})});
  const canAdd = writable && Boolean(current);

  return <section className="page artifact-page" aria-label="Artifact page"><div className="column">
    <PageHeader title={artifact.title} subtitle={subtitle}
      action={<button className="quiet" aria-expanded={graph} onClick={() => {setGraph(value => !value);setDependency(null);}}>{Icon.graph}{graph ? 'Hide dependencies' : 'Show dependencies'}</button>}/>
    {removing && declared.includes(removing) && <div className="inline-form dependency-confirm" role="group" aria-label="Remove dependency" onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation();keepDependency(removing);}}}>
      <p>Remove the dependency on {artifactTitle(snapshot, removing)}? {artifact.title} then no longer declares that it uses its knowledge.</p>
      <div className="form-actions"><button className="danger" autoFocus onClick={() => removeDependency(removing)}>Confirm remove</button><button onClick={() => keepDependency(removing)}>Keep dependency</button></div>
    </div>}
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
            <SystemViewLinks snapshot={snapshot} go={go}/>
          </p>
        </>}
    </div>

    {current ? <Notice><p>Open change: <button className="link" onClick={() => go({kind: 'change', artifact: artifact.id, change: current.name})}>{changeTitle(working || current)}</button>{working && ` · ${phaseLabel(working)}`}</p></Notice>
      : inPlace && <div className="no-change">
        {!starting && <Notice action={edit.editable && <button ref={startButton} onClick={() => setStarting(true)}>Start a change</button>}>
          {/* A change whose version waits for review and merge is still in progress. */}
          {waiting ? <p>Change in progress: <button className="link" aria-label={`${changeTitle(waiting)}, change in progress`} onClick={() => go({kind: 'change', artifact: artifact.id, change: waiting.name})}>{changeTitle(waiting)}</button> · {changeStatus(waiting, worktree).text}</p> : <p>No change in progress.</p>}
        </Notice>}
        {starting && <StartChange artifact={artifact} worktree={worktree} go={go} edit={edit} onClose={() => {setStarting(false);refocus(startButton);}}/>}
      </div>}

    {sections.map(s => {
      const all = expanded.has(s.kind), shown = all ? s.documents : s.documents.slice(0, 5), singular = SINGULAR[s.kind];
      return <Section key={s.kind} id={`artifact-section-${s.kind}`} label={s.label} title={s.label} summary={s.documents.length}
        actions={canAdd && adding !== s.kind && <button className="quiet" id={`artifact-add-${s.kind}`} onClick={() => setAdding(s.kind)}>{Icon.plus}New {singular}</button>}>
        {adding === s.kind && <AddDocument artifact={artifact} kind={s.kind} go={go} edit={edit}
          onClose={() => {setAdding(null);requestAnimationFrame(() => document.getElementById(`artifact-add-${s.kind}`)?.focus());}}/>}
        {shown.length ? <ul className="doc-list">{shown.map(d => <li key={d.file}>
          <button className="unstyled" onClick={() => openDocument(d)}><span className="doc-title">{d.title || d.path}</span><StateBadge state={d.state}/></button>
        </li>)}</ul> : <p className="muted empty-kind">No {s.label.toLowerCase()} yet.</p>}
        {s.documents.length > 5 && <button className="link show-all" aria-expanded={all} aria-label={all ? `Show first 5 ${s.label.toLowerCase()}` : `Show all ${s.documents.length} ${s.label.toLowerCase()}`} onClick={() => toggle(s.kind)}>{all ? 'Show first 5' : `Show all ${s.documents.length}`}</button>}
      </Section>;
    })}

    <Diagrams artifact={artifact} docs={docs} expanded={expanded.has('diagrams')} onToggle={() => toggle('diagrams')} go={go}/>
    <Concepts artifact={artifact} expanded={expanded.has('concepts')} onToggle={() => toggle('concepts')} go={go}/>
    <Versions artifact={artifact} go={go}/>
  </div></section>;
}

// The diagrams of the working knowledge in the document order of the page, only
// when the artifact has one. An item opens its document at the diagram.
function Diagrams({artifact, docs, expanded, onToggle, go}) {
  const items = [...docs.groups.flatMap(g => g.documents), ...docs.flows].flatMap(element => (element.diagrams || []).map(diagram => ({element, diagram})));
  if (!items.length) return null;
  const shown = expanded ? items : items.slice(0, 5);
  return <Section id="artifact-section-diagrams" title="Diagrams" summary={items.length}>
    <ul className="doc-list diagram-list">{shown.map(({element: e, diagram: d}) => <li key={`${e.file}#${d.index}`}>
      <button className="unstyled" onClick={() => go({kind: 'document', artifact: artifact.id, source: e.file, diagram: d.index})}>
        <span className="doc-title">
          <span className="diagram-title">{diagramName(d)}{d.stale && <StatusBadge status="Unchecked items" small title={d.stale}>Stale</StatusBadge>}</span>
          <span className="diagram-line">{diagramType(d.type)} · {e.title || e.path}{d.heading && ` › ${d.heading}`}</span>
          {d.source?.kind === 'source' ? <span className="diagram-line diagram-source" title={d.source.text}>{d.source.text}</span>
            : <span className={`diagram-line${d.source ? '' : ' no-source'}`}>{d.source ? 'Illustrative' : 'No source line'}</span>}
        </span>
      </button>
    </li>)}</ul>
    {items.length > 5 && <button className="link show-all" aria-expanded={expanded} aria-label={expanded ? 'Show first 5 diagrams' : `Show all ${items.length} diagrams`} onClick={onToggle}>{expanded ? 'Show first 5' : `Show all ${items.length}`}</button>}
  </Section>;
}

// The concepts of the artifact, only when it declares one. A removed
// declaration is no concept of the artifact any more.
function Concepts({artifact, expanded, onToggle, go}) {
  const concepts = useConcepts(artifact.id).filter(c => c.declaration !== 'removed');
  if (!concepts.length) return null;
  const shown = expanded ? concepts : concepts.slice(0, 5);
  return <Section id="artifact-section-concepts" title="Concepts" summary={concepts.length}>
    <ul className="doc-list concept-list">{shown.map(c => <li key={c.logicalId}>
      <button className="unstyled" onClick={() => go(conceptPage(c))}>
        <span className="doc-title"><span className="concept-title">{c.title}</span>{c.description && <span className="concept-detail">{firstSentence(c.description)}</span>}</span>
      </button>
    </li>)}</ul>
    {concepts.length > 5 && <button className="link show-all" aria-expanded={expanded} aria-label={expanded ? 'Show first 5 concepts' : `Show all ${concepts.length} concepts`} onClick={onToggle}>{expanded ? 'Show first 5' : `Show all ${concepts.length}`}</button>}
  </Section>;
}

function Versions({artifact, go}) {
  const [all, setAll] = useState(false), terms = termOnce();
  const versions = [...(artifact.versions || [])].reverse();
  const title = name => {const change = artifact.changes.find(c => c.name === name);return change ? changeTitle(change) : name;};
  const established = versions.find(v => v.version === artifact.currentVersion);
  const changeLink = v => v.sourceChange ? artifact.changes.some(c => c.name === v.sourceChange)
    ? <button className="link" onClick={() => go({kind: 'change', artifact: artifact.id, change: v.sourceChange})}>{title(v.sourceChange)}</button> : title(v.sourceChange) : 'an unrecorded change';
  return <Section id="artifact-section-versions" title="Versions" summary={versions.length}>
    {!versions.length ? <p className="muted">No version yet.</p> : <>
      <p className="muted">
        {established ? <>Latest: {established.version} from {changeLink(established)}.</> : artifact.currentVersion ? `Latest: ${artifact.currentVersion}.` : 'No established version.'}
        {artifact.proposedVersion && <> Version {artifact.proposedVersion} is {terms('prepared')} and not on main yet.</>}
        {' '}<button className="link" aria-expanded={all} onClick={() => setAll(value => !value)}>{all ? 'Hide versions' : 'Show versions'}</button>
      </p>
      {all && <ul className="doc-list version-list">{versions.map(v => <li key={v.version}>
        <button className="unstyled" onClick={() => go({kind: 'document', artifact: artifact.id, source: v.path})}>
          <span className="version-number">{v.version}</span>
          <span className="doc-title">{v.sourceChange ? title(v.sourceChange) : 'No source change recorded'}</span>
          {v.version === artifact.proposedVersion && <StatusBadge status="prepared" small>prepared on this branch</StatusBadge>}
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
