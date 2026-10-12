# Artifact Plane

Artifact Plane provides read-only exploration of local ADD repositories.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

## Current established version

1.2.0

## Established dependencies

None.

## Proposed release

Version 1.2.0 is prepared on the change branch. It separates Change histories from current knowledge and adds local worktree, inferred step, and commit evidence views. Version 1.1.0 remains established on main until the required knowledge and implementation merge. This section describes proposed state until merge.

## Knowledge snapshot

- [Requirements](versions/1.2.0/requirements/explorer.md)
- [Specification](versions/1.2.0/specifications/explorer.md)
- [Local server decision](versions/1.2.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.2.0/decisions/002-derived-workflow.md)
- [Implementation evidence](versions/1.2.0/tasks/README.md)

## Active change

[Change histories and workflow evidence](changes/change-history-workflows/README.md)
