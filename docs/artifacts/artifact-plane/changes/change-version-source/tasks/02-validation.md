---
id: validation
depends_on: [established-versions]
covers:
  - element: requirements/version-record-identity.md
    ids: [VR4, VA4, VA6]
evidence_records:
  - {id: bundle-parity, method: built add-validate.mjs against validate-knowledge.mjs on both fixtures, result: passed}
  - {id: live-check, method: change-runbooks scenario in a disposable clone, result: passed}
  - {id: suites, method: npm test and npx playwright test on Chromium 156, result: passed}
---

# Validation

## Scope and ownership

Coordinator. The built validator, the live check, the claims, the unit evidence and the version record.

## Governing knowledge

specifications/version-record-identity.md: Bundle validator, Validation plan; the unit brief plane-version-source; the Live check runbook of artifact-driven.

## Definition of Done

- [x] `npm run build:validator` succeeds, and `docs/artifact-driven/tools/add-validate.mjs` gives the same JSON as `scripts/validate-knowledge.mjs` on the fixtures of VA1 and VA3.
- [x] In a disposable clone with a local `main`, the change-runbooks scenario of the requirement gives `version-number-invalid` with 3.2.0, and the built validator gives the same result.
- [x] `npm run validate` reports no error on this branch, and the validator with `--change artifact-plane/change-version-source` reports `ok: true`.
- [x] The Node and browser suites pass on the integrated branch, and the existing tests of the reached flow steps pass without edits (claim reached-flows-kept).
- [x] The three claims have a status from evidence, and the unit evidence supports each criterion.

## Evidence

Live check on 19 October 2026 in a disposable clone of this repository with a local `main`, Node.js 24.21.0. The clone `main` is the parent of the ADD 3.1.0 merge plus a commit of a test change change-other with `versions/3.1.0/README.md` (`source_change: change-other`) and `current_version: 3.1.0`. The clone branch change-runbooks has the artifact-driven knowledge and the unit brief of the 3.1.0 merge, with `versions/3.1.0/README.md` (`source_change: change-runbooks`) and a minor plan. This is live evidence; the fixture evidence is in task 01.

| DoD item | Check | Result |
| --- | --- | --- |
| Bundle parity | `npm run build:validator` wrote `docs/artifact-driven/tools/add-validate.mjs`; on `sameNumberRepository()` and `sameNumberRepository({renumbered: true})` its stdout equals the stdout of `scripts/validate-knowledge.mjs` byte for byte, with exit status 1 for both (the fixture declares a small tier with a minor plan); the first has `version-number-invalid`, the second has no version diagnostic | Passed |
| Live check | Before the fix the Plane validator gave `ok: true` for `--change artifact-driven/change-runbooks`. With the fix the Plane validator and the built validator each give exit status 1 and one error, `version-number-invalid` at `docs/artifacts/artifact-driven/versions/3.1.0/README.md`: "Version 3.1.0 is not 3.2.0, the number that minor gives from 3.1.0."; their JSON is identical apart from the repository path | Passed |
| Repository | `node scripts/validate-knowledge.mjs --repository ../..` on this branch: `ok: true`, no error; `--change artifact-plane/change-version-source`: `ok: true` | Passed |
| Suites | `npm test`: 466 tests, 465 passed, 0 failed, 1 skipped. `npx playwright test` on the Playwright 1.64 headless shell (Chromium 156, the CI browser): 118 passed. No existing test file changed except the two record-check files of task 01, which have only added lines. `go test` of the bundle, `internal` and `cmd` packages passed with the built validator present (claim reached-flows-kept) | Passed |
| Claims | path-only-test verified by the before-fix probe of task 01; reached-flows-kept verified by the suites row; status-views-path-only stays a supported risk that ships with 1.23.1 | Passed |
