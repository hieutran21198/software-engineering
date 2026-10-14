---
id: flow-index
depends_on: [flow-reader]
---

# Maintain the local flow index

## Scope and governing knowledge

Own the separate SQLite cache, FTS5/chunks/vectors, local model-install command, offline embedding runtime, search ranking and source-fingerprint invalidation. Follow exact model/revision and freshness contract.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Atomic rebuilds and process concurrency preserve complete index generations.
- [x] Actual installed model runs offline; missing/corrupt model diagnostics preserve keyword/graph discovery.
- [x] Changed/deleted/renamed/dirty sources invalidate affected records and vectors without cross-worktree leakage.

## Evidence

Implementation uses a private SQLite index with FTS5, atomic generations, reverse links and cached Float32 vectors. The pinned model and tokenizer have independent SHA256 checks. Normal inference uses local files only and disables remote models and runtime assets.

Checks: FLOW_MODEL_STATE=/tmp/plane-flow-model-state node --test test/flow-index.test.js test/flow-model-integrity.test.js test/flow-adapters.test.js passed all 24 tests with no skips. The actual installed model produced finite 384-dimensional normalized vectors with network fetch disabled; related text similarity was higher than unrelated text. Tests cover process concurrency, interrupted asynchronous rebuilds, vector reuse, source deletion/rename, isolated worktrees, bounded context, missing/corrupt assets, altered manifests, and safe graceful close. Final full Node regression passed 179 tests, including the actual model.

KISS and STE self-check: one derived cache serves both adapters. Freshness, source publication, coverage and authorization retain separate meanings. No workflow state or hosted inference was added.
