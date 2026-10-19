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

- [ ] Node tests derive each status of the Change status table from fixtures, including `upstream` values `none`, `same` and `ahead`.
- [ ] A change with a version record that is not on the protected ref is in Current work; a delivered change is only in History.
- [ ] The stepper model marks Implementation not done while a task has an unchecked DoD item, and Version as prepared until established.
- [ ] The brief of a fixture change with an unestablished version lists the branch difference with named counts that match the PR description.
- [ ] The undecided flow text names affected_flows and the claim `about` list.
- [ ] `npm test` passes; existing route, tool and packet tests pass without edits.

## Evidence

Not recorded.
