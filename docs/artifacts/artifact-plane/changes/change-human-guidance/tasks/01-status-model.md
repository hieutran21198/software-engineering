---
id: status-model
depends_on: []
covers:
  - element: requirements/human-guidance.md
    ids: [HG1, HG2, HG4, HG5, HG6]
---

# Status model

## Scope and ownership

Implementer, own worktree. `server/workflow.js` (fields `delivered` and `upstream`), `src/work-model.js` (statuses, Current work, stepper rule), `server/change-brief.js` (difference of an unestablished change, named counts, undecided flow wording), `server/change-description.js` (count labels) and their Node tests.

## Governing knowledge

specifications/human-guidance.md: Change status, Agreement of views; claim upstream-from-local-refs.

## Definition of Done

- [x] Node tests derive each status of the Change status table from fixtures, including `upstream` values `none`, `same` and `ahead`.
- [x] A change with a version record that is not on the protected ref is in Current work; a delivered change is only in History.
- [x] The stepper model marks Implementation not done while a task has an unchecked DoD item, and Version as prepared until established.
- [x] The brief of a fixture change with an unestablished version lists the branch difference with named counts that match the PR description.
- [x] The undecided flow text names affected_flows and the claim `about` list.
- [x] `npm test` passes; existing route, tool and packet tests pass without edits.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Statuses | test/change-status.test.js, "HG1: each status…" from fixtures, and "HG1/HG2: workflow evidence…" on a real Git repository with a bare remote: Unchecked items, Ready for team review (`upstream` none), Waiting for merge (same) and Delivered; `behind` and `diverged` also checked | Passed |
| Current work | Tests "HG2…" and "HG1/HG2…": `currentChanges`, `sidebarRows` with History on and the overview summaries of `queryRepository` keep an unestablished version in Current work and a delivered one only in History | Passed |
| Stepper | Test "HG4…": step states done, done, done, incomplete, prepared; all done once delivered | Passed |
| Brief difference | Test "HG4-HG6…": origin `protected-diff` from the merge base; documents plus other knowledge files equal the PR description's changed knowledge files; the description names code and test lines | Passed |
| Flow wording | The same test checks the attention row and the decision item that name the unit brief's affected_flows and a claim's about list | Passed |
| Node suite | `npm test` 415 tests, 414 passed, 0 failed, 1 skipped; no existing test edited. After integration with tasks app-entry and visual-system: 425 tests, 424 passed, 0 failed | Passed |

Implementation: `delivered`, `upstream` and `upstreamState` in server/workflow.js (one `git rev-list --left-right --count HEAD...@{upstream}` per worktree; the contract sentence was corrected from two commands to this one); `changeStatus` and `isCurrent` in src/work-model.js; step states `incomplete` and `prepared`; the brief origin `protected-diff` in server/change-brief.js; the one-artifact detail of server/tier-check.js names "changed knowledge files under docs/artifacts". Supporting edits: server/reader.js passes baselines to the workflow reader; overview summaries carry `delivered`; src/main.jsx keeps evidence of current changes with `isCurrent`; src/names.js holds the name matching that SearchField.jsx re-exports. Open for task pages: test/browser/change-page.spec.js:329 still expects a prepared version under History, which HG2 replaces.
