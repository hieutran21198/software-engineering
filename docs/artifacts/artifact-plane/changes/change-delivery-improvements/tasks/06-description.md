---
id: description
depends_on: [tier-check]
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI6, PA5, PA6]
---

# Description

## Scope and ownership

Implementer, `apps/artifact-plane/server/change-review.js`, the MCP server, the packet export and the change page. Add the operation `description`, the tool `get_change_description`, the packet field `data.description` and the "PR description" section with the tier, the criteria results and a Copy button.

## Governing knowledge

specifications/delivery-support.md (PR description); specifications/change-review.md; specifications/review-brief.md; specifications/context-packets.md; requirements/delivery-improvements.md, PI6, PI8, PA5 and PA6.

## Prerequisites

Task tier-check.

## Definition of Done

- [x] For change-review-brief the Markdown has every section in the specified order and ends with the approval note; a fixture longer than 60,000 characters is cut with an omission line.
- [x] HTTP, MCP, packet and page return the same text for the same revision (parity test).
- [x] Browser tests cover the section and the Copy button; screenshots at 1440 and 390 pixels show the section without overflow.
- [x] `npm test` and `npm run test:browser` pass, and existing review, packet and adapter tests pass without edits.

## Evidence

An implementer agent delivered this task in a separate worktree (commits 9842812 and a0f1e34, merged); the coordinator reviewed it, looked at the screenshots, merged it and ran the suites again.

| DoD item | Check | Result |
| --- | --- | --- |
| Sections and cut | `test/change-description.test.js`: on this repository, the description of change-review-brief has the ten sections in order and ends with "Approval is not recorded by this description."; a fixture checks each section's content (R2 changed and not covered, R3 added and covered, computed version 1.1.0 from 1.0.0); a small change shows its README plan paragraph; 2,500 requirement IDs give at most 60,000 characters and an omission line that names the Requirement coverage section | Passed |
| Parity | One test: the operation, `POST /api/review/query` with `operation: description`, MCP `get_change_description` (read-only annotations) and the packet `data.description` return the same Markdown, tier and revision; an unknown field and an unknown change are refused. The browser test compares the page text and the copied text with the HTTP Markdown | Passed |
| Page | `test/browser/pr-description.spec.js`: the seven criteria rows, the tier summary, the section position, Copy with clipboard read-back and no overflow at 1440 and 390 pixels. The coordinator looked at the four screenshots: the table and the Markdown are readable, nothing overflows, and at 390 pixels the Copy button wraps to its own line. The wording "1 upstream artifacts" and "All 0 changed knowledge files" in the tier details was corrected in server/tier-check.js | Passed |
| Suites | On the combined branch: `npm test` 409 tests, 408 passed, 0 failed, 1 skipped; `npm run build` exits 0; `npm run test:browser` 108 passed | Passed |

Exception to "existing tests pass without edits" (PA6): three assertions list the MCP tools exactly (test/flow-adapters.test.js: the tool names and a count of 9; test/review-adapters.test.js: a count of 9). PI6 adds the tool `get_change_description`, so each now names it or counts 10; no assertion about tool behavior changed. PI8 allows the addition. Decisions: the Validator section lists the scoped record checks and the tier diagnostics; "X of Y DoD items" counts every checkbox of the task file; evidence results come from `evidence_records` only; the packet also runs the tier and record checks.
