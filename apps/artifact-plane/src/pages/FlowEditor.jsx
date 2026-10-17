import React, {useEffect, useState} from 'react';
import {repositoryQuery} from '../reload.js';
import {sha256} from '../knowledge-api.js';
import {ActionForm, useEdit, frontValue, splitFront, lines} from '../editing.jsx';
import {RemoveButton, FrontMatterEditor, documentOptions} from './DocumentPage.jsx';
import {artifactDocuments} from '../work-model.js';

const KINDS = [{value: 'element', label: 'Knowledge document'}, {value: 'flow', label: 'Another flow'}, {value: 'implementation', label: 'Implementation file'}, {value: 'test', label: 'Test file'}];
const BASES = [{value: 'documented', label: 'Documented'}, {value: 'static', label: 'Static (code reading)'}, {value: 'observed', label: 'Observed (recorded run)'}, {value: 'inferred', label: 'Inferred'}];
const targetLabel = s => s.kind === 'element' ? `${s.artifact}/${s.element}` : s.kind === 'flow' ? `${s.artifact}:${s.flow}` : `${s.path}${s.symbol ? ` · ${s.symbol}` : ''}`;
// Support target pickers: documents of any artifact, flows, or a tracked file path.
function targetFields(snapshot, flowOwner) {
  const artifacts = snapshot.artifacts.map(a => ({value: a.id, label: `${a.title} · ${a.id}`}));
  const flowOptions = id => artifactDocuments(snapshot.artifacts.find(a => a.id === id) || {elements: [], id}).flows.map(f => ({value: f.flow.split(':')[1], label: f.flow}));
  const isKnowledge = v => ['element', 'flow'].includes(v.kind);
  return [
    {name: 'kind', label: 'Support kind', type: 'select', options: KINDS, value: 'element'},
    {name: 'artifact', label: 'Target artifact', type: 'select', options: artifacts, value: flowOwner, hidden: v => !isKnowledge(v), onChange: (value, set) => {set('element', documentOptions(snapshot, value)[0]?.value || '');set('flow', flowOptions(value)[0]?.value || '');}},
    {name: 'element', label: 'Target document', type: 'select', options: v => documentOptions(snapshot, v.artifact || flowOwner), value: documentOptions(snapshot, flowOwner)[0]?.value || '', hidden: v => v.kind !== 'element'},
    {name: 'flow', label: 'Target flow', type: 'select', options: v => flowOptions(v.artifact || flowOwner), value: flowOptions(flowOwner)[0]?.value || '', hidden: v => v.kind !== 'flow'},
    {name: 'path', label: 'Tracked file path', placeholder: 'src/module.js', spellCheck: false, hidden: v => isKnowledge(v)},
  ];
}
const targetInput = v => v.kind === 'element' ? {artifact: v.artifact, element: v.element} : v.kind === 'flow' ? {artifact: v.artifact, flow: v.flow} : {path: v.path.trim()};

// Structured flow editing: each control is one flow operation on the flow
// document; participants, interactions and models stay as written.
export default function FlowEditor({selected, snapshot, root, worktree, epoch}) {
  const edit = useEdit(), [loaded, setLoaded] = useState(null), [error, setError] = useState('');
  const artifact = snapshot.artifacts.find(a => a.id === selected?.artifact);
  const editable = edit.editable && artifact?.layout === 'in-place' && selected?.source === 'working' && selected?.file;
  useEffect(() => {
    if (!editable) {setLoaded(null);return;}
    const controller = new AbortController();
    repositoryQuery({path: root, worktree, section: 'markdown', artifact: artifact.id, source: selected.file}, controller.signal)
      .then(async r => {setLoaded({markdown: r.data.markdown, digest: await sha256(r.data.markdown)});setError('');})
      .catch(failure => {if (failure.name !== 'AbortError') setError(failure.message);});
    return () => controller.abort();
  }, [editable, selected?.file, epoch, root, worktree]);
  if (!editable) return null;
  if (error) return <p role="alert">{error}</p>;
  if (!loaded) return <p role="status" className="muted">Loading the flow for editing…</p>;
  const value = frontValue(loaded.markdown), flow = value.flow;
  if (!flow || typeof flow !== 'object') return <section className="flow-editor" aria-label="Flow editing"><p className="notice">The flow front matter is not a flow object. Use the advanced front-matter editor.</p><FrontMatterEditor text={splitFront(loaded.markdown).front ?? ''} onSave={text => edit.run('document.properties.set', {path: selected.file, frontMatter: text}, {expected: {[selected.file]: loaded.digest}})}/></section>;
  const base = {artifact: artifact.id, flow: flow.id}, run = (operation, input, options) => edit.run(operation, {...base, ...input}, options);
  const steps = Array.isArray(flow.steps) ? flow.steps : [], support = Array.isArray(flow.support) ? flow.support : [], transitions = Array.isArray(flow.transitions) ? flow.transitions : [];
  const stepOptions = steps.map(s => ({value: s.id, label: s.title || s.id})), supportOptions = support.map(s => ({value: s.id, label: `${s.id} · ${targetLabel(s)}`}));
  const title = id => steps.find(s => s.id === id)?.title || id;
  return <section className="flow-editor" aria-label="Flow editing">
    <header className="flow-editor-head">
      <h2>{flow.title}</h2>
      <p><strong>Trigger:</strong> {flow.trigger}</p><p><strong>Outcome:</strong> {flow.outcome}</p>
      <ActionForm label="Edit title, trigger and outcome" submitLabel="Save flow header" fields={[
        {name: 'title', label: 'Title', required: true, value: flow.title || ''},
        {name: 'trigger', label: 'Trigger', type: 'textarea', rows: 2, required: true, value: flow.trigger || ''},
        {name: 'outcome', label: 'Outcome', type: 'textarea', rows: 2, required: true, value: flow.outcome || ''},
      ]} onSubmit={v => run('flow.meta.set', v)}/>
    </header>
    <section aria-label="Steps"><h3>Steps</h3>
      <ol className="step-list">{steps.map((s, i) => <li key={s.id} aria-label={`Step ${s.title}`}>
        <div className="step-head"><strong>{s.title}</strong> <small>{s.id}{(flow.entry_steps || []).includes(s.id) ? ' · entry' : ''}</small></div>
        <div className="chips" aria-label={`Supports of ${s.title}`}>{(s.supports || []).length ? s.supports.map(id => <span key={id} className="chip">{id}</span>) : <span className="muted">No support</span>}</div>
        <div className="chips" aria-label={`Next steps of ${s.title}`}>{transitions.filter(t => t.from === s.id).map(t => <span key={t.to} className="chip">Next: {title(t.to)}{t.condition ? ` (${t.condition})` : ''}
          <button aria-label={`Remove transition from ${s.title} to ${title(t.to)}`} onClick={() => run('flow.transition.remove', {from: t.from, to: t.to})}>×</button></span>)}</div>
        <div className="row-actions">
          <ActionForm label={`Edit step ${s.title}`} submitLabel="Save step" fields={[{name: 'title', label: 'Title', required: true, value: s.title}, {name: 'supports', label: 'Supports', type: 'checks', options: supportOptions, value: s.supports || [], empty: 'Add support first.'}]}
            onSubmit={v => run('flow.step.update', {step: s.id, title: v.title, supports: v.supports})}/>
          <ActionForm label={`Add next step after ${s.title}`} submitLabel="Set next step" fields={[{name: 'to', label: 'Next step', type: 'select', options: stepOptions, value: steps[i + 1]?.id || s.id}, {name: 'condition', label: 'Condition (optional)'}]}
            onSubmit={v => run('flow.transition.set', {from: s.id, to: v.to, ...(v.condition.trim() ? {condition: v.condition.trim()} : {})})}/>
          <button aria-label={`Move ${s.title} up`} disabled={i === 0} onClick={() => run('flow.step.move', {step: s.id, to: i - 1})}>Move up</button>
          <button aria-label={`Move ${s.title} down`} disabled={i === steps.length - 1} onClick={() => run('flow.step.move', {step: s.id, to: i + 1})}>Move down</button>
          {steps.length > 1 && <RemoveButton label={`Remove step ${s.title}`} onRemove={() => run('flow.step.remove', {step: s.id})}/>}
        </div>
      </li>)}</ol>
      <ActionForm label="Add step" submitLabel="Add step" fields={[
        {name: 'title', label: 'Title', required: true, placeholder: 'What happens in this step'},
        {name: 'after', label: 'After step', type: 'select', options: [...stepOptions, {value: '', label: 'No previous step'}], value: steps.at(-1)?.id || ''},
        {name: 'supports', label: 'Supports', type: 'checks', options: supportOptions, value: [], empty: 'No support yet.'},
      ]} onSubmit={v => run('flow.step.add', {title: v.title, supports: v.supports, ...(v.after ? {after: v.after, position: steps.findIndex(s => s.id === v.after) + 1} : {})})}/>
    </section>
    <section aria-label="Support"><h3>Support</h3>
      <ul className="support-list">{support.map(s => <li key={s.id}>
        <div><strong>{s.id}</strong> · {s.kind} · {targetLabel(s)} · {s.basis}</div><p>{s.requires}</p>{s.evidence?.length > 0 && <p className="tiny">Evidence: {s.evidence.join(', ')}</p>}
        <div className="row-actions">
          <ActionForm label={`Edit support ${s.id}`} submitLabel="Save support" fields={[
            {name: 'requires', label: 'Reason', type: 'textarea', rows: 2, required: true, value: s.requires || ''},
            {name: 'basis', label: 'Basis', type: 'select', options: BASES, value: s.basis || 'documented'},
            {name: 'evidence', label: 'Evidence files, one per line', type: 'lines', rows: 2, value: (s.evidence || []).join('\n'), hidden: v => v.basis !== 'observed'},
          ]} onSubmit={v => run('flow.support.update', {support: s.id, requires: v.requires, basis: v.basis, ...(v.basis === 'observed' ? {evidence: lines(v.evidence)} : {})})}/>
          <RemoveButton label={`Remove support ${s.id}`} onRemove={() => run('flow.support.remove', {support: s.id})}/>
        </div>
      </li>)}</ul>
      <ActionForm label="Add support" submitLabel="Add support" fields={[
        ...targetFields(snapshot, artifact.id),
        {name: 'requires', label: 'Reason', required: true, placeholder: 'What the step needs from the target'},
        {name: 'basis', label: 'Basis', type: 'select', options: BASES, value: 'documented'},
        {name: 'evidence', label: 'Evidence files, one per line', type: 'lines', rows: 2, hidden: v => v.basis !== 'observed'},
        {name: 'steps', label: 'Steps that use it', type: 'checks', options: stepOptions, value: steps.length === 1 ? [steps[0].id] : []},
      ]} onSubmit={v => run('flow.support.add', {kind: v.kind, target: targetInput(v), requires: v.requires, basis: v.basis, steps: v.steps, ...(v.basis === 'observed' ? {evidence: lines(v.evidence)} : {})})}/>
    </section>
    <section aria-label="Gaps and exclusions"><h3>Gaps and exclusions</h3>
      <p><strong>Gaps:</strong> {(flow.gaps || []).join(' · ') || 'None.'}</p><p><strong>Exclusions:</strong> {(flow.exclusions || []).join(' · ') || 'None.'}</p>
      <ActionForm label="Edit gaps and exclusions" submitLabel="Save gaps and exclusions" fields={[
        {name: 'gaps', label: 'Gaps, one per line', type: 'lines', rows: 3, value: (flow.gaps || []).join('\n')},
        {name: 'exclusions', label: 'Exclusions, one per line', type: 'lines', rows: 3, value: (flow.exclusions || []).join('\n')},
      ]} onSubmit={v => run('flow.meta.set', {gaps: lines(v.gaps), exclusions: lines(v.exclusions)})}/>
    </section>
    {(flow.participants?.length > 0 || steps.some(s => s.interactions?.length)) && <section aria-label="Model layer"><h3>Participants and interactions</h3>
      <ul>{(flow.participants || []).map(p => <li key={p.id}>{p.id}: {p.artifact}:{p.model} · {p.requires}</li>)}</ul>
      <ul>{steps.flatMap(s => (s.interactions || []).map((x, i) => <li key={`${s.id}-${i}`}>{s.title}: {x.from} → {x.to}: {x.action}</li>))}</ul>
      <p className="tiny">Change the model layer in the advanced front-matter editor.</p>
    </section>}
    <details className="advanced-front"><summary>Advanced front matter</summary>
      <FrontMatterEditor key={loaded.digest} text={splitFront(loaded.markdown).front ?? ''} onSave={text => edit.run('document.properties.set', {path: selected.file, frontMatter: text}, {expected: {[selected.file]: loaded.digest}})}/>
    </details>
  </section>;
}
