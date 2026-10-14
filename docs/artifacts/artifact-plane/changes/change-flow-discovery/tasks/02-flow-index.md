---
id: flow-index
depends_on: [flow-reader]
---

# Maintain the local flow index

## Scope and governing knowledge

Own the separate SQLite cache, FTS5/chunks/vectors, local model-install command, offline embedding runtime, search ranking and source-fingerprint invalidation. Follow exact model/revision and freshness contract.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [ ] Atomic rebuilds and process concurrency preserve complete index generations.
- [ ] Actual installed model runs offline; missing/corrupt model diagnostics preserve keyword/graph discovery.
- [ ] Changed/deleted/renamed/dirty sources invalidate affected records and vectors without cross-worktree leakage.

## Evidence

No implementation checks have run for this task.
