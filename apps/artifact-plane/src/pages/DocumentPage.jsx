import React, {useEffect, useMemo, useRef, useState} from 'react';
import {repositoryQuery} from '../reload.js';
import Reader from '../Reader.jsx';
import Markdown from '../Markdown.jsx';
import ReviewDiff from '../ReviewDiff.jsx';
import PageHeader from './PageHeader.jsx';
import {sha256} from '../knowledge-api.js';
import {ActionForm, OperationError, useEdit, splitFront, frontValue} from '../editing.jsx';
import {currentSource} from '../model.js';

const RESULTS = [{value: 'passed', label: 'Passed'}, {value: 'failed', label: 'Failed'}, {value: 'incomplete', label: 'Incomplete'}];
export const resultField = {name: 'result', label: 'Result', type: 'select', options: RESULTS, value: 'passed'};
// Documents an element reference can target: the current knowledge of an artifact.
export function documentOptions(snapshot, artifactId) {
  const artifact = snapshot.artifacts.find(a => a.id === artifactId), source = currentSource(artifact);
  return (artifact?.elements || []).filter(e => e.source === source).map(e => ({value: e.path, label: e.path}));
}
const artifactOptions = snapshot => snapshot.artifacts.map(a => ({value: a.id, label: `${a.title} · ${a.id}`}));
function referenceFields(snapshot, {artifact, element, requires} = {}) {
  const first = artifact || snapshot.artifacts[0]?.id || '';
  return [
    {name: 'artifact', label: 'Target artifact', type: 'select', options: artifactOptions(snapshot), value: first, onChange: (value, set) => set('element', documentOptions(snapshot, value)[0]?.value || '')},
    {name: 'element', label: 'Target document', type: 'select', options: values => documentOptions(snapshot, values.artifact), value: element || documentOptions(snapshot, first)[0]?.value || ''},
    {name: 'requires', label: 'Reason', value: requires || '', required: true, placeholder: 'What this document needs from the target'},
  ];
}
// A save that meets newer bytes on disk: compare both and choose.
function ConflictDialog({current, draft, onReload, onOverwrite, busy}) {
  const dialog = useRef(null);
  useEffect(() => {dialog.current?.querySelector('button')?.focus();}, []);
  const trap = event => {
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.current.querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  };
  return <section className="conflict-dialog" role="alertdialog" aria-modal="true" aria-label="Save conflict" ref={dialog} onKeyDown={trap}>
    <h2>The file changed on disk</h2>
    <p>Another edit changed this file after you opened it. Reload takes the text on disk. Overwrite saves your text over it.</p>
    <div className="form-actions"><button onClick={onReload} disabled={busy}>Reload</button><button className="primary" onClick={onOverwrite} disabled={busy}>Overwrite</button></div>
    <ReviewDiff before={splitFront(current).body} after={draft} complete/>
  </section>;
}

// The document page: one source with its state since main, properties and an
// in-place editor. Every write is an operation of the knowledge service.
export default function DocumentPage({entry, snapshot, root, worktree, epoch, project, targets, onOpen, onBack, backLabel, onReadEstablished, onFlows}) {
  const edit = useEdit(), page = useRef(null);
  useEffect(() => {(page.current?.querySelector('.back-button') || page.current?.querySelector('h1'))?.focus();}, [entry]);
  const artifact = snapshot.artifacts.find(a => a.id === (entry.artifact || entry.scope?.artifact));
  const element = artifact?.elements.find(e => e.file === entry.source && (entry.scope?.change ? e.source === `change:${entry.scope.change}` : !e.source.startsWith('change:')));
  const refs = element ? snapshot.references.filter(r => r.consumer === element.id) : [];
  const state = entry.established ? `Established text on ${String(artifact?.baseline?.ref || 'main').replace('refs/heads/', '')}` : element ? element.source === 'working' ? ({added: 'New since main', modified: 'Changed since main', unchanged: 'Unchanged since main'})[element.state] || 'State since main unknown' : element.source.replace(':', ' · ') : null;
  // Established text comes from the protected ref through the contained query route.
  const reading = useMemo(() => {
    const scope = entry.scope || (entry.artifact ? {artifact: entry.artifact} : {});
    const load = entry.load || (entry.established ? signal => repositoryQuery({path: root, worktree, section: 'markdown', artifact: scope.artifact, source: entry.source, revision: 'established'}, signal).then(r => ({markdown: r.data.markdown, source: r.data.source, partial: r.completeness === 'partial'})) : undefined);
    return {...entry, scope, load};
  }, [entry, root, worktree]);
  const writable = edit.editable && !entry.load && !entry.established && entry.source.startsWith('docs/artifacts/') && !/\/versions\//.test(entry.source) && (artifact ? artifact.layout === 'in-place' : entry.source.includes('/units-of-work/'));
  const [loaded, setLoaded] = useState(null), [mode, setMode] = useState(entry.edit ? 'edit' : 'view'), [base, setBase] = useState(null), [draft, setDraft] = useState(''), [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [conflict, setConflict] = useState(null), [compare, setCompare] = useState(null);
  useEffect(() => {setMode(entry.edit ? 'edit' : 'view');setBase(null);setConflict(null);setError(null);setCompare(null);}, [entry]);
  const onLoaded = async value => {if (value.partial) return;setLoaded({markdown: value.markdown, digest: await sha256(value.markdown)});};
  // Entering edit mode takes the loaded bytes as the base of the save.
  useEffect(() => {if (mode === 'edit' && !base && loaded) {setBase(loaded);setDraft(splitFront(loaded.markdown).body);}}, [mode, base, loaded]);
  const dirty = mode === 'edit' && base && draft !== splitFront(base.markdown).body;
  const changedOnDisk = mode === 'edit' && base && loaded && loaded.digest !== base.digest;
  useEffect(() => {edit.setUnsaved(entry.source, Boolean(dirty));return () => edit.setUnsaved(entry.source, false);}, [dirty, entry.source]);
  const values = useMemo(() => frontValue(loaded?.markdown), [loaded]);
  async function save(digest = base.digest) {
    setBusy(true);setError(null);
    try {await edit.run('document.save', {path: entry.source, body: draft}, {expected: {[entry.source]: digest}});setConflict(null);setMode('view');setBase(null);}
    catch (failure) {if (failure.code === 'digest-mismatch' && failure.current?.[entry.source] !== undefined) setConflict({current: failure.current[entry.source]});else setError(failure);}
    finally {setBusy(false);}
  }
  const discard = () => {if (dirty && !window.confirm('Discard unsaved changes?')) return;setMode('view');setBase(null);setError(null);};
  async function reload(text = conflict?.current ?? loaded?.markdown) {const next = {markdown: text, digest: await sha256(text)};setBase(next);setDraft(splitFront(text).body);setConflict(null);}
  async function overwrite() {await save(await sha256(conflict.current));}
  async function showCompare() {
    if (compare) {setCompare(null);return;}
    setCompare({loading: true});
    try {
      const established = await repositoryQuery({path: root, worktree, section: 'markdown', artifact: artifact.id, source: entry.source, revision: 'established'});
      setCompare({before: established.data.markdown, after: loaded?.markdown || ''});
    } catch (failure) {setCompare({error: failure.message});}
  }
  async function saveFront(text) {
    await edit.run('document.properties.set', {path: entry.source, frontMatter: text}, {expected: loaded ? {[entry.source]: loaded.digest} : undefined});
  }
  const replaceReference = async (ref, input) => {
    await edit.run('reference.remove', {path: entry.source, artifact: ref.artifact, element: ref.element});
    await edit.run('reference.add', {path: entry.source, ...input});
  };
  const openTarget = ref => {
    const target = snapshot.artifacts.find(a => a.id === ref.artifact)?.elements.find(e => e.id === ref.targetId);
    if (target) onOpen({kind: 'document', artifact: target.artifact, source: target.file, title: target.path, ...(target.source.startsWith('change:') ? {scope: {artifact: target.artifact, change: target.source.slice(7)}} : {})});
  };
  const selfCheck = values.self_check;
  const models = Array.isArray(values.models) ? values.models : [];
  return <section className="page document-page" aria-label="Document page" ref={page}>
    <PageHeader project={project} artifact={artifact?.id} crumb={entry.title || entry.source.split('/').at(-1)} title={entry.title || entry.source} onNavigate={onOpen} onBack={onBack} backLabel={backLabel}
      status={state}
      actions={mode === 'edit' ? null : <>
        {writable && <button className="primary" disabled={!loaded} onClick={() => setMode('edit')}>Edit</button>}
        {element?.state === 'modified' && !entry.established && <><button aria-pressed={Boolean(compare)} onClick={showCompare}>Compare with main</button><button onClick={() => onReadEstablished(element)}>Read established on {String(artifact.baseline?.ref || 'main').replace('refs/heads/', '')}</button></>}
        {element && <button onClick={() => onFlows({artifact: element.artifact, ids: [element.id]}, element.source.startsWith('change:'))}>Find participating flows</button>}
      </>}/>
    {(writable || refs.length > 0 || models.length > 0 || selfCheck) && mode === 'view' && <section className="properties-strip" aria-label="Properties">
      {(writable || selfCheck) && <div className="property"><h2>Self-check</h2>
        <p>{selfCheck ? `${selfCheck.result || 'invalid'} · ${selfCheck.source || 'no source'}` : 'Not recorded.'}</p>
        {writable && <ActionForm label="Record self-check" submitLabel="Record" fields={[resultField, {name: 'detail', label: 'Detail', type: 'textarea', rows: 3, required: true, value: 'The content is complete and agrees with its governing knowledge.'}]}
          onSubmit={v => edit.run('selfcheck.record', {path: entry.source, result: v.result, detail: v.detail})}/>}
      </div>}
      {(writable || refs.length > 0) && <div className="property" aria-label="References" role="group"><h2>References</h2>
        {refs.length ? <ul className="reference-rows">{refs.map(r => <li key={r.id} className="reference-row">
          <span className={`source-tag ${r.status === 'proposed' ? 'proposed' : ''}`}>{r.status} · {r.resolved ? 'resolved' : 'unresolved'}</span>
          <button className="reference-target" disabled={!r.resolved} onClick={() => openTarget(r)}>{r.artifact} / {r.element}</button>
          <span className="reference-reason">{r.reason}</span>
          {r.diagnostic && <span className="error-text">{r.diagnostic}</span>}
          {writable && <span className="row-actions">
            {!r.resolved && <ActionForm label="Fix" submitLabel="Replace reference" fields={referenceFields(snapshot, {requires: r.reason})} onSubmit={v => replaceReference(r, v)}/>}
            <RemoveButton label={`Remove reference to ${r.artifact} / ${r.element}`} onRemove={() => edit.run('reference.remove', {path: entry.source, artifact: r.artifact, element: r.element})}/>
          </span>}
        </li>)}</ul> : <p className="muted">No references.</p>}
        {writable && <ActionForm label="Add reference" submitLabel="Add reference" fields={referenceFields(snapshot)} onSubmit={v => edit.run('reference.add', {path: entry.source, ...v})}/>}
      </div>}
      {models.length > 0 && <div className="property"><h2>Declared models</h2><ul>{models.map(m => <li key={m.id}><strong>{m.title || m.id}</strong> {m.description}</li>)}</ul></div>}
    </section>}
    {compare && <section className="page-section" aria-label="Comparison with main">{compare.loading ? <p role="status">Loading the established text…</p> : compare.error ? <p role="alert">{compare.error}</p> : <ReviewDiff before={compare.before} after={compare.after} complete/>}</section>}
    {mode === 'edit' && <section className="document-editor" aria-label="Document editor">
      {!base ? <p role="status">Loading source…</p> : <>
        {changedOnDisk && <div className="notice" role="status">The file changed on disk. <button onClick={() => reload(loaded.markdown)}>Reload</button><button onClick={() => save(loaded.digest)}>Overwrite</button></div>}
        <div className="editor-toolbar">
          <button className="primary" disabled={busy} aria-busy={busy} onClick={() => save()}>Save</button>
          <button onClick={discard}>Discard</button>
          <button aria-pressed={preview} onClick={() => setPreview(value => !value)}>Preview</button>
          <span className="tiny">{dirty ? 'Unsaved changes · Ctrl+S saves' : 'No changes'}</span>
        </div>
        <OperationError error={error}/>
        {conflict && <ConflictDialog current={conflict.current} draft={draft} busy={busy} onReload={() => reload()} onOverwrite={overwrite}/>}
        {preview ? <div className="editor-preview"><Markdown text={draft}/></div> :
          <textarea className="text-editor" aria-label="Document text" value={draft} spellCheck onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {e.preventDefault();save();}}}/>}
      </>}
    </section>}
    <div hidden={mode === 'edit'}>
      <Reader entry={reading} root={root} worktree={worktree} epoch={epoch} targets={targets} onLoaded={onLoaded} onNavigate={({kind, fragment, ...link}) => onOpen({...link, kind: 'document', artifact: link.scope?.artifact || entry.artifact})}/>
    </div>
    {writable && mode === 'view' && loaded && <details className="advanced-front">
      <summary>Advanced front matter</summary>
      <FrontMatterEditor key={loaded.digest} text={splitFront(loaded.markdown).front ?? ''} onSave={saveFront}/>
    </details>}
  </section>;
}
export function FrontMatterEditor({text, onSave}) {
  const [value, setValue] = useState(text), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  return <div className="front-editor">
    <textarea className="text-editor" aria-label="Front matter" value={value} rows={10} spellCheck={false} onChange={e => setValue(e.target.value)}/>
    <OperationError error={error}/>
    <button disabled={busy} onClick={async () => {setBusy(true);setError(null);try {await onSave(value);} catch (failure) {setError(failure);} finally {setBusy(false);}}}>Save front matter</button>
  </div>;
}
// Removal applies directly; a failure stays next to the record.
export function RemoveButton({label, onRemove, children = 'Remove'}) {
  const [error, setError] = useState(null), [busy, setBusy] = useState(false);
  return <><button aria-label={label} disabled={busy} onClick={async () => {setBusy(true);setError(null);try {await onRemove();} catch (failure) {setError(failure);} finally {setBusy(false);}}}>{children}</button><OperationError error={error}/></>;
}
