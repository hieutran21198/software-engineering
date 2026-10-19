---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/version-record-identity.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/record-checks.md
    requires: the version-number-invalid rule, the requirement-uncovered rule
      and the definition of an open change
claims:
  - id: path-only-test
    kind: root_cause
    statement: The validator misses the stale number because it counts a
      working version record as established when the protected branch has any
      file at the same path.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/requirements/version-record-identity.md#need
    check: Run the new same-path fixture test on the code without the fix and
      confirm that it fails because no version-number-invalid diagnostic
      appears.
    risk_if_wrong: The fix changes the test and the validator still misses the
      stale number.
    about: [apps/artifact-plane/server/record-checks.js]
  - id: status-views-path-only
    kind: risk
    statement: The change status, the change list, the change brief, the claim
      check and version preparation keep the path-only test in this version, so
      in the same-path scenario they can show the change as delivered.
    status: supported
    basis: static
    evidence:
      - docs/artifacts/artifact-plane/specifications/version-record-identity.md#excluded-callers
    risk_if_wrong: A reader trusts a delivered label of a change whose number
      another change took.
---

# Version record identity contract

Governs VR1 to VR5 and VA1 to VA6 in requirements/version-record-identity.md. The record-checks contract of artifact-driven defines the checks; this page defines how the Plane decides that a working version record is established.

## Established version record

A working version record is a file `docs/artifacts/<artifact>/versions/<n>/README.md` in the working tree whose front matter has a string `source_change`.

The record is established when all conditions are true:

1. The protected baseline of the artifact is available.
2. The protected tree has a file at the same path.
3. The working bytes have the blob ID of the protected file, or the protected file has front matter with the same `source_change`.

The blob comparison is a shortcut: equal bytes have the same `source_change`. When the bytes differ, the Plane reads the protected file with the existing read-only Git helper. A protected file that cannot be read, or that has no `source_change`, makes the record not established.

A delivered change is a change that an established working version record names.

## Baseline field

The established view of `server/knowledge-baseline.js` gains `versionBlobs`: a map from each version number with a protected version record to the blob ID of that record. The field is additive. `versionRecords` keeps its value, because the excluded callers read it.

## Shared function

`server/record-checks.js` exports `establishedVersions({root, git, files, baselines})`. It returns the set of working version-record paths that are established. It never writes and runs no command other than `git show` of a protected path.

| Caller | Use |
| --- | --- |
| `version-number-invalid` in `recordChecks` | Skips only the established paths. Every other working version record of an in-place artifact with an available baseline gets the existing number check. |
| `requirement-uncovered` in `recordChecks` | The delivered changes come from the established paths. An open change of the check is a change that no established path names. |
| tier targets in `scripts/validate-knowledge.mjs` | The delivered changes come from the established paths. |

The diagnostic codes, severities, messages, paths and the output schema stay the same.

## Excluded callers

These callers keep the test `versionRecords.includes(version)` in this version (claim status-views-path-only):

| Caller | Effect in the same-path scenario |
| --- | --- |
| `server/workflow.js` change status | shows the change as delivered |
| `server/repository-query.js` change list | shows the change as delivered |
| `server/change-brief.js` | treats the version as established |
| `server/claims.js` `claim-unverified-at-version` | reports no warning for the change |
| `server/knowledge-operations.js` version.prepare | treats the record as established |

## Bundle validator

`npm run build:validator` bundles the changed modules into `docs/artifact-driven/tools/add-validate.mjs`. Git ignores that file, and CI and the release build it from the same source, so the two validators cannot drift in Git. The build rule of delivery-support.md stays the same.

## Validation plan

- Node tests in `test/record-checks.test.js` with a fixture variant in `test/record-fixtures.js`: the protected branch has `versions/1.1.0/README.md` of another change and `current_version: 1.1.0`; the change branch has the same path for its own minor change. Expected: `version-number-invalid` with 1.2.0 (VA1), and `requirement-uncovered` for an uncovered added ID (VA2). After a rename to 1.2.0: no version diagnostic (VA3).
- The same test fails on the code without the fix (claim path-only-test).
- The built validator gives the same JSON as `scripts/validate-knowledge.mjs` on the fixtures of VA1 and VA3 (VA4).
- `npm test` passes, and the existing record-check tests pass without edits; `npm run validate` reports no error on this repository (VA5).
- Live check in a disposable clone: the change-runbooks scenario of the requirement gives `version-number-invalid` with 3.2.0 (VA6).

## Specification self-check

VR1 maps to Established version record, VR2 and VR3 to Shared function, VR4 to Bundle validator, VR5 to the unchanged codes and the existing tests. Each VA has a test in the validation plan. Claims: one supported root cause with its check, and one risk for the excluded callers. KISS: one function, one additive field, no new diagnostic, option or state. STE: one rule in each sentence or row. Representations: the caller tables were checked against a search for `versionRecords` in `server/` and `scripts/` (8 uses: 3 in scope, 5 excluded). Impact: no flow changes its steps. No blocker prevents Plan.
