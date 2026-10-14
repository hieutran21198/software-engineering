---
id: review-context-service
depends_on: [publication-evidence, search-order, worktree-observation]
---

# Derive selected-change review and bounded context

## Scope and ownership

Own a small apps/artifact-plane/server/change-review.js service, reusable contained-reader helpers when required, a pure src/context-packet.js formatter, and focused review/packet Node tests. Preserve upstream fixes and unrelated edits. Coordinate shared reader changes with the coordinator; keep shared artifact updates centralized.

Governing knowledge: R1–R8; specifications/change-review.md, context-packets.md and decisions/009-derived-change-review-context.md. Prerequisite tasks must satisfy their DoD; existing ADD 2.1.0 remains separately required.

## Definition of Done

- [ ] Compare exact safe UTF-8 knowledge counterparts against explicit declared-current baseline; initial/null, invalid/missing and historical-current cases retain distinct labels.
- [ ] Return added/modified/removed/unchanged records with exact both-side IDs/fingerprints and deterministic pages; task evidence stays outside knowledge deltas.
- [ ] Candidate impact derives full explicit closure on both sides, including removed sources, plus separately labeled owning-unit assessment; missing/stale/ambiguous graph inputs never prove exhaustive or empty impact.
- [ ] Packet schema/facts, bounded excerpts, diagnostics, exclusions, source continuation and revision validation meet both contracts; formatted Markdown is inert and matches JSON facts.
- [ ] Source/root/symlink/tracked/UTF-8/size guards, no arbitrary selector, stale cursors, zero budgets, delayed reads and repository fingerprints pass focused tests.
- [ ] Governing sources, scoped publication reasons and approval-not-verified labels reuse corrected upstream semantics; return actual evidence to coordinator.

## Evidence

Implementation has not started; the service and formatter are proposed locations.
