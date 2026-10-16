---
id: unit-graphs
depends_on: [unit-reader]
---

# Derive aggregate dependency and implementation graphs

## Scope and location

apps/artifact-plane plain graph modules, server/task-graph.js, graph tests. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- Requirements
- Specification

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [x] Project established/planning artifact edges with transitive external prerequisite closure and no membership-created edges.
- [x] Combine validated member task DAGs through establishment gates; namespace all sources by worktree/unit/artifact/change/task.
- [x] Preserve internal edges and distinguish gate edges from phase sequence; completion does not follow checked tasks alone.
- [x] Test forks/joins, multiple dependents, external gates, disconnected/empty/invalid/legacy plans, identical local task IDs, and combined cycles.
- [x] Historical graph source and current artifact dependency labels match the contract.

## Evidence

Six focused aggregate graph tests and the integrated 86-test suite passed. They verify transitive external closure, member proposals, fork/join sinks and roots through establishment gates, disconnected/empty/invalid/legacy components, namespaced identities, cycles, and missing prerequisites. Internal task edges stay within their owner; gate evidence remains separate from checklist counts.

Commands: node --test test/units-of-work.test.js test/unit-graphs.test.js test/http.test.js and npm test in apps/artifact-plane. Git fixture subprocesses required sandbox escalation. Initial fixture-directory/API expectation failures were corrected and rerun successfully. ADD 1.2.0 established after PR #10 and the contract recheck passed. KISS reuses existing safe scanning, YAML, task graphs, and workflow evidence; STE preserves unknown/proposed/established distinctions. Self-check passed.
