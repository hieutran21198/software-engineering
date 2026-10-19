---
id: established-versions
depends_on: []
covers:
  - element: requirements/version-record-identity.md
    ids: [VR1, VR2, VR3, VR5, VA1, VA2, VA3, VA5]
---

# Established versions

## Scope and ownership

Implementer. `apps/artifact-plane/server/knowledge-baseline.js` (field `versionBlobs`), `server/record-checks.js` (function `establishedVersions` and the callers of `version-number-invalid` and `requirement-uncovered`), `scripts/validate-knowledge.mjs` (tier targets), `test/record-fixtures.js` and `test/record-checks.test.js`. The excluded callers of the specification stay unchanged.

## Governing knowledge

specifications/version-record-identity.md: Established version record, Baseline field, Shared function, Validation plan; specifications/record-checks.md of artifact-driven: Checks.

## Definition of Done

- [ ] A fixture variant has `versions/1.1.0/README.md` of another change and `current_version: 1.1.0` on `main`, and the same path for the minor change of the branch. The validator reports `version-number-invalid` at that path with "not 1.2.0".
- [ ] On the same variant, an added requirement ID that no task covers gives `requirement-uncovered`, and `validateKnowledge` with `--change` selects the change for the tier check.
- [ ] After a rename of the branch record to 1.2.0 and `current_version: 1.2.0`, the variant has no `version-number-invalid` and no `version-identity-mismatch`.
- [ ] The new tests fail on the code before the fix (claim path-only-test).
- [ ] `git diff main -- apps/artifact-plane/test/record-checks.test.js` shows only added lines, and `test/record-fixtures.js` keeps the existing fixture bytes; `npm test` passes.

## Evidence
