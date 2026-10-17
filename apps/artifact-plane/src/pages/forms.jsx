import React from 'react';
import {ActionForm, useEdit, lines} from '../editing.jsx';
import {openChanges} from '../Relationships.jsx';
import {currentChanges} from '../work-model.js';

// Creation forms shared by the work, artifact and change pages. Each form
// derives every path and identifier through its operation and opens the result.
const KIND_LABEL = {requirement: 'requirement', specification: 'specification', decision: 'decision'};
export const startable = snapshot => snapshot.artifacts.filter(a => a.layout === 'in-place' && !openChanges(a).length);
export function StartChangeForm({snapshot, worktree, artifact, open, onClose, onOpen, label = 'Start a change'}) {
  const edit = useEdit(), candidates = startable(snapshot);
  const units = (worktree?.unitsOfWork || []).map(u => ({value: u.id, label: `Join ${u.title}`}));
  if (!edit.editable || (!artifact && !candidates.length)) return null;
  const fields = [
    ...(artifact ? [] : [{name: 'artifact', label: 'Artifact', type: 'select', options: candidates.map(a => ({value: a.id, label: `${a.title} · ${a.id}`})), value: candidates[0]?.id}]),
    {name: 'title', label: 'Title', required: true, placeholder: 'What this change does'},
    {name: 'reason', label: 'Reason', required: true, placeholder: 'Why the change is necessary'},
    {name: 'unit', label: 'Unit of work', type: 'select', options: [{value: 'new', label: 'New unit with the change title'}, ...units, {value: '', label: 'No unit of work'}], value: 'new'},
  ];
  return <ActionForm label={label} submitLabel="Start change" open={open} onClose={onClose} fields={fields} onSubmit={async v => {
    const target = artifact || v.artifact;
    const response = await edit.run('change.start', {artifact: target, title: v.title, reason: v.reason, ...(v.unit === 'new' ? {unit: {title: v.title}} : v.unit ? {unit: {id: v.unit}} : {})});
    onOpen({kind: 'change', artifact: target, change: response.result.change});
  }}/>;
}
export function NewUnitForm({snapshot, worktree, open, onClose, onOpen}) {
  const edit = useEdit();
  if (!edit.editable) return null;
  const claimed = new Set((worktree?.unitsOfWork || []).flatMap(u => u.members.map(m => `${m.artifact}/${m.change}`)));
  const options = currentChanges(worktree).filter(c => !claimed.has(`${c.artifact}/${c.name}`)).map(c => ({value: `${c.artifact}/${c.name}`, label: `${c.artifact} / ${c.name}`}));
  return <ActionForm label="New unit" submitLabel="Create unit" open={open} onClose={onClose} note={options.length ? null : 'Every open change already belongs to a unit. Start a change first.'} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: 'The one deliverable outcome'},
    {name: 'purpose', label: 'Purpose', placeholder: 'Why the outcome matters'},
    {name: 'changes', label: 'Participating changes', type: 'checks', options, value: options.length === 1 ? [options[0].value] : [], empty: 'No open change without a unit.'},
    {name: 'criteria', label: 'Acceptance criteria, one per line', type: 'lines', rows: 3, required: true, placeholder: 'One observable criterion per line'},
    {name: 'flowAssessment', label: 'Flow assessment', type: 'textarea', rows: 2, required: true, value: 'No flow is assessed yet. Assess the affected flows before the plan.'},
  ]} onSubmit={async v => {
    const changes = (v.changes || []).map(value => {const [artifact, change] = value.split('/');return {artifact, change};});
    const criteria = lines(v.criteria).map(criterion => ({criterion}));
    // Several members need one integration criterion; the last one checks the combination.
    if (changes.length > 1 && criteria.length) criteria[criteria.length - 1].integration = true;
    const response = await edit.run('unit.create', {title: v.title, purpose: v.purpose, changes, acceptance: criteria, flowAssessment: v.flowAssessment});
    onOpen({kind: 'unit', unit: response.result.unit});
  }}/>;
}
export function AddDocumentForm({artifact, kind, onOpen, label, open}) {
  const edit = useEdit();
  if (!edit.editable) return null;
  return <ActionForm open={open} label={label || `Add ${KIND_LABEL[kind]}`} submitLabel={`Add ${KIND_LABEL[kind]}`} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: `Name of the ${KIND_LABEL[kind]}`},
    {name: 'body', label: 'Text (optional)', type: 'textarea', rows: 4, placeholder: 'Leave empty to start from the template'},
  ]} onSubmit={async v => {
    const response = await edit.run('document.add', {artifact, kind, title: v.title, ...(v.body.trim() ? {body: v.body} : {})});
    const path = response.result.path;
    onOpen({kind: 'document', artifact, source: path, title: path.slice(`docs/artifacts/${artifact}/`.length), edit: !v.body.trim()});
  }}/>;
}
export function AddFlowForm({artifact, onFlow, open}) {
  const edit = useEdit();
  if (!edit.editable) return null;
  return <ActionForm open={open} label="Add flow" submitLabel="Create flow" fields={[
    {name: 'title', label: 'Title', required: true, placeholder: 'Name of the behavior'},
    {name: 'trigger', label: 'Trigger', required: true, placeholder: 'What starts the behavior'},
    {name: 'outcome', label: 'Outcome', required: true, placeholder: 'What the behavior produces'},
    {name: 'firstStep', label: 'First step', required: true, placeholder: 'Title of the first step'},
  ]} onSubmit={async v => {
    const response = await edit.run('flow.create', {artifact, ...v});
    onFlow({artifact, flow: `${artifact}:${response.result.flow}`}, true);
  }}/>;
}
