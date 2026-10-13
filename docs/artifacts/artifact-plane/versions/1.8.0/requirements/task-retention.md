# Delivery evidence and navigation requirements

## Need and scope

R1. Remove the standalone top-level Workflow tab and its canvas. Preserve Dependencies, Units of work, recorded executions, and all three unit views, including unit Workflow.
R2. Preserve explicit worktree discovery/opening, unavailable and detached worktree details, change histories, phase/commit evidence, and task graph access for changes without a unit. Use existing navigation and inspectors without a replacement top-level workflow canvas.
R3. Resolve future historical member task graphs and DoD evidence from their originating retained change, associated through the delivered version's provenance. Preserve legacy version-owned plans and evidence and active-change exploration.
R4. Change-owned evidence supports historical completion only when its delivery source is safely resolved and matches published protected-ref evidence. Missing, modified, ambiguous, unsafe, or unavailable evidence remains incomplete or unknown. No inferred approval or execution order is added.
R5. Preserve read-only access, explicit refresh, worktree isolation, selection, safe Markdown, responsive controls, task ownership, dependency gates, and Codex observation/history.

## Acceptance examples

Opening Plane shows no top-level Workflow button. A selected unit still exposes Workflow, Artifacts, and Implementation. A repository without briefs still exposes change task graphs and phase evidence. A task-free delivered version resolves its retained change plan; an old version with tasks retains its historical graph. Uncommitted changes to delivered evidence prevent supported completion.

## Impact and self-check

Consumes established artifact-driven 2.0.0, element specifications/task-retention.md, originating change change-task-retention. Upstream establishment and recheck passed before implementation. Task filtering and loading changes are excluded. KISS reuses current graph/reader/inspector mechanisms; STE separates phase evidence from permission. No Requirement blocker remains.
