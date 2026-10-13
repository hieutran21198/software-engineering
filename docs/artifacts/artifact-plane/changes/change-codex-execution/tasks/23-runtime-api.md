---
id: runtime-api
depends_on: ["runtime-store"]
---

# Expose local execution queries and SSE invalidation

## Scope and location

Own read-only runtime routes and store-change watcher in apps/artifact-plane/server/http.js and runtime API helpers. Preserve current knowledge routes and loopback/origin checks.

## Governing contracts

Artifact Plane elements requirements/codex-execution.md, specifications/codex-execution.md, and decisions/006-codex-observer.md in change-codex-execution. Existing knowledge contracts remain applicable. Consume established artifact-driven 1.2.0 task and unit contracts; no proposed upstream contract is required.

## Prerequisites

Explicit user approval of this plan; upstream contracts rechecked; internal dependencies above satisfy their applicable DoD.

## Definition of Done

- [x] HTTP tests cover origin/host restrictions, payload limits, contained root/context query, missing runtime storage, and no mutation or arbitrary file-read route.
- [x] SSE tests verify initial invalidation, concurrent changes, reconnect refetch, client limits, cleanup, and no watcher when clients disconnect.
- [x] Restart and archived-context queries recover observations without the removed worktree; repository/Git fingerprints remain unchanged.

## Evidence

node --test test/runtime-api.test.js passed both API fixtures. Checks cover host/origin validation, payload limits, query semantics, initial/live SSE invalidation, client limits/disconnect cleanup, restart freshness, unavailable runtime storage, no mutation route, and repository fingerprints. Full npm test also passed 102 tests after integration. KISS uses one watcher only while SSE clients exist; STE retains Unknown semantics.
