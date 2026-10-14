---
tasks:
  - 01-project-sessions.md
  - 02-workspace-tabs.md
  - 03-validation.md
---

# Project tab implementation plan

## Approval boundary

Requirement and Specification are complete. Implementation requires explicit user approval of this plan. All work is in this repository. Artifact Plane 1.9.0 and ADD 2.0.0 are established on main; no new upstream contract is required.

## Ordered tasks

1. [Isolate project sessions](01-project-sessions.md): extract explorer ownership and implement active/inactive lifecycle.
2. [Workspace tabs and restoration](02-workspace-tabs.md): add tab controls, duplicate handling, and browser persistence.
3. [Integrated validation and delivery](03-validation.md): verify isolation, restoration, cleanup, regressions, and read-only behavior.

Execute sequentially because the workspace shell depends on project lifecycle contracts and both tasks touch current explorer wiring. No parallel implementer is needed. Record current validation in these tasks; prior evidence does not prove the new behavior.

## Plan self-check

All seven local acceptance criteria and all shared unit criteria map to the task DoD. Task IDs are unique; prerequisites resolve and form a three-task chain without cycles. Scope, locations, contract references, failure cases, and validation are explicit. KISS and STE checks passed. Proposed defaults include one tab per canonical path, lazy restored inactive projects, and persistence of paths/order/active project only.

## Delivery

After approved implementation and passing validation, propose a minor version because this adds a compatible user capability. Ask the user to confirm the version. Prepare the full snapshot without tasks, with source_change: change-project-tabs and delivery_tasks: change. Update the unit evidence, artifact root, and DAG consistently. Push the branch and prepare a review PR; stop for team review and merge.
