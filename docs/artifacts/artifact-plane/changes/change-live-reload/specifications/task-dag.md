# Task graph exploration contract

Governs P1–P5 in requirements/task-dag.md. Consume the established upstream contract from artifact-driven, element specifications/task-dag.md, for plan membership, IDs, depends_on, validation, and legacy behavior. The recheck against ADD's current established version, 1.1.0, passed before implementation.

## Reader and response

Reuse bounded, contained Markdown reading for each inspected worktree/change. Parse YAML with the existing yaml package, using document errors to reject malformed and duplicate-key declarations. No reads outside the task directory or through unsafe links. No new API endpoint is needed.

Add taskGraph to each workflow change in the existing /api/explore response:

- state: available, unavailable, or invalid.
- tasks: records with id (null when invalid), path, title, dependsOn, Markdown body, and the existing checked/unchecked/state evidence. Markdown body supplies scope, DoD, and evidence without another format.
- edges: source/target task IDs, prerequisite first. Return execution edges only when the complete graph is valid.
- diagnostics: code, path, message records, including malformed-plan, missing-task, malformed-task, duplicate-task-id, unknown-prerequisite, self-dependency, duplicate-prerequisite, and task-cycle. Plan path violations use malformed-plan. Duplicate listed paths are malformed-plan.

The taskGraph state is unavailable when tasks/README.md has no tasks declaration. Malformed front matter is invalid. An explicit empty tasks list is available with zero nodes. Missing declarations in a listed task are invalid. Invalid plans retain safely readable task records and diagnostics, but edges are empty and no topological-order claim is shown. Diagnostics do not remove the surrounding artifact or workflow evidence. Namespace UI node identity by worktree path, artifact, change, and task path; raw task IDs are local to one plan.

Graph metadata does not change workflow phase inference or existing checklist semantics. Do not infer task readiness, user approval, running agents, or verified completion. Preserve documented evidence and inherited/historical labels separately from explicit graph membership.

## Interface

Selecting change delivery details in the Dependencies inspector exposes a View task graph action. Open the existing graph canvas within Dependencies with Back to dependencies and change identity. Reuse React Flow, existing dagre, fit/pan/zoom, and the current inspector. Edges mean task prerequisites; show this legend. Include disconnected nodes and deterministic layout. For invalid, unavailable, or empty graphs, show the reason and readable records without prerequisite edges.

Task selection uses the existing safe Markdown renderer for scope, DoD, and evidence; display ID, source path, explicit prerequisites, and checklist counts. Never render raw Markdown HTML unsanitized. Return to the selected change without resetting history expansion. Retain inspector resize and narrow-layout behavior. Refresh retains selection only while the source still exists; otherwise clear it with the existing behavior. Opening another worktree clears task context. Repository polling follows live-reload.md. No file writes or new browser persistence.

## Dependency and validation

Propose artifact-plane -> artifact-driven in dependencies.yaml using the established graph convention. Diagram arrows still run upstream to dependent. This is an actual input contract prerequisite, with no reverse edge. ADD 1.1.0 established before this implementation. The root and DAG updates on this branch prepare the new dependency for establishment with the Plane release.

Use real temporary-repository fixtures for valid fork/join, disconnected/single/empty graphs, legacy plans, copied unlisted history, malformed YAML/types, duplicate keys/IDs/paths, missing files and IDs, invalid paths, duplicate prerequisites, self-dependencies, and cycles. Verify identical IDs in separate changes/worktrees do not collide. Browser acceptance covers navigation, selection/Markdown, diagnostic states, refresh, history preservation, desktop/narrow layouts, and read-only fingerprints. Existing regression checks remain required.

## Specification self-check

P1–P5 are covered by additive response, safe parsing, graph state, UI, and evidence rules. Existing local-server and derived-workflow decisions remain valid; the upstream metadata decision supplies the graph source. KISS reuses libraries and readers. STE distinguishes prerequisites from phase order and evidence from verification. No blocker remains for Plan.

## Upstream recheck

ADD 1.1.0 is established on main after PR #7 merged. The contract at the owning artifact's current version, element specifications/task-dag.md, matches the proposed format used for this approved plan. Task membership, IDs, prerequisites, validation, and legacy behavior remain unchanged. Dependency and phase self-checks pass; no material plan amendment is required.

## Codex observation extension

The codex-execution contract adds a separate runtime overlay and observation store. Earlier no-polling/no-persistence/no-agent-inference constraints continue to govern knowledge derivation. Explicit runtime events may show observed execution with freshness and reported validation labels; they do not alter knowledge graph, approval, or establishment semantics.
