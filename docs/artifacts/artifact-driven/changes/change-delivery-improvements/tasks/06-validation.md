---
id: validation
depends_on: [bundle-source, tier-guidance, role-skills, repository-setup, small-replay]
---

# Validation

## Scope and ownership

Coordinator. Combined checks of the ADD change, the unit evidence of the criteria that the ADD change can support, and the version record.

## Governing knowledge

requirements/delivery-improvements.md, A1 to A7 and DI15; the unit brief docs/artifacts/units-of-work/delivery-improvements/README.md.

## Prerequisites

Tasks bundle-source, tier-guidance, role-skills, repository-setup and small-replay.

## Definition of Done

- [x] `go test ./...`, `go vet ./...` and `npm run build` in website pass on the combined branch; the release build archive lists the full bundle and `tools/README.md`.
- [x] The Plane validator reports no new error on this repository (A5).
- [x] For each of the five guarantees, a row in the evidence names the contract statement or check that holds it for small, medium and large changes (A6).
- [x] A configuration fixture with a changed `max_code_lines` changes the result of the code-limit criterion when the rule is applied by hand; the automated check moves to the Plane validator (A7).
- [x] The unit brief evidence records the reading and guarantees criteria from task evidence; the version record `versions/3.0.0/README.md` and `current_version: 3.0.0` are prepared after the owner confirmed the major level.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Combined checks and archive | On the branch tip: `go vet ./...` and `go test ./...` pass; `npm run build` in website exits 0 with 44 bundle pages; `CGO_ENABLED=0 go build -trimpath ./cmd/se-adopt` (the release command) builds a binary whose adoption into an empty directory creates 52 files; `diff -r -x '*.go'` of `docs/artifact-driven` and the adopted directory reports no difference, and the adopted bundle contains `tools/README.md` | Passed | Commands in this row |
| A5 | The Plane validator of the main checkout reports 1 information diagnostic (`retained-legacy-change`) on `main` and the same single diagnostic on this branch; no error or warning | Passed | `node scripts/validate-knowledge.mjs` on both checkouts |
| A6 | The guarantee table below | Passed | The table below |
| A7 | In the replay clone of task small-replay, `docs/artifacts/add.config.yaml` with `tiers.small.max_code_lines: 50` was parsed, and the code-limit rule was applied by hand to the 57 code and test lines: default 100 gives pass, 50 gives fail, so the allowed tier becomes medium. The automated check is Plane task tier-check | Passed (by hand) | This row |
| Unit evidence and version | The unit brief has evidence entries for `reading` and `guarantees`. `versions/3.0.0/README.md` names `source_change: change-delivery-improvements`; `current_version` is 3.0.0, computed from 2.9.0 on `main` and the major level that the owner confirmed with the plan approval | Passed | `docs/artifacts/units-of-work/delivery-improvements/README.md`, `versions/3.0.0/README.md` |

| Guarantee | Small | Medium and large |
| --- | --- | --- |
| `main` shows the current truth | Lifecycle step 1 of workflow.md and the tier table of change-tiers.md: requirements and specifications are edited in place on the change branch for every tier. The replay edits live-reload.md, project-tabs.md and explorer.md in commit 1 of the branch that holds the code | Unchanged lifecycle |
| Traceability | `covers` with `covers-unknown-id` and `requirement-uncovered` (record-checks.md, Covers); the replay task covers R4 and R7, the two changed IDs | The same checks; the plan needs no prose coverage |
| Versions and the established rule | The tier table requires the version record and identity record for every tier; establishment needs the merge to the protected branch (validation.md, Establishing a Version). The replay writes 1.18.1 | Unchanged |
| Upstream wait | Criterion upstream-established: an unestablished upstream makes a change not small | dependencies.md: a task starts only after required upstream contracts are established; `upstream-unestablished` warns |
| A person approves a large plan | A change is small only when one-artifact and no-contract pass, so a small change is never large | The tier table and flow change-delivery: plan to approval for medium and large, explicit approval before implementation |

Not yet supported: the unit criteria small-path (run of the default-install validator on the replay), validator, review, scores and integration need the Plane version and are recorded after it.
