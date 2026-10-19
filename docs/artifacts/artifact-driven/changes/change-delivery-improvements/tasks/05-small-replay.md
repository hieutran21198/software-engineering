---
id: small-replay
depends_on: [role-skills]
---

# Small replay

## Scope and ownership

Coordinator, as implementer. In a temporary copy of this repository at the merge base of Artifact Plane change-hidden-tab-streams (#37), write that change again as a small change with the copied scaffold of task tier-guidance: change README with tier and plan, the requirement and specification edits, `tasks/README.md`, one task with `covers`, the version record and the identity record. Apply the code of #37. Commit knowledge once and implementation with the version once. Do not commit the replay to this repository; record the counts and the method in the evidence.

## Governing knowledge

specifications/delivery-tiers.md; specifications/record-checks.md; requirements/delivery-improvements.md, A1.

## Prerequisites

Task role-skills.

## Definition of Done

- [ ] The replay has at most 7 knowledge files and at most 160 knowledge lines (`git diff --numstat` on `docs/artifacts`), 2 commits and 1 human gate (the PR review).
- [ ] The installed Plane validator of this repository reports no error on the replay, and the rules of record-checks.md that it does not implement yet are checked by hand and listed.
- [ ] Each small-tier criterion of the change is recorded with its result and decider.

## Evidence

Not recorded.
