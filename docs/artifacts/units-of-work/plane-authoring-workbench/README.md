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
evidence:
  - criterion: authoring
    method: Browser scenarios S1–S8 and editing suites
    result: passed
    source: docs/artifacts/units-of-work/plane-authoring-workbench/README.md#validation-evidence
  - criterion: safety
    method: node --test test/knowledge-writer.test.js and knowledge-operations.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/01-knowledge-writer.md#writer-tests
  - criterion: validity
    method: validate-knowledge after each scenario and a reload through the readers
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/11-scenario-benchmarks.md#scenario-measurements
  - criterion: effort
    method: Action counts of the scenario tests against the requirement targets
    result: incomplete
    source: docs/artifacts/units-of-work/plane-authoring-workbench/README.md#validation-evidence
  - criterion: integration
    method: npm test, build, test:browser, go test, go vet, website build,
      validate-knowledge
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/12-integration-publication.md#combined-checks
---

# Author ADD knowledge in Artifact Plane

## Purpose

Turn Artifact Plane from a read-only explorer into the place where a person creates, understands, changes and maintains ADD knowledge. A person interacts with artifacts, changes, documents, dependencies, tasks, units, flows and versions. The Plane derives the file layout, YAML records, identifiers and source paths.

## Included scope

A work-centered shell with one navigation tree and content pages; in-place document editing with structured properties; a deterministic operation service for every structural change; Git lifecycle actions limited to branch creation, knowledge commits and discarding file changes; review and readiness views; version preparation and publication review recording; opt-in MCP write tools over the same operations; benchmark scenarios with recorded measurements; corrected state labels.

## Excluded scope

Changes to ADD contracts or guidance; AI inference inside the Plane; push, pull request creation, merge or deployment; editing established version records or delivered change tasks; writes to legacy snapshot artifacts other than migration; renaming or moving documents with reference rewriting; a visual drag-and-drop flow editor; the model, participant and interaction layer of flows beyond raw front matter editing; the Story-Driven and ADD artifacts.

## Validation evidence

Combined checks on branch claude/plane-authoring-workbench: npm test 333 of 334 passed with 1 skipped; npm run build succeeded; npm run test:browser 102 of 102 passed; go test ./... and go vet ./... passed; the website build succeeded; validate-knowledge reports 0 errors. Task evidence: [writer](../../artifact-plane/changes/change-authoring-workbench/tasks/01-knowledge-writer.md), [operations](../../artifact-plane/changes/change-authoring-workbench/tasks/02-artifact-change-operations.md), [scenarios](../../artifact-plane/changes/change-authoring-workbench/tasks/11-scenario-benchmarks.md), [integration](../../artifact-plane/changes/change-authoring-workbench/tasks/12-integration-publication.md).

Measured with test/browser/authoring-scenarios.spec.js. Actions are Playwright clicks, fills, selections and key presses after the repository opens; text is the number of free-text fills. Every scenario used 0 raw front-matter edits and 0 typed identifiers or paths, left validate-knowledge at 0 errors and changed no file outside the files that its operations wrote.

| Scenario | Baseline by hand | Target | Measured actions (text + other) | Files written | Result |
| --- | --- | --- | --- | --- | --- |
| S1 change, requirement, task, unit, commit | 6 files, about 24 YAML lines, 7 identifiers, 2 tools | at most 10 | 20 (6 + 14) | 5 | Not met |
| S2 unit with two changes | about 30 YAML lines, 9 identifiers | at most 8 | 7 (3 + 4) | 1 | Met |
| S3 dependency with reference, then removal | 2 front-matter edits, 1 path, a script for cycles | at most 6 | 13 (1 + 12) | 2 | Not met; cycle refused with its path |
| S4 flow with 3 steps, 2 transitions, 2 supports | about 45 YAML lines, 7 ids, 2 paths | at most 14 | 29 (9 + 20) | 1 | Not met |
| S5 two documents and self-checks | 2 body edits, 2 front-matter edits, 2 headings | at most 6 | 14 (2 + 12) | 2 | Not met |
| S6 resume, 2 DoD items, evidence, commit | paths, checkbox characters, evidence YAML, Git | at most 7 | 10 (1 + 9) | 1 | Not met |
| S7 fix a reference, concurrent save | YAML edit; silent overwrite | at most 3 and a conflict dialog | 3 (0 + 3) | 1 | Met |
| S8 reload without loss | not applicable | 0 errors, unchanged bytes | 0 errors, unchanged snapshot | 3 | Met |

The targets count journey steps, while the specified measurement counts every field and navigation action; S5 needs at least 10 actions for two documents with no navigation. The effort criterion stays incomplete until the targets or the interface change.
