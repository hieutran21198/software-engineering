---
id: change-page
depends_on: [claim-operations, brief-service, mockups]
---

# Change page

## Scope and ownership

Implementer in a separate worktree. Files: apps/artifact-plane/src/pages/ChangePage.jsx, src/pages/ChangePageBrief.jsx (new), src/pages/ChangePage.css, src/pages/DocumentPage.jsx and src/pages/FlowPage.jsx (wording notes), test/browser/change-page.spec.js and a new browser spec for the brief.

## Governing knowledge

specifications/review-brief.md, Change page, Verification ladder and Wording notes; the approved mockups; requirements/review-brief.md, B1, B3, B5, B8, B10 and B11.

## Prerequisites

Tasks claim-operations, brief-service and mockups meet their DoD. Explicit plan approval.

## Definition of Done

- [ ] The Change brief section sits between the phase steps and the plan, shows the seven rows in order, hides empty rows and opens the attention row.
- [ ] Claim cards, the hypothesis table and the flows table match the approved mockups.
- [ ] "Record my check" keeps its submit button disabled until "What you observed" has text and calls claim.verify; the card then shows "Checked by a person".
- [ ] No row shows the word verified for an agent record without "not independent".
- [ ] Document and flow pages show the wording note only for records of delivered work.
- [ ] Browser tests pass for section order, expansion, the check form, one title and one navigation, and no horizontal overflow at 390, 700, 851 and 1440 pixels.

## Evidence

Implementation has not started.
