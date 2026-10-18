---
id: interfaces
depends_on:
  - impact-service
evidence_records:
  - id: interface-checks
    method: node --test of the http, flow-adapters, review-adapters, change-review, context-packet, flow-index and impact tests; npm test with a temporary state directory
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/03-interfaces.md#interface-checks
---

# Interfaces

## Scope and ownership

Own the route in apps/artifact-plane/server/http.js, the tool in server/flow-mcp.js, the delegation in server/flow-index.js (impact operation) and the packet field in server/change-review.js and src/context-packet.js, with tests in test/http.test.js, test/flow-adapters.test.js, test/review-adapters.test.js and test/context-packet.test.js.

## Governing knowledge

specifications/change-impact.md, section Interfaces. specifications/context-packets.md, Change-impact amendment. specifications/flows.md, Change-impact amendment. requirements/change-impact.md, I7.

## Prerequisites

Task impact-service satisfies its DoD.

## Definition of Done

- [x] POST /api/impact/query validates its fields like the flow query, rejects unknown fields and unregistered worktrees, and returns the envelope with data, diagnostics and omissions.
- [x] The MCP tool get_change_impact has read-only annotations, accepts the same inputs, and returns structuredContent and the compact text; HTTP and MCP return identical facts for the same query.
- [x] The flow query impact operation and get_impact_context delegate to the service and keep their result shape, ordering and cursors; the existing flow and review tests pass without edits.
- [x] The packet adds data.impact.tiers with the coverage statement under tiers.coverage, the schema name is unchanged, and the Markdown export shows a Change impact section after Recorded flow impact.
- [x] README documents the route, the tool, the delegation and the packet field.

## Evidence

### interface-checks

Checked on 18 October 2026 on branch claude/impact-interfaces (commits a35c5d4, fbb0b5c, 55faa67, the merge 1f36b5d with task flow-reads, and 424ade9), merged into claude/impact-intelligence.

POST /api/impact/query uses the body parsing and host and origin checks of the other routes; the service rejects an unknown field with 400, and no origin mode, two modes, depth 5, an unregistered worktree or an invalid knowledge selector with 422; a valid query returns the envelope with data, diagnostics and omissions. The MCP tool get_change_impact has read-only annotations and the same inputs and returns the envelope as structuredContent and the compact text; a test confirms that HTTP and MCP return identical data apart from timing fields. The flow query impact operation and get_impact_context delegate to the service at depth 4 through the flow service's fingerprint-cached load, keep flow summaries with paths in the former source, target, kind and reason form, unresolved IDs, artifactOptions, the artifact scope, newest-first ordering and cursors, and cap each tier at 200 entities with a truncated-impact diagnostic. Review and packet responses add data.impact.tiers with counts, the first entities per tier with paths, and the coverage under tiers.coverage, because data.impact.coverage already holds the v1 text; the Markdown export has a Change impact section after Recorded flow impact; the schema name is unchanged. README documents the route, the tool, the delegation and the packet field.

Six assertions in existing tests changed: the expected MCP tool list and the stdio tool count (7 to 8) in test/flow-adapters.test.js and test/review-adapters.test.js, which follow from the new tool, and four loader-call counts in test/flow-index.test.js, which follow from the single cached read of task flow-reads. No other existing assertion changed. A fix in server/impact-index.js makes every update check for the go command, so two processes sharing an index report Go coverage alike.

The test script runs with a fresh private state directory from mktemp and removes it afterwards; test/review-adapters.test.js passes a temporary --state-dir to the stdio server, because the MCP stdio client does not forward ARTIFACT_PLANE_STATE_DIR. `npm test`: 359 tests, 358 passed, 1 skipped, 0 failed; the files in ~/.local/state/artifact-plane were not modified during the run. The selected test list: 74 tests, 73 passed, 1 skipped.
