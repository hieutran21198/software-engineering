# Artifact Plane

Artifact Plane provides read-only knowledge exploration of local ADD repositories and optional local Codex execution observation.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Observe explicitly bound Codex attempts and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

Version 1.9.0 and its snapshot links on this branch are proposed until required team merge. Version 1.8.0 remains established until then.

## Current established version

1.8.0

## Established dependencies

- artifact-driven

## Active change

- [Automatic updates and faster reloads](changes/change-live-reload/README.md)

## Knowledge snapshot

- [Requirements](versions/1.9.0/requirements/explorer.md)
- [Specification](versions/1.9.0/specifications/explorer.md)
- [Local server decision](versions/1.9.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.9.0/decisions/002-derived-workflow.md)
- [Task graph requirements](versions/1.9.0/requirements/task-dag.md)
- [Task graph specification](versions/1.9.0/specifications/task-dag.md)
- [Unit-of-work requirements](versions/1.9.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/1.9.0/specifications/units-of-work.md)
- [Implementation evidence](changes/change-live-reload/tasks/README.md)

- [Codex execution requirements](versions/1.9.0/requirements/codex-execution.md)
- [Codex execution contract](versions/1.9.0/specifications/codex-execution.md)
- [Codex observer decision](versions/1.9.0/decisions/006-codex-observer.md)

- [Task retention and navigation requirements](versions/1.9.0/requirements/task-retention.md)
- [Retained delivery and navigation contract](versions/1.9.0/specifications/task-retention.md)

- [Automatic update requirements](versions/1.9.0/requirements/live-reload.md)
- [Automatic update contract](versions/1.9.0/specifications/live-reload.md)
- [Lazy loading contract](versions/1.9.0/specifications/lazy-loading.md)
- [Repository update decision](versions/1.9.0/decisions/007-repository-updates.md)
