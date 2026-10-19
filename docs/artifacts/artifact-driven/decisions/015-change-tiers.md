# Scale delivery records and gates with change tiers

## Context

Measurements on this repository on 19 October 2026 show the same records, commits and gates for every change: a fix with 50 code and test lines produced 312 knowledge lines, 5 commits and 3 human gates. Plan approval takes a median of 2 minutes after the plan commit, so the cost of a small change is in records and turns, not in waiting. The owner fixed five guarantees that every option must keep, and decided on tiers with the proposed limits and without a code-only tier.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Keep one path | Every change keeps all phases, commits and gates. | Keeps the measured cost; low overhead stays at 1 of 5. Rejected. |
| B. Skip records for one-line fixes | Fixes below a size skip ADD, as OpenSpec advises. | A fix that changes documented behavior leaves `main` without the current truth, against the first guarantee. Rejected. |
| C. Automatic routing by a model | A model reads the request and selects the route, as in BMAD Build. | The route depends on model judgment that a reviewer cannot check. Rejected. |
| D. Three tiers with checked criteria | Small, medium and large. Small has tested entry criteria that a validator, the impact service or the coordinator decides; the owner can raise any tier. | Keeps every guarantee; most criteria are deterministic; a missing tool answer keeps the larger path. Selected. |
| E. Code-only maintenance tier | No record and no version for changes without documented behavior change. | The validator cannot decide "no behavior change". Deferred by the owner until new measurements exist. |

## Decision

Adopt option D as specifications/delivery-tiers.md. The tier is an optional front-matter key of the change README; a change without it is medium. A small change keeps its requirement and specification edits, one task, its version record and its PR, and drops the unit brief, the separate phase commits and the separate approval turn.

## Consequences

Small fixes cost fewer files, commits and turns. Medium and large changes keep their gates. A wrong tier is possible when a criterion is decided by the coordinator; the PR description shows the tier and the criteria results to the reviewer. The limit of 100 code lines is an assumption recorded with its check in the requirements.
