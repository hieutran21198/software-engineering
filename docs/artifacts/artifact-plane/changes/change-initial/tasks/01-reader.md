# Repository scanner and local API

## Scope and ownership

Own the Node package, scanner, local HTTP server, fixture builders, and scanner/API tests under `apps/artifact-plane`. Use existing parsing libraries and Node's test runner. Avoid persistent state. Governing elements are `requirements/explorer.md` and `specifications/explorer.md` in this change.

## Prerequisites

User approval of the plan. No upstream implementation dependencies.

## Definition of Done

- [ ] Discover artifacts, declared versions, change candidates, knowledge elements, and Git context according to the contract.
- [ ] Return established and proposed artifact edges and resolved or unresolved element references.
- [ ] Test initial artifacts, proposals, removals, cycles, missing endpoints, metadata ambiguity, malformed YAML, and index disagreement.
- [ ] Test invalid roots, foreign-origin requests, traversal, and escaping symlinks.
- [ ] Verify exploration does not change fixture contents or Git state.
- [ ] Provide useful errors and preserve valid portions of inconsistent inputs.

## Evidence

Record executed checks and results after implementation.
