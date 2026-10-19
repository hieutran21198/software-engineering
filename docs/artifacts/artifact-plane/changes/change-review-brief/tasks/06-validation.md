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

- [x] `npm test` and `npm run build` pass in apps/artifact-plane; a known flaky test is reported with its rerun result.
- [x] `npm run test:browser` passes twice.
- [x] The repository checks of task brief-service hold on the combined branch.
- [x] Screenshots of the built brief at 1440 and 390 pixels match the approved mockups.
- [x] The owner opens the brief on real changes of this repository, answers the seven questions from it and accepts the page; the acceptance is recorded in the unit brief.
- [x] validate-knowledge reports no error.
- [x] The version record versions/1.20.0/README.md names source_change change-review-brief and the identity record sets current_version 1.20.0, after the user confirms the level.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Node and build | `npm test`: 376 tests, 375 pass, 0 fail, 1 skipped (the Go index test skips when the test environment has no go command). `npm run build` exits 0. The known flaky SQLite test did not fail in these runs | Passed | Commands on commit 839c089 |
| Browser twice | `npx playwright test` (the test:browser script) on a separate port: 107 passed in 4.1 min, then 107 passed in 4.0 min | Passed | Commands on commit 839c089 |
| Repository checks | Same counts as task brief-service on the combined branch: hidden-tab 6/1/5, impact-intelligence 6 not declared and 5 unresolved, the four delivered units with their failed or incomplete evidence or unchecked DoD; warm briefs 1097–1137 ms | Passed | Scratchpad probe, 19 October 2026 |
| Screenshots | The built page at 1440 and 390 pixels on a disposable clone matches the approved mockup in order, rows, cards, tables and the check form; see task change-page | Passed | Scratchpad screenshots |
| Owner acceptance | The owner opened the built brief on changes of this repository and accepted the page on 19 October 2026; recorded in the unit brief | Passed | units-of-work/human-cognitive-support/README.md#owner-acceptance |
| validate-knowledge | 0 errors; one info diagnostic `retained-legacy-change`, unchanged | Passed | `node apps/artifact-plane/scripts/validate-knowledge.mjs .` |
| Version | The user confirmed 1.20.0 on 19 October 2026. versions/1.20.0/README.md names source_change change-review-brief; the identity record and package.json set 1.20.0 | Passed | versions/1.20.0/README.md |

Integration criterion: `go test ./...` passes, both bundle copies are identical apart from the existing required-skills directory, and `npm run build` in website exits 0.
