---
id: validation
depends_on: [hidden-tab-streams, reply-guard]
evidence_records:
  - id: dod
    method: npm test, build, two full browser runs, the three-tab diagnosis probe on a private server copy, and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/03-validation.md#evidence
---

# Validate the combined result

## Scope and ownership

Coordinator. Repository: this repository. Checks over the built browser application and the knowledge. Fixes for failed checks return to the owning task.

## Governing knowledge

R11–R12 in requirements/live-reload.md; the acceptance criteria of the hidden-tab-streams unit.

## Prerequisites

Tasks hidden-tab-streams and reply-guard meet their DoD. Explicit user approval of this plan.

## Definition of Done

- [x] `npm test` and `npm run build` pass in apps/artifact-plane. A known flaky test is reported with its rerun result.
- [x] `npm run test:browser` passes twice.
- [x] The diagnosis probe (three tabs, document in the third) runs on a private server copy of this repository with the first two pages hidden and shows the document text instead of "Request timed out".
- [x] validate-knowledge reports no errors.

## Evidence

Executed on 18 October 2026 on the combined branch.

- `npm test`: 365 tests, 364 passed, 0 failed, 1 skipped. The known flaky SQLite test did not fail. `npm run build` passed.
- `npm run test:browser` with a private state directory on port 4331: 102 passed in run 1 and 102 passed in run 2.
- Diagnosis probe on a private server copy of this repository (port 4321, private state directory), three pages in one browser context: with pages 1 and 2 hidden, page 3 showed the text of "Automatic updates and reload performance" 1.1 seconds after the read started. Before the fix, the same probe showed "Request timed out. Retry this evidence read." after 30 seconds.
- Limit, observed in the same probe with all three pages visible: page 3 still timed out. In a normal browser only the front tab of each window is visible, so this occurs only with three or more Plane windows visible at the same time. A shared stream for all tabs is out of scope.
- validate-knowledge: 0 errors, 18 flows, 1 existing info diagnostic.
