# Project tabs

## Reason and scope

Open multiple local ADD projects in tabs inside Artifact Plane. Restore open projects and the active tab after refresh or browser restart. This change starts from complete Artifact Plane 1.9.0 knowledge, whose implementation and snapshot landed on main through PR #15. Historical delivery evidence stays in its originating change.

All knowledge and implementation belong to this repository. The established artifact-driven dependency remains unchanged. No new upstream contract is needed.

## Knowledge

- [Project tab requirements](requirements/project-tabs.md)
- [Project tab contract](specifications/project-tabs.md)
- [Implementation plan](tasks/README.md)

## Requirement self-check

The user confirmed tabs inside the application and restoration of open projects and the active tab. Scope and observable criteria are defined. Existing read-only, evidence interpretation, and lazy-loading requirements remain applicable. KISS and STE checks passed. Proposed defaults are explicit and subject to plan approval.

## Plan handoff

Requirement, Specification, and Plan self-checks are complete. Explicit user approval is required before implementation.
