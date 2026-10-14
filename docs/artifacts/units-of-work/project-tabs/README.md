---
unit_of_work: project-tabs
changes:
  - artifact: artifact-plane
    change: change-project-tabs
acceptance:
  - id: tabs
    criterion: Multiple projects can be opened, switched, and closed with independent session navigation.
  - id: restoration
    criterion: Open project paths, order, and the active project restore after page or browser restart, with recoverable per-project failures.
  - id: integration
    criterion: Integrated checks verify request isolation, resource cleanup, existing exploration behavior, and unchanged inspected repository bytes and Git state.
    integration: true
evidence: []
---

# Project tabs

## Purpose

Explore multiple projects within Artifact Plane and restore the project workspace on restart.

## Included scope

Project tab controls, independent session navigation, browser-local project restoration, failure recovery, and integrated validation.

## Excluded scope

Project editing, cross-window synchronization, persisted graph data, tab reordering, ADD contract changes, deployment, and merge.

## Validation evidence

No implementation checks have run. Evidence will be recorded in the originating delivery tasks and referenced here after validation.
