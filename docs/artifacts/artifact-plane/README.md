# Artifact Plane

Artifact Plane provides read-only knowledge exploration of local ADD repositories and optional local Codex execution observation.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Observe explicitly bound Codex attempts and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

The version and snapshot links on this branch are proposed until required knowledge and implementation changes merge.

## Current established version

1.7.0

## Established dependencies

- artifact-driven

## Active change

- [Task retention and navigation simplification](changes/change-task-retention/README.md)

## Knowledge snapshot

- [Requirements](versions/1.7.0/requirements/explorer.md)
- [Specification](versions/1.7.0/specifications/explorer.md)
- [Local server decision](versions/1.7.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.7.0/decisions/002-derived-workflow.md)
- [Task graph requirements](versions/1.7.0/requirements/task-dag.md)
- [Task graph specification](versions/1.7.0/specifications/task-dag.md)
- [Unit-of-work requirements](versions/1.7.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/1.7.0/specifications/units-of-work.md)
- [Implementation evidence](versions/1.7.0/tasks/README.md)

- [Codex execution requirements](versions/1.7.0/requirements/codex-execution.md)
- [Codex execution contract](versions/1.7.0/specifications/codex-execution.md)
- [Codex observer decision](versions/1.7.0/decisions/006-codex-observer.md)
