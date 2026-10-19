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

- [ ] Fixture tests cover an open change and a delivered change: origins, the seven answers in order, empty answers with summary null, the ladder step of each row, attention order and the cap of seven with the count of the rest.
- [ ] Fixture tests cover undecided flows (a claim about the flow removes it) and stale claims.
- [ ] On this repository the brief of change-hidden-tab-streams shows 6 reached, 1 declared and 5 undecided flows, and the brief of change-impact-intelligence shows 6 reached flows not declared and 5 unresolved items.
- [ ] The briefs of the delivered changes of add-agent-efficiency, evidence-and-usability, plane-authoring-workbench and plane-workbench-redesign list their failed or incomplete evidence or unchecked DoD item.
- [ ] The brief operation, data.brief of the packet and get_change_brief return the same answers, claims and counts for one revision; existing review and packet tests pass without edits.
- [ ] A warm brief on this repository returns in at most 2 seconds; the measurement is recorded.

## Evidence

Implementation has not started.
