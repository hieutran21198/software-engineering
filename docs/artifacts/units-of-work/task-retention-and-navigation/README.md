---
unit_of_work: task-retention-and-navigation
changes:
  - artifact: artifact-driven
    change: change-task-retention
  - artifact: artifact-plane
    change: change-task-retention
acceptance:
  - id: knowledge-delivery
    criterion: New ADD versions contain complete artifact knowledge without task copies and retain traceable delivery plans and evidence in their originating changes.
  - id: plane-navigation
    criterion: Artifact Plane removes the standalone Workflow tab and retains unit views, worktree access, histories, and task evidence for current and legacy repositories.
  - id: integration
    criterion: Plane resolves change-owned delivery evidence under the established ADD contract and preserves legacy snapshots, honest completion, and read-only behavior.
    integration: true
evidence:
  - criterion: knowledge-delivery
    method: Review task-free version contents and run adoption/fidelity, documentation build, and link checks.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-task-retention/tasks/02-delivery-validation.md#evidence
  - criterion: plane-navigation
    method: Run reader and browser checks for navigation, retained task sources, worktrees, histories, and runtime observation.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-task-retention/tasks/02-navigation.md#evidence
  - criterion: integration
    method: Run the complete Node/Chromium suites, both builds, and Go adoption/fidelity checks.
    result: passed
    source: docs/artifacts/units-of-work/task-retention-and-navigation/README.md#combined-checks
---

# Task retention and navigation simplification

## Purpose

Separate versioned artifact knowledge from change-owned delivery work and simplify Artifact Plane navigation without losing delivery evidence.

## Included scope

ADD lifecycle, provenance and retention rules; canonical and packaged guidance; Artifact Plane historical task resolution, shared evidence checks, and removal of the top-level Workflow canvas. Keep the Workflow view inside each unit. Provide worktree and ungrouped change access through existing repository navigation and inspectors.

## Excluded scope

Established snapshot edits or task deletion, task pagination or completion filtering, lazy loading, new execution controls, deployment, automatic merging, and a workflow state registry.

## Validation evidence

ADD Go tests, go vet, the website build, bundle fidelity, Markdown links/hierarchy, and task-free snapshot checks passed. Evidence remains in the originating change. Plane acceptance and combined integration checks passed as recorded below. ADD 2.0.0 established after PR #13 merged and its contract was rechecked before Plane implementation. Plane 1.8.0 remains proposed until review/merge; no completed shared outcome is asserted.

## Combined checks

Against established ADD 2.0.0, npm test in apps/artifact-plane passed 120 Node checks; npm run build passed; npm run test:browser passed 17 Chromium acceptance cases. GOCACHE=/tmp/software-engineering-retention-go-cache go test ./... and go vet ./... passed at repository root. npm run build in website passed. The system Chromium path was supplied through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for local browser checks.

Fixtures cover exact originating task sources, task-free version knowledge, legacy snapshots, protected-ref path/byte publication, modified/missing evidence and honest completion. Browser checks cover removal of only the top-level Workflow, retained unit views, phase/commit/history access, worktrees, runtime/archived attempts, responsive controls, refresh, and read-only fingerprints. Detailed member evidence stays in its originating change. Snapshot/link/hierarchy checks confirm that new versions contain no task directory and old delivered records remain intact.

## Publication review

artifact-driven 2.0.0: All required knowledge and implementation changes have landed on main after PR #13. The user reported the merge; Git verified the version and retained originating tasks on main before Plane implementation. Plane 1.8.0 remains proposed until required review/merge.
