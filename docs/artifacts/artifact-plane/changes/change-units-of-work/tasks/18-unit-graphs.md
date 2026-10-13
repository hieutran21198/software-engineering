---
id: unit-graphs
depends_on: [unit-reader]
---

# Derive aggregate dependency and implementation graphs

## Scope and location

apps/artifact-plane plain graph modules, server/task-graph.js, graph tests. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [ ] Project established/planning artifact edges with transitive external prerequisite closure and no membership-created edges.
- [ ] Combine validated member task DAGs through establishment gates; namespace all sources by worktree/unit/artifact/change/task.
- [ ] Preserve internal edges and distinguish gate edges from phase sequence; completion does not follow checked tasks alone.
- [ ] Test forks/joins, multiple dependents, external gates, disconnected/empty/invalid/legacy plans, identical local task IDs, and combined cycles.
- [ ] Historical graph source and current artifact dependency labels match the contract.

## Evidence

Implementation has not started. Record commands/review methods, results, and source references here during approved execution. KISS and STE checks are part of the task self-check.
