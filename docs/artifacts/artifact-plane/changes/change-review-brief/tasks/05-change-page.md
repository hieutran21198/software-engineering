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

- [x] The Change brief section sits between the phase steps and the plan, shows the seven rows in order, hides empty rows and opens the attention row.
- [x] Claim cards, the hypothesis table and the flows table match the approved mockups.
- [x] "Record my check" keeps its submit button disabled until "What you observed" has text and calls claim.verify; the card then shows "Checked by a person".
- [x] No row shows the word verified for an agent record without "not independent".
- [x] Document and flow pages show the wording note only for records of delivered work.
- [x] Browser tests pass for section order, expansion, the check form, one title and one navigation, and no horizontal overflow at 390, 700, 851 and 1440 pixels.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Section and rows | The section order on the change page is Phases > Change brief > Plan; rows follow the seven questions, rows with no item are hidden, and only "What should I care about?" is open | Passed | test/browser/change-brief.spec.js, first test |
| Mockup match | Claim cards (kind, status, step, statement, basis, evidence, about, "Wrong if", check, "In", folded rejected options), the hypothesis table of one task file and the flows table with "Decided by" match the approved mockup. Screenshots of a disposable clone of this repository at 1440 and 390 pixels: open change change-review-brief with illustrative claims, and delivered change change-hidden-tab-streams (6 flows reached, 1 declared, 5 undecided; one wording note) | Passed | Scratchpad screenshots of 19 October 2026 |
| Person's check | The submit button is disabled until "What you observed" has text; submit calls claim.verify; the card shows "Checked by a person" and status verified; the task file has `verified_by: person` and the `missing-index-check` section | Passed | test/browser/change-brief.spec.js, first test |
| Agent qualifier | An agent-verified claim shows "verified by an agent, not independent" and the step "Re-checked by an agent, not independent"; no status on the page shows verified without "not independent" except the person's check | Passed | Same test |
| Wording notes | An unchanged specification with "remain pending" shows the inferred note; a document added on the branch with the same sentence shows none; an unchanged flow record with the sentence wrapped in its YAML gaps shows the note. A delivered change brief lists its wording notes | Passed | test/browser/change-brief.spec.js, second test; delivered screenshot |
| Browser checks | One h1 and one navigation; no horizontal overflow at 1440, 851, 700 and 390 pixels; no page error. Full browser suite 107 passed; node suite 375 passed, 1 skipped | Passed | `npx playwright test`; `npm test` |

The change brief loads with the page through `POST /api/review/query` (operation brief) and reloads when the repository changes. Check and challenge forms appear only on a writable branch for changes that are not retained.
