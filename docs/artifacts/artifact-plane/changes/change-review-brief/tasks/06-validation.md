---
id: validation
depends_on: [change-page]
---

# Validate the combined result

## Scope and ownership

Coordinator. Checks over the built Plane, this repository and the knowledge; the version record and identity record of artifact-plane; the unit evidence.

## Governing knowledge

requirements/review-brief.md, P1–P7; the acceptance criteria of the human-cognitive-support unit.

## Prerequisites

Task change-page meets its DoD. Explicit plan approval. ADD 2.9.0 is established.

## Definition of Done

- [ ] `npm test` and `npm run build` pass in apps/artifact-plane; a known flaky test is reported with its rerun result.
- [ ] `npm run test:browser` passes twice.
- [ ] The repository checks of task brief-service hold on the combined branch.
- [ ] Screenshots of the built brief at 1440 and 390 pixels match the approved mockups.
- [ ] The owner opens the brief on real changes of this repository, answers the seven questions from it and accepts the page; the acceptance is recorded in the unit brief.
- [ ] validate-knowledge reports no error.
- [ ] The version record versions/1.20.0/README.md names source_change change-review-brief and the identity record sets current_version 1.20.0, after the user confirms the level.

## Evidence

Implementation has not started.
