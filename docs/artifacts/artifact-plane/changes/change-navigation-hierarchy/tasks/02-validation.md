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

- [ ] `npm test`, `npm run build` and `npm run test:browser` pass in apps/artifact-plane, including the overflow checks at 390, 700, 851 and 1440 pixels. A known flaky test is reported with its rerun result.
- [ ] Sidebar screenshots of this repository, from a disposable clone, at 1440 and 390 pixels, with Artifact Plane and Story-Driven Knowledge Framework expanded and one document row selected. The coordinator reviews them as a user (alignment, line joins, spacing, truncation, selected and hover rows) before showing them.
- [ ] The owner accepts the screenshots.
- [ ] validate-knowledge reports no errors.

## Evidence

Implementation has not started.
