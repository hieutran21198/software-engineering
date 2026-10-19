---
id: brief-service
depends_on: [claims-reader]
---

# Brief service

## Scope and ownership

Implementer in a separate worktree. Files: apps/artifact-plane/server/change-review.js (operation brief and data.brief in the packet), server/change-brief.js (new; answers, ladder, flows, attention, delivery, counts), server/flow-mcp.js (get_change_brief), src/context-packet.js (Markdown section), apps/artifact-plane/README.md (interfaces), test/change-brief.test.js (new), test/review-adapters.test.js.

## Governing knowledge

specifications/review-brief.md, Service and interfaces, Origins, Brief data, Verification ladder and Wording notes; specifications/change-review.md; ADD specifications/change-impact.md; requirements/review-brief.md, B2–B5, B8, B9, P1, P2, P4 and P5.

## Prerequisites

Task claims-reader meets its DoD. Explicit plan approval. ADD 2.9.0 is established on main.

## Definition of Done

- [x] Fixture tests cover an open change and a delivered change: origins, the seven answers in order, empty answers with summary null, the ladder step of each row, attention order and the cap of seven with the count of the rest.
- [x] Fixture tests cover undecided flows (a claim about the flow removes it) and stale claims.
- [x] On this repository the brief of change-hidden-tab-streams shows 6 reached, 1 declared and 5 undecided flows, and the brief of change-impact-intelligence shows 6 reached flows not declared and 5 unresolved items.
- [x] The briefs of the delivered changes of add-agent-efficiency, evidence-and-usability, plane-authoring-workbench and plane-workbench-redesign list their failed or incomplete evidence or unchecked DoD item.
- [x] The brief operation, data.brief of the packet and get_change_brief return the same answers, claims and counts for one revision; existing review and packet tests pass without edits.
- [x] A warm brief on this repository returns in at most 2 seconds; the measurement is recorded.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Open and delivered fixtures | Open change: origin protected-diff, the seven questions in order, summary null exactly when an answer has no item, every item on a ladder step, attention categories in contract order capped at 7 with `more: 1`, the goal line quoting the approval section with "Approval not verified by this reader.", a code file outside the task scope marked Inferred. Delivered change: origin delivery-commit with the introducing commit, failed unit evidence, the unchecked DoD item and a wording note first in attention. Ladder unit test covers every step | Passed | test/change-brief.test.js (B3, B2/B4/B5/B9, B8) |
| Undecided and stale | Without a claim, b:report is undecided and artifact:c is unresolved; a task claim with `about: [b:report]` makes the flow decided by that claim. A unit-brief claim about src/util.js is stale when the diff changes src/util.js and not the brief | Passed | test/change-brief.test.js (B5, open change) |
| Repository counts | change-hidden-tab-streams: 6 reached, 1 declared, 5 undecided. change-impact-intelligence: 12 reached, 6 declared, 6 not declared, 5 unresolved | Passed | Scratchpad probe through createReviewService on this repository, 19 October 2026 |
| Delivered units | add-agent-efficiency: measurements failed. evidence-and-usability (both members): efficient-refresh failed, integration incomplete. plane-authoring-workbench: effort incomplete and five unchecked DoD items. plane-workbench-redesign: the unchecked owner-acceptance item | Passed | Same probe |
| Parity | brief, packet `data.brief` and MCP `get_change_brief` return equal answers, claims, counts, flows and attention for one revision; the packet schema stays change-context.v1; the Markdown export has a Change brief section after Change impact; the MCP tool is read-only and refuses an unknown field. Existing review and packet tests pass; the only edits to existing tests add `get_change_brief` to the two MCP tool inventories (8 → 9 tools) | Passed | test/change-brief.test.js (B9/P4), test/flow-adapters.test.js, test/review-adapters.test.js |
| Warm time | Five warm brief requests for change-hidden-tab-streams: 1131, 1127, 1135, 1108 and 1123 ms; three for the open change-review-brief: 1033, 1050 and 1041 ms (x86_64, 16 cores, impact index warm, in process) | Passed (≤ 2 s) | Same probe |

The contract gap found during the mockups is closed in specifications/review-brief.md: an open or superseded claim takes the step of its basis (observed with evidence → Recorded experiment; inferred → Inferred; documented or static → Explained).

Full suite: `npm test` 376 tests, 375 pass, 0 fail, 1 skipped.
