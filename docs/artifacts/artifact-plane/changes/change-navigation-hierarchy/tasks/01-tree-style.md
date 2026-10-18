---
id: tree-style
depends_on: []
evidence_records: []
---

# Style the tree hierarchy and test it

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/src/styles.css (tree rules) and apps/artifact-plane/test/browser/shell.spec.js (one new test). Sidebar.jsx and work-model.js do not change.

## Governing knowledge

N1–N4 in requirements/navigation-hierarchy.md; Sidebar and Tree presentation in specifications/authoring-workbench.md.

## Prerequisites

Explicit user approval of this plan. ADD 2.6.0 is established.

## Definition of Done

- [ ] styles.css sets the left padding of levels 0, 1 and 2 to 8, 28 and 48 pixels; the unused level-3 rule is removed.
- [ ] Rows at levels 1 and 2 draw 1 and 2 guide lines in `--control` at 15 and 35 pixels, extending 1 pixel above and below the row, above the background and without pointer events.
- [ ] Level-0 rows have an 8-pixel top margin, except the first tree row and the first row after a heading; artifact rows use weight 500.
- [ ] A new shell.spec.js test measures, on the fixture: chevron offsets of 20 pixels between levels 0, 1 and 2; guide line position and width for levels 1 and 2; the margin above the second artifact row and none above the first after the heading; weight 500 on an artifact row and 400 on its kind row.

## Evidence

Implementation has not started.
