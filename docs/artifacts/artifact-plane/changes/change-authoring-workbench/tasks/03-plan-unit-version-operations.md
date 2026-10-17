---
id: plan-unit-version-operations
depends_on: [knowledge-writer]
evidence_records: []
---

# Plan, unit and version operations

## Scope and ownership

Own the operations task.add, task.update, task.remove, task.checklist.set, evidence.record, plan.selfcheck.record, unit.create, unit.member.add, unit.member.remove, unit.acceptance.set, unit.evidence.record, unit.flows.set, version.prepare, publication.record, artifact.migrate and undo in knowledge-operations.js, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, section Operations. ADD task-dag.md, units-of-work.md, evidence-records.md and knowledge-layout.md.

## Prerequisites

Task knowledge-writer. Coordinate the shared service file with task artifact-change-operations through the coordinator when both run in parallel.

## Definition of Done

- [ ] Task operations keep tasks/README.md and the task files consistent: sequence numbers, listed paths, unique IDs, resolved prerequisites and acyclicity checked with buildTaskGraph on the post-image; removal is refused for delivered changes and for tasks that others depend on.
- [ ] task.checklist.set changes only the checkbox characters; evidence.record and plan.selfcheck.record derive their sources, write their sections and validate with the declared-evidence checks.
- [ ] Unit operations enforce safe IDs, unique membership across all briefs, one change per artifact, unique criteria, the integration criterion for several members, resolvable evidence sources and a reasoned empty affected-flow list.
- [ ] version.prepare computes the version from the level, refuses a delivered or missing change and an invalid task graph, reports unchecked DoD items and blocks without acknowledgment, and writes the version record and current_version together; publication.record validates HTTPS identities, derives the repository from the remote, rejects duplicates and writes the review section to the specified file.
- [ ] artifact.migrate reuses planMigration and applyMigration with dry run; undo restores a journal entry and rejects a changed post-image.
- [ ] Tests cover success, each refusal and round-trip line diffs for every operation.

## Evidence

Implementation has not started.
