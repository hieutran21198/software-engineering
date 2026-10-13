---
tasks:
  - 01-delivery-reader.md
  - 02-navigation.md
  - 03-integration.md
---

# Task retention implementation plan — artifact-plane

## Tasks

- [Resolve change-owned historical delivery](01-delivery-reader.md)
- [Remove standalone Workflow navigation](02-navigation.md)
- [Validate integrated Plane and prepare delivery](03-integration.md)

## Gates and coordination

Requires established ADD specifications/task-retention.md from change-task-retention and a recorded contract recheck before any implementation. Explicit plan approval is also required. Tasks form a sequential chain. Execute sequentially; these scopes do not require concurrent implementers. The current capable session handles Specification and Plan. Keep unit membership and shared evidence under coordinator control.

ADD publication precedes dependent Plane implementation. Use separate upstream and downstream publication branches/PRs so an unmerged upstream contract never gates itself through one combined PR. This preparation branch contains both reviewed plans; publish only ADD implementation first, then rebase/recheck the Plane preparation after upstream establishment. Preserve the existing artifact-driven → artifact-plane dependency and create no membership-derived edge.

## Versions and review

Suggest ADD 2.0.0 because the delivered snapshot layout changes; suggest Plane 1.8.0 for additive layout compatibility and navigation simplification. The user confirms or overrides each at Version preparation. Future snapshots exclude tasks and link this retained change plan; existing snapshots remain intact. PR handoff stops for team review and merge. No implementation checks have run.

## Plan self-check

Requirements R1–R5 map to the listed work and concrete DoD. IDs are unique, prerequisites resolve locally, and the chain is acyclic. Upstream establishment and plan approval remain separate gates. KISS retains existing mechanisms with sequential execution; STE preserves evidence and publication limits. No Plan blocker remains; explicit approval is pending.

## Preparation evidence

The existing Artifact Plane task parser accepted both plans: ADD has two tasks and one edge; Plane has three tasks and two edges. Neither has graph diagnostics. The shared brief parser accepted membership and criteria without diagnostics. All 15 relative Markdown links in the new member changes and brief resolved without ancestor README links. git diff --check passed. Established versions, reusable bundle files, and application code are unchanged. These checks validate preparation only; implementation and acceptance checks have not run.
