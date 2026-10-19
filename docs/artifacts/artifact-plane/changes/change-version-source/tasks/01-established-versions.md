---
id: established-versions
depends_on: []
covers:
  - element: requirements/version-record-identity.md
    ids: [VR1, VR2, VR3, VR5, VA1, VA2, VA3, VA5]
evidence_records:
  - {id: same-path, method: node --test test/record-checks.test.js, result: passed}
  - {id: before-fix, method: probe of the same-path fixture on the main versions of the three modules, result: passed}
  - {id: node-suite, method: npm test, result: passed}
---

# Established versions

## Scope and ownership

Implementer. `apps/artifact-plane/server/knowledge-baseline.js` (field `versionBlobs`), `server/record-checks.js` (function `establishedVersions` and the callers of `version-number-invalid` and `requirement-uncovered`), `scripts/validate-knowledge.mjs` (tier targets), `test/record-fixtures.js` and `test/record-checks.test.js`. The excluded callers of the specification stay unchanged.

## Governing knowledge

specifications/version-record-identity.md: Established version record, Baseline field, Shared function, Validation plan; specifications/record-checks.md of artifact-driven: Checks.

## Definition of Done

- [x] A fixture variant has `versions/1.1.0/README.md` of another change and `current_version: 1.1.0` on `main`, and the same path for the minor change of the branch. The validator reports `version-number-invalid` at that path with "not 1.2.0".
- [x] On the same variant, an added requirement ID that no task covers gives `requirement-uncovered`, and `validateKnowledge` without `--change` selects the small change for the tier check, so `tier-mismatch` appears for its minor plan.
- [x] After a rename of the branch record to 1.2.0 and `current_version: 1.2.0`, the variant has no `version-number-invalid` and no `version-identity-mismatch`.
- [x] The same-path test fails on the code before the fix (claim path-only-test).
- [x] `git diff main -- apps/artifact-plane/test/record-checks.test.js` shows only added lines, and `test/record-fixtures.js` keeps the existing fixture bytes; `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Stale number | test/record-checks.test.js "a protected record at the same path of another change does not establish the branch record": `sameNumberRepository()` gives one `version-number-invalid` at `versions/1.1.0/README.md` with "Version 1.1.0 is not 1.2.0", for the whole repository and with the change scope | Passed |
| Delivered change | The same test: `requirement-uncovered` for L3, and `validateKnowledge` without a scope reports `tier-mismatch` for change-fix | Passed |
| Renumber | "after the renumber the branch record has no version diagnostic": no diagnostic code that starts with `version-`; L3 is still uncovered | Passed |
| Before the fix | A probe test on the same fixture with `server/record-checks.js`, `server/knowledge-baseline.js` and `scripts/validate-knowledge.mjs` of `main`: no `version-number-invalid`, no L3 warning and no `tier-mismatch`; with the fix all three appear. The new same-path test fails on `main` code (6 of 7 tests pass); the renumber test passes on both, as a negative case | Passed |
| Existing tests | `git diff main` of both test files shows 51 added lines and 0 removed lines; `npm test` 466 tests, 465 passed, 0 failed, 1 skipped | Passed |
