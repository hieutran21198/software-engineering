import React from 'react';
import PageHeader from './PageHeader.jsx';
import {currentChanges, currentUnits, memberUnit, phase, unitStatus} from '../work-model.js';
import {protectedBranch, knowledgeEntries} from '../knowledge-api.js';
import {RecordedPicker} from '../RecordedExecutions.jsx';
import {ActionForm, useEdit} from '../editing.jsx';
import {StartChangeForm, NewUnitForm} from './forms.jsx';
import {RemoveButton} from './DocumentPage.jsx';

// The commit form stages only the checked knowledge paths and commits them.
export function CommitForm({entries, message}) {
  const edit = useEdit();
  return <ActionForm open label="Commit changes" submitLabel="Commit" fields={[
    {name: 'message', label: 'Commit message', required: true, value: message},
    {name: 'paths', label: 'Files to commit', type: 'checks', options: entries.map(e => ({value: e.path, label: `${e.path} · ${statusWord(e.code)}`})), value: entries.map(e => e.path)},
  ]} onSubmit={v => {if (!v.paths.length) throw Error('Select at least one file.');return edit.git('commit', {paths: v.paths, message: v.message});}}/>;
}

// Uncommitted knowledge is grouped by artifact or unit.
const owner = path => {const parts = path.split('/');return parts[2] === 'units-of-work' ? `unit ${parts[3] || ''}`.trim() : parts[2] || 'docs/artifacts';};
const statusWord = (code = '?') => ({M: 'changed', A: 'added', D: 'deleted', R: 'renamed', '??': 'new', '?': 'new'})[code] || ({M: 'changed', A: 'added', D: 'deleted'})[code[0]] || code;

export default function WorkPage({snapshot, worktree, project, onOpen, add}) {
  const edit = useEdit(), branch = snapshot.repository.branch, locked = protectedBranch(branch);
  const changes = currentChanges(worktree), units = currentUnits(worktree);
  const entries = edit.status ? edit.status.knowledge.map(e => ({code: e.status.trim() || '?', path: e.path})) : knowledgeEntries(snapshot.repository.status);
  const owners = [...new Set(entries.map(e => e.path.split('/')[2]))], single = owners.length === 1 ? changes.find(c => c.artifact === owners[0]) : null;
  const message = single ? `${single.artifact} ${single.name}: ${phase(single).chip || 'update'}` : `Update knowledge of ${owners.filter(o => o !== 'units-of-work').join(', ') || 'units of work'}`;
  const groups = [...new Set(entries.map(e => owner(e.path)))].map(name => ({name, entries: entries.filter(e => owner(e.path) === name)}));
  return <section className="page work-page" aria-label="Work page">
    <PageHeader project={project} title="Current work" onNavigate={onOpen}
      status={`${branch === 'detached' ? 'Detached HEAD' : `Branch ${branch}`} · ${locked ? 'protected: knowledge cannot be edited here' : 'knowledge can be edited'} · ${snapshot.artifacts.length} artifacts`}
      actions={<button onClick={() => onOpen({kind: 'graph'})}>Dependency graph</button>}/>
    <section className="page-section" aria-label="Open changes">
      <h2>Open changes</h2>
      <div className="inspector-actions"><StartChangeForm snapshot={snapshot} worktree={worktree} onOpen={onOpen} open={add === 'change'}/><NewUnitForm snapshot={snapshot} worktree={worktree} onOpen={onOpen} open={add === 'unit'}/></div>
      {changes.length ? <div className="card-list">{changes.map(c => {
        const p = phase(c), unit = memberUnit(worktree, c.artifact, c.name);
        return <article className="work-card" key={`${c.artifact}/${c.name}`} aria-label={`${c.artifact} / ${c.name}`}>
          <div className="work-card-head"><h3>{c.artifact} / {c.name}</h3>{p.chip && <span className="phase-chip">{p.chip}</span>}</div>
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
        <p>{unitStatus(u) || 'Open the unit to check its completion evidence.'}</p>
        <div className="inspector-actions"><button onClick={() => onOpen({kind: 'unit', unit: u.id})}>Open</button></div>
      </article>)}</div> : <p className="muted">No unit of work has an open change. {worktree?.unitsOfWork?.length ? `${worktree.unitsOfWork.length} units are listed in the navigation.` : 'This worktree has no unit-of-work briefs.'}</p>}
    </section>
    <section className="page-section" aria-label="Uncommitted knowledge">
      <h2>Uncommitted knowledge</h2>
      {entries.length ? groups.map(g => <div className="uncommitted-group" key={g.name}><h3>{g.name}</h3><ul>{g.entries.map(e => <li key={e.path}><code>{e.path}</code> <small>{statusWord(e.code)}</small>{edit.editable && <RemoveButton label={`Discard changes to ${e.path}`} onRemove={() => {if (window.confirm(`Discard the uncommitted changes to ${e.path}?`)) return edit.git('discard', {path: e.path});}}>Discard</RemoveButton>}</li>)}</ul></div>) : <p className="muted">No uncommitted knowledge files.</p>}
      {edit.editable && entries.length > 0 && <CommitForm key={entries.map(e => e.path).join()} entries={entries} message={message}/>}
    </section>
    {worktree && <section className="page-section" aria-label="Worktree details">
      <h2>Worktree</h2>
      <p>{worktree.path}</p>
      <p className="tiny">{worktree.branch || 'Detached HEAD'} · {worktree.availability}{worktree.locked ? ' · Locked' : ''}{worktree.prunable ? ' · Prunable' : ''}</p>
      <details><summary>HEAD and diagnostics</summary><code className="full-commit">{worktree.head || 'No commits'}</code>{worktree.diagnostics.map((d, i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}</details>
      {snapshot.workflow?.diagnostics.map((d, i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
    </section>}
    <RecordedPicker selected={null} onSelect={id => id && onOpen({kind: 'recorded', context: id})}/>
  </section>;
}
