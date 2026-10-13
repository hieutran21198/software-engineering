# Artifact Plane

Artifact Plane provides read-only exploration of local ADD repositories.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

## Current established version

1.5.0

## Proposed release

The 1.5.0 declaration, dependency, and snapshot describe proposed post-merge state on this branch. Version 1.4.0 remains established on main until team merge. Version 1.5.0 adds per-change implementation task graphs and task evidence inspection; ADD 1.1.0 is already established.

## Established dependencies

- artifact-driven

## Knowledge snapshot

- [Requirements](versions/1.5.0/requirements/explorer.md)
- [Specification](versions/1.5.0/specifications/explorer.md)
- [Local server decision](versions/1.5.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.5.0/decisions/002-derived-workflow.md)
- [Task graph requirements](versions/1.5.0/requirements/task-dag.md)
- [Task graph specification](versions/1.5.0/specifications/task-dag.md)
- [Implementation evidence](versions/1.5.0/tasks/README.md)

## Active change

[Implementation task DAG](changes/change-implementation-task-dag/README.md).
