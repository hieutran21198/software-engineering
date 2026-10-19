---
id: validation
depends_on: [established-versions]
covers:
  - element: requirements/version-record-identity.md
    ids: [VR4, VA4, VA6]
---

# Validation

## Scope and ownership

Coordinator. The built validator, the live check, the claims, the unit evidence and the version record.

## Governing knowledge

specifications/version-record-identity.md: Bundle validator, Validation plan; the unit brief plane-version-source; the Live check runbook of artifact-driven.

## Definition of Done

- [ ] `npm run build:validator` succeeds, and `docs/artifact-driven/tools/add-validate.mjs` gives the same JSON as `scripts/validate-knowledge.mjs` on the fixtures of VA1 and VA3.
- [ ] In a disposable clone with a local `main`, the change-runbooks scenario of the requirement gives `version-number-invalid` with 3.2.0, and the built validator gives the same result.
- [ ] `npm run validate` reports no error on this branch, and the validator with `--change artifact-plane/change-version-source` reports `ok: true`.
- [ ] The Node and browser suites pass on the integrated branch, and the existing tests of the reached flow steps pass without edits (claim reached-flows-kept).
- [ ] The three claims have a status from evidence, and the unit evidence supports each criterion.

## Evidence
