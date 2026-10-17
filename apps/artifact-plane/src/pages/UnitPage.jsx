import React, {useRef} from 'react';
import PageHeader from './PageHeader.jsx';
import {RailDivider} from './Rail.jsx';
import {UnitView, UnitDetails, completionLabel} from '../UnitsOfWork.jsx';

// The unit page: the aggregate views with the brief, criteria and evidence in
// the details rail. Task change-unit-pages adds membership and evidence editing.
export default function UnitPage({context, view, onView, planning, onPlanning, selection, onSelect, loading, document, completion, onDocument, onFlow, project, onOpen, rail, tabId}) {
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
      </aside>
    </div>
  </section>;
}
