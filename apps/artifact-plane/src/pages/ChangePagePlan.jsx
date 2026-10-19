// The plan of a change: a task table whose rows expand in place, one add row,
// the plan self-check and the task canvas on request.
import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useDocument, useShell} from '../page-data.js';
import {Badge, Section} from '../ui.jsx';
import {GraphPanel, Handles} from '../GraphPanel.jsx';
import {ActionForm, OperationError, useEdit, checklistItems, sectionText, frontValue, lines} from '../editing.jsx';
import {useTaskRuntime} from '../Runtime.jsx';
import {stateLabels, elapsedLabel} from '../runtime-model.js';
import {afterLabel, planSelfCheckMissing, taskGraphLayout, taskNumber, taskState, TASK_STATES} from './ChangePageModel.js';

const RESULTS = [{value: 'passed', label: 'Passed'}, {value: 'failed', label: 'Failed'}, {value: 'incomplete', label: 'Incomplete'}];
export const resultField = {name: 'result', label: 'Result', type: 'select', options: RESULTS, value: 'passed'};
export const detailField = (value = '', label = 'Detail') => ({name: 'detail', label, type: 'textarea', rows: 3, required: true, value});
const RESULT_TONE = {passed: 'passed', failed: 'failed', incomplete: 'incomplete'};

function StatusDot({state}) {
  return <span className={`task-dot ${state}`} title={TASK_STATES[state]}/>;
}

// Observed execution of one task, shown only in its expanded row.
function TaskRuntime({change, task, worktreePath}) {
  const value = useTaskRuntime(change.artifact, change.name, task.path, undefined, worktreePath, task);
  const attempt = value.attempts[0];
  return <p className="task-runtime"><span className="muted">Execution</span> <Badge tone={['done'].includes(value.state) ? 'ok' : ['failed', 'blocked', 'interrupted'].includes(value.state) ? 'failed' : ''}>{stateLabels[value.state] || 'Unknown'}</Badge>
    {attempt && <span className="muted"> {value.attempts.length > 1 ? `${value.attempts.length} agents` : attempt.agent || attempt.session} · {elapsedLabel(Math.max(...value.attempts.map(a => a.elapsedMs)))}{attempt.stale ? ` · stale, last observed ${attempt.lastObservedState}` : ''}</span>}
    {!value.attempts.length && <span className="muted"> · Observations do not verify completion.</span>}
  </p>;
}

// Edit task: title, prerequisites and DoD lines, with Remove task.
function EditTaskForm({change, task, tasks, numbers, dod, onClose}) {
  const edit = useEdit(), id = useId(), first = useRef(null);
  const [values, setValues] = useState({title: task.title, prerequisites: task.dependsOn, dod: dod.map(i => i.text).join('\n')});
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [confirm, setConfirm] = useState(false);
  useEffect(() => {first.current?.focus();}, []);
  const target = {artifact: change.artifact, change: change.name, id: task.id};
  const others = tasks.filter(t => t.id && t.id !== task.id);
  async function act(work) {setBusy(true);setError(null);try {await work();onClose();} catch (failure) {setError(failure);} finally {setBusy(false);}}
  const save = event => {event.preventDefault();if (!busy) act(() => edit.run('task.update', {...target, title: values.title, prerequisites: values.prerequisites, dod: lines(values.dod)}));};
  return <form className="inline-form task-form" aria-label="Edit task" onSubmit={save} onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation();onClose();}}}>
    <div className="field"><label htmlFor={`${id}-title`}>Title</label><input ref={first} id={`${id}-title`} required value={values.title} onChange={e => setValues(v => ({...v, title: e.target.value}))}/></div>
    <fieldset className="checks"><legend>After</legend>{others.length ? others.map(t => <label className="check" key={t.id}>
      <input type="checkbox" checked={values.prerequisites.includes(t.id)} onChange={e => setValues(v => ({...v, prerequisites: e.target.checked ? [...v.prerequisites, t.id] : v.prerequisites.filter(p => p !== t.id)}))}/>{numbers.get(t.id)} {t.title}</label>) : <p className="tiny">No other task.</p>}</fieldset>
    <div className="field"><label htmlFor={`${id}-dod`}>Definition of Done, one item per line</label><textarea id={`${id}-dod`} rows={Math.max(3, values.dod.split('\n').length)} required value={values.dod} onChange={e => setValues(v => ({...v, dod: e.target.value}))}/></div>
    <OperationError error={error}/>
    <div className="form-actions">
      <button className="primary" disabled={busy}>Save task</button><button type="button" onClick={onClose}>Cancel</button>
      <span className="spacer"/>
      {confirm ? <><span className="small">Remove this task file?</span><button type="button" className="danger" disabled={busy} onClick={() => act(() => edit.run('task.remove', target))}>Confirm remove</button><button type="button" className="quiet" onClick={() => setConfirm(false)}>Keep task</button></>
        : <button type="button" className="danger" disabled={busy} onClick={() => setConfirm(true)}>Remove task</button>}
    </div>
  </form>;
}

function TaskDetail({change, task, tasks, numbers, writable}) {
  const {go, worktreePath} = useShell(), edit = useEdit();
  const scope = {artifact: change.artifact, change: change.name};
  const document = useDocument(task.path, scope);
  const [mode, setMode] = useState(null), [failure, setFailure] = useState(null), [attempt, setAttempt] = useState(0);
  const text = document.data ? document.markdown : null;
  const items = text ? checklistItems(text) : [], dod = text ? checklistItems(sectionText(text, 'definition-of-done') || '') : [];
  const records = text ? (Array.isArray(frontValue(text).evidence_records) ? frontValue(text).evidence_records : []) : [];
  // Checkboxes apply at once; a refused write restores the recorded state.
  const toggle = async (index, checked) => {setFailure(null);try {await edit.run('task.checklist.set', {path: task.path, index, checked});} catch (error) {setFailure(error);setAttempt(n => n + 1);}};
  return <div className="task-detail" role="region" aria-label={`Task ${numbers.get(task.id) || ''} details`}>
    <h3>Definition of Done</h3>
    {!text ? <p className="muted" role="status">{document.status === 'error' ? document.error : 'Reading the task…'}</p> : items.length ? <ul className="task-checks">{items.map((item, index) => <li key={index}><label className="check">
      <input key={`${attempt}-${item.checked}`} type="checkbox" defaultChecked={item.checked} disabled={!writable} onChange={e => toggle(index, e.target.checked)}/>{item.text}</label></li>)}</ul> : <p className="muted">No checklist items.</p>}
    <OperationError error={failure}/>
    <h3>Evidence</h3>
    {text && (records.length ? <ul className="evidence-list">{records.map((r, i) => {const anchor = r?.source === undefined ? 'evidence' : String(r?.source || '').split('#')[1];const detail = anchor ? sectionText(text, anchor) : null;return <li key={r?.id || i}>
      <div><span className="evidence-method">{r?.method || r?.id}</span> <Badge tone={RESULT_TONE[r?.result] || ''}>{RESULTS.find(x => x.value === r?.result)?.label || 'Unknown'}</Badge></div>
      {detail && <p className="evidence-detail">{detail}</p>}
    </li>;})}</ul> : <p className="muted">No evidence recorded.</p>)}
    <TaskRuntime change={change} task={task} worktreePath={worktreePath}/>
    {mode === 'evidence' && <ActionForm open submitLabel="Record evidence" onClose={() => setMode(null)} fields={[{name: 'method', label: 'Method', required: true, value: 'Run the task checks.'}, resultField, detailField()]}
      onSubmit={v => edit.run('evidence.record', {path: task.path, ...v})}/>}
    {mode === 'edit' && <EditTaskForm change={change} task={task} tasks={tasks} numbers={numbers} dod={dod} onClose={() => setMode(null)}/>}
    {!mode && <div className="task-actions">
      {writable && <button className="quiet" disabled={!text} onClick={() => setMode('evidence')}>Record evidence</button>}
      {writable && <button className="quiet" disabled={!text} onClick={() => setMode('edit')}>Edit task</button>}
      <button className="quiet" onClick={() => go({kind: 'document', artifact: change.artifact, source: task.path, scope})}>Open task document</button>
    </div>}
  </div>;
}

function TaskNode({data}) {
  const {task, number} = data, state = taskState(task);
  return <div className={`graph-node task-node ${state}`}>
    <Handles/>
    <strong title={task.title}>{task.title}</strong>
    <small><span className={`task-dot ${state}`} aria-hidden="true"/> {number} · {task.checked} of {task.checked + task.unchecked} done</small>
  </div>;
}
const nodeTypes = {task: TaskNode};

export default function PlanSection({change, writable}) {
  const edit = useEdit(), {worktreePath} = useShell();
  const graph = change.taskGraph, tasks = graph?.tasks || [];
  const [view, setView] = useState('list'), [openPath, setOpenPath] = useState(null), [adding, setAdding] = useState(false), [selfCheck, setSelfCheck] = useState(false);
  const numbers = useMemo(() => new Map(tasks.map((t, i) => [t.id, taskNumber(t, i)])), [tasks]);
  const layout = useMemo(() => view === 'graph' ? taskGraphLayout(change, numbers) : null, [view, change, numbers]);
  const done = tasks.filter(t => taskState(t) === 'done').length;
  const target = {artifact: change.artifact, change: change.name};
  const options = tasks.filter(t => t.id).map(t => ({value: t.id, label: `${numbers.get(t.id)} ${t.title}`}));
  const message = graph?.state === 'not-loaded' ? 'Reading the plan…' : graph?.state === 'invalid' ? 'The plan is invalid. No task order is shown.' : graph?.state === 'unavailable' ? 'This plan declares no task list.' : null;
  const showSelfCheck = writable && planSelfCheckMissing(change);
  return <Section title="Plan" label="Plan" id="change-plan" summary={tasks.length ? `· ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} · ${done} done` : null}
    actions={<div className="plan-actions">
      {showSelfCheck && !selfCheck && <button className="quiet" onClick={() => setSelfCheck(true)}>Record plan self-check</button>}
      {tasks.length > 1 && <div className="segmented" role="group" aria-label="Plan view">{[['list', 'List'], ['graph', 'Graph']].map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>}
    </div>}>
    {selfCheck && <ActionForm open className="plan-selfcheck" submitLabel="Record plan self-check" title="Plan self-check" onClose={() => setSelfCheck(false)}
      fields={[resultField, detailField('Every task has an ID, prerequisites and an observable Definition of Done.')]} onSubmit={v => edit.run('plan.selfcheck.record', {...target, ...v})}/>}
    {graph?.state === 'invalid' && <ul className="plan-diagnostics">{graph.diagnostics.map((d, i) => <li key={i}>{d.message} <span className="mono">{d.path}</span></li>)}</ul>}
    {view === 'graph' && tasks.length > 0 ? <GraphPanel label="Task graph" nodes={layout.nodes} edges={layout.edges} nodeTypes={nodeTypes} flowKey={`${worktreePath}:${change.artifact}:${change.name}`}
      onNodeClick={(_, node) => {setOpenPath(node.id);setView('list');}}
      legend={<><span><i/>Prerequisite</span><span>Select a task to open it in the list.</span></>}/> :
      <div className="rows task-table" aria-label="Tasks" role="group">
        {tasks.length > 0 && <div className="task-row head" aria-hidden="true"><span/><span>ID</span><span>Task</span><span className="after">After</span><span>Done</span></div>}
        {tasks.map((task, index) => {
          const open = openPath === task.path, state = taskState(task), number = numbers.get(task.id) || taskNumber(task, index), after = afterLabel(task, numbers);
          return <React.Fragment key={task.path}>
            <button className={`unstyled task-row ${open ? 'open' : ''}`} aria-expanded={open} aria-label={`${number} ${task.title}, ${TASK_STATES[state]}, ${task.checked} of ${task.checked + task.unchecked} done`} onClick={() => setOpenPath(open ? null : task.path)}>
              <StatusDot state={state}/>
              <span className="task-id">{number}</span>
              <span className="task-title">{task.title}{after && <small className="after-inline">After {after}</small>}</span>
              <span className="after task-meta">{after || '—'}</span>
              <span className="task-meta">{task.checked} of {task.checked + task.unchecked}</span>
            </button>
            {open && <TaskDetail change={change} task={task} tasks={tasks} numbers={numbers} writable={writable}/>}
          </React.Fragment>;
        })}
        {!tasks.length && <p className="task-empty muted">{message || 'No tasks yet.'}</p>}
        {writable && graph?.state !== 'invalid' && (adding ? <ActionForm open submitLabel="Add task" onClose={() => setAdding(false)} fields={[
          {name: 'title', label: 'Title', required: true, placeholder: 'What the task delivers'},
          {name: 'prerequisites', label: 'After', type: 'checks', options, value: [], empty: 'No other task.'},
          {name: 'dod', label: 'Definition of Done, one item per line', type: 'lines', rows: 3, required: true, placeholder: 'One observable result per line'},
        ]} onSubmit={async v => {const response = await edit.run('task.add', {...target, title: v.title, prerequisites: v.prerequisites, dod: lines(v.dod)});if (response.result?.path) setOpenPath(response.result.path);}}/>
          : <button className="add-row" onClick={() => setAdding(true)}>+ Add task</button>)}
      </div>}
  </Section>;
}
