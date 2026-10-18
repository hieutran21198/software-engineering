---
id: validation
depends_on: [hidden-tab-streams, reply-guard]
---

# Validate the combined result

## Scope and ownership

Coordinator. Repository: this repository. Checks over the built browser application and the knowledge. Fixes for failed checks return to the owning task.

## Governing knowledge

R11–R12 in requirements/live-reload.md; the acceptance criteria of the hidden-tab-streams unit.

## Prerequisites

Tasks hidden-tab-streams and reply-guard meet their DoD. Explicit user approval of this plan.

## Definition of Done

- [ ] `npm test` and `npm run build` pass in apps/artifact-plane. A known flaky test is reported with its rerun result.
- [ ] `npm run test:browser` passes twice.
- [ ] The diagnosis probe (three tabs, document in the third) runs on a private server copy of this repository with the first two pages hidden and shows the document text instead of "Request timed out".
- [ ] validate-knowledge reports no errors.

## Evidence

Validation has not started.
