---
id: validation
depends_on: [renderer, representations-a, representations-b]
evidence_records:
  - id: dod
    method: Real-knowledge rendering in the Plane, flow supports, unit and browser suites, build, link check and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/04-validation.md#evidence
---

# Validate the Plane change

## Scope and ownership

Coordinator. Checks over the Plane code, the Plane knowledge and the flow records.

## Governing knowledge

AVP1 to AVP4 in requirements/visual-artifacts.md; the Validation sections of specifications/visual-artifacts.md and specifications/diagram-rendering.md; the flow supports section of the rendering contract.

## Prerequisites

Tasks renderer, representations-a and representations-b meet their DoD.

## Definition of Done

- [x] Every Mermaid block of the changed Plane knowledge renders in the Plane document page without a note, checked with a browser script on this repository.
- [x] The flow records repository-exploration and source-retrieval gain implementation and test supports for src/diagram-render.js and its browser test; their steps and transitions are unchanged.
- [x] `npm test`, the browser tests and `npm run build` in apps/artifact-plane pass; known flaky tests are reported with their runs.
- [x] Every relative link and anchor of the changed files resolves; validate-knowledge reports no error.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan.

- Real knowledge: a browser script opened, in the Plane document page on a disposable clone of this repository, every document of the unit with a Mermaid block: knowledge-editing.md (2), project-tabs.md (1), codex-execution.md (1) and story-driven framework.md (1), at 1440 and 390 pixels. Each block is an SVG with its title and description and no note, and the page does not scroll horizontally. Widths in the 720-pixel column at 1440 after the two layout changes: write path 850 and 663 pixels shown at 720 and 663, Codex update path 864 at 720, tab lifecycle 927 at 720, Story-Driven graph 1,093 at 820 with scrolling inside the figure. Before the changes the sequence diagrams were 1,511 to 1,732 pixels wide.
- Tables: the marked lexer finds 13 new tables and 2 tree listings in the twelve Plane specifications, as the Decisions table of the contract lists; the browser suite renders the document page.
- Flow supports: repository-exploration (step inspect) and source-retrieval (step read) have diagram-rendering-contract, diagram-renderer (implementation, src/diagram-render.js, symbol renderDiagrams, basis static) and diagram-browser (test, observed, evidence in task renderer). Steps and transitions are unchanged.
- Suites: `npm test` 364 tests, 363 passed, 1 skipped, 0 failed; `npm run test:browser` 103 passed; `npm run build` succeeds; `npm ci` succeeds with package version 1.19.0.
- Links: 335 relative links and anchors under docs/artifacts resolve. validate-knowledge reports 0 errors and the existing info diagnostic retained-legacy-change.
