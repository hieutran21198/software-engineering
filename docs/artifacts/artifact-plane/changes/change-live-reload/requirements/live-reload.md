# Automatic updates and reload performance

## Need and scope

Users need current repository evidence without repeatedly clicking Refresh. The user requests unit tabs in the order Artifacts, Workflow, Implementation and faster reloading. Changes belong to Artifact Plane; ADD lifecycle contracts and existing workflow inference rules remain intact.

## Requirements

R1. Unit tabs appear in the order Artifacts, Workflow, Implementation. Opening a unit starts with Artifacts. Recorded executions retain their existing Implementation view.

R2. While a repository is open, relevant knowledge edits, additions, deletions, renames, task evidence updates, Git commits/ref changes, and registered worktree changes automatically update repository views. Registered readable ADD worktrees are included. Ordinary source edits update dirty context, but do not create invented phase evidence.

R3. Automatic and manual updates preserve the active view, valid selection, expansion, filters, inspector width, pan, and zoom. A deleted selection clears safely. The existing snapshot remains usable while loading or after an update error. Switching repositories prevents responses for the previous repository from replacing the current view.

R4. Group bursts and avoid overlapping reloads for the same repository. Expose updating, connected, and stale/error information. Reconnect and browser focus reconcile current evidence after missed notifications. Retain manual Refresh for recovery.

R5. Reduce repeated filesystem and Git work while retaining complete history, publication checks, diagnostics, and exact current contents. Changes to protected refs, task bytes/path sets, or knowledge must invalidate corresponding evidence. Cache failures must not hide later recovery.

R6. Measure cold and repeated reload duration and Git command counts against a fixed corpus on the same machine. Specify concrete improvement targets in the design and validate them with repeatable checks. No empty or incomplete snapshot may count as a performance improvement.

R7. Keep exploration read-only, local-origin checks and path containment. Release observation resources when clients disconnect or switch repositories. Do not persist a workflow state registry or cache in the inspected repository.

## Acceptance examples

- Editing a task checkbox updates the implementation view without clicking Refresh.
- Adding a dependency proposal updates the planning artifact graph; committing it updates history evidence.
- Editing an inspected registered worktree updates its evidence; adding/removing a worktree updates the worktree list.
- A manual reload during a burst produces a current result without a viewport reset or stale response overwrite.
- Disconnecting shows stale state; reconnecting reads current evidence before indicating a current snapshot.
- Modifying delivered task evidence or moving main removes any unsupported establishment conclusion.

## Excluded scope

Workflow canvas redesign, new phase inference or approval rules, runtime execution controls, source-code HMR, deployment, automatic merging, version changes to ADD, and historical evidence edits.

## Requirement self-check

R1–R7 cover the requested outcome and observable recovery behavior. Only Artifact Plane changes; existing ADD contracts supply the unchanged dependency. KISS limits scope to navigation and repository updates. STE preserves the distinction between observed edits, documented evidence, and establishment. No Requirement blocker remains.
