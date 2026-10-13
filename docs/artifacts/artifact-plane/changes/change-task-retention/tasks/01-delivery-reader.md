---
id: delivery-reader
depends_on: []
---

# Resolve change-owned historical delivery

## Scope and ownership

Repository: this repository. Locations: apps/artifact-plane/server/units-of-work.js, workflow.js, unit-graphs.js, reader.js if needed, matching Node fixtures/tests.

Read the established ADD delivery contract. Resolve new marker/provenance into separate knowledge and delivery paths; build exact retained task graphs and protected-ref evidence checks. Preserve legacy resolution, unit completion, worktree isolation, phase history, and safe access.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md. Requires established ADD specifications/task-retention.md from change-task-retention and a recorded contract recheck before any implementation. Explicit plan approval is also required. Internal prerequisites: none. Required predecessor DoD must pass before starting.

## Definition of Done

- [x] Targeted units-of-work, workflow/history, task-graph and unit-graph checks pass for the new layout and legacy fixtures.
- [x] Missing/invalid marker, missing source, modified/deleted/added task records, conflicting/unavailable protected refs and branch-only evidence cannot support completion.
- [x] Delivered history classification and version-preparation evidence remain correct when version snapshots lack task copies.
- [x] Next-change plans do not replace historical graphs; task IDs and runtime source bindings remain correct; read-only fingerprints pass.

## Evidence

Targeted Node reader/workflow/history/task/unit-graph suites passed 81 checks. The final npm test in apps/artifact-plane passed 120 checks. git diff --check passed.

Fixtures verify exact originating delivery sources, task-free delivered history/version-preparation association, missing/invalid markers and sources, changed/deleted/added task records and plan membership, UTF-8 byte differences, conflicting/unavailable protected refs, branch-only sources, invalid plans, next-change isolation, and read-only fingerprints. Existing legacy fixtures still pass.

member.sourcePath remains delivered knowledge; member.deliveryPath identifies the exact task source. Workflow/task identities and runtime bindings remain unchanged. KISS reuses scanner/Git/task graph mechanisms and STE preserves evidence uncertainty. The reader task DoD is satisfied; navigation can begin.
