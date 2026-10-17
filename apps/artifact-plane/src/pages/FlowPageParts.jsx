// Parts of the flow page: the flow detail read, the support picker, the
// in-place text editor and the front matter editor.
import React, {useEffect, useId, useState} from 'react';
import {Handles} from '../GraphPanel.jsx';
import {postJSON} from '../request.js';
import {gitAction} from '../knowledge-api.js';
import {OperationError, lines} from '../editing.jsx';
import {artifactDocuments} from '../work-model.js';

// The flow detail of the working branch: graph, models and resolved supports.
export function useFlowDetail({root, worktreePath, epoch, flow}) {
  const [state, setState] = useState({status: 'idle', data: null, error: null});
  useEffect(() => {
    if (!root || !flow) return;
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading'}));
    postJSON('/api/flows/query', {path: root, ...(worktreePath ? {worktree: worktreePath} : {}), knowledge: 'planning', operation: 'detail', flow}, controller.signal)
      .then(result => {if (!controller.signal.aborted) setState({status: 'loaded', data: result.data, error: null});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, worktreePath, epoch, flow]);
  return state;
}

// Tracked files of the worktree, for the code and test file field.
export function useTrackedFiles({root, worktreePath, enabled}) {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    if (!enabled || !root) return;
    const controller = new AbortController();
    gitAction({path: root, worktree: worktreePath, operation: 'files'}, controller.signal).then(r => setFiles(r.files || [])).catch(() => setFiles([]));
    return () => controller.abort();
  }, [enabled, root, worktreePath]);
  return files;
}

export const SUPPORT_GROUPS = [['knowledge', 'Knowledge'], ['code', 'Code'], ['tests', 'Tests']];
export const supportGroup = s => s?.kind === 'implementation' ? 'code' : s?.kind === 'test' ? 'tests' : 'knowledge';
const BASES = [{value: 'documented', label: 'Documented'}, {value: 'static', label: 'Static (code reading)'}, {value: 'observed', label: 'Observed (recorded run)'}, {value: 'inferred', label: 'Inferred'}];
const KINDS = [{value: 'element', label: 'Knowledge document'}, {value: 'flow', label: 'Another flow'}, {value: 'implementation', label: 'Code file'}, {value: 'test', label: 'Test file'}];

// The title of a support target, for knowledge and flows; the path for files.
export function supportTarget(snapshot, s) {
  if (s.kind === 'element') {
    const artifact = snapshot.artifacts.find(a => a.id === s.artifact);
    const doc = artifact && artifactDocuments(artifact).groups.flatMap(g => g.documents).find(d => d.path === s.element);
    return {title: doc?.title || s.element, page: doc && !doc.removed ? {kind: 'document', artifact: s.artifact, source: doc.file} : null};
  }
  if (s.kind === 'flow') {
    const artifact = snapshot.artifacts.find(a => a.id === s.artifact);
    const flow = artifact && artifactDocuments(artifact).flows.find(f => f.flow === `${s.artifact}:${s.flow}`);
    return {title: flow?.title || s.flow, page: flow ? {kind: 'flow', artifact: s.artifact, flow: flow.flow} : null};
  }
  return {path: `${s.path}${s.symbol ? ` · ${s.symbol}` : ''}`};
}

// Fields of "Add support": a new target, or a support that the flow already has.
export function supportFields({snapshot, owner, existing, tracked, self}) {
  const artifacts = snapshot.artifacts.map(a => ({value: a.id, label: a.title}));
  const documents = id => {const a = snapshot.artifacts.find(x => x.id === id);return a ? artifactDocuments(a).groups.flatMap(g => g.documents.filter(d => !d.removed).map(d => ({value: d.path, label: `${d.title} · ${g.singular}`}))) : [];};
  const flows = id => {const a = snapshot.artifacts.find(x => x.id === id);return a ? artifactDocuments(a).flows.filter(f => f.flow !== self && !f.removed).map(f => ({value: f.flow.split(':')[1], label: f.title})) : [];};
  const kinds = existing.length ? [...KINDS, {value: 'existing', label: 'A support of this flow'}] : KINDS;
  const knowledge = v => ['element', 'flow'].includes(v.kind), file = v => ['implementation', 'test'].includes(v.kind);
  return [
    {name: 'kind', label: 'Support', type: 'select', options: kinds, value: 'element'},
    {name: 'existing', label: 'Support of this flow', type: 'select', options: existing, value: existing[0]?.value || '', hidden: v => v.kind !== 'existing'},
    {name: 'artifact', label: 'Artifact', type: 'select', options: artifacts, value: owner, hidden: v => !knowledge(v), onChange: (value, set) => {set('element', documents(value)[0]?.value || '');set('flow', flows(value)[0]?.value || '');}},
    {name: 'element', label: 'Document', type: 'select', options: v => documents(v.artifact || owner), value: documents(owner)[0]?.value || '', hidden: v => v.kind !== 'element'},
    {name: 'flow', label: 'Flow', type: 'select', options: v => flows(v.artifact || owner), value: flows(owner)[0]?.value || '', hidden: v => v.kind !== 'flow'},
    {name: 'path', label: 'File in the repository', placeholder: 'Start to type a file name', spellCheck: false, suggestions: tracked, hidden: v => !file(v)},
    {name: 'requires', label: 'What the step needs from it', type: 'textarea', rows: 2, hidden: v => v.kind === 'existing'},
    {name: 'basis', label: 'Basis', type: 'select', options: BASES, value: 'documented', hidden: v => v.kind === 'existing'},
    {name: 'evidence', label: 'Evidence files, one per line', type: 'lines', rows: 2, placeholder: 'The test file is used when this is empty', hidden: v => v.basis !== 'observed' || v.kind === 'existing'},
  ];
}
// The operation and input of "Add support" for one step.
export function supportOperation(values, step) {
  if (values.kind === 'existing') return ['flow.step.update', {step: step.id, supports: [...(step.supports || []), values.existing]}];
  const target = values.kind === 'element' ? {artifact: values.artifact, element: values.element} : values.kind === 'flow' ? {artifact: values.artifact, flow: values.flow} : {path: (values.path || '').trim()};
  const evidence = lines(values.evidence);
  if (values.basis === 'observed' && !evidence.length && target.path) evidence.push(target.path);
  if (!String(values.requires || '').trim()) throw Error('Say what the step needs from this support.');
  return ['flow.support.add', {kind: values.kind, target, requires: values.requires, basis: values.basis, steps: [step.id], ...(values.basis === 'observed' ? {evidence} : {})}];
}

// A box or text that edits in place: Save and Cancel, Escape cancels.
export function TextEditor({label, value, rows = 3, onSave, onClose, hint}) {
  const id = useId(), [text, setText] = useState(value), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();if (busy) return;
    setBusy(true);setError(null);
    try {await onSave(text);onClose();} catch (failure) {setError(failure);} finally {setBusy(false);}
  }
  return <form className="text-edit" onSubmit={submit} onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation();onClose();}}}>
    <label htmlFor={id}>{label}</label>
    <textarea id={id} value={text} rows={rows} autoFocus onChange={e => setText(e.target.value)}/>
    {hint && <small className="tiny">{hint}</small>}
    <OperationError error={error}/>
    <div className="form-actions"><button className="primary" disabled={busy} aria-busy={busy}>Save</button><button type="button" onClick={onClose}>Cancel</button></div>
  </form>;
}

// The front matter of the flow document as YAML text.
export function FrontMatterEditor({text, onSave}) {
  const [value, setValue] = useState(text), [busy, setBusy] = useState(false), [error, setError] = useState(null), id = useId();
  return <div className="front-editor">
    <label htmlFor={id}>Front matter</label>
    <textarea id={id} className="mono" value={value} rows={14} spellCheck={false} onChange={e => setValue(e.target.value)}/>
    <OperationError error={error}/>
    <div className="form-actions"><button disabled={busy} onClick={async () => {setBusy(true);setError(null);try {await onSave(value);} catch (failure) {setError(failure);} finally {setBusy(false);}}}>Save front matter</button></div>
  </div>;
}

// A light step node of the diagram.
function StepNode({data}) {
  return <div className="graph-node step-node"><Handles/><small>{data.number ? `Step ${data.number}` : data.kind}</small><strong title={data.title}>{data.title}</strong></div>;
}
export const flowNodeTypes = {flow: StepNode};
