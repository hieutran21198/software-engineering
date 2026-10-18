import React, {useEffect, useMemo, useRef, useState} from 'react';
import Markdown from '../Markdown.jsx';
import ReviewDiff from '../ReviewDiff.jsx';
import {useDocument, useQuery, useShell} from '../page-data.js';
import {Badge, PageHeader} from '../ui.jsx';
import {ActionForm, OperationError, frontValue, splitFront, useEdit} from '../editing.jsx';
import {sha256} from '../knowledge-api.js';
import {headingTitle} from '../model.js';
import {knowledgeTargets} from '../knowledge-navigation.js';
import {artifactTitle, changeTitle, isFlow, memberUnit} from '../work-model.js';
import {impactPage} from '../impact-model.js';
import {ConflictDialog, FrontMatterEditor, bodyWithoutTitle, linkPage, useMedia} from './DocumentPageParts.jsx';
import './DocumentPage.css';

const KINDS = {requirements: ['Requirement', 'Requirements'], specifications: ['Specification', 'Specifications'], decisions: ['Decision', 'Decisions']};
const BRANCH = {added: ['new', 'New', 'not on main'], modified: ['changed', 'Changed', 'differs from main'], removed: ['removed', 'Removed', 'deleted on this branch']};
const RESULTS = [{value: 'passed', label: 'Passed'}, {value: 'failed', label: 'Failed'}, {value: 'incomplete', label: 'Incomplete'}];

// What the source is: an artifact document, an overview, a change record, a
// version record or a unit brief. Each has its own scope and labels.
function describeSource(snapshot, worktree, page) {
  const source = page.source;
  const unitMatch = source.match(/^docs\/artifacts\/units-of-work\/([^/]+)\/README\.md$/);
  if (unitMatch || page.scope?.unit) {
    const id = page.scope?.unit || unitMatch[1], unit = (worktree?.unitsOfWork || []).find(u => u.id === id);
    return {type: 'unit', scope: {unit: id}, unit, kind: 'Unit brief', fallback: unit?.title || id};
  }
  const artifactId = page.scope?.artifact || page.artifact || source.match(/^docs\/artifacts\/([^/]+)\//)?.[1];
  const artifact = snapshot.artifacts.find(a => a.id === artifactId);
  const rest = source.slice(`docs/artifacts/${artifactId}/`.length);
  const changeMatch = rest.match(/^changes\/([^/]+)\/README\.md$/);
  if (changeMatch || page.scope?.change && rest.startsWith('changes/')) {
    const name = page.scope?.change || changeMatch[1], change = artifact?.changes.find(c => c.name === name);
    return {type: 'change', scope: {artifact: artifactId, change: name}, artifact, change, kind: 'Change record', fallback: change ? changeTitle(change) : name};
  }
  if (rest === 'README.md') return {type: 'overview', scope: {artifact: artifactId}, artifact, kind: 'Overview', fallback: artifact?.title || artifactId};
  const version = rest.match(/^versions\/([^/]+)\/README\.md$/);
  if (version) return {type: 'version', scope: {artifact: artifactId}, artifact, kind: 'Version record', fallback: `Version ${version[1]}`};
  const wanted = page.scope?.change ? `change:${page.scope.change}` : artifact?.layout === 'in-place' ? 'working' : null;
  const matches = (artifact?.elements || []).filter(e => e.file === source);
  const element = matches.find(e => e.source === wanted) || (page.scope?.change ? null : matches.find(e => !e.source.startsWith('change:'))) || null;
  const removed = !element && (artifact?.removedKnowledge || []).includes(source);
  const folder = rest.split('/')[0], flow = element && isFlow(element);
  const [kind, plural] = flow ? ['Flow', 'Flows'] : KINDS[folder] || ['Document', null];
  return {type: 'element', scope: page.scope?.change ? {artifact: artifactId, change: page.scope.change} : {artifact: artifactId}, artifact, element, removed, kind, plural, section: flow ? 'flows' : folder,
    fallback: element?.title || source.split('/').at(-1).replace(/\.md$/, '')};
}

// The document page: the text in the document style, its properties beside
// it, and an in-place editor. Every write is an operation of the knowledge service.
export default function DocumentPage({page}) {
  const {snapshot, worktree, go} = useShell(), edit = useEdit();
  const info = useMemo(() => describeSource(snapshot, worktree, page), [snapshot, worktree, page]);
  const {artifact, element} = info;
  const established = Boolean(page.established || info.removed);
  const working = useDocument(established ? null : page.source, info.scope);
  const old = useQuery(established ? {section: 'markdown', source: page.source, artifact: info.scope.artifact, revision: 'established'} : null);
  const doc = established ? {...old, markdown: old.data?.markdown ?? '', ready: old.status === 'loaded' || Boolean(old.data)} : working;
  const narrow = useMedia('(max-width: 1100px)');
  const targets = useMemo(() => knowledgeTargets(snapshot, info.unit ? {unit: info.unit} : null), [snapshot, info.unit]);
  const writable = edit.editable && !established && !page.source.includes('/versions/') && (info.type === 'unit' || artifact?.layout === 'in-place');

  // The loaded bytes and their digest are the base of a save.
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (!doc.ready || doc.partial || established) return;
    let live = true;
    sha256(doc.markdown).then(digest => {if (live) setLoaded(current => current?.digest === digest ? current : {markdown: doc.markdown, digest});});
    return () => {live = false;};
  }, [doc.markdown, doc.ready, doc.partial, established]);

  const [mode, setMode] = useState(page.edit ? 'edit' : 'view'), [tab, setTab] = useState('write'), [base, setBase] = useState(null), [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [conflict, setConflict] = useState(null), [compare, setCompare] = useState(false);
  const editButton = useRef(null), editor = useRef(null);
  // Entering edit mode takes the loaded bytes; a refresh later never replaces the editor text.
  useEffect(() => {if (mode === 'edit' && !base && loaded) {setBase(loaded);setDraft(splitFront(loaded.markdown).body);}}, [mode, base, loaded]);
  useEffect(() => {if (mode === 'edit' && base && tab === 'write') editor.current?.focus();}, [mode, Boolean(base), tab]);
  const dirty = mode === 'edit' && Boolean(base) && draft !== splitFront(base.markdown).body;
  const changedOnDisk = mode === 'edit' && base && loaded && loaded.digest !== base.digest;
  useEffect(() => {edit.setUnsaved(page.source, dirty);}, [dirty, page.source]);
  useEffect(() => () => edit.setUnsaved(page.source, false), [page.source]);

  const leaveEditor = () => {setMode('view');setBase(null);setError(null);setConflict(null);setTab('write');requestAnimationFrame(() => editButton.current?.focus());};
  async function save(digest = base?.digest) {
    if (!base || busy) return;
    setBusy(true);setError(null);
    try {await edit.run('document.save', {path: page.source, body: draft}, {expected: {[page.source]: digest}});edit.setUnsaved(page.source, false);leaveEditor();}
    catch (failure) {if (failure.code === 'digest-mismatch' && failure.current?.[page.source] !== undefined) setConflict({current: failure.current[page.source]});else setError(failure);}
    finally {setBusy(false);}
  }
  const cancel = () => {if (dirty && !window.confirm('Discard unsaved changes?')) return;edit.setUnsaved(page.source, false);leaveEditor();};
  async function reload(text) {setBase({markdown: text, digest: await sha256(text)});setDraft(splitFront(text).body);setConflict(null);}
  const overwrite = async text => save(await sha256(text));

  const title = info.element?.title || (doc.ready && headingTitle(doc.markdown)) || info.fallback;
  const eyebrow = <Eyebrow info={info} snapshot={snapshot} go={go}/>;
  const values = useMemo(() => frontValue(loaded?.markdown ?? doc.markdown), [loaded, doc.markdown]);
  const body = useMemo(() => bodyWithoutTitle(doc.markdown), [doc.markdown]);
  const navigate = link => go(linkPage(link, info.scope.artifact));
  const properties = <DocumentProperties heading={!narrow} info={info} page={page} values={values} loaded={loaded} writable={writable} established={established}
    snapshot={snapshot} worktree={worktree} go={go} edit={edit} compare={compare} onCompare={() => setCompare(value => !value)}/>;

  return <section className={`page document-page ${narrow ? 'narrow' : ''}`} aria-label="Document page"><div className="column document-columns">
    <article className="document-main">
      <PageHeader eyebrow={eyebrow} title={title}
        action={mode === 'view' && writable ? <button ref={editButton} disabled={!loaded} onClick={() => setMode('edit')}>Edit</button> : null}/>
      {narrow && <details className="properties-disclosure"><summary>Properties</summary>{properties}</details>}
      {established && <p className="notice" role="status">{info.removed ? 'This document is removed on this branch. The text below is the version on main.' : 'The text below is the version on main.'}</p>}
      {compare && mode === 'view' && <Comparison info={info} source={page.source} after={doc.markdown}/>}
      {mode === 'edit' ? <section className="document-editor" aria-label="Document editor"
        onKeyDown={event => {if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {event.preventDefault();save();}}}>
        {!base ? <p className="muted" role="status">Reading the text…</p> : <>
          {changedOnDisk && !conflict && <div className="notice warning" role="status">
            <span>The file changed on disk.</span>
            <span className="form-actions"><button onClick={() => reload(loaded.markdown)}>Reload</button><button onClick={() => save(loaded.digest)}>Overwrite</button></span>
          </div>}
          <div className="editor-toolbar">
            <div className="segmented" role="tablist" aria-label="Editor view">
              <button role="tab" aria-selected={tab === 'write'} aria-pressed={tab === 'write'} onClick={() => setTab('write')}>Write</button>
              <button role="tab" aria-selected={tab === 'preview'} aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
            </div>
            <span className="tiny editor-state" role="status" aria-label="Editor state">{dirty ? 'Unsaved changes · Ctrl+S saves' : 'No changes'}</span>
            <span className="form-actions"><button className="primary" disabled={busy} aria-busy={busy} onClick={() => save()}>Save</button><button onClick={cancel}>Cancel</button></span>
          </div>
          <OperationError error={error}/>
          {tab === 'preview' ? <div className="prose editor-preview"><Markdown text={draft} source={page.source} targets={targets} onNavigate={() => {}}/></div>
            : <textarea ref={editor} className="code-editor document-text" aria-label="Document text" value={draft} spellCheck onChange={e => setDraft(e.target.value)}/>}
          {conflict && <ConflictDialog current={conflict.current} draft={draft} busy={busy} onReload={() => reload(conflict.current)} onOverwrite={() => overwrite(conflict.current)} onClose={() => setConflict(null)}/>}
        </>}
      </section> : <div className="document-reader prose">
        {doc.error && !doc.ready ? <p role="alert">{doc.error} <button className="link" onClick={doc.retry}>Retry</button></p>
          : !doc.ready ? <p className="muted" role="status">Reading the text…</p>
          : <>
            {doc.partial && <p className="muted" role="status">This is a partial excerpt of the source.</p>}
            {body.trim() ? <Markdown text={body} source={page.source} targets={targets} onNavigate={navigate}/> : <p className="muted">This document has no text yet.</p>}
          </>}
      </div>}
    </article>
    {!narrow && <aside className="document-side">{properties}</aside>}
  </div></section>;
}

function Eyebrow({info, snapshot, go}) {
  const artifactLink = info.artifact && <button className="link" onClick={() => go({kind: 'artifact', artifact: info.artifact.id})}>{info.artifact.title}</button>;
  if (info.type === 'unit') return <>{info.unit ? <button className="link" onClick={() => go({kind: 'unit', unit: info.unit.id})}>Unit of work</button> : 'Unit of work'} / Brief</>;
  if (info.type === 'change') return <>{artifactLink} / {info.change ? <button className="link" onClick={() => go({kind: 'change', artifact: info.artifact.id, change: info.change.name})}>{changeTitle(info.change)}</button> : info.scope.change}</>;
  if (info.type === 'version') return <>{artifactLink} / Versions</>;
  if (info.type === 'overview') return <>{artifactLink} / Overview</>;
  return <>{artifactLink || artifactTitle(snapshot, info.scope.artifact)} / {info.plural || info.kind}</>;
}

function Comparison({info, source, after}) {
  const added = info.element?.state === 'added';
  const main = useQuery(added ? null : {section: 'markdown', source, artifact: info.scope.artifact, revision: 'established'});
  return <section className="comparison" aria-label="Comparison with main">
    <h2 className="section-title">Compared with main</h2>
    {added ? <ReviewDiff before="" after={after} complete/> : main.error && !main.data ? <p role="alert">{main.error}</p>
      : !main.data ? <p className="muted" role="status">Reading the text on main…</p> : <ReviewDiff before={main.data.markdown} after={after} complete/>}
  </section>;
}

// Kind, branch state, self-check, references, use, file, front matter and delete.
function DocumentProperties({heading, info, page, values, loaded, writable, established, snapshot, worktree, go, edit, compare, onCompare}) {
  const {element, artifact} = info, isDocument = info.type === 'element' && Boolean(element) && !established;
  const canReference = writable && isDocument && artifact?.layout === 'in-place' && element.source === 'working' && !isFlow(element);
  const selfCheck = values.self_check && typeof values.self_check === 'object' ? values.self_check : null;
  const refs = element ? snapshot.references.filter(r => r.consumer === element.id) : [];
  const state = established ? 'removed' : element?.state;
  const run = (operation, input) => edit.run(operation, input);
  return <section className="document-properties" aria-label="Properties">
    {heading && <h2 className="properties-title">Properties</h2>}
    <Prop label="Kind">{info.kind}</Prop>
    {info.type === 'element' && <Prop label="In this branch">
      {BRANCH[state] ? <><Badge tone={BRANCH[state][0]}>{BRANCH[state][1]}</Badge> <span className="muted small">{BRANCH[state][2]}</span></>
        : state === 'unchanged' ? 'Same as main' : <span className="muted small">Not compared: no main branch is readable.</span>}
      {['added', 'modified'].includes(state) && <div><button className="link small" aria-expanded={compare} onClick={onCompare}>{compare ? 'Hide comparison' : 'Compare with main'}</button></div>}
    </Prop>}
    {(isDocument || selfCheck) && <SelfCheck selfCheck={selfCheck} source={page.source} writable={writable && !established} edit={edit} go={go} artifact={info.scope.artifact}/>}
    {isDocument && (canReference || refs.length > 0) && <References refs={refs} canEdit={canReference} source={page.source} snapshot={snapshot} go={go} run={run}/>}
    {isDocument && <UsedBy element={element} source={page.source} snapshot={snapshot} worktree={worktree} go={go}/>}
    <Prop label="File"><span className="mono file-path">{page.source.split('/').map((part, i) => <React.Fragment key={i}>{i > 0 && <>/<wbr/></>}{part}</React.Fragment>)}</span></Prop>
    {writable && loaded && <div className="prop">
      <details className="front-matter"><summary>Edit front matter</summary>
        <FrontMatterEditor key={loaded.digest} text={splitFront(loaded.markdown).front ?? ''}
          onSave={text => edit.run('document.properties.set', {path: page.source, frontMatter: text}, {expected: {[page.source]: loaded.digest}})}/>
      </details>
    </div>}
    {writable && isDocument && artifact?.layout === 'in-place' && <DeleteDocument element={element} source={page.source} edit={edit} go={go} artifact={artifact} section={info.section}/>}
  </section>;
}

const Prop = ({label, children, group}) => <div className="prop" {...(group ? {role: 'group', 'aria-label': label} : {})}>
  <div className="prop-key">{label}</div><div className="prop-value">{children}</div>
</div>;

function SelfCheck({selfCheck, source, writable, edit, go, artifact}) {
  const [recording, setRecording] = useState(false), opener = useRef(null);
  const result = selfCheck?.result, tone = result === 'passed' ? 'passed' : result === 'failed' ? 'failed' : 'incomplete';
  const [path, fragment] = String(selfCheck?.source || '').split('#');
  const openSection = () => {
    if (path && path !== source) {go({kind: 'document', artifact: path.match(/^docs\/artifacts\/([^/]+)\//)?.[1] || artifact, source: path});return;}
    document.getElementById(`knowledge-heading-${fragment}`)?.scrollIntoView({block: 'start', behavior: 'smooth'});
  };
  return <Prop label="Self-check">
    {selfCheck ? <Badge tone={tone}>{result ? result[0].toUpperCase() + result.slice(1) : 'Invalid'}</Badge> : <span>Not recorded</span>}
    {selfCheck?.source && <div><button className="link small" onClick={openSection}>Read the self-check</button></div>}
    {writable && !recording && <div><button ref={opener} className="link small" onClick={() => setRecording(true)}>Record self-check</button></div>}
    {recording && <ActionForm open submitLabel="Record" title="Record self-check" onClose={() => {setRecording(false);requestAnimationFrame(() => opener.current?.focus());}} fields={[
      {name: 'result', label: 'Result', type: 'select', options: RESULTS, value: 'passed'},
      {name: 'detail', label: 'Detail', type: 'textarea', rows: 3, required: true, value: 'The content is complete and agrees with its governing knowledge.'},
    ]} onSubmit={v => edit.run('selfcheck.record', {path: source, result: v.result, detail: v.detail})}/>}
  </Prop>;
}

// Target documents: the current knowledge of an artifact, by title.
function documentOptions(snapshot, artifactId) {
  const artifact = snapshot.artifacts.find(a => a.id === artifactId);
  const source = artifact?.layout === 'in-place' ? 'working' : artifact?.currentVersion ? `version:${artifact.currentVersion}` : null;
  return (artifact?.elements || []).filter(e => e.source === source).map(e => ({value: e.path, label: e.title || e.path})).sort((a, b) => a.label.localeCompare(b.label));
}
function referenceFields(snapshot, {artifact, requires} = {}) {
  const first = artifact || snapshot.artifacts[0]?.id || '';
  return [
    {name: 'artifact', label: 'Target artifact', type: 'select', options: snapshot.artifacts.map(a => ({value: a.id, label: a.title})), value: first,
      onChange: (value, set) => set('element', documentOptions(snapshot, value)[0]?.value || '')},
    {name: 'element', label: 'Target document', type: 'select', options: values => documentOptions(snapshot, values.artifact), value: documentOptions(snapshot, first)[0]?.value || ''},
    {name: 'requires', label: 'Reason', value: requires || '', required: true, placeholder: 'What this document needs from the target'},
  ];
}
function References({refs, canEdit, source, snapshot, go, run}) {
  const [form, setForm] = useState(null), addButton = useRef(null);
  const target = r => snapshot.artifacts.find(a => a.id === r.artifact)?.elements.find(e => e.id === r.targetId);
  const label = r => target(r)?.title || `${artifactTitle(snapshot, r.artifact)} / ${r.element}`;
  const close = () => {setForm(null);requestAnimationFrame(() => addButton.current?.focus());};
  // Add first: a failed add keeps the old reference.
  const replace = async (r, input) => {await run('reference.add', {path: source, ...input});await run('reference.remove', {path: source, artifact: r.artifact, element: r.element});};
  return <Prop label="References" group>
    {refs.length ? <ul className="reference-list">{refs.map(r => {
      const element = target(r);
      return <li key={r.id}>
        {element && r.resolved ? <button className="link" onClick={() => go({kind: 'document', artifact: element.artifact, source: element.file})}>{label(r)}</button> : <span className="reference-target">{label(r)}</span>}
        {r.reason && <span className="reference-reason">{r.reason}</span>}
        {!r.resolved && <span className="reference-state"><Badge tone="failed">Unresolved</Badge>{r.diagnostic && <span className="tiny"> {r.diagnostic}</span>}</span>}
        {canEdit && form !== r.id && <span className="reference-actions">
          {!r.resolved && <button className="link small" aria-label={`Fix reference to ${label(r)}`} onClick={() => setForm(r.id)}>Fix</button>}
          <RemoveReference label={`Remove reference to ${label(r)}`} onRemove={() => run('reference.remove', {path: source, artifact: r.artifact, element: r.element})}/>
        </span>}
        {form === r.id && <ActionForm open submitLabel="Replace reference" onClose={() => setForm(null)} onSubmit={v => replace(r, v)}
          fields={referenceFields(snapshot, {artifact: snapshot.artifacts.some(a => a.id === r.artifact) ? r.artifact : undefined, requires: r.reason})}/>}
      </li>;
    })}</ul> : <span className="muted small">None</span>}
    {canEdit && form !== 'add' && <div><button ref={addButton} className="link small" onClick={() => setForm('add')}>+ Add reference</button></div>}
    {form === 'add' && <ActionForm open submitLabel="Add reference" onClose={close} fields={referenceFields(snapshot)} onSubmit={v => run('reference.add', {path: source, ...v})}/>}
  </Prop>;
}
function RemoveReference({label, onRemove}) {
  const [error, setError] = useState(null), [busy, setBusy] = useState(false);
  return <><button className="link small danger-link" aria-label={label} disabled={busy} onClick={async () => {setBusy(true);setError(null);try {await onRemove();} catch (failure) {setError(failure);setBusy(false);}}}>Remove</button><OperationError error={error}/></>;
}

// Changes, units and documents that name this document.
function UsedBy({element, source, snapshot, worktree, go}) {
  const items = [], seen = new Set();
  const add = (key, label, page, kind) => {if (!seen.has(key)) {seen.add(key);items.push({key, label, page, kind});}};
  for (const c of worktree?.changes || []) {
    const named = (c.steps || []).some(s => (s.evidence || []).some(e => e.file === source || String(e.source || '').split('#')[0] === source));
    const changing = !c.history && !c.version && c.artifact === element.artifact && ['added', 'modified'].includes(element.state);
    if (!named && !changing) continue;
    add(`c:${c.artifact}/${c.name}`, changeTitle(c), {kind: 'change', artifact: c.artifact, change: c.name}, 'Change');
    const unit = memberUnit(worktree, c.artifact, c.name);
    if (unit) add(`u:${unit.id}`, unit.title, {kind: 'unit', unit: unit.id}, 'Unit of work');
  }
  const elements = new Map(snapshot.artifacts.flatMap(a => a.elements.map(e => [e.id, e])));
  for (const r of snapshot.references.filter(r => r.targetId === element.id)) {
    const consumer = elements.get(r.consumer);
    if (!consumer) continue;
    const flow = isFlow(consumer) && `${consumer.artifact}:${consumer.path.split('/').at(-1).replace(/\.md$/, '')}`;
    add(`e:${consumer.id}`, consumer.title, flow ? {kind: 'flow', artifact: consumer.artifact, flow} : {kind: 'document', artifact: consumer.artifact, source: consumer.file}, flow ? 'Flow' : 'Document');
  }
  return <Prop label="Used by">
    {items.length ? <ul className="used-by">{items.map(i => <li key={i.key}><span className="used-kind">{i.kind}</span><button className="link" aria-label={`${i.label} (${i.kind.toLowerCase()})`} onClick={() => go(i.page)}>{i.label}</button></li>)}</ul> : <span className="muted small">Nothing names this document.</span>}
    <div><button className="link small" onClick={() => go(impactPage({origins: [{path: source}], title: element.title}))}>Where is this used?</button></div>
  </Prop>;
}

function DeleteDocument({element, source, edit, go, artifact, section}) {
  const [confirming, setConfirming] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(null), opener = useRef(null);
  async function remove() {
    setBusy(true);setError(null);
    try {await edit.run('document.delete', {path: source});go({kind: 'artifact', artifact: artifact.id, ...(section ? {section} : {})});}
    catch (failure) {setError(failure);setBusy(false);}
  }
  return <div className="prop">
    {!confirming ? <button ref={opener} className="danger delete-document" onClick={() => setConfirming(true)}>Delete document</button>
      : <div className="inline-form delete-confirm" role="group" aria-label="Delete document">
        <p>Delete “{element.title}”? The file is removed from this branch.</p>
        <OperationError error={error}/>
        <div className="form-actions"><button className="primary danger-primary" disabled={busy} aria-busy={busy} onClick={remove}>Delete</button>
          <button onClick={() => {setConfirming(false);requestAnimationFrame(() => opener.current?.focus());}}>Cancel</button></div>
      </div>}
  </div>;
}
