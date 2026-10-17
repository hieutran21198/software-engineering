import React, {useRef, useState} from 'react';
import Markdown from '../Markdown.jsx';
import PageHeader from './PageHeader.jsx';
import {RailDivider} from './Rail.jsx';
import {ChangeDetails} from '../Delivery.jsx';
import {TaskGraph, TaskGraphDetails} from '../TaskGraph.jsx';
import ChangeReview from '../ChangeReview.jsx';
import {memberUnit, phase as phaseOf} from '../work-model.js';
import {ActionForm, OperationError, useEdit, checklistItems, sectionText, lines} from '../editing.jsx';
import {edit as previewEdit} from '../knowledge-api.js';
import {AddDocumentForm} from './forms.jsx';
import {RemoveButton, resultField} from './DocumentPage.jsx';
import {CommitForm} from './WorkPage.jsx';

const TABS = [['overview', 'Overview'], ['plan', 'Plan'], ['review', 'Review']];
const detailField = (value, label = 'Detail') => ({name: 'detail', label, type: 'textarea', rows: 3, required: true, value});
// Readiness: each unmet item names the place that fixes it.
function readiness(change, diagnostics, editable) {
  const graph = change.taskGraph, tasks = graph?.tasks || [], step = name => change.steps?.find(s => s.name === name)?.state;
  return [
    {label: 'The change is open', met: !change.history && !change.version, fix: null},
    {label: 'The plan is valid and has tasks', met: graph?.state === 'available' && tasks.length > 0, fix: 'plan'},
    {label: 'All Definition of Done items are checked', met: tasks.length > 0 && tasks.every(t => t.checked > 0 && t.unchecked === 0), fix: 'plan'},
    {label: 'Requirement, specification and plan self-checks are recorded', met: ['Requirement', 'Specification', 'Plan'].every(name => step(name) === 'documented-complete'), fix: 'overview'},
    {label: 'No error diagnostics', met: !diagnostics.length, fix: 'review'},
    {label: 'The branch is not protected', met: editable, fix: 'work'},
  ];
}
function TaskEditor({context, document, run, onOpen}) {
  const {change, task} = context, graph = change.taskGraph, [failure, setFailure] = useState(null), [attempt, setAttempt] = useState(0);
  if (!task) return null;
  // Checkboxes respond at once; a refused write restores the recorded state.
  const toggle = async (index, checked) => {setFailure(null);try {await run('task.checklist.set', {path: task.path, index, checked});} catch (error) {setFailure(error);setAttempt(n => n + 1);}};
  // A reload keeps the previous text, so forms opened meanwhile start complete.
  const text = document?.source === task.path && document.markdown ? document.markdown : null;
  const items = text ? checklistItems(text) : [], dod = text ? checklistItems(sectionText(text, 'definition-of-done') || '') : [];
  const others = graph.tasks.filter(t => t.id && t.id !== task.id).map(t => ({value: t.id, label: `${t.id} · ${t.title}`}));
  const target = {artifact: change.artifact, change: change.name, id: task.id};
  return <section className="task-editor" aria-label="Task editing">
    <h3>Definition of Done</h3>
    {!text ? <p role="status" className="muted">Loading the task…</p> : items.length ? <ul className="dod-list">{items.map((item, index) => <li key={index}><label className="check-field">
      <input key={`${attempt}-${item.checked}`} type="checkbox" defaultChecked={item.checked} onChange={e => toggle(index, e.target.checked)}/>{item.text}</label></li>)}</ul> : <p className="muted">No checklist items.</p>}
    <OperationError error={failure}/>
    <div className="inspector-actions">
      <ActionForm label="Record evidence" submitLabel="Record evidence" fields={[{name: 'method', label: 'Method', required: true, value: 'Run the task checks.'}, resultField, detailField('', 'Detail')]}
        onSubmit={v => run('evidence.record', {path: task.path, ...v})}/>
      <ActionForm label="Edit task" submitLabel="Save task" fields={[
        {name: 'title', label: 'Title', required: true, value: task.title},
        {name: 'prerequisites', label: 'Prerequisites', type: 'checks', options: others, value: task.dependsOn || [], empty: 'No other task.'},
        {name: 'dod', label: 'Definition of Done, one item per line', type: 'lines', rows: 4, required: true, value: dod.map(i => i.text).join('\n')},
      ]} onSubmit={v => run('task.update', {...target, title: v.title, prerequisites: v.prerequisites, dod: lines(v.dod)})}/>
      <RemoveButton label={`Remove task ${task.id}`} onRemove={() => run('task.remove', target)}>Remove task</RemoveButton>
      <button onClick={() => onOpen({kind: 'document', artifact: change.artifact, source: task.path, title: task.title, scope: {artifact: change.artifact, change: change.name}})}>Open task document</button>
    </div>
  </section>;
}
// Version preparation shows both files before it writes them.
function PrepareVersion({change, root, worktree, run}) {
  const [values, setValues] = useState({level: 'minor', reason: '', summary: '', acknowledge: false}), [preview, setPreview] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false), [open, setOpen] = useState(false);
  const input = {artifact: change.artifact, change: change.name, level: values.level, reason: values.reason, summary: values.summary, ...(values.acknowledge ? {acknowledgeUnchecked: true} : {})};
  const set = (key, value) => {setValues(current => ({...current, [key]: value}));setPreview(null);};
  async function show(event) {event.preventDefault();setBusy(true);setError(null);try {setPreview(await previewEdit({path: root, worktree, operation: 'version.prepare', input, dryRun: true}));} catch (failure) {setError(failure);} finally {setBusy(false);}}
  async function apply() {setBusy(true);setError(null);try {await run('version.prepare', input, {expected: preview.expected});setOpen(false);setPreview(null);} catch (failure) {setError(failure);} finally {setBusy(false);}}
  if (!open) return <button onClick={() => setOpen(true)}>Prepare version</button>;
  return <form className="action-form" aria-label="Prepare version" onSubmit={show}>
    <div className="form-field"><label htmlFor="version-level">Level</label><select id="version-level" value={values.level} onChange={e => set('level', e.target.value)}><option value="patch">Patch: compatible fix</option><option value="minor">Minor: compatible addition</option><option value="major">Major: incompatible change</option></select></div>
    <div className="form-field"><label htmlFor="version-reason">Reason</label><input id="version-reason" required value={values.reason} onChange={e => set('reason', e.target.value)} placeholder="Why this level applies"/></div>
    <div className="form-field"><label htmlFor="version-summary">Summary</label><textarea id="version-summary" required rows={3} value={values.summary} onChange={e => set('summary', e.target.value)} placeholder="What the version delivers"/></div>
    {error?.code === 'unchecked-dod' && <label className="check-field"><input type="checkbox" checked={values.acknowledge} onChange={e => set('acknowledge', e.target.checked)}/>Prepare the version with unchecked Definition of Done items</label>}
    <OperationError error={error}/>
    {preview && <section aria-label="Version preview"><h4>Version {preview.result.version}</h4>{preview.files.map(f => <details key={f.path} open><summary><code>{f.path}</code> · {f.action}</summary><pre className="file-preview">{f.after}</pre></details>)}</section>}
    <div className="form-actions">{preview ? <button type="button" className="primary" disabled={busy} onClick={apply}>Prepare {preview.result.version}</button> : <button className="primary" disabled={busy}>Preview version</button>}<button type="button" onClick={() => {setOpen(false);setPreview(null);setError(null);}}>Cancel</button></div>
  </form>;
}

// The change page: Overview (reason, unit, phases, readiness), Plan (tasks with
// their DoD and evidence) and Review (comparison, diagnostics, commit, version).
export default function ChangePage({context, tab, onTab, phase, onPhase, taskSelected, onTask, document, loading, review, project, onOpen, rail, tabId, active, snapshot, add}) {
  const body = useRef(null), [inspector, setInspector] = useState(null), [graphView, setGraphView] = useState(false), edit = useEdit();
  if (!context) return <section className="page" aria-label="Change page"><PageHeader project={project} title="Change not found" onNavigate={onOpen}/><p className="muted">This change is not in the selected worktree.</p></section>;
  const {worktree, change, task} = context, unit = memberUnit(worktree, change.artifact, change.name), p = phaseOf(change);
  const artifact = snapshot.artifacts.find(a => a.id === change.artifact), inPlace = artifact?.layout === 'in-place';
  const writable = edit.editable && inPlace && !change.history && !change.version;
  const run = edit.run, target = {artifact: change.artifact, change: change.name};
  const prefix = `docs/artifacts/${change.artifact}/`, readme = `${prefix}changes/${change.name}/README.md`;
  const diagnostics = [...snapshot.diagnostics.filter(d => d.severity !== 'info' && String(d.path).startsWith(prefix)), ...(change.taskGraph?.diagnostics || [])];
  const ready = readiness(change, diagnostics, edit.editable), graph = change.taskGraph, tasks = graph?.tasks || [];
  const evidenceCount = path => (change.steps?.find(s => s.name === 'Validation')?.evidence || []).filter(e => e.file === path).length;
  const changed = (artifact?.elements || []).filter(e => e.source === 'working' && ['added', 'modified'].includes(e.state));
  const commitPaths = (edit.status?.knowledge || []).map(e => ({code: e.status.trim() || '?', path: e.path})).filter(e => e.path.startsWith(prefix) || unit && e.path === `docs/artifacts/units-of-work/${unit.id}/README.md`);
  const goFix = fix => fix === 'work' ? onOpen({kind: 'work'}) : onTab(fix);
  const units = (worktree.unitsOfWork || []).filter(u => !u.members.some(m => m.artifact === change.artifact));
  return <section className={`page change-page ${tab === 'plan' ? 'canvas-page' : ''}`} aria-label="Change page">
    <PageHeader project={project} artifact={change.artifact} crumb={change.name} title={`${change.artifact} / ${change.name}`} onNavigate={onOpen}
      status={change.history ? change.historyReason || 'Retained change record.' : p.chip ? `Open change · current step: ${p.chip}${p.loading ? '' : ` · ${p.hint}`}` : 'Open change'}
      actions={<div className="view-toggle" role="group" aria-label="Change sections">{TABS.map(([value, label]) => <button key={value} aria-pressed={tab === value} className={tab === value ? 'active' : ''} onClick={() => onTab(value)}>{label}</button>)}</div>}/>
    {tab === 'overview' && <div className="page-body">
      <section className="page-section" aria-label="Reason and scope">
        <h2>Reason and scope</h2>
        {document?.source === readme && document.status === 'Loaded' ? <Markdown text={document.markdown}/> : <p className="muted" role="status">{document?.status === 'Error' ? document.error : 'Loading change record…'}</p>}
        <div className="inspector-actions">
          <button onClick={() => onOpen({kind: 'document', artifact: change.artifact, source: readme, title: `${change.name} README.md`, scope: target})}>Read change record</button>
          {writable && <button onClick={() => onOpen({kind: 'document', artifact: change.artifact, source: readme, title: `${change.name} README.md`, scope: target, edit: true})}>Edit reason and scope</button>}
        </div>
      </section>
      {writable && <section className="page-section" aria-label="Add knowledge">
        <h2>Add knowledge</h2>
        <div className="inspector-actions">{['requirement', 'specification', 'decision'].map(kind => <AddDocumentForm key={kind} artifact={change.artifact} kind={kind} onOpen={onOpen} open={add === kind}/>)}</div>
      </section>}
      <section className="page-section" aria-label="Readiness">
        <h2>Readiness</h2>
        <ul className="readiness">{ready.map(item => <li key={item.label} className={item.met ? 'met' : 'unmet'}><span aria-hidden="true">{item.met ? '✓' : '○'}</span> {item.label}{!item.met && item.fix && <button className="link-button" onClick={() => goFix(item.fix)}>{item.fix === 'work' ? 'Create a branch' : `Open ${item.fix}`}</button>}</li>)}</ul>
      </section>
      <section className="page-section" aria-label="Unit of work">
        <h2>Unit of work</h2>
        {unit ? <button onClick={() => onOpen({kind: 'unit', unit: unit.id})}>{unit.title}</button> : <p className="muted">This change belongs to no unit of work.</p>}
        {!unit && writable && units.length > 0 && <ActionForm label="Add to unit" submitLabel="Add to unit" fields={[{name: 'unit', label: 'Unit', type: 'select', options: units.map(u => ({value: u.id, label: u.title})), value: units[0].id}]}
          onSubmit={v => run('unit.member.add', {unit: v.unit, ...target})}/>}
      </section>
      {writable && <section className="page-section" aria-label="Self-checks">
        <h2>Self-checks</h2>
        <ul className="selfcheck-list">{changed.map(e => <li key={e.id}><span>{e.path}</span>
          <ActionForm label={`Record self-check for ${e.path}`} submitLabel="Record" fields={[resultField, detailField('The content is complete and agrees with its governing knowledge.')]} onSubmit={v => run('selfcheck.record', {path: e.file, ...v})}/></li>)}
          <li><span>Plan</span><ActionForm label="Record plan self-check" submitLabel="Record" fields={[resultField, detailField('Every task has an ID, prerequisites and an observable Definition of Done.')]} onSubmit={v => run('plan.selfcheck.record', {...target, ...v})}/></li>
        </ul>
      </section>}
      <section className="page-section" aria-label="Declared phases">
        <ChangeDetails loading={loading} context={context} phase={phase} onPhase={onPhase}/>
      </section>
    </div>}
    {tab === 'plan' && <div className="page-body with-rail" ref={body} style={{'--rail-width': rail.width + 'px'}}>
      <div className="canvas-area plan-area">
        <div className="plan-toolbar">
          <button aria-pressed={graphView} onClick={() => setGraphView(value => !value)}>Graph</button>
          {writable && <ActionForm label="Add task" submitLabel="Add task" open={add === 'task'} fields={[
            {name: 'title', label: 'Title', required: true, placeholder: 'What the task delivers'},
            {name: 'prerequisites', label: 'Prerequisites', type: 'checks', options: tasks.filter(t => t.id).map(t => ({value: t.id, label: `${t.id} · ${t.title}`})), value: [], empty: 'No other task.'},
            {name: 'dod', label: 'Definition of Done, one item per line', type: 'lines', rows: 3, required: true, placeholder: 'One observable result per line'},
          ]} onSubmit={async v => {const response = await run('task.add', {...target, title: v.title, prerequisites: v.prerequisites, dod: lines(v.dod)});const added = response.result?.path;if (added) onTask(JSON.stringify([worktree.path, change.artifact, change.name, 'task', added]));}}/>}
          {writable && <ActionForm label="Record plan self-check" submitLabel="Record" fields={[resultField, detailField('Every task has an ID, prerequisites and an observable Definition of Done.')]} onSubmit={v => run('plan.selfcheck.record', {...target, ...v})}/>}
        </div>
        {graphView ? <TaskGraph key={JSON.stringify([worktree.path, change.artifact, change.name])} context={context} selection={taskSelected} onSelect={onTask}/> :
          <table className="task-table" aria-label="Tasks"><thead><tr><th>#</th><th>ID</th><th>Title</th><th>Prerequisites</th><th>DoD</th><th>Evidence</th></tr></thead>
            <tbody>{tasks.map((t, i) => {const key = JSON.stringify([worktree.path, change.artifact, change.name, 'task', t.path]);return <tr key={t.path} aria-selected={taskSelected === key} className={taskSelected === key ? 'selected' : ''}>
              <td>{i + 1}</td><td>{t.id || 'invalid'}</td><td><button className="link-button" onClick={() => onTask(key)}>{t.title}</button></td><td>{t.dependsOn.join(', ') || 'None'}</td><td>{t.checked} of {t.checked + t.unchecked}</td><td>{evidenceCount(t.path)}</td></tr>;})}</tbody>
          </table>}
        {!tasks.length && <p className="muted">{graph?.state === 'not-loaded' ? 'Loading the plan…' : graph?.state === 'invalid' ? 'The plan is invalid. See the diagnostics in Review.' : 'No planned tasks. Add the first task.'}</p>}
      </div>
      <RailDivider width={rail.width} max={rail.max} onResize={rail.onResize} controls={`details-panel-${tabId}`} edge={() => body.current.getBoundingClientRect().right}/>
      <aside id={`details-panel-${tabId}`} className="details-panel" aria-label="Selection details">
        <TaskGraphDetails onRead={() => onOpen({kind: 'document', artifact: change.artifact, source: task.path, title: task.title, scope: target})} document={document} context={context} onClear={() => onTask(null)}/>
        {writable && <TaskEditor context={context} document={document} run={run} onOpen={onOpen}/>}
      </aside>
    </div>}
    {tab === 'review' && <div className="page-body review-body">
      <div className="review-main">
        <section className="page-section" aria-label="Diagnostics">
          <h2>Diagnostics</h2>
          {diagnostics.length ? <ul>{diagnostics.map((d, i) => <li key={i}><strong>{d.code}</strong> {d.message} <small>{d.path}</small></li>)}</ul> : <p className="muted">No error diagnostics for {change.artifact}.</p>}
        </section>
        {edit.editable && commitPaths.length > 0 && <section className="page-section" aria-label="Commit">
          <h2>Commit knowledge</h2>
          <CommitForm key={commitPaths.map(e => e.path).join()} entries={commitPaths} message={`${change.artifact} ${change.name}: ${p.chip || 'update'}`}/>
        </section>}
        {writable && <section className="page-section" aria-label="Version"><h2>Version</h2><PrepareVersion change={change} root={edit.root} worktree={edit.worktree} run={run}/></section>}
        {edit.editable && inPlace && change.version && <section className="page-section" aria-label="Publication review">
          <h2>Publication review of {change.version}</h2>
          <ActionForm label="Record publication review" submitLabel="Record publication review" open={add === 'publication'} fields={[
            {name: 'pullRequest', label: 'Pull request URL', required: true, placeholder: 'https://…/pull/1', spellCheck: false},
            {name: 'scope', label: 'Scope', required: true, value: `${change.artifact} knowledge and implementation`},
            detailField('All required knowledge and implementation changes have landed on main.'),
            {name: 'repository', label: 'Repository URL (empty: the origin remote)', spellCheck: false},
          ]} onSubmit={v => run('publication.record', {artifact: change.artifact, version: change.version, pullRequest: v.pullRequest, scope: v.scope, detail: v.detail, ...(v.repository.trim() ? {repository: v.repository.trim()} : {})})}/>
        </section>}
        <ChangeReview root={review.root} contextKey={JSON.stringify([worktree.path, change.artifact, change.name])} epoch={review.epoch} session={review.session} active={active} updating={review.updating} repositoryFresh={review.fresh} inspector={inspector}/>
      </div>
      <aside className="review-inspector-slot" ref={setInspector} aria-label="Review evidence"/>
    </div>}
  </section>;
}
