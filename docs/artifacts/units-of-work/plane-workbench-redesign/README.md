---
unit_of_work: plane-workbench-redesign
changes:
  - artifact: artifact-plane
    change: change-workbench-redesign
affected_flows:
  - artifact: artifact-plane
    flow: knowledge-authoring
    effect: modify
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
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
flow_assessment: Inspected the nine Plane flow records, the browser
  application source and the rendered pages on this repository at 1440 pixels.
  The eight listed flows change because their browser steps and their browser
  test supports change with the new shell, sidebar and pages. Context handoff
  is excluded because its packets, HTTP routes and MCP tools do not change.
  ADD and Story-Driven journeys are excluded because no ADD contract changes.
acceptance:
  - id: mockups
    criterion: The owner approves static mockups of the work, artifact with
      document, change with plan, flow and unit pages before implementation.
  - id: usability
    criterion: The built pages match the approved mockups at 1440 and 390
      pixels, have one navigation, one title and one control per action, and
      the owner accepts them.
  - id: authoring
    criterion: Benchmark scenarios S1 to S8 still pass with no YAML, no typed
      identifiers or paths and no validation errors, and no scenario needs more
      actions than in 1.16.0.
  - id: integration
    criterion: Node, browser, build, Go and website checks pass for the combined
      change, and the HTTP and MCP interfaces stay compatible.
    integration: true
evidence:
  - criterion: mockups
    method: Owner review of the seven mockups on the design canvas.
    result: passed
    source: docs/artifacts/units-of-work/plane-workbench-redesign/README.md#validation-evidence
  - criterion: authoring
    method: Run the S1 to S8 scenario suite twice with the 1.16.0 action limits.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md#scenario-counts
  - criterion: integration
    method: Run the Node, browser, build, Go and website checks on the combined branch.
    result: passed
    source: docs/artifacts/units-of-work/plane-workbench-redesign/README.md#validation-evidence
---

# Redesign the authoring workbench

## Purpose

Make Artifact Plane a tool that people want to open to write and change ADD knowledge. The 1.16.0 operations stay. The browser application gets one calm, light, document-first layout in which each action has one place.

## Included scope

The application shell and sidebar; the work, artifact, document, change, unit, flow and graph pages; inline editing of lists and properties; one visual style; the placement of Codex execution views and behavior discovery; the browser tests and scenario measurements.

## Excluded scope

Server operations, the knowledge writer, Git actions, HTTP and MCP interfaces, the readers, ADD contracts and the Story-Driven and ADD artifacts. A dark theme. Drag-and-drop graph editing.

## Validation evidence

Mockup review: on 17 October 2026 the owner reviewed the design canvas "Artifact Plane redesign mockups" with seven artboards (work, artifact, document, change with plan, unit, flow, and work at 390 pixels) and approved them before Specification.

Combined checks on branch claude/plane-workbench-redesign, after the merge of all task branches:
- In apps/artifact-plane, `npm test`: 337 tests, 336 passed, 1 skipped, 0 failed.
- `npm run build` succeeded.
- `npx playwright test` with the Nix Chromium: 93 of 93 passed in two runs.
- `go test ./...` and `go vet ./...` passed.
- The website build (`npm run build` in website) succeeded.
- `node apps/artifact-plane/scripts/validate-knowledge.mjs .` reports 0 errors.

The HTTP and MCP interfaces are unchanged except for the optional element and change `title` fields, and their Node tests pass without edits.
