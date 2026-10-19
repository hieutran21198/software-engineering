---
id: description
depends_on: [tier-check]
---

# Description

## Scope and ownership

Implementer, `apps/artifact-plane/server/change-review.js`, the MCP server, the packet export and the change page. Add the operation `description`, the tool `get_change_description`, the packet field `data.description` and the "PR description" section with the tier, the criteria results and a Copy button.

## Governing knowledge

specifications/delivery-support.md (PR description); specifications/change-review.md; specifications/review-brief.md; specifications/context-packets.md; requirements/delivery-improvements.md, PI6, PI8, PA5 and PA6.

## Prerequisites

Task tier-check.

## Definition of Done

- [ ] For change-review-brief the Markdown has every section in the specified order and ends with the approval note; a fixture longer than 60,000 characters is cut with an omission line.
- [ ] HTTP, MCP, packet and page return the same text for the same revision (parity test).
- [ ] Browser tests cover the section and the Copy button; screenshots at 1440 and 390 pixels show the section without overflow.
- [ ] `npm test` and `npm run test:browser` pass, and existing review, packet and adapter tests pass without edits.

## Evidence

Not recorded.
