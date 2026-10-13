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

- [x] Valid fork/join, single/disconnected/empty plans produce exact records and prerequisite edges. Unlisted history is excluded.
- [x] Tests cover legacy unavailable plans, malformed YAML/types/duplicate keys, invalid/duplicate paths, missing files/declarations/IDs, duplicate IDs/prerequisites, self-dependencies, and cycles. Invalid graphs have diagnostics and no execution edges.
- [x] Namespaced identity remains distinct across changes/worktrees. Existing response fields and workflow evidence are preserved.
- [x] Real repository fixtures verify contained reads and unchanged file/Git fingerprints. Run affected Node tests and record results.

## Evidence

Implemented server/task-graph.js, scanner containment checks, and additive workflow response fields. The established ADD 1.1.0 task contract matches the prepared format. The complete Node suite passed 57 tests for this task; integrated UI/layout tests later increased the suite to 60 passing tests. Tests cover fork/join, single/disconnected/empty/legacy graphs, metadata errors, duplicate YAML keys/paths/IDs/prerequisites, unsafe aliases, missing tasks and prerequisites, self-dependencies, cycles, separate changes/worktrees, and unchanged repository/Git fingerprints. Existing workflow inference tests pass. Invalid graphs retain diagnostics and safely readable records with no execution edges. Git/HTTP fixtures required subprocess/local-server access; the restricted runner initially denied those capabilities, and the permitted runner passed. KISS reuses existing readers/libraries and no stored workflow state. STE keeps prerequisites and evidence distinct from authorization and verification.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
