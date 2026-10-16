---
id: model-explanations
depends_on: [comparison-interface]
---

# Explain dependencies and model interactions

## Scope and ownership

Own model/flow parsing and indexing, src/model.js, graph edge inspector, Flows.jsx, flow-canvas.js and focused tests. Coordinator owns pilot knowledge and source evidence.

## Governing knowledge

P4 and model-explanations P1-P6; specifications/model-explanations.md; specifications/domain-model.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Dependency selection shows supplier/consumer direction, recorded reasons, selector/status and exact sources; missing reasons remain explicit.
- [ ] Named models group by owner; selected steps expose actions/outcomes and branch/loop context with source navigation and known participation.
- [ ] Tests cover duplicate/missing models, unsafe sources, self interactions, legacy fallback, shared model identity across flows, unresolved reasons and parallel edge statuses.
- [ ] HTTP/MCP graph/detail/impact parity and invalidation preserve project/worktree/snapshot isolation. Browser checks cover keyboard focus, source return and desktop/narrow layouts.
- [ ] Record fresh delivery evidence under this change. Do not mark old model-explanations tasks or its unit complete using a different source_change.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
