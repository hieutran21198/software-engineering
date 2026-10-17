---
unit_of_work: plane-authoring-workbench
changes:
  - artifact: artifact-plane
    change: change-authoring-workbench
affected_flows:
  - artifact: artifact-plane
    flow: knowledge-authoring
    effect: create
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: project-tabs
    effect: modify
  - artifact: artifact-plane
    flow: repository-refresh
    effect: modify
flow_assessment: Inspected the eight Plane flow records, the explorer, query,
  review, flow, units and workflow modules, the migrate-layout script, the
  browser suites and the rendered application on this repository at 1440 and
  390 pixels. Authoring is a new journey. Exploration, source reading, unit
  inspection, change review, project tabs and refresh change because the shell
  becomes work-centered, documents become editable pages and refresh must keep
  unsaved edits. Context handoff and execution observation keep their readers
  and are excluded; their query services and MCP read tools do not change. ADD
  and Story-Driven journeys are excluded because no ADD contract changes.
acceptance:
  - id: authoring
    criterion: A user creates and maintains artifacts, changes, documents,
      dependencies, references, tasks, units, flows and versions from the Plane
      without typing YAML, identifiers, file paths or heading fragments.
  - id: safety
    criterion: Every write stays inside docs/artifacts of the selected worktree
      on a non-protected branch, preserves unrelated bytes, detects concurrent
      edits, can be previewed and undone, and never edits version records or
      delivered change tasks.
  - id: validity
    criterion: Knowledge written by the eight benchmark scenarios passes
      validate-knowledge with zero error diagnostics and reads back through the
      existing readers without loss.
  - id: effort
    criterion: Each benchmark scenario needs fewer user actions and zero manual
      YAML lines compared with the recorded baseline, as measured by the
      scenario tests.
  - id: integration
    criterion: Node, browser, build, Go and website checks pass for the combined
      change, and the existing HTTP and MCP read interfaces stay compatible.
    integration: true
evidence: []
---

# Author ADD knowledge in Artifact Plane

## Purpose

Turn Artifact Plane from a read-only explorer into the place where a person creates, understands, changes and maintains ADD knowledge. A person interacts with artifacts, changes, documents, dependencies, tasks, units, flows and versions. The Plane derives the file layout, YAML records, identifiers and source paths.

## Included scope

A work-centered shell with one navigation tree and content pages; in-place document editing with structured properties; a deterministic operation service for every structural change; Git lifecycle actions limited to branch creation, knowledge commits and discarding file changes; review and readiness views; version preparation and publication review recording; opt-in MCP write tools over the same operations; benchmark scenarios with recorded measurements; corrected state labels.

## Excluded scope

Changes to ADD contracts or guidance; AI inference inside the Plane; push, pull request creation, merge or deployment; editing established version records or delivered change tasks; writes to legacy snapshot artifacts other than migration; renaming or moving documents with reference rewriting; a visual drag-and-drop flow editor; the model, participant and interaction layer of flows beyond raw front matter editing; the Story-Driven and ADD artifacts.

## Validation evidence

No checks have run. Reference the originating task evidence after validation.
