---
id: small-replay
depends_on: [role-skills]
---

# Small replay

## Scope and ownership

Coordinator, as implementer. In a temporary copy of this repository at the merge base of Artifact Plane change-hidden-tab-streams (#37), write that change again as a small change with the copied scaffold of task tier-guidance: change README with tier and plan, the requirement and specification edits, `tasks/README.md`, one task with `covers`, the version record and the identity record. Apply the code of #37. Commit knowledge once and implementation with the version once. Do not commit the replay to this repository; record the counts and the method in the evidence.

## Governing knowledge

specifications/delivery-tiers.md; specifications/record-checks.md; requirements/delivery-improvements.md, A1.

## Prerequisites

Task role-skills.

## Definition of Done

- [ ] The replay has at most 7 knowledge files and at most 160 knowledge lines (`git diff --numstat` on `docs/artifacts`), 2 commits and 1 human gate (the PR review).
- [ ] The installed Plane validator of this repository reports no error on the replay, and the rules of record-checks.md that it does not implement yet are checked by hand and listed.
- [x] Each small-tier criterion of the change is recorded with its result and decider.

## Evidence

Method: on 19 October 2026 a clone of this repository in a temporary directory, with branch `main` set to 89ed23a (the merge base of #37), received change-hidden-tab-streams again as a small change with the copied scaffold of task tier-guidance. Commit 1 holds Requirement, Specification and Plan; commit 2 holds the code of #37 (`git checkout 3c317fd -- apps/artifact-plane`), the task evidence, the version record and the identity record. The replay is not committed to this repository.

| Measure | #37 | Replay | Limit (A1) | Result |
| --- | --- | --- | --- | --- |
| Knowledge files (`git diff --numstat main HEAD -- docs/artifacts`) | 13 | 9 | at most 7 | Failed |
| Knowledge lines, added and removed | 316 | 130 (125 and 5) | at most 160 | Passed |
| Commits | 5 | 2 | 2 | Passed |
| Human gates | 3 | 1 (the PR review) | 1 | Passed |
| Code and test lines | 57 | 57 | – | – |

The 9 files are 5 that every small change writes (change README, `tasks/README.md`, one task, version record, identity record) and 4 knowledge edits that the outcome needs: requirements/live-reload.md (R4 and R7 amended in place, no new requirement), specifications/project-tabs.md (hidden-tab rules), specifications/explorer.md (reply guard) and flow repository-refresh (two supports). The replay drops the unit brief, two tasks, the plan prose, the duplicated `self_check` blocks of explorer.md and live-reload.md and the cross-reference sentence of the live-reload specification. #37 combines two defects with two contracts; the limit of 7 files leaves room for two knowledge edits only. The optimization record estimated "13 to 7" files, but removing the brief and two tasks from 13 gives 10.

Validator: the Plane validator of the main checkout (1.20.0, `node scripts/validate-knowledge.mjs <replay>`) exits 0 with one information diagnostic (`retained-legacy-change`, which also occurs on main). Rules of record-checks.md that it does not implement yet, checked by hand:

| Code | Hand check | Result |
| --- | --- | --- |
| `source-unresolved` | Both `self_check` sources resolve to nonempty headings; the task evidence record without `source` resolves to its Evidence section | No diagnostic |
| `link-broken` | Link script: 4 relative links of the replay records, 0 findings | No diagnostic |
| `placeholder-text` | No added line contains scaffold placeholder text | No diagnostic |
| `version-identity-mismatch`, `version-number-invalid` | `current_version: 1.18.1` has its record; protected 1.18.0 plus patch is 1.18.1 | No diagnostic |
| `upstream-unestablished` | artifact-driven 2.8.0 is established on `main` | No diagnostic |
| `requirement-id-duplicate`, `requirement-uncovered` | live-reload.md has no list-item IDs, so no ID is added, changed or duplicated | No diagnostic |
| `requirement-ids-missing` | live-reload.md is edited and has no list-item ID | Information |
| `covers-unknown-id` | The task covers R4 and R7. live-reload.md labels them as paragraphs (`R4. …`), not list items, so under the current rule R4 and R7 are not IDs of the file | Error |
| `tier-mismatch` | See the criteria table | No diagnostic |
| `open-change-conflict`, `config-invalid` | Not applicable in the clone; no configuration file | No diagnostic |

Converting R4 and R7 to list items would avoid the error, but the validator would then count them as added IDs, and no-contract would fail. 13 of 44 requirement files use the paragraph form.

| Criterion | Decided by | Result | Detail |
| --- | --- | --- | --- |
| one-artifact | validator (by hand) | pass | All 9 knowledge paths are under docs/artifacts/artifact-plane; no unit brief |
| one-repository | coordinator | coordinator | Client, server and tests are in this repository; recorded in the change README |
| patch-level | validator (by hand) | pass | `compatibility: patch` |
| no-contract | validator (by hand) | pass | No flow file added or removed, no decision, no list-item ID added; no other artifact references the changed elements |
| upstream-established | validator (by hand) | pass | artifact-driven 2.8.0 on `main` |
| code-limit | validator (by hand) | pass | 57 changed code and test lines, below 100 |
| impact-contained | Plane impact service, `diff: {base: protected}`, depth 2 | pass | Completeness complete, frontier 0; 13 direct items, all in artifact-plane (6 flows, 1 model, 6 code and test files), 0 transitive, 13 potential |

Open: the file limit of A1 and the `covers-unknown-id` error need an owner decision before task validation.
