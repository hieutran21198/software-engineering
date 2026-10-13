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
---

# Task retention and navigation simplification

## Purpose

Separate versioned artifact knowledge from change-owned delivery work and simplify Artifact Plane navigation without losing delivery evidence.

## Included scope

ADD lifecycle, provenance and retention rules; canonical and packaged guidance; Artifact Plane historical task resolution, shared evidence checks, and removal of the top-level Workflow canvas. Keep the Workflow view inside each unit. Provide worktree and ungrouped change access through existing repository navigation and inspectors.

## Excluded scope

Established snapshot edits or task deletion, task pagination or completion filtering, lazy loading, new execution controls, deployment, automatic merging, and a workflow state registry.

## Validation evidence

ADD Go tests, go vet, the website build, bundle fidelity, Markdown links/hierarchy, and task-free snapshot checks passed. Evidence remains in the originating change. Plane acceptance and shared integration checks have not run. ADD must establish before dependent Plane implementation. No completion is asserted.
