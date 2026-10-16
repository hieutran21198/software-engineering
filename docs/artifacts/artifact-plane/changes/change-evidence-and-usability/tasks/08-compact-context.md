---
id: compact-context
depends_on: [comparison-service]
evidence_records: []
---

Superseded on 16 October 2026 by the in-place layout reading tasks 09 to 13. This file is unlisted historical context and is not executable.

# Bound complete agent context responses

## Scope and ownership

Implementer owns server/change-review.js, server/flow-mcp.js, HTTP/MCP/context tests
and one benchmark script under apps/artifact-plane/scripts. Coordinator owns project
knowledge. Reuse existing captured facts and source registration. No UI or cache.

## Governing knowledge and prerequisites

requirements/agent-efficiency.md R1-R6/A1-A5; specifications/compact-context.md;
context-packets.md and evidence-and-comparison.md. Explicit approval of this
extension, comparison-service DoD and verified established ADD 2.3.0 are required.
No dependency on proposed ADD 2.4.0 is introduced.

## Definition of Done

- [ ] Optional compact request returns the specified schema, budgets, category totals, limits and continuation; default requests retain existing v1 behavior.
- [ ] Entire HTTP JSON and MCP tool result fit accepted 4096/16384/65536 byte caps, including multibyte/escaped text, diagnostics and wrapper. Test bounded rejection of unfit identity/items and invalid budgets.
- [ ] Traverse complete metadata without silent loss, duplicate-page ambiguity or incorrect full-impact eligibility. Reconstruct registered source text and reject stale/cross-context/comparison/format cursors. Preserve read-only containment and inert text.
- [ ] HTTP/MCP facts and cursors agree, compact MCP avoids duplicated structuredContent, and default adapter output remains compatible.
- [ ] Add a repeatable benchmark with 10,100,1000 sources and the representative repository selection. At 16384 bytes, first compact MCP result is at least 80 percent smaller than default large-fixture and representative results. Record initial/traversal bytes, pages, capture count and elapsed time; do not promise a latency or model-token improvement.
- [ ] Existing context, adapter and source-safety regressions pass; feed fresh evidence to the existing integration join and unit compact-context criterion.

## Evidence

Not executed. This is proposed additional scope; no earlier approval or baseline
test result proves its implementation or completion.
