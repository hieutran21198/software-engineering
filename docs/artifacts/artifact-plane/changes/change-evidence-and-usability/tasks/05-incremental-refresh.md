---
id: incremental-refresh
depends_on: [model-explanations]
---

# Reduce idle full reads with bounded recovery

## Scope and ownership

Own server/repository-events.js, observation integration, reload hooks where required, benchmark script and observer/refresh tests.

## Governing knowledge

P5, P7; specifications/incremental-observation.md; decisions/012-incremental-observation.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Initial/full reconciliation and incremental invalidation agree on final fingerprints; repeated same-size preserved-timestamp edits, nested creation, rename/delete and registered source edits are detected.
- [ ] Fake-clock/event tests prove dropped-event recovery within interval plus scan duration, bounded queues/handles, no overlapping scans, fallback visibility and final-subscriber cleanup.
- [ ] Real filesystem tests cover ref/status/worktree changes, watcher failure/exhaustion, stale recovery and read-only behavior.
- [ ] Run the same 60-second large fixture before/after: at least 80 percent fewer knowledge bytes read, with CPU/duration/counts and limits reported. A failed target returns to Specification/Plan rather than weakening correctness silently.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
