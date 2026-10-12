import React from "react";

function Commit({commit}) {
  return <details className="workflow-commit"><summary><code>{commit.id.slice(0, 8)}</code> {commit.subject}</summary><code className="full-commit">{commit.id}</code></details>;
}
export function Workflow({workflow, onOpen, busy}) {
  if (!workflow) return <div className="workflow-view"><p>Workflow evidence is unavailable. Refresh to retry.</p></div>;
  return <div className="workflow-view" aria-label="Local ADD workflows">
    <h2>Local ADD workflows</h2>
    <p className="muted">Steps are inferred from Markdown and Git. This view does not detect running agents or prove approval. Read again with Refresh.</p>
    <p className="tiny">At most {workflow.historyLimit} commits touching artifact knowledge per worktree.</p>
    {workflow.diagnostics.map((d,i)=><p className="workflow-diagnostic" key={i}>{d.message}</p>)}
    {!workflow.worktrees.length && <p className="muted">No registered worktrees available.</p>}
    {workflow.worktrees.map(worktree=><article className={`worktree-card ${worktree.selected ? "selected" : ""}`} key={worktree.path}>
      <header className="worktree-head"><h3>{worktree.branch || (worktree.detached ? "Detached HEAD" : "Unknown branch")}</h3>
        {worktree.selected ? <span className="source-tag">Selected worktree</span> : <button disabled={busy || worktree.availability !== "readable"} onClick={()=>onOpen(worktree.path)}>Open worktree</button>}
      </header>
      <p className="worktree-path">{worktree.path}</p>
      <p className="tiny">HEAD <code title={worktree.head || ""}>{worktree.head?.slice(0,8) || "No commits"}</code> · {worktree.availability}{worktree.locked ? " · Locked" : ""}{worktree.prunable ? " · Prunable" : ""}</p>
      {worktree.head && <details><summary>Full HEAD ID</summary><code className="full-commit">{worktree.head}</code></details>}
      {worktree.diagnostics.map((d,i)=><p className="workflow-diagnostic" key={i}>{d.message}</p>)}
      {worktree.availability === "readable" && !worktree.changes.length && <p className="muted">No ADD changes discovered.</p>}
      {worktree.changes.map(change=><details className="workflow-change" key={change.artifact + "/" + change.name}>
        <summary><strong>{change.artifact} / {change.name}</strong><span className="step-badge">{change.currentStep || (change.inferenceReason.startsWith("No distinguishable ongoing") ? "Historical" : "Unknown")}</span></summary>
        <p className="muted">{change.inferenceReason}</p>
        {change.declaredActive && <p className="tiny">Declared change; this does not prove ongoing execution.</p>}
        <div className="workflow-steps">{change.steps.map(step=><details className="workflow-step" key={step.name}>
          <summary><strong>{step.name}</strong><span>{step.state === "documented-complete" ? "Documented complete" : step.state} · {step.commits.length} commits</span></summary>
          {step.evidence.length ? <ul>{step.evidence.map((e,i)=><li key={i}>{e.explanation}{e.file && <small>{e.file}</small>}</li>)}</ul> : <p className="muted">No completion evidence available.</p>}
          {step.completionCommit ? <div><p className="tiny">Commit introducing completion evidence</p><Commit commit={step.completionCommit}/></div> : <p className="tiny">Exact completion commit unknown.</p>}
          {!!step.commits.length && <p className="tiny">Associated commits</p>}
          {step.commits.map(commit=><Commit key={commit.id} commit={commit}/>)}
        </details>)}</div>
        <details className="workflow-tasks"><summary>Task evidence ({change.tasks.length})</summary>
          {change.tasks.length ? change.tasks.map(task=><div className="workflow-task" key={task.path}><p>{task.path}</p><small>{task.checked} checked · {task.unchecked} unchecked · {task.state}{task.inherited ? " · Inherited / historical" : ""}</small></div>) : <p className="muted">No tasks found.</p>}
        </details>
      </details>)}
    </article>)}
  </div>;
}
