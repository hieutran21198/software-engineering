---
id: validation
depends_on: [tree-style]
evidence_records: []
---

# Validate and get owner acceptance

## Scope and ownership

Coordinator. Repository: this repository. Checks over the built browser application and the knowledge. Fixes for failed checks return to task tree-style.

## Governing knowledge

N5 and NA1–NA6 in requirements/navigation-hierarchy.md; the acceptance criteria of the navigation-hierarchy unit.

## Prerequisites

Task tree-style meets its DoD. Explicit user approval of this plan.

## Definition of Done

- [x] `npm test`, `npm run build` and `npm run test:browser` pass in apps/artifact-plane, including the overflow checks at 390, 700, 851 and 1440 pixels. A known flaky test is reported with its rerun result.
- [x] Sidebar screenshots of this repository, from a disposable clone, at 1440 and 390 pixels, with Artifact Plane and Story-Driven Knowledge Framework expanded and one document row selected. The coordinator reviews them as a user (alignment, line joins, spacing, truncation, selected and hover rows) before showing them.
- [ ] The owner accepts the screenshots.
- [x] validate-knowledge reports no errors.

## Evidence

Executed on 18 October 2026 on the combined branch.

- `npm test`: 336 passed, 0 failed, 1 skipped. `npm run build` passed. `npm run test:browser`: 94 passed, including the drawer and overflow checks, on the final CSS. No flaky failure occurred.
- Screenshots: a disposable clone of this repository on this branch, with a local main, served by `PORT=4321 node server/index.js` with a private state directory. Artifact Plane and Story-Driven Knowledge Framework are expanded, Artifact Plane Specifications is expanded and its first document is selected. Sidebar captures at 1440 and 390 pixels report no horizontal overflow.
- Review as a user, first capture: the guide lines broke above "Show all 25", and on the selected row the line looked faint. The fixes are recorded in task tree-style. Second capture: the lines join through every group and through Show all; a pixel sample of a 4x capture shows both lines on the selected row (200,199,193 at x=27 and x=47 CSS pixels). Children start one step to the right of their parents. Artifacts are separated by visibly more space than the rows in a group, and artifact rows read as group titles. Document titles at the default 264-pixel width truncate 20 pixels earlier than in 1.17.0, because level 2 moved from 28 to 48 pixels; the sidebar can still be resized up to 400 pixels.
- validate-knowledge: 0 errors, 1 existing info diagnostic.
- Owner acceptance: pending.
