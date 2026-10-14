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
evidence:
  - criterion: tabs
    method: Run project-tab navigation, duplicate, close, keyboard, and viewport cases.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-project-tabs/tasks/02-workspace-tabs.md#evidence
  - criterion: restoration
    method: Check preference validation, page refresh, fresh browser context, unavailable paths, and blocked storage.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-project-tabs/tasks/02-workspace-tabs.md#evidence
  - criterion: integration
    method: Run Node and Chromium regressions, production build, fixture fingerprints, and resource lifecycle checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-project-tabs/tasks/03-validation.md#evidence
---

# Project tabs

## Purpose

Explore multiple projects within Artifact Plane and restore the project workspace on restart.

## Included scope

Project tab controls, independent session navigation, browser-local project restoration, failure recovery, and integrated validation.

## Excluded scope

Project editing, cross-window synchronization, persisted graph data, tab reordering, ADD contract changes, deployment, and merge.

## Validation evidence

The referenced task evidence records 136 passing Node checks, 27 passing browser cases, the production build, fixture fingerprints, resource cleanup, and documentation/task metadata review. These are preparatory delivery checks until the resulting version and required code merge on main. No completed outcome is asserted.

## Review handoff

The user confirmed version 1.10.0 and authorized publication to the configured GitHub repository. [Review PR #19](https://github.com/hieutran21198/software-engineering/pull/19) proposes the complete knowledge snapshot, retained task evidence, and implementation together. Establishment and unit completion require review and merge on main. No merge or deployment occurred.
