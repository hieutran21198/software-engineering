# Change-owned evidence and simplified navigation contract

Governs R1–R5 in requirements/task-retention.md. Consume proposed artifact-driven/change-task-retention, element specifications/task-retention.md. Existing artifact-driven edge remains unchanged. Recheck the established upstream before implementation.

## Delivery source resolution

Extend server/units-of-work.js using safe existing Markdown maps and read-only argument-array Git calls. Version claims retain source_change and parse delivery_tasks. For delivery_tasks: change, sourcePath remains the delivered version knowledge prefix; a separate deliveryPath is its exact retained originating change prefix. Build the member taskGraph from deliveryPath. Keep task source paths and namespace identity tied to that change. Include its task Markdown for exact inspector navigation. Do not substitute current/newer tasks.

Compare both the version prefix and originating tasks prefix with local main/master. Require matching path sets and bytes for delivery publication, including task deletion/addition and plan membership. Conflicting protected refs and unavailable checks remain unknown; selected-branch differences cannot prove completion. Reuse publication evidence and all-required-merges rules. Resolve unit task evidence only within the exact member delivery path and validated publication. Report missing or invalid delivery sources rather than fabricating an empty completed graph.

Legacy versions without delivery_tasks continue using their version plan/evidence. They may still be inspected if their original change was removed. Invalid marker values are diagnostic. Active changes continue using their own current plans. Retain safe path/symlink containment and worktree isolation. No generic file endpoint or new persisted state is introduced.

## Phase/history interpretation

The absence of task copies from new version knowledge must not make an established source change appear ongoing. Use exact valid source_change/delivery_tasks association and publication checks for delivered history classification; keep missing or modified evidence visible as uncertain. Compare knowledge categories separately from task delivery records when associating version-preparation evidence. Preserve bounded commit evidence, squash ambiguity, unknown phases, and no inferred approval.

## Navigation and legacy access

Top-level explorer buttons are Dependencies and Units of work; recorded executions remain accessible through the existing picker. Remove the standalone Workflow canvas, its mounting/selection state, and unused canvas components/helpers/tests. Keep the workflow data reader because units, worktrees, and evidence use it.

Add a reusable worktree selector/details control in the repository sidebar, available in both primary views. Show path, branch/HEAD and unavailable/detached/locked/prunable states. Opening a readable worktree uses the existing explicit Open action; selection alone does not mutate Git. Remove redundant unit-only worktree selection. Preserve refresh and repository reset behavior.

In the Dependencies inspector, retain artifact Change histories and add change delivery details for the selected change: phase evidence, full commit IDs, diagnostics, and a View task graph action. Render the existing TaskGraph in the dependency content area with Back to dependencies. This gives legacy repositories and ungrouped changes access without another top-level workflow canvas. Reuse phase/commit detail rendering where useful, with in-memory context namespaced by worktree/artifact/change. Clear vanished sources on refresh; keep history groups closed by default and ordered by bounded Git recency, unknown last.

Unit Workflow, Artifacts, and Implementation controls remain. Preserve recorded runtime context, observer hooks, task bindings, external prerequisites, establishment gates, pan/zoom/fit, inspector resizing, and responsive controls. Phase lines describe sequence; task arrows describe dependencies. This change adds no completed-task filtering or lazy loading.

## Checks and self-check

Reader fixtures cover new task-free versions, retained delivered tasks, next-change isolation, legacy versions with/without retained changes, missing/invalid delivery markers, missing tasks, branch-only evidence, modified/deleted/added task files, conflicting protected refs, and inaccessible Git. Workflow fixtures cover established history classification and version-preparation associations. Browser checks assert no top-level Workflow button, retained unit Workflow, worktree opening and unavailable states, ungrouped task access, commit details, refresh, runtime history, responsive layout, and read-only fingerprints.

KISS retains one delivery source and existing graph components; STE preserves evidence uncertainty. All R1–R5 are covered and no Specification blocker remains. Upstream establishment remains a separate gate.

## Upstream recheck

ADD 2.0.0 is established on main after PR #13 merged. Its specifications/task-retention.md matches the supplying contract used for this plan. The version declares source_change and delivery_tasks: change and retains the published originating tasks. All required upstream knowledge and implementation live in this repository. User plan approval remains valid; no material amendment is required.
