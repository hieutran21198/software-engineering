---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/version-record-identity.md#requirement-self-check
references:
  - artifact: artifact-driven
    element: specifications/record-checks.md
    requires: the version-number-invalid rule, the requirement-uncovered rule
      and the definition of an open change
---

# Version record identity requirements for Artifact Plane

## Outcome

The validator reports a wrong version number on a change branch also when another change of the same artifact merged first with the same number.

## Need

Facts observed on 19 October 2026:

- The record-checks contract of artifact-driven checks the number of "a version record that is not on the protected branch". It defines an open change as "a change directory without a version record that names it". A version record names its change in `source_change`.
- The Plane counts a version record as established when the protected branch has a file at the same path. It does not compare `source_change`.
- In a disposable clone, `main` had `versions/3.1.0/README.md` with `source_change: change-other` and `current_version: 3.1.0`. The branch of change-runbooks had the same path with `source_change: change-runbooks` and a minor plan. The validator with `--change artifact-driven/change-runbooks` gave `ok: true`. The expected result is the error `version-number-invalid` with the number 3.2.0.
- In the same scenario, the validator also counts change-runbooks as delivered. It then reports no `requirement-uncovered` warning for the change, and it does not select the change for the tier check.

## Requirements

- VR1: A version record of the working tree is established only when the protected branch has a version record at the same path that names the same change in `source_change`.
- VR2: The validator checks the number of every version record that is not established by VR1, with the existing `version-number-invalid` rule.
- VR3: The validator counts a change as delivered only when a version record that names the change is established by VR1. This applies to `requirement-uncovered` and to the selection of changes for the tier check.
- VR4: The default-install validator of the bundle reports the same diagnostics as the Plane validator for the same tree.
- VR5: The other diagnostics of the validator keep their results on trees where no protected record has the same path as a working record with another `source_change`.

## Acceptance criteria

- VA1: On a fixture where the protected branch has `versions/1.1.0/README.md` of another change with `current_version: 1.1.0`, and the change branch has the same path for its own minor change, the validator reports `version-number-invalid` with the expected number 1.2.0.
- VA2: On the same fixture, a requirement ID that the change adds and that no task covers gives `requirement-uncovered`.
- VA3: On the same fixture after the branch renumbers to 1.2.0, the validator reports no version diagnostic.
- VA4: The built `add-validate.mjs` gives the same JSON as the Plane validator entry point on the fixtures of VA1 and VA3.
- VA5: The Node suite passes, and the existing record-check tests pass without edits. The validator reports `ok: true` for this repository.
- VA6: The disposable-clone scenario of the Need section gives `version-number-invalid` with 3.2.0.

## Affected artifacts and flows

This change consumes artifact-driven specifications/record-checks.md and changes no element of artifact-driven. The Plane flows change-review and agent-session-guidance show validator results; their steps stay the same. No other artifact references the files of this change.

## Facts, assumptions and exclusions

Facts: the observations above come from the Plane source at 1.23.0 and the disposable clone. Exclusions: the status views listed in the change README, and the ADD contract and guidelines.

## Requirement self-check

Each requirement states a need, and VA1 to VA6 make each one observable. VR1 restates the contract identity of a record for the Plane, so the Plane adds no rule of its own. The scope keeps the status views out by the owner's decision. KISS: no new diagnostic code, field or option. STE: one rule in each item. No blocker prevents Specification; artifact-driven 3.1.0 is established on `main`.
