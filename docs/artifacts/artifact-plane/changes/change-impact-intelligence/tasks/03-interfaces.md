---
id: interfaces
depends_on:
  - impact-service
---

# Interfaces

## Scope and ownership

Own the route in apps/artifact-plane/server/http.js, the tool in server/flow-mcp.js, the delegation in server/flow-index.js (impact operation) and the packet field in server/change-review.js and src/context-packet.js, with tests in test/http.test.js, test/flow-adapters.test.js, test/review-adapters.test.js and test/context-packet.test.js.

## Governing knowledge

specifications/change-impact.md, section Interfaces. specifications/context-packets.md, Change-impact amendment. specifications/flows.md, Change-impact amendment. requirements/change-impact.md, I7.

## Prerequisites

Task impact-service satisfies its DoD.

## Definition of Done

- [ ] POST /api/impact/query validates its fields like the flow query, rejects unknown fields and unregistered worktrees, and returns the envelope with data, diagnostics and omissions.
- [ ] The MCP tool get_change_impact has read-only annotations, accepts the same inputs, and returns structuredContent and the compact text; HTTP and MCP return identical facts for the same query.
- [ ] The flow query impact operation and get_impact_context delegate to the service and keep their result shape, ordering and cursors; the existing flow and review tests pass without edits.
- [ ] The packet adds data.impact.tiers with the coverage statement under tiers.coverage, the schema name is unchanged, and the Markdown export shows a Change impact section after Recorded flow impact.
- [ ] README documents the route, the tool, the delegation and the packet field.

## Evidence

No checks have run.
