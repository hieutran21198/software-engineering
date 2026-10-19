---
tier: medium
---

# Count a version record as established only with its change

## Reason and scope

On 19 October 2026 the validation of change-runbooks (ADD 3.1.0) found that the validator does not report a stale version number. The cause is that the Plane counts a version record as established when the protected branch has a file at the same path, `versions/<n>/README.md`. It does not compare `source_change`. When another change of the same artifact merges first with the same number, the record of the branch is skipped, and `version-number-invalid` does not appear. The record-checks contract of artifact-driven already identifies a record by the change that it names, so this change corrects the Plane only.

The owner decided on 19 October 2026: fix every validator check that uses this test; keep the status views out of scope.

Included:

- the established-record test of `version-number-invalid`;
- the delivered-change test of `requirement-uncovered`;
- the delivered-change test that selects the changes for the tier check of the validator;
- fixtures and tests for a protected record at the same path with another `source_change`;
- the built validator of the bundle, checked on the same fixture.

Excluded, for later changes: the same test in the change status, the change list, the change brief, the claim check and version preparation of the Plane; any edit of the ADD contract or guidelines.

Knowledge is edited in place on this branch. The unit brief is [Plane version source](../../../units-of-work/plane-version-source/README.md).

- [Requirements: version record identity](../../requirements/version-record-identity.md)
