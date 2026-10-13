---
tasks:
  - 01-guidance.md
  - 02-delivery-validation.md
---

# Task retention implementation plan — artifact-driven

## Tasks

- [Update task retention guidance](01-guidance.md)
- [Validate and prepare ADD delivery](02-delivery-validation.md)

## Gates and coordination

No upstream artifact gate. Explicit plan approval is required. Tasks form a sequential chain. Execute sequentially; these scopes do not require concurrent implementers. The current capable session handles Specification and Plan. Keep unit membership and shared evidence under coordinator control.

ADD publication precedes dependent Plane implementation. Use separate upstream and downstream publication branches/PRs so an unmerged upstream contract never gates itself through one combined PR. This preparation branch contains both reviewed plans; publish only ADD implementation first, then rebase/recheck the Plane preparation after upstream establishment. Preserve the existing artifact-driven → artifact-plane dependency and create no membership-derived edge.

## Versions and review

Suggest ADD 2.0.0 because the delivered snapshot layout changes; suggest Plane 1.8.0 for additive layout compatibility and navigation simplification. The user confirms or overrides each at Version preparation. Future snapshots exclude tasks and link this retained change plan; existing snapshots remain intact. PR handoff stops for team review and merge. Implementation evidence is recorded in the listed tasks.

## Plan self-check

Requirements R1–R5 map to the listed work and concrete DoD. IDs are unique, prerequisites resolve locally, and the chain is acyclic. Upstream establishment and plan approval remain separate gates. KISS retains existing mechanisms with sequential execution; STE preserves evidence and publication limits. No Plan blocker remains. The user explicitly approved the plan before implementation.

## Preparation evidence

The existing Artifact Plane task parser accepted both plans: ADD has two tasks and one edge; Plane has three tasks and two edges. Neither has graph diagnostics. The shared brief parser accepted membership and criteria without diagnostics. All 15 relative Markdown links in the new member changes and brief resolved without ancestor README links. git diff --check passed. Established versions, reusable bundle files, and application code are unchanged. These checks validate preparation only; implementation and acceptance checks have not run.

## Upstream delivery checks

ADD guidance task DoD passed. Go test/vet and the website production build passed for the updated bundle. The user confirmed proposed 2.0.0. Its snapshot excludes tasks and links this retained plan. Artifact Plane remains unimplemented behind upstream team merge and contract recheck.

## Review handoff

[PR #13](https://github.com/hieutran21198/software-engineering/pull/13) contains the upstream delivery. Both ADD tasks have concrete evidence. The user-approved Plane plan remains in the preparation branch. Stop for required team review/merge, then recheck ADD 2.0.0 before dependent implementation.
