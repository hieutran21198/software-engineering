# Artifact Plane

Artifact Plane provides read-only knowledge exploration of local ADD repositories and optional local Codex execution observation.

## Scope

Discover artifact knowledge and visualize artifact dependencies, knowledge references and maintained system flows. Retrieve source-backed context through local keyword, semantic and graph discovery, HTTP and stdio MCP. Inspect local worktrees and workflow evidence. Observe explicitly bound Codex attempts and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

Version 1.10.0, its originating delivery tasks, and implementation landed on main through the merged project-tabs delivery. Historical snapshot preparation text is retained.

## Current established version

1.11.0

## Established dependencies

- artifact-driven

## Active change

- [Flow readability](changes/change-flow-readability/README.md)


## Knowledge snapshot

- [Requirements](versions/1.11.0/requirements/explorer.md)
- [Specification](versions/1.11.0/specifications/explorer.md)
- [Local server decision](versions/1.11.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.11.0/decisions/002-derived-workflow.md)
- [Task graph requirements](versions/1.11.0/requirements/task-dag.md)
- [Task graph specification](versions/1.11.0/specifications/task-dag.md)
- [Unit-of-work requirements](versions/1.11.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/1.11.0/specifications/units-of-work.md)
- [Implementation evidence](changes/change-flow-discovery/tasks/README.md)

- [Codex execution requirements](versions/1.11.0/requirements/codex-execution.md)
- [Codex execution contract](versions/1.11.0/specifications/codex-execution.md)
- [Codex observer decision](versions/1.11.0/decisions/006-codex-observer.md)

- [Task retention and navigation requirements](versions/1.11.0/requirements/task-retention.md)
- [Retained delivery and navigation contract](versions/1.11.0/specifications/task-retention.md)

- [Automatic update requirements](versions/1.11.0/requirements/live-reload.md)
- [Automatic update contract](versions/1.11.0/specifications/live-reload.md)
- [Lazy loading contract](versions/1.11.0/specifications/lazy-loading.md)
- [Repository update decision](versions/1.11.0/decisions/007-repository-updates.md)

- [Project tab requirements](versions/1.11.0/requirements/project-tabs.md)
- [Project tab contract](versions/1.11.0/specifications/project-tabs.md)

## Publication review

Version 1.11.0 is established through merged PR #21. The complete knowledge snapshot, originating delivery tasks and required implementation match protected main. Artifact Plane, Go and documentation CI checks passed on the reviewed feature revision. This compatible minor version adds flow discovery without removing prior contracts.

- [Flow requirements](versions/1.11.0/requirements/flows.md)
- [Flow contract](versions/1.11.0/specifications/flows.md)

## Proposed patch

[Version 1.11.1](versions/1.11.1/README.md) improves flow status, shortened-source details, shared controls and synchronized panels with lazy newest-first pagination. Its approved [delivery plan](changes/change-flow-readability/tasks/README.md) contains validation evidence. It remains proposed until review and merge; the current established version is 1.11.0.
