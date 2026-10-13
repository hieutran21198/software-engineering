---
id: runtime-store
depends_on: []
---

# Persist execution observations and exact task bindings

## Scope and location

Own runtime storage, event normalization/reduction, identity, exact plan binding, and immutable graph-context capture in apps/artifact-plane/server/runtime*.js. Add a local runtime CLI entry and focused Node fixtures. Do not edit repository knowledge through runtime operations.

## Governing contracts

Artifact Plane elements requirements/codex-execution.md, specifications/codex-execution.md, and decisions/006-codex-observer.md in change-codex-execution. Existing knowledge contracts remain applicable. Consume established artifact-driven 1.2.0 task and unit contracts; no proposed upstream contract is required.

## Prerequisites

Explicit user approval of this plan; upstream contracts rechecked; internal dependencies above satisfy their applicable DoD.

## Definition of Done

- [ ] SQLite tests cover concurrent writers, duplicate IDs, schema rejection, restart recovery, and private outside-repository paths including symlink aliases.
- [ ] Binding tests reject invalid/unlisted tasks and isolate repositories, plans, agents, attempts, and retries.
- [ ] State tests cover every specified state, stale activity, late Stop events, multiple attempts, and evidence-backed reported validation without inferred approval/establishment.
- [ ] Temporary Git fixtures prove context/history remains readable after worktree removal and task revision changes.

## Evidence

No implementation or task validation has run.
