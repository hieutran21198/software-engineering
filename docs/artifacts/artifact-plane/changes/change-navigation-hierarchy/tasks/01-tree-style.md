---
id: tree-style
depends_on: []
evidence_records:
  - id: dod
    method: New shell.spec.js test of offsets, guide lines, margins and weights; CSS review against Tree presentation.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/01-tree-style.md#evidence
---

# Style the tree hierarchy and test it

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/src/styles.css (tree rules) and apps/artifact-plane/test/browser/shell.spec.js (one new test). Sidebar.jsx and work-model.js do not change.

## Governing knowledge

N1–N4 in requirements/navigation-hierarchy.md; Sidebar and Tree presentation in specifications/authoring-workbench.md.

## Prerequisites

Explicit user approval of this plan. ADD 2.6.0 is established.

## Definition of Done

- [x] styles.css sets the left padding of levels 0, 1 and 2 to 8, 28 and 48 pixels; the unused level-3 rule is removed.
- [x] Rows at levels 1 and 2 draw 1 and 2 guide lines in `--guide` at 15 and 35 pixels, extending 1 pixel above and below the row, above the background and without pointer events.
- [x] Level-0 rows have an 8-pixel top margin, except the first tree row and the first row after a heading; artifact rows use weight 500.
- [x] A new shell.spec.js test measures, on the fixture: chevron offsets of 20 pixels between levels 0, 1 and 2; guide line position and width for levels 1 and 2; the margin above the second artifact row and none above the first after the heading; weight 500 on an artifact row and 400 on its kind row.

## Evidence

Executed on 18 October 2026 after the owner approved the plan.

- styles.css: levels 0, 1 and 2 have 8, 28 and 48 pixels of left padding; the unused level-3 rule is removed. Level-1 and level-2 rows draw a `::before` repeating gradient of 1-pixel lines at 15 and 35 pixels, from 1 pixel above to 1 pixel below the row, with pointer-events none. Level-0 rows have an 8-pixel top margin, removed for the first tree row and the first row after a heading. Expandable level-0 rows use weight 500.
- Corrections from the screenshot review in task validation: the line color is the new `--guide` token (#C8C7C1) instead of `--control`, and `.tree-row.show-all` sets margin-top 0, because the shared `.show-all` rule added 8 pixels and broke the lines above the tree's Show all row.
- New test "sidebar tree indents children, draws joined guide lines, spaces groups and weights artifact rows" in shell.spec.js passed. It measured chevron offsets of [20, 20] pixels, no line on the artifact row, a line at 15 pixels, 1 pixel wide, from -1 to -1 pixels with pointer-events none on the kind row, width 21 pixels on the document row, margins of 0, 0 and 8 pixels on the Current work row, the first artifact after the heading and the second artifact, and weights 500, 400 and 400. Its first run failed because the test matched row text that starts with the chevron; the test now matches `.tree-title`.
