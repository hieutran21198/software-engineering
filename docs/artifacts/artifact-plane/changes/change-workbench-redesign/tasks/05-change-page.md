---
id: change-page
depends_on: [style-and-shell]
evidence_records:
  - id: change-review
    method: Page build and screenshot comparison with the Change mockup
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/05-change-page.md#change-review
  - id: change-suite
    method: npx playwright test test/browser/change-page.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/05-change-page.md#change-suite
---

# Change page

## Scope and ownership

Own apps/artifact-plane/src/pages/ChangePage.jsx and the parts of Delivery.jsx, TaskGraph.jsx and ChangeReview.jsx that it still needs, moved into modules without presentation.

## Governing knowledge

specifications/authoring-workbench.md, sections Change page and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [x] The header shows the eyebrow with artifact, change and unit (or Add to unit), the change title once, and Read reason and scope; the phase steps link completed phases and offer Record self-check for the current one.
- [x] The plan table shows status, ID, task, After and Done; a row expands in place with DoD checkboxes, evidence, Record evidence, Edit task (with Remove) and Open task document; "+ Add task" and Record plan self-check work; Graph shows the task canvas inline.
- [x] Changed knowledge lists the change's documents by title with badges and an inline Compare.
- [x] Ready for a version shows the readiness items with fix links, Prepare version with preview and acknowledgment, and Record publication review for a merged version without a review.
- [x] No Overview, Plan or Review tabs remain, and no label combines Delivered and proposed.
- [x] Screenshots at 1440 and 390 pixels match the Change mockup.

## Evidence

### change-review

Checked on a disposable clone at 1440 and 390 pixels, and at 700 and 851 pixels for the overview: one h1, unique control names and 0 pixels of overflow in every state. The coordinator compared the screenshots with the Change mockup. The checks covered:
- the header eyebrow with Add to unit, and phase steps with Record self-check;
- the plan table with in-place task rows: DoD, evidence, Edit task with Remove, Open task document;
- "+ Add task" and Record plan self-check, and the task graph;
- Changed knowledge with inline Compare and Export context;
- readiness with fix links, Prepare version with preview and acknowledgment, and Record publication review;
- delivered changes read only.

There are no tabs, and labels read "Delivered X" or "Version X prepared" alone.

Implementation: src/pages/ChangePage.jsx, ChangePagePlan.jsx, ChangePageReview.jsx, ChangePageModel.js and ChangePage.css.

### change-suite

`change-page.spec.js`: 15 of 15 passed. This includes a regression test for observed execution on a legacy change, which failed before the fix in src/Runtime.jsx.
