---
id: model-projection
depends_on: []
---

# Parse and index model-aware flows and edge reasons

## Scope and ownership

Own apps/artifact-plane/src/model.js and server model/flow/index/query/impact code and focused Node tests. Derive dependency explanations and model nodes/interaction edges; expose additive responses through existing HTTP/MCP paths.

## Governing knowledge

P1-P6; specifications/model-explanations.md; required newly established ADD model contract.

## Prerequisites

Explicit concrete-plan approval and listed prerequisite DoD are required. All tasks wait for the new ADD contract to establish, followed by contract recheck. PR #26 is an unpublished same-artifact predecessor: reconcile its reviewed tree and merge before downstream implementation; no early current-version repair or historical rewrite is authorized.

## Definition of Done

Tests cover matching consumer snapshots, supplier direction, proposed/removed parallel edges, deduplication, missing reasons, model duplicates/missing paths, self-interactions, legacy flow fallback, multi-flow identity, graph/impact and HTTP-MCP parity. Verify refresh invalidates affected indexed data and project/worktree separation remains.

## Evidence

Not executed during preparation. Record actual commands, results and limitations after implementation.
