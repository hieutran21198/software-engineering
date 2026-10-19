---
id: explore-scale
depends_on: []
covers:
  - element: requirements/explore-scale.md
    ids: [ES1, ES2, ES3, ESA1, ESA2, ESA3]
---

# Explore scale

## Scope and ownership

Implementer, own worktree. The explore route in `server/http.js` (or one function that it calls), Node tests with a many-worktree fixture.

## Governing knowledge

specifications/units-of-work.md, Deferred exploration (the exceptions); requirements/explore-scale.md.

## Definition of Done

- [ ] A Node test on a fixture with 12 registered worktrees and unit briefs gets status 200 from POST /api/explore, the not-loaded fields of the contract, and a response that grows by at most the selected worktree's size for each added worktree.
- [ ] POST /api/explore on this repository with its registered worktrees, on a private port and state directory, returns 200; the size and time are recorded.
- [ ] `exploreRepository`, the runtime binding and POST /api/repository/query keep complete unit records; the unit page graph tests pass without edits.
- [ ] `npm test` passes; the browser suite passes.

## Evidence

Not recorded.
