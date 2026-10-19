---
tasks:
  - 01-established-versions.md
  - 02-validation.md
compatibility: patch
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-version-source/tasks/README.md#plan-self-check
---

# Version record identity plan

1. [Established versions](01-established-versions.md): the baseline field, the shared function, its three callers and the fixture tests.
2. [Validation](02-validation.md): the built validator, the live check, the claims, the unit evidence and the version.

Task 02 depends on task 01. The coordinator keeps the knowledge edits and task 02.

## Plan self-check

Every ID of requirements/version-record-identity.md is in the `covers` of a task. The graph has two tasks, no cycle and one end. Each DoD item names an observable check. Compatibility is patch: the validator reports a diagnostic that the contract already requires, and no diagnostic code, output field or interface changes; `versionBlobs` is an internal additive field. The two claims of the specification are supported, and the assumption reached-flows-kept of the unit brief is open; tasks 01 and 02 check them. KISS: one function and one field, no new diagnostic or option. STE: one check in each DoD item.
