import React, {useRef} from 'react';
import PageHeader from './PageHeader.jsx';
import {RailDivider} from './Rail.jsx';
import {UnitView, UnitDetails, completionLabel} from '../UnitsOfWork.jsx';
import {ActionForm, useEdit} from '../editing.jsx';
import {RemoveButton, resultField} from './DocumentPage.jsx';
import {currentChanges, artifactDocuments} from '../work-model.js';

// Brief editing: members, criteria, evidence and affected flows. Each action is
// one operation on the brief; the readers validate membership and evidence.
function UnitEditor({context, snapshot, onOpen}) {
  const edit = useEdit(), {unit, worktree} = context, run = edit.run;
  const claimed = new Set((worktree.unitsOfWork || []).filter(u => u.id !== unit.id).flatMap(u => u.members.map(m => `${m.artifact}/${m.change}`)));
  const memberOptions = currentChanges(worktree).filter(c => !unit.members.some(m => m.artifact === c.artifact) && !claimed.has(`${c.artifact}/${c.name}`)).map(c => ({value: `${c.artifact}/${c.name}`, label: `${c.artifact} / ${c.name}`}));
  const criteria = unit.acceptance.map(c => ({id: c.id, criterion: c.criterion, ...(c.integration ? {integration: true} : {})}));
  const setCriteria = next => run('unit.acceptance.set', {unit: unit.id, criteria: next});
  // Evidence sources: Evidence sections of member task files that the readers know.
  const taskPaths = [...new Set([
    ...(unit.implementationGraph?.nodes || []).filter(n => n.kind === 'task' && n.task?.path).map(n => n.task.path),
    ...worktree.changes.filter(c => unit.members.some(m => m.artifact === c.artifact && m.change === c.name)).flatMap(c => (c.taskGraph?.tasks || []).map(t => t.path)),
  ])];
  const sources = [{value: '', label: 'Combined checks section of this brief'}, ...taskPaths.map(path => ({value: `${path}#evidence`, label: `${path.split('/').slice(-3).join('/')} · Evidence`}))];
  const flows = snapshot.artifacts.flatMap(a => artifactDocuments(a).flows.map(f => ({value: f.flow, label: f.flow})));
  const current = (unit.affectedFlows || []).map(f => `${f.artifact}:${f.flow}`);
  const missingReview = unit.members.filter(m => m.establishmentEvidence?.reasons?.some(r => /publication_reviews|publication review/i.test(r)));
  return <section className="unit-editor" aria-label="Unit editing">
    {missingReview.map(m => <p key={m.artifact} className="notice">Completion unknown: no publication review for {m.artifact} {m.deliveredVersion || ''}. <button className="link-button" onClick={() => onOpen({kind: 'change', artifact: m.artifact, change: m.change, tab: 'review', add: 'publication'})}>Record publication review</button></p>)}
    {edit.editable && <>
      <div className="inspector-actions"><button onClick={() => onOpen({kind: 'document', source: unit.path, title: unit.title, scope: {unit: unit.id}, edit: true})}>Edit brief</button></div>
      <h3>Members</h3>
      <ul className="member-list">{unit.members.map(m => <li key={m.artifact}><span>{m.artifact} / {m.change}</span>{unit.members.length > 1 && <RemoveButton label={`Remove member ${m.artifact} / ${m.change}`} onRemove={() => run('unit.member.remove', {unit: unit.id, artifact: m.artifact, change: m.change})}/>}</li>)}</ul>
      {memberOptions.length > 0 && <ActionForm label="Add member" submitLabel="Add member" fields={[{name: 'member', label: 'Open change', type: 'select', options: memberOptions, value: memberOptions[0].value}]}
        onSubmit={v => {const [artifact, change] = v.member.split('/');return run('unit.member.add', {unit: unit.id, artifact, change});}}/>}
      <h3>Acceptance criteria</h3>
      <ul className="criteria-list">{unit.acceptance.map((c, i) => <li key={c.id}><span><strong>{c.id}</strong>{c.integration ? ' · Integration' : ''} {c.criterion}</span>
        <span className="row-actions">
          <ActionForm label={`Edit criterion ${c.id}`} submitLabel="Save criterion" fields={[{name: 'criterion', label: 'Criterion', required: true, value: c.criterion}, {name: 'integration', label: 'Integration criterion', type: 'checkbox', value: c.integration}]}
            onSubmit={v => setCriteria(criteria.map((x, j) => j === i ? {id: x.id, criterion: v.criterion, ...(v.integration ? {integration: true} : {})} : x))}/>
          {criteria.length > 1 && <RemoveButton label={`Remove criterion ${c.id}`} onRemove={() => setCriteria(criteria.filter((_, j) => j !== i))}/>}
          <ActionForm label={`Record evidence for ${c.id}`} submitLabel="Record evidence" fields={[
            {name: 'method', label: 'Method', required: true, value: 'Run the combined checks.'}, resultField,
            {name: 'source', label: 'Source', type: 'select', options: sources, value: sources[1]?.value ?? ''},
            {name: 'detail', label: 'Detail for the brief', type: 'textarea', rows: 2, hidden: v => Boolean(v.source)},
          ]} onSubmit={v => run('unit.evidence.record', {unit: unit.id, criterion: c.id, method: v.method, result: v.result, ...(v.source ? {source: v.source} : {detail: v.detail})})}/>
        </span></li>)}</ul>
      <ActionForm label="Add criterion" submitLabel="Add criterion" fields={[{name: 'criterion', label: 'Criterion', required: true, placeholder: 'One observable criterion'}, {name: 'integration', label: 'Integration criterion', type: 'checkbox', value: unit.members.length > 1 && !criteria.some(c => c.integration)}]}
        onSubmit={v => setCriteria([...criteria, {criterion: v.criterion, ...(v.integration ? {integration: true} : {})}])}/>
      <h3>Affected flows</h3>
      <ActionForm label="Set affected flows" submitLabel="Set affected flows" fields={[
        {name: 'flows', label: 'Flows', type: 'checks', options: flows, value: current, empty: 'No flow records exist.'},
        {name: 'effect', label: 'Effect of this outcome on the selected flows', type: 'select', options: [{value: 'modify', label: 'Modify'}, {value: 'create', label: 'Create'}, {value: 'remove', label: 'Remove'}], value: unit.affectedFlows?.[0]?.effect || 'modify'},
        {name: 'assessment', label: 'Flow assessment', type: 'textarea', rows: 3, required: true, value: unit.flowAssessment || ''},
      ]} onSubmit={v => run('unit.flows.set', {unit: unit.id, affectedFlows: v.flows.map(value => {const [artifact, flow] = value.split(':');return {artifact, flow, effect: v.effect};}), flowAssessment: v.assessment})}/>
    </>}
  </section>;
}

// The unit page: the aggregate views with the brief, criteria and evidence in
// the details rail, and the editing actions of the brief.
export default function UnitPage({context, snapshot, view, onView, planning, onPlanning, selection, onSelect, loading, document, completion, onDocument, onFlow, project, onOpen, rail, tabId}) {
  const body = useRef(null);
  if (!context) return <section className="page" aria-label="Unit page"><PageHeader project={project} title="Unit of work not found" onNavigate={onOpen}/><p className="muted">This unit of work is not in the selected worktree.</p></section>;
  const {unit} = context;
  return <section className="page canvas-page unit-page" aria-label="Unit page">
    <PageHeader project={project} crumb={`Unit ${unit.id}`} title={unit.title} onNavigate={onOpen}
      status={`${unit.members.length} participating ${unit.members.length === 1 ? 'change' : 'changes'} · ${completion.state === 'loading' ? 'Checking completion…' : completionLabel(unit.completion)}`}/>
    <div className="page-body with-rail" ref={body} style={{'--rail-width': rail.width + 'px'}}>
      <div className="canvas-area"><UnitView loading={loading} context={context} view={view} onView={onView} planning={planning} onPlanning={onPlanning} selection={selection} onSelect={onSelect}/></div>
      <RailDivider width={rail.width} max={rail.max} onResize={rail.onResize} controls={`details-panel-${tabId}`} edge={() => body.current.getBoundingClientRect().right}/>
      <aside id={`details-panel-${tabId}`} className="details-panel" aria-label="Selection details">
        <UnitDetails onFlow={onFlow} onDocument={onDocument} document={document} onCompletion={completion.load} completionState={completion.state} completionError={completion.error} context={context} view={view} planning={planning} selection={selection} onSelect={onSelect}/>
        {!selection && <UnitEditor context={context} snapshot={snapshot} onOpen={onOpen}/>}
      </aside>
    </div>
  </section>;
}
