---
id: readers
depends_on: []
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI1, PI7, PI8]
---

# Readers

## Scope and ownership

Implementer, `apps/artifact-plane`. Parse the change README `tier`, the plan `compatibility`, task `covers`, list-item and paragraph-label requirement IDs and `docs/artifacts/add.config.yaml` with defaults; resolve a task evidence record without `source` to the task's `#evidence` heading. Report `invalid-tier`, `invalid-compatibility`, `requirement-id-duplicate` and `config-invalid`.

## Governing knowledge

specifications/delivery-support.md (Readers); artifact-driven specifications/delivery-tiers.md and record-checks.md; requirements/delivery-improvements.md, PI1, PI7 and PI8.

## Prerequisites

Explicit plan approval and artifact-driven 3.0.0 established on main.

## Definition of Done

- [x] Node tests cover each field with a valid value, an invalid value and absence, and the configuration file with defaults, a changed limit and an unknown key.
- [x] A task evidence record without `source` resolves to its `#evidence` section in the task view and in unit evidence.
- [x] `npm test` passes, and existing reader tests pass without edits.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Fields and configuration | `src/delivery-records.js` parses `tier`, `compatibility`, `covers` (default artifact from the task path), list-item and paragraph-label requirement IDs, and `add.config.yaml` with defaults. `test/delivery-records.test.js` covers each field valid, invalid and absent, IDs outside front matter and fences, duplicates in either form, and the configuration with defaults, a changed limit and six invalid files (unknown key, wrong type, wrong version, unknown role, unknown tier, a list). The scanner loads the configuration file; the snapshot reports `invalid-tier`, `invalid-compatibility`, `invalid-covers`, `requirement-id-duplicate` and `config-invalid`, and each change carries `tier`, `tierDeclared` and `compatibility`. The snapshot keys and the task graph object do not change, because the API contract test and the task-graph tests compare them exactly | Passed |
| Evidence source default | `server/workflow.js`, `server/claims.js`, `server/change-brief.js` and the task view in `ChangePagePlan.jsx` use `<task path>#evidence` for a record without `source`. A test records a passed check without `source`: the declared Validation step is documented-complete with the `#evidence` source; without an Evidence section the record gives `missing-evidence` | Passed |
| Suite | `npm test`: 383 tests, 382 passed, 0 failed, 1 skipped; no existing test file changed. The validator on this repository still reports one information diagnostic | Passed |
