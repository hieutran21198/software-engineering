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

- [ ] HTTP tests cover origin/host restrictions, payload limits, contained root/context query, missing runtime storage, and no mutation or arbitrary file-read route.
- [ ] SSE tests verify initial invalidation, concurrent changes, reconnect refetch, client limits, cleanup, and no watcher when clients disconnect.
- [ ] Restart and archived-context queries recover observations without the removed worktree; repository/Git fingerprints remain unchanged.

## Evidence

No implementation or task validation has run.
