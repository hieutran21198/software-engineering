---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/explorer.md#agent-orchestration-self-check
---

# Repository explorer requirements

## Need and scope

Provide a local web application that opens an ADD Git repository and explains its artifact dependencies. Git, Markdown, YAML dependency declarations, and the directory structure supply the data. Build graph views in memory.

The inspected repository must remain unchanged. This restriction includes Git metadata and untracked files. Creating this application's code and development artifacts in its own workspace is permitted.

## Acceptance criteria

1. A reader can open a local repository and explicitly refresh its contents. Invalid paths and missing ADD directories produce useful errors.
2. Discover artifacts under `docs/artifacts` from root READMEs. Show identity, details, declared current version, and active change. Show an initial artifact with no established version accurately.
3. Show the established artifact graph with arrows from prerequisite to dependent. Distinguish active dependency additions and removals from established edges.
4. Selecting an artifact shows its direct and transitive upstream and downstream dependencies, with established and proposed relationships distinguished.
5. Expanding an artifact shows knowledge elements and their dependency references, including the owning artifact, element path, reason, and established or proposed source.
6. Resolve established element references through the owner's declared current version. Do not substitute the newest version directory. Keep active change elements distinguishable from established elements.
7. Report missing targets, cycles, conflicting index data, ambiguous metadata, and multiple active changes. Keep valid portions inspectable without silently fixing repository data.
8. Display Markdown details safely. Repository content cannot execute browser scripts or cause reads outside the chosen repository through element paths or symlinks.
9. Opening, inspecting, and refreshing leave repository files and Git state unchanged. Explicit authoring operations are governed by requirements/authoring-workbench.md.
10. Explore the graph on an interactive canvas: pan, zoom, fit the graph, select nodes, and expand or collapse an artifact to show its element dependencies in place. Canvas actions change only the browser view.

## Constraints

Reading operations remain read-only with no workflow engine. The authoring extension in requirements/authoring-workbench.md defines the only write path, limited to docs/artifacts of the selected worktree on a non-protected branch. The agent orchestration extension in requirements/agent-orchestration.md defines the only agent controls: a person starts each agent session, and Plane writes no repository file. The Codex execution extension permits a local observation store outside inspected repositories, local event authentication, and live browser updates. Retained graph context belongs only to execution history; current knowledge graphs remain derived. Prefer existing libraries.

## Behavior examples

These examples clarify the acceptance criteria and supply shared fixtures for implementation checks.

### B1 — Initial artifact

Given an artifact README declares no established version and one `change-initial` directory exists, when the repository opens, show no established version and show `change-initial` as the active change. Show its knowledge elements as proposed knowledge.

### B2 — Established dependency and reference

Given `authentication` depends on `tenant`, and an authentication element references `specifications/identity.md` in tenant, when tenant declares current version `1.0.0`, draw tenant → authentication and resolve the reference within tenant's `versions/1.0.0`. A newer version directory does not change resolution. Tenant is upstream of authentication; authentication is downstream of tenant.

### B3 — Proposed dependency removal

Given an established tenant → authentication edge and authentication's active proposal removes tenant, when the repository opens, retain the established edge with a proposed-removal annotation. Exclude it from the planning graph. The proposal does not change the established relationship.

### B4 — Missing referenced element

Given a valid artifact reference points to a missing element in the owner's current version, when the reader expands the consuming artifact, show the target and reason with an unresolved-reference diagnostic. Keep other artifacts and references inspectable.

### B5 — Proposed dependency addition

Given two artifacts with no established edge and an active proposal adds tenant as authentication's dependency, when the repository opens, show tenant → authentication as a proposed addition in the planning view. Do not present it as established.

### B6 — Read-only refresh

Given a repository with tracked and untracked files, when the reader opens, inspects, and refreshes it without external edits, all repository file contents and Git state remain unchanged. An explicit refresh after an external Markdown edit displays the updated working-tree content.

### B7 — Canvas exploration

Given a displayed artifact graph, when the reader pans, zooms, selects an artifact, and expands it, show that artifact's type groups on the same canvas. Opening a type group shows its elements and reference connections. Selecting an element shows its details. Collapsing the artifact hides its element nodes while preserving artifact dependency edges. These actions do not change repository data.

## Input boundary

Support the canonical ADD layout and its documented YAML element references and dependency proposals. Root README conventions must be documented by the implementation. Unsupported or ambiguous conventions produce diagnostics. Arbitrary Markdown prose cannot reliably identify a dependency.

## Self-check

The scope covers the user's requested behavior and read-only constraint. No other project artifacts exist to change. KISS excludes unrelated runtime infrastructure. STE checks preserve the requirements and use direct acceptance criteria. The path-input interaction is part of the approved plan.

## Element reading order

11. Expanded artifacts and inspector lists group knowledge by type in ADD reading order: Requirements, Specifications, Decisions, then Tasks. Type groups show record counts and can be opened or closed. Primary type groups contain current-version elements. Each change has separate type groups under Change histories.
12. Place a category's README before its other files. Order the remaining paths naturally, so `2-reader.md` precedes `10-validation.md`. Keep nested paths deterministic.
13. Preserve element identity, reference resolution, dependency relationships, selection, and read-only behavior when changing display order.
14. Reduce excess bottom space in canvas records while keeping filenames and source labels readable.
15. Let the reader resize the right details panel without changing repository files or saving persistent UI state. Keep the canvas and content usable at supported widths.

### B8 — Ordered artifact knowledge

Given an artifact has elements from its current version and a change, including requirements, specifications, decisions, and numbered task files, when the reader expands the artifact or opens its inspector list, show collapsible Requirements → Specifications → Decisions → Tasks groups with counts. Opening primary Tasks shows only current-version records. Opening Tasks within a change history shows only that change. Within either source, show README.md, 2-reader.md, then 10-validation.md. Selecting a displayed element opens the same source-specific record as before.

### B9 — Compact records

Given an open type group on the canvas, show each record with its filename and source label and less bottom space than the initial release. Labels remain readable and connection handles remain attached to the correct record.

### B10 — Resizable navigation

Given the desktop layout, when the reader drags the sidebar divider or uses its keyboard resize control, change the sidebar width within bounds. Page content reflows and the current page and selection stay. The workbench redesign (workbench-redesign.md) removed the inspector panel.

### Ordering self-check

The correction addresses the reported screenshot without changing discovery or dependency contracts. Requirements define the reading order and observable grouping; the specification chooses source precedence. KISS adds no sorting settings or new dependencies. STE checks preserve existing requirements and state the order explicitly. Prior task evidence remains historical and does not prove this correction passes.

## Change histories and workflow visibility

Compact records, resizing, references, and read-only rules remain valid.

16. Primary Requirements, Specifications, Decisions, and Tasks groups show only current-version records. All change records belong in a separate **Change histories** section, closed by default. Each change has its own closed type groups and counts. Preserve Markdown inspection, selection, and reference navigation. Retained directories do not prove an active workflow.
17. List all local worktrees registered to the opened repository. Show branch, absolute path, HEAD, and selected worktree. Selecting another readable ADD worktree explicitly switches the displayed context in one action. Represent detached, locked, prunable, unavailable, and non-ADD entries honestly. Do not switch Git branches or scan unrelated repositories.
18. For each readable ADD worktree, show discovered changes and the best-supported current step: Requirement, Specification, Plan, Implementation, Validation, or Version preparation. Distinguish observed work, inferred progress, documented completion, and unknown state. Show task evidence. A clean tree, filename, directory, or commit message alone must not prove approval, validation, or a running agent.
19. Show associated commit IDs and messages for each step from that worktree's Git history. Short IDs serve lists; full IDs remain inspectable. When a finished step has documented completion, show its evidence and associated commits. If its exact completion commit cannot be identified, say so. Preserve multiple commits and squash ambiguity.
20. Read on Open, manual Refresh, or repository invalidation under requirements/live-reload.md. No execution controls, file writes, workflow database, authentication, or AI inference. One unavailable worktree must not prevent opening the selected repository.

## Additional behavior examples

- B11: Current version and two retained changes produce version-only primary groups and closed Change histories. Opening a change and type shows only that source. Reference navigation reveals its correct section.
- B12: Main, change-branch, and unavailable worktrees show their paths and branch state. The selected entry is highlighted. Opening a readable ADD worktree changes the view without modifying files or Git refs.
- B13: Separate phase commits and task evidence produce associated commits and an inferred step with a reason. Uncommitted specifications show observed Specification work. Unchecked tasks are unfinished. The explorer does not infer approval.
- B14: A squash commit can appear under several steps, with exact completion commits unknown. Detached HEAD, empty history, malformed checklists, and no changes produce honest diagnostics or empty states.

## Change self-check

The scope stays within Artifact Plane. B11–B14 cover source separation, worktrees, progress uncertainty, and commit provenance. No execution engine or workflow state is added. KISS and STE checks preserve simple sources and clear evidence limits.

## Worktree and delivery navigation

21. Present registered worktree selection and details from the branch control in the top bar. Show branch, path, HEAD, availability and detached/locked/prunable states. Selecting another readable worktree explicitly switches the displayed context in one action.
22. Expose change delivery details and phase evidence on the change page, with full commit IDs, messages, completion evidence, and uncertainty. A change page can show its task graph. Preserve access in repositories without unit briefs.
23. Remove the standalone Workflow tab and canvas. Preserve unit Workflow, dependency exploration, worktree/history access, and recorded executions. Automatic refresh follows requirements/live-reload.md. Add no execution controls, approval inference, or repository writes.

### B15 — Delivery evidence exploration

Given local worktrees and changes, the branch control lists registered sources. Opening a change shows its phase evidence and task plan. A unit page shows its changes, criteria and, on request, its graph.

### B16 — View and source safety

Opening another page or resizing preserves valid selection. Refresh preserves valid selection or clears it when its source disappears. Selecting another worktree is the explicit context-switch action. Canvas interactions leave files and Git state unchanged.

## Workflow histories and navigation

24. Remove Approval from the displayed workflow phase sequence. The explorer still does not infer user approval or run workflows.
25. In each worktree, keep current changes separate from retained changes. Put retained changes in Change histories, closed by default. Readers can expand histories and individual changes to inspect their phases and evidence. A declared change already represented by the current snapshot belongs in histories. Ambiguous active metadata must remain visible as uncertain rather than proving completion.
26. Order Change histories by the latest Git commit time for each change, descending. Unknown times sort last with deterministic ties. Do not use directory name or filesystem modification time as recency evidence.
27. The workbench redesign (workbench-redesign.md) replaces the view switcher and the Established / Planning controls. Graphs show the working branch and mark differences from main with badges. Maintain usable controls on narrow layouts.

### B17 — Workflow history exploration

Given a current declared change and two retained changes committed at different times, the artifact page shows the current change and a closed version history. Expanding histories shows the newer change first. Selecting a history shows its six phases without Approval. Phase evidence preserves full IDs and uncertainty.

### B18 — Stable navigation

At a fixed desktop width, opening another page leaves the top bar and the sidebar in the same position. At narrow widths, controls remain readable and operable.

### History requirement self-check

The change affects only Artifact Plane. B17 and B18 cover history separation, recency, phases, and toolbar stability. KISS retains Git/Markdown and existing libraries. STE distinguishes retained history from proof of completed execution. No Requirement blocker remains.

## Agent orchestration self-check

change-agent-orchestration amends the constraints: agent controls now exist only as the person-started sessions of requirements/agent-orchestration.md. Reading stays read-only, and the authoring write path is unchanged.
