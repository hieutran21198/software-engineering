---
id: validation
depends_on: [renderer, representations-a, representations-b]
evidence_records: []
---

# Validate the Plane change

## Scope and ownership

Coordinator. Checks over the Plane code, the Plane knowledge and the flow records.

## Governing knowledge

AVP1 to AVP4 in requirements/visual-artifacts.md; the Validation sections of specifications/visual-artifacts.md and specifications/diagram-rendering.md; the flow supports section of the rendering contract.

## Prerequisites

Tasks renderer, representations-a and representations-b meet their DoD.

## Definition of Done

- [ ] Every Mermaid block of the changed Plane knowledge renders in the Plane document page without a note, checked with a browser script on this repository.
- [ ] The flow records repository-exploration and source-retrieval gain implementation and test supports for src/diagram-render.js and its browser test; their steps and transitions are unchanged.
- [ ] `npm test`, the browser tests and `npm run build` in apps/artifact-plane pass; known flaky tests are reported with their runs.
- [ ] Every relative link and anchor of the changed files resolves; validate-knowledge reports no error.

## Evidence

Implementation has not started.
