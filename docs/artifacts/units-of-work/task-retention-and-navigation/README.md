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
evidence: []
---

# Task retention and navigation simplification

## Purpose

Separate versioned artifact knowledge from change-owned delivery work and simplify Artifact Plane navigation without losing delivery evidence.

## Included scope

ADD lifecycle, provenance and retention rules; canonical and packaged guidance; Artifact Plane historical task resolution, shared evidence checks, and removal of the top-level Workflow canvas. Keep the Workflow view inside each unit. Provide worktree and ungrouped change access through existing repository navigation and inspectors.

## Excluded scope

Established snapshot edits or task deletion, task pagination or completion filtering, lazy loading, new execution controls, deployment, automatic merging, and a workflow state registry.

## Validation evidence

Preparation checks belong to the member plans. Shared acceptance and integration checks have not run. ADD must establish before dependent Plane implementation. No completion is asserted.
