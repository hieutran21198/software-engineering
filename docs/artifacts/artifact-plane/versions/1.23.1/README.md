---
source_change: change-version-source
---

# artifact-plane 1.23.1

Patch: the validator reports a diagnostic that the record-checks contract already requires; no diagnostic code, output field or interface changes. A working version record counts as established only when the protected record at the same path names the same `source_change`. `version-number-invalid`, `requirement-uncovered` and the tier targets of the validator use this rule, so a stale number is reported after another change of the artifact took it on the protected branch.

The plan and its evidence are in the [retained change](../../changes/change-version-source/tasks/README.md).
