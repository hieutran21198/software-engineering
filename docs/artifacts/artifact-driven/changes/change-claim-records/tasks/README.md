---
tasks:
  - 01-guidance.md
  - 02-validation.md
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-claim-records/tasks/README.md#plan-self-check
---

# Claim records implementation plan

Two fresh tasks deliver the ADD side of the human-cognitive-support unit. The contract and the decision are already in the working knowledge; the tasks deliver the bundle guidance and the combined validation.

1. [Guidance](01-guidance.md): the Claims section of the evidence guideline, the definition, the writing rule, the artifact model row, the review guidance and the three role skills, in both bundle copies.
2. [Validation](02-validation.md): combined checks, the unit evidence and the version record, after task guidance.

## Sequence and parallelism

Task guidance runs first; task validation follows it. Artifact Plane implements the contract in change-review-brief. Its claim tasks wait until this version establishes, so this change merges before the Plane change.

## Approval and prerequisites

Present this plan for explicit user approval before implementation. ADD 2.8.1 is established on main and no upstream contract is proposed. A material change to the claim fields, status rules or consequential rule requires renewed approval. After all tasks pass, the coordinator suggests version 2.9.0 (minor: a new optional field and guidance; existing records stay valid).

## Plan self-check

- Coverage: C1–C10 and A1, A4 and A5 are in the contract and the decision (Specification); task guidance covers A2 and A3; task validation covers A4, A5 and the version.
- The graph is valid: two listed tasks, unique IDs, one resolved prerequisite (guidance → validation), no cycle. No artifact edge changes.
- Each DoD item is observable by a diff, a command or a test.
- KISS: guidance text only, no script, no new state. STE: imperative DoD items.
- No blocker prevents implementation after approval.
