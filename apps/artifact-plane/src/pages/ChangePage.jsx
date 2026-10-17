import React, {useRef, useState} from 'react';
import Markdown from '../Markdown.jsx';
import PageHeader from './PageHeader.jsx';
import {RailDivider} from './Rail.jsx';
import {ChangeDetails} from '../Delivery.jsx';
import {TaskGraph, TaskGraphDetails} from '../TaskGraph.jsx';
import ChangeReview from '../ChangeReview.jsx';
import {memberUnit, phase as phaseOf} from '../work-model.js';

const TABS = [['overview', 'Overview'], ['plan', 'Plan'], ['review', 'Review']];
// The change page: Overview (reason, unit, declared phases), Plan (task graph
// with task details) and Review (comparison with main). Task change-unit-pages
// adds the readiness checklist, task table, commit form and version actions.
export default function ChangePage({context, tab, onTab, phase, onPhase, taskSelected, onTask, document, loading, review, project, onOpen, rail, tabId, active}) {
  const body = useRef(null), [inspector, setInspector] = useState(null);
  if (!context) return <section className="page" aria-label="Change page"><PageHeader project={project} title="Change not found" onNavigate={onOpen}/><p className="muted">This change is not in the selected worktree.</p></section>;
  const {worktree, change, task} = context, unit = memberUnit(worktree, change.artifact, change.name), p = phaseOf(change);
  return <section className={`page change-page ${tab === 'plan' ? 'canvas-page' : ''}`} aria-label="Change page">
    <PageHeader project={project} artifact={change.artifact} crumb={change.name} title={`${change.artifact} / ${change.name}`} onNavigate={onOpen}
      status={change.history ? change.historyReason || 'Retained change record.' : p.chip ? `Open change · current step: ${p.chip}${p.loading ? '' : ` · ${p.hint}`}` : 'Open change'}
      actions={<div className="view-toggle" role="group" aria-label="Change sections">{TABS.map(([value, label]) => <button key={value} aria-pressed={tab === value} className={tab === value ? 'active' : ''} onClick={() => onTab(value)}>{label}</button>)}</div>}/>
    {tab === 'overview' && <div className="page-body">
      <section className="page-section" aria-label="Reason and scope">
        <h2>Reason and scope</h2>
        {document?.source === `docs/artifacts/${change.artifact}/changes/${change.name}/README.md` && document.status === 'Loaded' ? <Markdown text={document.markdown}/> : <p className="muted" role="status">{document?.status === 'Error' ? document.error : 'Loading change record…'}</p>}
        <button onClick={() => onOpen({kind: 'document', artifact: change.artifact, source: `docs/artifacts/${change.artifact}/changes/${change.name}/README.md`, title: `${change.name} README.md`, scope: {artifact: change.artifact, change: change.name}})}>Read change record</button>
      </section>
      <section className="page-section" aria-label="Unit of work">
        <h2>Unit of work</h2>
        {unit ? <button onClick={() => onOpen({kind: 'unit', unit: unit.id})}>{unit.title}</button> : <p className="muted">This change belongs to no unit of work.</p>}
      </section>
      <section className="page-section" aria-label="Declared phases">
        <ChangeDetails loading={loading} context={context} phase={phase} onPhase={onPhase}/>
      </section>
    </div>}
    {tab === 'plan' && <div className="page-body with-rail" ref={body} style={{'--rail-width': rail.width + 'px'}}>
      <div className="canvas-area"><TaskGraph key={JSON.stringify([worktree.path, change.artifact, change.name])} context={context} selection={taskSelected} onSelect={onTask}/></div>
      <RailDivider width={rail.width} max={rail.max} onResize={rail.onResize} controls={`details-panel-${tabId}`} edge={() => body.current.getBoundingClientRect().right}/>
      <aside id={`details-panel-${tabId}`} className="details-panel" aria-label="Selection details">
        <TaskGraphDetails onRead={() => onOpen({kind: 'document', artifact: change.artifact, source: task.path, title: task.title, scope: {artifact: change.artifact, change: change.name}})} document={document} context={context} onClear={() => onTask(null)}/>
      </aside>
    </div>}
    {tab === 'review' && <div className="page-body review-body">
      <ChangeReview root={review.root} contextKey={JSON.stringify([worktree.path, change.artifact, change.name])} epoch={review.epoch} session={review.session} active={active} updating={review.updating} repositoryFresh={review.fresh} inspector={inspector}/>
      <aside className="review-inspector-slot" ref={setInspector} aria-label="Review evidence"/>
    </div>}
  </section>;
}
