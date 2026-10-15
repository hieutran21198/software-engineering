---
id: review-context-service
depends_on: [publication-evidence, search-order, worktree-observation]
---

# Derive selected-change review and bounded context

## Scope and ownership

Own a small apps/artifact-plane/server/change-review.js service, reusable contained-reader helpers when required, a pure src/context-packet.js formatter, and focused review/packet Node tests. Preserve upstream fixes and unrelated edits. Coordinate shared reader changes with the coordinator; keep shared artifact updates centralized.

Governing knowledge: R1–R8; specifications/change-review.md, context-packets.md and decisions/009-derived-change-review-context.md. Prerequisite tasks must satisfy their DoD; existing ADD 2.1.0 remains separately required.

## Definition of Done

- [x] Compare exact safe UTF-8 knowledge counterparts against explicit declared-current baseline; initial/null, invalid/missing and historical-current cases retain distinct labels.
- [x] Return added/modified/removed/unchanged records with exact both-side IDs/fingerprints and deterministic pages; task evidence stays outside knowledge deltas.
- [x] Candidate impact derives full explicit closure on both sides, including removed sources, plus separately labeled owning-unit assessment; missing/stale/ambiguous graph inputs never prove exhaustive or empty impact.
- [x] Packet schema/facts, bounded excerpts, diagnostics, exclusions, source continuation and revision validation meet both contracts; formatted Markdown is inert and matches JSON facts.
- [x] Source/root/symlink/tracked/UTF-8/size guards, no arbitrary selector, stale cursors, zero budgets, delayed reads and repository fingerprints pass focused tests.
- [x] Governing sources, scoped publication reasons and approval-not-verified labels reuse corrected upstream semantics; return actual evidence to coordinator.

## Evidence

Implemented in commits f59bc84 and 3ee1a42. Focused service, publication and unit checks passed: 89 tests, no skips. The service corpus check returned baseline 1.11.0, 39 records and seven candidate flows with exactly 12,000 excerpt characters. Tracked bytes, symlink identities, HEAD and status remained unchanged. Tests cover bounded excerpts, both-side closure, source guards, cursor invalidation, races and repeated dirty support edits. Commit 085937f makes Markdown sections readable, prioritizes scope and changed excerpts, and keeps unavailable evidence partial. Fourteen focused service/formatter checks passed with no skips. Source text and hostile metadata remain inert.

Commit 341d565 corrects unreadable comparison directories, observed flow evidence and retained historical publication inputs. Unavailable sources cannot prove additions or removals. Observed trace bytes participate in source registration, revision checks and repository observation. Historical evidence does not enter current knowledge deltas. Service, formatter and unit suites passed 57 tests with no skips.
