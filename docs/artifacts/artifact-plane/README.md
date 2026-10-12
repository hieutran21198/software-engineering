# Artifact Plane

Artifact Plane provides read-only exploration of local ADD repositories.

## Scope

Discover artifact knowledge and visualize artifact and element dependencies. Inspect local worktrees and workflow evidence. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

## Current established version

1.3.0

## Established dependencies

None.

## Proposed release

Version 1.3.0 is prepared on the change branch. It replaces the text-first Workflow view with an interactive canvas and phase evidence in the resizable inspector. Version 1.2.0 remains established on main until the required knowledge and implementation merge. This section describes proposed state until merge.

## Knowledge snapshot

- [Requirements](versions/1.3.0/requirements/explorer.md)
- [Specification](versions/1.3.0/specifications/explorer.md)
- [Local server decision](versions/1.3.0/decisions/001-local-server.md)
- [Derived workflow decision](versions/1.3.0/decisions/002-derived-workflow.md)
- [Implementation evidence](versions/1.3.0/tasks/README.md)

## Active change

[Workflow canvas](changes/change-workflow-canvas/README.md)
