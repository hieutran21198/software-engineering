---
id: comparison-service
depends_on: [publication-evidence]
---

Superseded on 16 October 2026 by the in-place layout reading tasks 09 to 13. This file is unlisted historical context and is not executable.

# Add explicit comparison targets to HTTP and MCP

## Scope and ownership

Own server/change-review.js, server/flow-mcp.js and review/adapter tests. Add selector discovery and compatible comparison envelopes.

## Governing knowledge

P2, P3, P7; specifications/evidence-and-comparison.md; specifications/change-review.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Default requests retain declared-current results; version/change selectors compare only safe same-artifact targets.
- [ ] Fixtures distinguish inherited-only, changed-after-predecessor, unchanged and removals, including differences on both baselines; labels make no authorship claim.
- [ ] HTTP/MCP results agree; malformed selectors, missing baseline, cross-context sources and stale cursors fail with specified status or partial evidence.
- [ ] Changing either baseline or worktree during capture invalidates the packet; compare complete eligibility before pagination and keep all source reads contained.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
