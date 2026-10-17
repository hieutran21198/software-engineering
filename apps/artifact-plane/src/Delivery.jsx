import React from 'react';

const stateLabel = state => ({'documented-complete':'Documented complete','declared-incomplete':'Declared incomplete','not-declared':'Not declared'})[state] || state;
const natural = new Intl.Collator('en', {numeric:true});
export const changeKey = (worktree, change) => JSON.stringify([worktree.path, change.artifact, change.name]);

export function ChangeList({worktree, artifact, selected, onSelect, historiesOpen, onToggleHistories}) {
 const changes = (worktree?.changes || []).filter(c => c.artifact === artifact);
 const histories = changes.filter(c => c.history).sort((a,b) => (b.lastCommitAt ?? -1) - (a.lastCommitAt ?? -1) || natural.compare(a.name,b.name));
 const button = c => <button className={'delivery-change' + (selected === changeKey(worktree,c) ? ' active' : '')} key={c.name} onClick={() => onSelect(changeKey(worktree,c))}>
  <span>{c.name}</span><small>{c.version ? `Version ${c.version}` : c.history ? 'History' : c.currentStep || (c.loadState==='not-loaded'?'':'Unknown')}</small>
 </button>;
 return <section className="change-delivery" aria-label="Change delivery">
  <h3>Delivery work</h3>
  {changes.filter(c => !c.history).map(button)}
  {!!histories.length && <><button className="type-toggle" aria-label="Delivery histories" aria-expanded={historiesOpen} onClick={onToggleHistories}><span>{historiesOpen ? '▾' : '▸'} Delivery history</span><span>{histories.length}</span></button>{historiesOpen && <div className="delivery-histories">{histories.map(button)}</div>}</>}
  {!changes.length && <p className="muted">No change delivery records in this worktree.</p>}
 </section>;
}

function Commit({commit}) {
 return <details className="workflow-commit"><summary><code>{commit.id.slice(0,8)}</code> {commit.subject}</summary><code className="full-commit">{commit.id}</code></details>;
}

export function ChangeDetails({context, phase, onPhase, onBack, onTaskGraph, onReview, children, loading}) {
 const {worktree, change} = context;
 const pending=change.loadState==='not-loaded'||loading==='Loading';
 const step = change.steps.find(s => s.name === phase);
 return <div className="workflow-details delivery-details">
  {onBack&&<button onClick={onBack}>Back to artifact</button>}
  {children}
  <div className="details-heading"><span className="eyebrow">{step ? 'Phase evidence' : 'Change delivery'}</span>{step && <button aria-label="Clear phase selection" onClick={() => onPhase(null)}>×</button>}</div>
  <h2>{step?.name || `${change.artifact} / ${change.name}`}</h2>
  <div className="details-meta"><span>{worktree.branch || 'Detached HEAD'}</span><span>{worktree.path}</span><span>{change.artifact} / {change.name}</span></div>
  {change.history && <p className="muted">{change.historyReason}</p>}
  <p className="tiny" hidden={pending||change.layout==='in-place'}>Latest inspected change commit: {change.lastCommitAt === null ? 'Unknown' : new Date(change.lastCommitAt*1000).toISOString()} · bounded local history</p>
  <p className="muted" role="status">{pending?'Loading evidence…':change.inferenceReason}</p>
  {change.declaredActive && <p className="tiny">Declared change; this does not prove ongoing execution.</p>}
  {worktree.diagnostics.filter(d=>d.message.includes(`${change.artifact}/${change.name}`)).map((d,i) => <p className="workflow-diagnostic" key={i}>{d.message}</p>)}
  {(onTaskGraph||onReview)&&<div className="inspector-actions">{onTaskGraph&&<button onClick={onTaskGraph}>View task graph</button>}{onReview&&<button onClick={onReview}>Review change</button>}</div>}
  <nav hidden={pending} className="delivery-phases" aria-label="Change phases">{change.steps.map(s => <button key={s.name} aria-pressed={s.name === phase} onClick={() => onPhase(s.name)}><span>{s.name}</span><small>{stateLabel(s.state)}</small></button>)}</nav>
  {pending?null:step ? <section><h3>{stateLabel(step.state)}</h3>
   {step.evidence.length ? <ul>{step.evidence.map((e,i) => <li key={i}>{e.explanation}{e.file && <small>{e.file}</small>}</li>)}</ul> : <p className="muted">No completion evidence available.</p>}
   {change.layout==='in-place' ? <p className="tiny">Declared evidence; Git history is not replayed.</p> : <>{step.completionCommit ? <><p className="tiny">Commit introducing completion evidence</p><Commit commit={step.completionCommit}/></> : <p className="tiny">Exact completion commit unknown.</p>}
   <h3>Associated commits</h3>{step.commits.length ? step.commits.map(c => <Commit key={c.id} commit={c}/>) : <p className="muted">None.</p>}</>}
  </section> : <section><h3>Task evidence ({change.tasks.length})</h3>{change.tasks.map(t => <div className="workflow-task" key={t.path}><p>{t.path}</p><small>{t.checked} checked · {t.unchecked} unchecked · {t.state}{t.inherited ? ' · Inherited / historical' : ''}</small></div>)}</section>}
 </div>;
}
