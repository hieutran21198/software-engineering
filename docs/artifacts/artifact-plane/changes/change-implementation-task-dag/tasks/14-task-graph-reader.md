---
id: task-graph-reader
depends_on: []
---

# Read and validate task graphs

## Scope and governing references

Repository: software-engineering. Own a small task graph parsing module in apps/artifact-plane/server, its integration into server/workflow.js and existing contained reading, and reader/unit fixtures. Preserve current API fields and phase inference.

P2/P4/P5; specifications/task-dag.md. Upstream reference: artifact-driven, element specifications/task-dag.md, requires plan membership and task metadata contract; currently proposed by change-implementation-task-dag.

## Prerequisites

The required ADD contract must be established and rechecked. Explicit user approval of this plan is required.

## Definition of Done

- [ ] Valid fork/join, single/disconnected/empty plans produce exact records and prerequisite edges. Unlisted history is excluded.
- [ ] Tests cover legacy unavailable plans, malformed YAML/types/duplicate keys, invalid/duplicate paths, missing files/declarations/IDs, duplicate IDs/prerequisites, self-dependencies, and cycles. Invalid graphs have diagnostics and no execution edges.
- [ ] Namespaced identity remains distinct across changes/worktrees. Existing response fields and workflow evidence are preserved.
- [ ] Real repository fixtures verify contained reads and unchanged file/Git fingerprints. Run affected Node tests and record results.

## Evidence

Implementation has not started. Record actual commands, results, and source/test references after execution.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
