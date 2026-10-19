---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/explore-scale.md#requirement-self-check
---

# Open a repository with many worktrees

## Outcome

A person opens a repository with many registered worktrees in the Plane, and the work page appears.

## Need

Facts measured on 19 October 2026 on this repository with 12 registered worktrees (the parallel implementer worktrees of change-human-guidance among them):

- POST /api/explore returns status 500 with `RangeError: Invalid string length`, from source and from the executable. JSON.stringify of the response exceeds the V8 string limit.
- Each worktree record carries `unitsOfWork` of about 117 MB. In it, `artifactGraph` is about 1.4 MB for each of 26 units; without it the units of one worktree take 4.8 MB, and without the implementation graphs and member knowledge bodies 2.0 MB.
- The unit page already reads the artifact graph and the implementation graph of a unit through POST /api/repository/query (sections `artifacts` and `implementation`).
- The owner asked on 19 October 2026 to fix this in the current change.

## Requirements

- ES1: POST /api/explore answers for a repository with at least 12 registered worktrees and 26 unit briefs.
- ES2: The explore response does not carry data that a page loads on demand: unit artifact graphs, and for worktrees that are not selected, unit implementation graphs and member knowledge bodies. Each omitted field keeps its key with a `not-loaded` state.
- ES3: Pages, the runtime binding and the server-side readers keep their behavior; the unit page shows its graphs as before.

## Acceptance criteria

- ESA1: On a fixture with 12 worktrees and units, POST /api/explore returns 200, and its size grows by at most the selected worktree's size for each added worktree.
- ESA2: On this repository with its registered worktrees, POST /api/explore on a private port returns 200; the response size is recorded.
- ESA3: The Node and browser suites pass; the unit page graph tests pass without edits.

## Requirement self-check

Each fact comes from a measurement of the explore snapshot on this repository. Each requirement is testable through ESA1 to ESA3. ES2 changes the explore response shape of two fields, which W9 of requirements/authoring-workbench.md keeps unchanged otherwise; this requirement is the stated exception. KISS: omit, do not add a new route. STE: one rule in each item. No blocker prevents Specification.
