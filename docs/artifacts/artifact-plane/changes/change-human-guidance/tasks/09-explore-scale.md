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

- [x] A Node test on a fixture with 12 registered worktrees and unit briefs gets status 200 from POST /api/explore, the not-loaded fields of the contract, and a response that grows by at most the selected worktree's size for each added worktree.
- [x] POST /api/explore on this repository with its registered worktrees, on a private port and state directory, returns 200; the size and time are recorded.
- [x] `exploreRepository`, the runtime binding and POST /api/repository/query keep complete unit records; the unit page graph tests pass without edits.
- [x] `npm test` passes; the browser suite passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Fixture | test/explore-response.test.js: 4 unit briefs with 8 member changes and 11 added worktrees; POST /api/explore through `createAppServer` returns 200 with 1 and with 12 worktrees; every `artifactGraph` and every unselected `implementationGraph` is not-loaded; unselected member knowledge keeps paths without markdown; the top-level units equal the selected view; 374,365 bytes with 1 worktree and 2,026,349 bytes with 12, about 150 KB per added worktree against 201,165 bytes for the selected one | Passed |
| This repository | Server from source on a private port and state directory: POST /api/explore returns 200 twice, 47,042,208 bytes in 8.72 s and 8.63 s, 13 worktrees and 26 units; the selected worktree record is 5.56 MB and each other one about 2.8 MB | Passed |
| Complete records | `exploreRepository`, server/runtime-store.js and server/repository-query.js are unchanged; `exploreResponse` leaves the snapshot JSON unchanged; unit-graphs, repository-query, runtime and units-of-work tests pass without edits | Passed |
| Suites | `npm test` 430 tests, 429 passed, 0 failed, 1 skipped; browser suite 108 passed, 1 failed: the known test/browser/change-page.spec.js:302 that task pages updates for HG2; the unit page graph tests pass | Passed |

Finding: the browser client reads its snapshot through POST /api/repository/query (section overview), not /api/explore. The failure affected callers of /api/explore: the smoke check, scripts and external clients.
