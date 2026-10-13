# Aggregated unit-of-work exploration contract

Governs P1–P6 and U1–U5 in requirements/units-of-work.md. Consume established artifact-driven 2.0.0, elements specifications/units-of-work.md and specifications/task-retention.md, originating change change-task-retention. The upstream recheck passed before implementation. Existing explorer and task-graph contracts remain valid except the reserved units-of-work directory is explicitly excluded from artifact discovery. No new artifact edge is needed.

## Reader and additive response

Extend the existing safe reader and POST /api/explore response with unitsOfWork. Each inspected worktree supplies its own brief contents and derived records; never combine mutable files from separate worktrees. Selected repository records are also available at snapshot level for list/detail navigation. Read contained immediate briefs, version provenance READMEs, resolved member knowledge, and evidence Markdown with existing realpath/.git containment. Detect duplicate membership within each worktree, including historical briefs. No API endpoint, background polling, Git mutation, or persisted view state is added.

A unit record contains id, title, path, markdown, members, acceptance, evidence, diagnostics, completion, artifactGraph, and implementationGraph. Member records contain artifact, change, retainedChangePath (nullable), deliveredVersion (nullable), sourcePath, establishmentEvidence, and workflow evidence. completion contains derivation (documented-complete, incomplete, or unknown), reasons, and source references. These fields exist only in the response. Invalid membership has unknown completion; known unmet criteria or proposed versions produce incomplete. Missing Git proof produces unknown rather than complete. Display documented-complete as Completion supported by documented evidence.

Reuse the existing workflow evidence rules and six display phases, including Validation and Version preparation as evidence views rather than new ADD phases. Group rows by unit and member within the same worktree. Resolve retained change workflow evidence where available; when only a delivered version remains, show delivered-version evidence and unavailable historical phases without inventing phase commits. Ungrouped change phase evidence and task graphs remain accessible through the Dependencies inspector for legacy repositories.

## Git establishment evidence

Use existing argument-array read-only Git access. For provenance claims, query explicit local refs/heads/main and refs/heads/master; compare relevant version files and provenance with committed protected-ref contents. A version must be reachable in one of those refs and retain matching immutable knowledge. Do not trust the selected feature branch's root version statement. If both protected refs provide conflicting claims, diagnose ambiguity. Version provenance proves knowledge publication; required implementation merges need the existing repository contract plus recorded review evidence. Show that limit. Bound Git work to claimed version/evidence paths, retain timeouts, and diagnose unavailable reads. Do not infer source changes for legacy snapshots.

## Artifact view

Derive an established/planning projection from existing artifact roots and valid selected-change dependency proposals. Include member nodes, their edges, and the transitive upstream closure as external prerequisite nodes. Do not include unrelated downstream artifacts. External nodes are visibly labelled and do not become members. Edge direction remains prerequisite to dependent. The view describes current dependency knowledge and explicitly labels it as such for historical outcomes; it does not recompute historical completion against a newer dependency graph. Retain diagnostics for missing endpoints and cycles.

## Implementation view

Reuse each member's validated taskGraph from its retained originating change when delivery_tasks is change, or its delivered version for legacy snapshots without that marker. Namespaced node keys include worktree, unit, artifact, change, and task path. Preserve original local IDs and internal edges. Invalid plans retain safely readable records with no invented edges; absent legacy metadata remains unavailable. Whole-graph derivation is invalid/unavailable where a required component cannot be resolved; render valid components but do not claim complete execution order.

For each actual artifact prerequisite of a member, add a version-establishment gate owned by that prerequisite. A participating prerequisite gate follows its task sinks and gates the dependent member's task roots. An external gate has no invented task nodes. One artifact gate can feed several dependents. Gate edges are distinguished from internal task edges and phase sequence lines. Establishment includes publication/review obligations beyond tasks, so task completion never automatically opens a gate. Internal sinks/roots come only from valid task DAGs; an empty graph still has an establishment gate where required. Display explicit user approval as a separate documented obligation, never as inferred permission. A downstream member's entire implementation remains governed by its gate through task reachability. Diagnose cycles in the combined graph.

For a historical delivered member, use the exact retained originating change's plan/evidence for delivery_tasks: change, or legacy delivered-version tasks; retain its namespace change provenance. Historical display does not instruct rerunning established tasks. Gate evidence refers to the required established knowledge and is unknown where it cannot be verified. Do not create cross-artifact depends_on metadata or persist this combined graph.

## Interface

Add a Units of work navigation choice beside existing repository views. List name, purpose, member count, and derived completion with uncertainty reasons. Selecting a unit opens its safe Markdown brief and structured member/criteria/evidence details, with Workflow, Artifacts, and Implementation view controls. Reuse React Flow, dagre, shared selection/Markdown, inspector resizing, keyboard lists, responsive layout, pan/zoom/fit, and in-memory view state. Label external prerequisites and gate meanings. Selecting task/phase/artifact/gate nodes opens exact source knowledge and evidence. Unit selection/refresh is namespaced by worktree and source; clear vanished sources and reset context when opening another repository. No graph editing or product-facing schema diagnostics beyond actionable invalid/missing knowledge details.

## Validation and self-check

Fixtures cover multi/single-member units, duplicates, malformed/unsafe briefs, missing artifacts/changes/provenance, retained/removed changes, historical versions, branch-only versions, unavailable main/master, later current versions, shared passed/failed/incomplete evidence, and reserved-directory discovery. Graph fixtures cover fork/join tasks, disconnected/empty/invalid/legacy plans, external/transitive prerequisites, gates, cycles, and repeated local task IDs across units/worktrees. Browser checks cover all three views, exact-source navigation, uncertainty, refresh, legacy access, responsive layouts, and read-only fingerprints. Existing tests remain required. P1–P6 are covered; KISS reuses existing reader/graph/UI libraries and STE labels evidence limits. No Specification blocker remains.

## Upstream recheck

ADD 1.2.0 is established on main after PR #10 merged. Its specifications/units-of-work.md matches the supplying approved contract. Existing artifact and task DAG semantics remain unchanged. The local main reference has been fast-forwarded to the merged upstream commit for read-only establishment checks. No material plan amendment is required. The user's implementation approval remains valid.

For documented merge review, readers recognize an explicit statement that all required knowledge and implementation changes reside in the inspected repository, or that all required knowledge and implementation changes have landed on main/master. Publication still requires identical complete knowledge on a local protected ref; a branch-only statement cannot establish it. Missing review assertions remain unverified. This is a supported prose convention for existing evidence, not a workflow status declaration.

A shared brief can record a publication-review paragraph prefixed with artifact identifier and delivered version (for example, artifact-driven 1.2.0:), followed by the explicit all-required-merges assertion. The reader applies it only to that member/version and still verifies identical protected-ref knowledge. This supports merged upstream members without editing their immutable snapshots.

## Repository updates

The live-reload.md contract in this specification directory defines automatic repository updates, reload reuse, recovery, and preserved user context. It changes refresh transport and unit tab order without changing evidence interpretation.
