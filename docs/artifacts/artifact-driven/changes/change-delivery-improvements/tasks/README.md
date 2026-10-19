---
tasks:
  - 01-bundle-source.md
  - 02-tier-guidance.md
  - 03-role-skills.md
  - 04-repository-setup.md
  - 05-small-replay.md
  - 06-validation.md
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-delivery-improvements/tasks/README.md#plan-self-check
---

# Delivery improvements implementation plan

Six fresh tasks deliver the ADD side of the delivery-improvements unit. The contracts and decisions are in the working knowledge; the tasks deliver the Go package move, the bundle guidance, the role skills, the repository setup, the small-tier replay and the combined validation.

1. [Bundle source](01-bundle-source.md): the Go package beside the canonical bundle, the `tools/` directory, the website copy and the removal of `src/archs/artifact-driven`.
2. [Tier guidance](02-tier-guidance.md): tiers, the small-tier path, gates, version number, owner look, configuration, requirement IDs, `covers`, single-source records and the validator rules in the bundle guidelines.
3. [Role skills](03-role-skills.md): a core of at most 400 words for each role skill, the read-when tables, the KISS and STE checklists, implementer context rules and impact-selected tests.
4. [Repository setup](04-repository-setup.md): `AGENTS.md` and the Claude Code skill entries.
5. [Small replay](05-small-replay.md): the small-tier record set of change-hidden-tab-streams, measured.
6. [Validation](06-validation.md): combined checks, unit evidence for the ADD criteria and the version record.

## Sequence and parallelism

Task bundle-source runs first because it moves the Go package that the other tasks' checks build. Tier-guidance follows; role-skills follows it because the skills point to the new guidance. Repository-setup and small-replay follow role-skills and can run in parallel. Validation joins all tasks.

Artifact Plane change-delivery-improvements implements the validator rules, the scaffold, the tier check and the PR description. Its implementation waits until this version establishes on main, so this change merges first. The unit criteria that need the Plane (validator, review, scores) complete after the Plane version.

## Approval and prerequisites

Present this plan with the Plane plan for explicit user approval before implementation; one approval covers both plans. ADD 2.9.0 is established on main and no upstream contract is proposed. The owner chose the major level at Requirement; confirm it with this approval. The number is 3.0.0. Decision 017 meets the owner's choice of one bundle source with a Go package beside the bundle instead of a generated copy; the approval confirms this. A material change to the tiers, the record checks or the validator delivery requires renewed approval.

## Plan self-check

- Coverage: DI1 to DI8 and DI12 to bundle-source (DI13, A4, A2 install) and tier-guidance; DI9 to DI11 and A3 to role-skills; DI12 and DI14 to repository-setup; A1 to small-replay; A5, A6, A7 and the version to validation. DI15 is checked in validation through A6.
- The graph is valid: six listed tasks, unique IDs, resolved prerequisites (bundle-source → tier-guidance → role-skills → repository-setup and small-replay → validation, and bundle-source → validation), no cycle. No artifact edge changes.
- Each DoD item is observable by a diff, a command, a count or a test.
- KISS: guidance and one package move; no new runner in ADD. STE: imperative DoD items.
- No blocker prevents implementation after approval.
