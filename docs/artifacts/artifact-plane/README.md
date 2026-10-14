# Artifact Plane

Artifact Plane provides read-only knowledge exploration of local ADD repositories and optional local Codex execution observation.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Observe explicitly bound Codex attempts and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

Version 1.10.0 and its snapshot links on this branch are proposed until team review and merge. Version 1.9.0 remains established on main.

## Current established version

1.9.0

## Established dependencies

- artifact-driven

## Active change

- [Project tabs](changes/change-project-tabs/README.md)

## Knowledge snapshot

- [Requirements](versions/1.10.0/requirements/explorer.md)
- [Specification](versions/1.10.0/specifications/explorer.md)
- [Local server decision](versions/1.10.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.10.0/decisions/002-derived-workflow.md)
- [Task graph requirements](versions/1.10.0/requirements/task-dag.md)
- [Task graph specification](versions/1.10.0/specifications/task-dag.md)
- [Unit-of-work requirements](versions/1.10.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/1.10.0/specifications/units-of-work.md)
- [Implementation evidence](changes/change-project-tabs/tasks/README.md)

- [Codex execution requirements](versions/1.10.0/requirements/codex-execution.md)
- [Codex execution contract](versions/1.10.0/specifications/codex-execution.md)
- [Codex observer decision](versions/1.10.0/decisions/006-codex-observer.md)

- [Task retention and navigation requirements](versions/1.10.0/requirements/task-retention.md)
- [Retained delivery and navigation contract](versions/1.10.0/specifications/task-retention.md)

- [Automatic update requirements](versions/1.10.0/requirements/live-reload.md)
- [Automatic update contract](versions/1.10.0/specifications/live-reload.md)
- [Lazy loading contract](versions/1.10.0/specifications/lazy-loading.md)
- [Repository update decision](versions/1.10.0/decisions/007-repository-updates.md)

- [Project tab requirements](versions/1.10.0/requirements/project-tabs.md)
- [Project tab contract](versions/1.10.0/specifications/project-tabs.md)
