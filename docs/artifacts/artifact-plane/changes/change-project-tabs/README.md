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

Requirement, Specification, and Plan self-checks are complete. The user explicitly approved this plan. Implementation follows the approved defaults; no material contract amendment is needed.

## Implementation handoff

Approved implementation and integrated validation passed. See the current task evidence. The user confirmed version 1.10.0. The complete proposed snapshot preserves source_change provenance and change-owned delivery tasks. Review handoff is linked below.

## Publication handoff

Version 1.10.0 is confirmed and the proposed snapshot is committed on the dedicated branch. Automatic permission review initially rejected publication because destination authorization was not verified. The user then explicitly authorized publishing the implementation and documentation to hieutran21198/software-engineering and opening a PR. The branch is pushed and [review PR #19](https://github.com/hieutran21198/software-engineering/pull/19) is open. Team review and merge remain required for establishment.
