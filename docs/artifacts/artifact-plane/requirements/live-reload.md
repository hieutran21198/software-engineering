---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/live-reload.md#hidden-tab-requirement-self-check
---

# Automatic updates and reload performance

## Need and scope

Users need current repository evidence without repeatedly clicking Refresh. The user requests unit tabs in the order Artifacts, Workflow, Implementation and faster reloading. Changes belong to Artifact Plane; ADD lifecycle contracts and existing workflow inference rules remain intact.

## Requirements

R1. Unit tabs appear in the order Artifacts, Workflow, Implementation. Opening a unit starts with Artifacts. Recorded executions retain their existing Implementation view.

R2. While a repository is open, relevant knowledge edits, additions, deletions, renames, task evidence updates, Git commits/ref changes, and registered worktree changes automatically update repository views. Registered readable ADD worktrees are included. Ordinary source edits update dirty context, but do not create invented phase evidence.

R3. Automatic and manual updates preserve the open page, valid selection, expansion, filters, sidebar width, and an open graph's pan and zoom. A deleted selection clears safely. The existing snapshot remains usable while loading or after an update error. Switching repositories prevents responses for the previous repository from replacing the current view.

R4. Group bursts and avoid overlapping reloads for the same repository. Expose updating, connected, and stale/error information. Reconnect and browser focus reconcile current evidence after missed notifications. Retain manual Refresh for recovery.

R5. Reduce repeated filesystem and Git work while retaining complete history, publication checks, diagnostics, and exact current contents. Changes to protected refs, task bytes/path sets, or knowledge must invalidate corresponding evidence. Cache failures must not hide later recovery.

R6. Measure cold and repeated reload duration and Git command counts against a fixed corpus on the same machine. Specify concrete improvement targets in the design and validate them with repeatable checks. No empty or incomplete snapshot may count as a performance improvement.

R7. Keep exploration read-only, local-origin checks and path containment. Release observation resources when clients disconnect or switch repositories. Do not persist a workflow state registry or cache in the inspected repository.

R8. Open a lightweight selected-worktree overview first. Load the selected unit/view, other worktrees, full Markdown, and detailed commit history on demand. Unopened detail must not block the overview or consume detailed evidence memory. Loading remains read-only and supports ungrouped artifacts/changes and recorded executions.

R9. Show Not loaded, Loading, Loaded, Stale, and Error for deferred sections. Absence of loaded evidence must not imply no dependencies, no tasks, completion, establishment, or approval. Load all necessary evidence for a requested conclusion; no partial publication check may establish a version or complete an outcome.

R10. Release deferred data on repository/worktree/unit switches and invalidate it when relevant inputs change. Measure server and browser memory, response bytes, loaded worktree/file counts, and idle polling cost on small and large fixed corpora. Distinguish the historical cache budget from total process memory. Loaded data must remain scoped to the active view and required dependencies rather than accumulating every previously opened section.

R11. A hidden browser tab must not hold connections that other tabs need. With several Plane tabs open on one host, reads in the visible tab must not wait for the browser's connection limit. When a hidden tab becomes visible again, it reconciles current evidence before it shows Current.

R12. A reply that fails after the server starts to send it must close only that connection. The server process must continue to answer later requests.

## Acceptance examples

- Editing a task checkbox updates the implementation view without clicking Refresh.
- Adding a dependency proposal updates the planning artifact graph; committing it updates history evidence.
- Editing an inspected registered worktree updates its evidence; adding/removing a worktree updates the worktree list.
- A manual reload during a burst produces a current result without a viewport reset or stale response overwrite.
- Disconnecting shows stale state; reconnecting reads current evidence before indicating a current snapshot.
- Modifying delivered task evidence or moving main removes any unsupported establishment conclusion.

- Opening a repository shows artifact identities/dependencies, unit membership, and worktree availability before detailed workflow/history processing.
- Opening one unit's Implementation view loads its plan and required upstream gate evidence without loading unrelated unit histories.
- A deferred section shows Not loaded; opening it loads current evidence and cannot use an older repository response.
- Navigating repeatedly between units releases inactive detail; measurements expose remaining memory use rather than treating 32 MiB as a total memory limit.

- With three Plane tabs open on one repository and two of them hidden, a document opened in the visible tab shows its text within 5 seconds. Before this change, the read stopped after 30 seconds with "Request timed out".
- A hidden tab that becomes visible again reconnects and reloads current evidence.
- A reply that fails during serialization closes its connection; the next request receives an answer.

## Excluded scope

Workflow canvas redesign, new phase inference or approval rules, runtime execution controls, source-code HMR, deployment, automatic merging, version changes to ADD, and historical evidence edits.

## Requirement self-check

R1–R10 cover the requested outcome and observable recovery behavior. Only Artifact Plane changes; existing ADD contracts supply the unchanged dependency. KISS limits scope to navigation and repository updates. STE preserves the distinction between observed edits, documented evidence, and establishment. Lazy loading extends the approved preparation scope at the user’s request; implementation still requires plan approval. No Requirement blocker remains.

## Hidden-tab requirement self-check

On 18 October 2026 the owner reported that every document read timed out. Measured facts: one document read took 0.33 seconds on the owner's server; on a private copy, one tab showed the text 0.8 seconds after the click, and the third of three tabs showed "Request timed out. Retry this evidence read." Each tab with an open repository keeps the repository and runtime event streams open, and a browser allows 6 HTTP/1.1 connections per host. A diagnostic `/api/explore` reply failed after its headers were sent, and the error handler stopped the server process.

R11 and R12 state observable results and their failure cases. R11 extends R4 and R7 (reconnect reconciles evidence; observation resources are released) to hidden browser tabs; it does not change the event API. R12 keeps the sanitized error rule of the explorer contract. Assumption: the owner uses one visible Plane tab at a time; two visible windows keep 4 of the 6 connections and still leave 2 for reads. KISS: no shared stream across tabs and no HTTP/2. STE: one rule per requirement. No Requirement blocker remains.
