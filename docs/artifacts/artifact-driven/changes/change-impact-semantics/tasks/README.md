---
tasks:
  - 01-guidance.md
  - 02-validation.md
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-impact-semantics/tasks/README.md#plan-self-check
---

# Change impact semantics implementation plan

Two fresh tasks deliver the ADD side of the change-impact-intelligence unit. The contract and the decision are already in the working knowledge; the tasks deliver the bundle pages and the combined validation.

1. [Guidance](01-guidance.md): the amended impact-analysis definition, the new end-user guideline and its index row, in both bundle copies.
2. [Validation](02-validation.md): combined checks and the version record.

## Sequence and parallelism

Task 1 runs first. Task 2 follows it. Artifact Plane implements the contract in its own change; its implementation waits for this version to establish, so this change merges with or before the Plane change.

## Plan self-check

- Coverage: M1 to M6 and A1 to A4 of requirements/change-impact.md map to the contract (delivered in Specification), task 1 (A3) and task 2 (A1, A2, A4 and the version).
- The graph is valid: two unique IDs, one resolved prerequisite, no cycle.
- Each DoD item is observable by a diff, a command or a test.
- KISS: no new field, no script, no state. STE: imperative DoD items.
- No blocker prevents implementation after approval.
