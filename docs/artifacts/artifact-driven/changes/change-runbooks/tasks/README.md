---
tasks:
  - 01-runbook-guide.md
  - 02-rule-guidance.md
  - 03-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-runbooks/tasks/README.md#plan-self-check
---

# Runbooks implementation plan

Three tasks deliver the runbooks of the [runbook contract](../../../specifications/runbooks.md) and the two lifecycle rules of the [layout contract](../../../specifications/knowledge-layout.md#lifecycle).

1. [Runbook guide](01-runbook-guide.md): the guide page with the seven runbooks and the material test, and the guideline index row.
2. [Rule guidance](02-rule-guidance.md): the stopped-change and reversal rules in the workflow and the writing rules, the link from the Corrections section, and the Read-when rows of the coordinator.
3. [Validation](03-validation.md): the replay of each runbook on its situation from this repository, the checks of the two decision claims in a disposable clone, the bundle checks and the version record.

## Sequence and compatibility

The tasks run in sequence: the rule pages link to the guide sections, and the validation reads both. One coordinator implements them; the tasks edit the same pages, so no parallel work is safe.

Compatibility: minor. The runbooks and the two rules add guidance; no record format, field or existing rule changes, and every existing record stays valid.

## Plan self-check

- Coverage: each RB and RA ID is in the `covers` of a task; the validator reports no `requirement-uncovered` warning.
- The graph is valid: three listed tasks, unique IDs, runbook-guide → rule-guidance → validation, no cycle. No artifact edge changes.
- Each DoD item is observable by a reading check against a named contract row, a command or a test.
- KISS: one guide page and text edits in four existing pages; no new tool. STE: imperative DoD items.
- Open claims: stopped-change-no-record and reversal-is-new-change; task validation checks both.
- No blocker prevents implementation after approval.
