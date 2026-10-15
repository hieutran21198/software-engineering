import React,{useId} from 'react';

const stateLabel = state => state === 'documented-complete' ? 'Documented complete' : state;
const natural = new Intl.Collator('en', {numeric:true});
export const changeKey = (worktree, change) => JSON.stringify([worktree.path, change.artifact, change.name]);

export function Worktrees({workflow, selected, onSelect, onOpen, busy}) {
 const controlId=useId();
 const worktrees = workflow?.worktrees || [];
 const worktree = worktrees.find(w => w.path === selected) || worktrees.find(w => w.selected);
 return <section className="worktree-browser" aria-label="Registered worktrees">
  <label htmlFor={controlId}>Worktree</label>
  <select id={controlId} value={worktree?.path || ''} onChange={event => onSelect(event.target.value)}>
   {worktrees.map(w => <option key={w.path} value={w.path}>{w.branch || (w.detached ? 'Detached HEAD' : 'Unknown branch')} · {w.selected ? 'opened' : w.availability} · {w.path}</option>)}
  </select>
  {worktree && <details className="worktree-details">
   <summary>Worktree details</summary><p>{worktree.path}</p>
   <p>{worktree.branch || 'Detached HEAD'} · {worktree.availability}{worktree.selected ? ' · Opened repository' : ''}{worktree.locked ? ' · Locked' : ''}{worktree.prunable ? ' · Prunable' : ''}</p>
   <code className="full-commit">{worktree.head || 'No commits'}</code>
   {worktree.diagnostics.map((d,i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
  </details>}
  {worktree && !worktree.selected && <button disabled={busy || worktree.availability !== 'readable'} onClick={() => onOpen(worktree.path)}>Open worktree</button>}
  {workflow?.diagnostics.map((d,i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
 </section>;
}

export function ChangeList({worktree, artifact, selected, onSelect, historiesOpen, onToggleHistories}) {
 const changes = (worktree?.changes || []).filter(c => c.artifact === artifact);
 const histories = changes.filter(c => c.history).sort((a,b) => (b.lastCommitAt ?? -1) - (a.lastCommitAt ?? -1) || natural.compare(a.name,b.name));
 const button = c => <button className={'delivery-change' + (selected === changeKey(worktree,c) ? ' active' : '')} key={c.name} onClick={() => onSelect(changeKey(worktree,c))}>
  <span>{c.name}</span><small>{c.history ? 'History' : c.currentStep || 'Unknown'}</small>
 </button>;
 return <section className="change-delivery" aria-label="Change delivery">
  <h3>Delivery work</h3>
  {changes.filter(c => !c.history).map(button)}
  {!!histories.length && <><button className="type-toggle" aria-label="Delivery histories" aria-expanded={historiesOpen} onClick={onToggleHistories}><span>{historiesOpen ? '▾' : '▸'} Change histories</span><span>{histories.length}</span></button>{historiesOpen && <div className="delivery-histories">{histories.map(button)}</div>}</>}
  {!changes.length && <p className="muted">No change delivery records in this worktree.</p>}
 </section>;
}

function Commit({commit}) {
 return <details className="workflow-commit"><summary><code>{commit.id.slice(0,8)}</code> {commit.subject}</summary><code className="full-commit">{commit.id}</code></details>;
}

export function ChangeDetails({context, phase, onPhase, onBack, onTaskGraph, onReview, children}) {
 const {worktree, change} = context;
 const step = change.steps.find(s => s.name === phase);
 return <div className="workflow-details delivery-details">
  <button onClick={onBack}>Back to artifact</button>
  {children}
  <div className="details-heading"><span className="eyebrow">{step ? 'Phase evidence' : 'Change delivery'}</span>{step && <button aria-label="Clear phase selection" onClick={() => onPhase(null)}>×</button>}</div>
  <h2>{step?.name || `${change.artifact} / ${change.name}`}</h2>
  <div className="details-meta"><span>{worktree.branch || 'Detached HEAD'}</span><span>{worktree.path}</span><span>{change.artifact} / {change.name}</span></div>
  {change.history && <p className="muted">{change.historyReason}</p>}
  <p className="tiny">Latest inspected change commit: {change.lastCommitAt === null ? 'Unknown' : new Date(change.lastCommitAt*1000).toISOString()} · bounded local history</p>
  <p className="muted">{change.inferenceReason}</p>
  {change.declaredActive && <p className="tiny">Declared change; this does not prove ongoing execution.</p>}
  {worktree.diagnostics.filter(d=>d.message.includes(`${change.artifact}/${change.name}`)).map((d,i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
  <div className="inspector-actions"><button onClick={onTaskGraph}>View task graph</button>{onReview&&<button onClick={onReview}>Review change</button>}</div>
  <nav className="delivery-phases" aria-label="Change phases">{change.steps.map(s => <button key={s.name} aria-pressed={s.name === phase} onClick={() => onPhase(s.name)}><span>{s.name}</span><small>{stateLabel(s.state)}</small></button>)}</nav>
  {step ? <section><h3>{stateLabel(step.state)}</h3>
   {step.evidence.length ? <ul>{step.evidence.map((e,i) => <li key={i}>{e.explanation}{e.file && <small>{e.file}</small>}</li>)}</ul> : <p className="muted">No completion evidence available.</p>}
   {step.completionCommit ? <><p className="tiny">Commit introducing completion evidence</p><Commit commit={step.completionCommit}/></> : <p className="tiny">Exact completion commit unknown.</p>}
   <h3>Associated commits</h3>{step.commits.length ? step.commits.map(c => <Commit key={c.id} commit={c}/>) : <p className="muted">None.</p>}
  </section> : <section><h3>Task evidence ({change.tasks.length})</h3>{change.tasks.map(t => <div className="workflow-task" key={t.path}><p>{t.path}</p><small>{t.checked} checked · {t.unchecked} unchecked · {t.state}{t.inherited ? ' · Inherited / historical' : ''}</small></div>)}</section>}
 </div>;
}
