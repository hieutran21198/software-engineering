import React from 'react';
import {ActionForm, useEdit, lines} from '../editing.jsx';
import {artifactTitle, changeTitle, currentChanges} from '../work-model.js';

// The two creation cards of the work page. Each form derives every path and
// identifier through its operation and opens the result.
const NEW_ARTIFACT = '+new';
// In-place artifacts without an open change can start one.
const openChanges = artifact => artifact.changes.filter(c => c.layout !== 'legacy' && !c.version);
export const startable = snapshot => snapshot.artifacts.filter(a => a.layout === 'in-place' && !openChanges(a).length);

export function StartChangeCard({snapshot, worktree, onClose, onOpen}) {
  const edit = useEdit(), candidates = startable(snapshot);
  const units = (worktree?.unitsOfWork || []).map(u => ({value: u.id, label: `Join ${u.title}`}));
  const isNew = values => values.artifact === NEW_ARTIFACT, isExisting = values => !isNew(values);
  const fields = [
    {name: 'artifact', label: 'Artifact', type: 'select', value: candidates[0]?.id || NEW_ARTIFACT,
      options: [...candidates.map(a => ({value: a.id, label: a.title})), {value: NEW_ARTIFACT, label: 'A new artifact'}]},
    {name: 'artifactTitle', label: 'Artifact title', required: true, placeholder: 'Name of the new artifact', hidden: isExisting},
    {name: 'purpose', label: 'Purpose', type: 'textarea', rows: 3, required: true, placeholder: 'What the artifact is for and what it covers', hidden: isExisting},
    {name: 'title', label: 'Title', required: true, placeholder: 'What this change does', hidden: isNew},
    {name: 'reason', label: 'Reason', type: 'textarea', rows: 2, required: true, placeholder: 'Why the change is necessary', hidden: isNew},
    {name: 'unit', label: 'Unit of work', type: 'select', value: 'new', hidden: isNew,
      options: [{value: 'new', label: 'New unit with the change title'}, ...units, {value: '', label: 'No unit of work'}]},
  ];
  return <ActionForm open title="Start a change" submitLabel="Start change" onClose={onClose} fields={fields} onSubmit={async v => {
    if (isNew(v)) {
      // artifact.create also creates change-initial.
      const response = await edit.run('artifact.create', {title: v.artifactTitle, purpose: v.purpose});
      onOpen({kind: 'change', artifact: response.result.artifact, change: response.result.change});
      return;
    }
    const response = await edit.run('change.start', {artifact: v.artifact, title: v.title, reason: v.reason, ...(v.unit === 'new' ? {unit: {title: v.title}} : v.unit ? {unit: {id: v.unit}} : {})});
    onOpen({kind: 'change', artifact: v.artifact, change: response.result.change});
  }}/>;
}

// The 1.16.0 unit form: title, purpose, participating changes, criteria and flow assessment.
export function NewUnitCard({snapshot, worktree, onClose, onOpen}) {
  const edit = useEdit();
  const claimed = new Set((worktree?.unitsOfWork || []).flatMap(u => u.members.map(m => `${m.artifact}/${m.change}`)));
  const options = currentChanges(worktree).filter(c => !claimed.has(`${c.artifact}/${c.name}`)).map(c => ({value: `${c.artifact}/${c.name}`, label: `${changeTitle(c)} · ${artifactTitle(snapshot, c.artifact)}`}));
  return <ActionForm open title="New unit" submitLabel="Create unit" onClose={onClose} fields={[
    {name: 'title', label: 'Title', required: true, placeholder: 'The one deliverable outcome'},
    {name: 'purpose', label: 'Purpose', placeholder: 'Why the outcome matters'},
    {name: 'changes', label: 'Participating changes', type: 'checks', options, value: options.length === 1 ? [options[0].value] : [], empty: 'Every open change already belongs to a unit.'},
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
