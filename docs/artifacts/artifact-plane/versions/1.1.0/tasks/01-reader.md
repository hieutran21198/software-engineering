# Repository scanner and local API

## Scope and ownership

Own the Node package, scanner, local HTTP server, fixture builders, and scanner/API tests under `apps/artifact-plane`. Use existing parsing libraries and Node's test runner. Avoid persistent state. Governing elements are `requirements/explorer.md` and `specifications/explorer.md` in this change.

## Prerequisites

User approval of the plan. No upstream implementation dependencies.

## Definition of Done

- [x] Separate filesystem/Git reads from pure parsing, reference-resolution, and graph calculations with plain modules.
- [x] Use the TDD cycle for meaningful parser, resolution, graph, and read-only behavior; run the relevant suite after refactoring.
- [x] Use shared fixtures for requirement examples B1–B6 and assert observable snapshot outputs.
- [x] Verify the API response fields and error outcomes against the snapshot contract.

- [x] Discover artifacts, declared versions, change candidates, knowledge elements, and Git context according to the contract.
- [x] Return established and proposed artifact edges and resolved or unresolved element references.
- [x] Test initial artifacts, proposals, removals, cycles, missing endpoints, metadata ambiguity, malformed YAML, and index disagreement.
- [x] Test invalid roots, foreign-origin requests, traversal, and escaping symlinks.
- [x] Verify exploration does not change fixture contents or Git state.
- [x] Provide useful errors and preserve valid portions of inconsistent inputs.

## Evidence

Validated from apps/artifact-plane with npm test: 14 tests passed across reader, API, model, and canvas calculations. Shared B1–B6 fixtures cover initial artifacts, declared-version resolution, additions/removals, unresolved references, and refresh. Tests also cover cycles, transitive reachability, proposed reference sources, metadata conflicts, multiple changes, malformed YAML, invalid roots, hostile request headers, traversal, and escaping symlinks.

The reader fixture compares every file's bytes, including Git metadata, and Git status before and after repeated exploration. External edits appear on refresh. Knowledge symlinks into .git are excluded. Test-first checks exposed malformed proposal/status handling, fenced metadata examples, and Git-metadata symlinks; each regression passes after the fix.

Implementation uses plain repository-reader, model, graph, and HTTP modules. KISS adds no persistence or interface hierarchy. STE and contract checks preserve established/proposed distinctions.
