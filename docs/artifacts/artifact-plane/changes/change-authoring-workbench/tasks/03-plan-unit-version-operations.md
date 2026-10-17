---
id: plan-unit-version-operations
depends_on: [knowledge-writer]
evidence_records:
  - id: operation-tests
    method: node --test test/knowledge-operations.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/03-plan-unit-version-operations.md#operation-tests
---

# Plan, unit and version operations

## Scope and ownership

Own the operations task.add, task.update, task.remove, task.checklist.set, evidence.record, plan.selfcheck.record, unit.create, unit.member.add, unit.member.remove, unit.acceptance.set, unit.evidence.record, unit.flows.set, version.prepare, publication.record, artifact.migrate and undo in knowledge-operations.js, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, section Operations. ADD task-dag.md, units-of-work.md, evidence-records.md and knowledge-layout.md.

## Prerequisites

Task knowledge-writer. Coordinate the shared service file with task artifact-change-operations through the coordinator when both run in parallel.

## Definition of Done

- [x] Task operations keep tasks/README.md and the task files consistent: sequence numbers, listed paths, unique IDs, resolved prerequisites and acyclicity checked with buildTaskGraph on the post-image; removal is refused for delivered changes and for tasks that others depend on.
- [x] task.checklist.set changes only the checkbox characters; evidence.record and plan.selfcheck.record derive their sources, write their sections and validate with the declared-evidence checks.
- [x] Unit operations enforce safe IDs, unique membership across all briefs, one change per artifact, unique criteria, the integration criterion for several members, resolvable evidence sources and a reasoned empty affected-flow list.
- [x] version.prepare computes the version from the level, refuses a delivered or missing change and an invalid task graph, reports unchecked DoD items and blocks without acknowledgment, and writes the version record and current_version together; publication.record validates HTTPS identities, derives the repository from the remote, rejects duplicates and writes the review section to the specified file.
- [x] artifact.migrate reuses planMigration and applyMigration with dry run; undo restores a journal entry and rejects a changed post-image.
- [x] Tests cover success, each refusal and round-trip line diffs for every operation.

## Evidence

### operation-tests

Checked in apps/artifact-plane at commit 8514ef3: 8 of 8 tests passed. Covered for this task: task.add with sequence numbers and listed paths, unknown prerequisite refusal, task.remove refused while another task depends on it, task.checklist.set changing one checkbox line, task.update keeping the checked state of unchanged DoD items, evidence.record and plan.selfcheck.record producing declared Plan and Validation evidence without diagnostics, version.prepare blocking three unchecked items without acknowledgment and writing the version record and current_version 1.1.0 together, delivered tasks refused afterwards, publication.record validating HTTPS identities, deriving the repository from an SSH origin and rejecting a duplicate pair, unit.create with integration and flow assessment rules, claimed membership refusal, unit.member.add and remove, unit.evidence.record with source resolution and Combined checks, unit.acceptance.set keeping evidenced criteria, unit.flows.set, artifact.migrate preview and apply, and undo with its conflict. validate-knowledge reports 0 errors after each sequence.
