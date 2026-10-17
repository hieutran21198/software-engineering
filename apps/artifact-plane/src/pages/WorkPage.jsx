import React from 'react';
import PageHeader from './PageHeader.jsx';
import {currentChanges, currentUnits, memberUnit, phase, unitStatus} from '../work-model.js';
import {protectedBranch} from '../knowledge-api.js';
import {RecordedPicker} from '../RecordedExecutions.jsx';

// Porcelain v1 entries under docs/artifacts, grouped by artifact or unit.
export function knowledgeEntries(status = '') {
  return status.split('\n').filter(line => line.length > 3).map(line => ({code: line.slice(0, 2).trim() || '?', path: line.slice(3).replace(/^"|"$/g, '').split(' -> ').at(-1)})).filter(e => e.path.startsWith('docs/artifacts/'));
}
const owner = path => {const parts = path.split('/');return parts[2] === 'units-of-work' ? `unit ${parts[3] || ''}`.trim() : parts[2] || 'docs/artifacts';};
const statusWord = code => ({M: 'changed', A: 'added', D: 'deleted', R: 'renamed', '??': 'new', '?': 'new'})[code] || ({M: 'changed', A: 'added', D: 'deleted'})[code[0]] || code;

export default function WorkPage({snapshot, worktree, project, onOpen, children}) {
  const branch = snapshot.repository.branch, locked = protectedBranch(branch);
  const changes = currentChanges(worktree), units = currentUnits(worktree), entries = knowledgeEntries(snapshot.repository.status);
  const groups = [...new Set(entries.map(e => owner(e.path)))].map(name => ({name, entries: entries.filter(e => owner(e.path) === name)}));
  return <section className="page work-page" aria-label="Work page">
    <PageHeader project={project} title="Current work" onNavigate={onOpen}
      status={`${branch === 'detached' ? 'Detached HEAD' : `Branch ${branch}`} · ${locked ? 'protected: knowledge cannot be edited here' : 'knowledge can be edited'} · ${snapshot.artifacts.length} artifacts`}
      actions={<button onClick={() => onOpen({kind: 'graph'})}>Dependency graph</button>}/>
    {children}
    <section className="page-section" aria-label="Open changes">
      <h2>Open changes</h2>
      {changes.length ? <div className="card-list">{changes.map(c => {
        const p = phase(c), unit = memberUnit(worktree, c.artifact, c.name);
        return <article className="work-card" key={`${c.artifact}/${c.name}`} aria-label={`${c.artifact} / ${c.name}`}>
          <div className="work-card-head"><h3>{c.artifact} / {c.name}</h3><span className="phase-chip">{p.chip}</span></div>
          <p>{p.hint}</p>
          <p className="tiny">{unit ? `Unit: ${unit.title}` : 'No unit of work'}{c.declaredActive ? ' · Declared change; this does not prove ongoing execution.' : ''}</p>
          <div className="inspector-actions">
            <button onClick={() => onOpen({kind: 'change', artifact: c.artifact, change: c.name})}>Open</button>
            <button onClick={() => onOpen({kind: 'change', artifact: c.artifact, change: c.name, tab: 'review'})}>Review</button>
            {unit && <button onClick={() => onOpen({kind: 'unit', unit: unit.id})}>Open unit</button>}
          </div>
        </article>;
      })}</div> : <div className="empty-state"><h3>No open change</h3><p>Open an artifact from the navigation to read its knowledge. A change starts on a branch other than main or master.</p></div>}
    </section>
    <section className="page-section" aria-label="Units in progress">
      <h2>Units in progress</h2>
      {units.length ? <div className="card-list">{units.map(u => <article className="work-card" key={u.id} aria-label={u.title}>
        <div className="work-card-head"><h3>{u.title}</h3><span className="type-count">{u.members.length} {u.members.length === 1 ? 'change' : 'changes'}</span></div>
        <p>{unitStatus(u) || 'Completion evidence not loaded'}</p>
        <div className="inspector-actions"><button onClick={() => onOpen({kind: 'unit', unit: u.id})}>Open</button></div>
      </article>)}</div> : <p className="muted">No unit of work has an open change. {worktree?.unitsOfWork?.length ? `${worktree.unitsOfWork.length} units are listed in the navigation.` : 'This worktree has no unit-of-work briefs.'}</p>}
    </section>
    <section className="page-section" aria-label="Uncommitted knowledge">
      <h2>Uncommitted knowledge</h2>
      {entries.length ? groups.map(g => <div className="uncommitted-group" key={g.name}><h3>{g.name}</h3><ul>{g.entries.map(e => <li key={e.path}><code>{e.path}</code> <small>{statusWord(e.code)}</small></li>)}</ul></div>) : <p className="muted">No uncommitted knowledge files.</p>}
    </section>
    {worktree && <section className="page-section" aria-label="Worktree">
      <h2>Worktree</h2>
      <p>{worktree.path}</p>
      <p className="tiny">{worktree.branch || 'Detached HEAD'} · {worktree.availability}{worktree.locked ? ' · Locked' : ''}{worktree.prunable ? ' · Prunable' : ''}</p>
      <details><summary>Worktree details</summary><code className="full-commit">{worktree.head || 'No commits'}</code>{worktree.diagnostics.map((d, i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}</details>
      {snapshot.workflow?.diagnostics.map((d, i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
    </section>}
    <RecordedPicker selected={null} onSelect={id => id && onOpen({kind: 'recorded', context: id})}/>
  </section>;
}
