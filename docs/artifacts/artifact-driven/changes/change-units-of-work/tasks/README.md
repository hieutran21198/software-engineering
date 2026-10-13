---
tasks:
  - 17-unit-knowledge.md
  - 18-unit-delivery-validation.md
---

# Units-of-work implementation plan

## Current work

- [Define and deliver unit-of-work knowledge](17-unit-knowledge.md).
- [Validate ADD delivery and prepare upstream publication](18-unit-delivery-validation.md).

Copied earlier tasks remain historical/contextual and are excluded from this graph. Their prior test results do not validate this change.

## Execution and external gates

No upstream artifact prerequisite. Explicit user plan approval gates implementation.

Execute the task chain sequentially. Its dependencies do not justify parallel implementer worktrees. Preserve all valid knowledge and unrelated implementation. Do not introduce a workflow state registry.

## Coordination and publication

The shared outcome is unit-of-work grouping and aggregate exploration across ADD and Plane. Create its brief during approved upstream implementation. Publish ADD first; only after team merge and contract recheck may Plane implementation begin. Shared outcome completion waits for both delivered versions and shared acceptance/integration evidence.

Propose 1.2.0 for the additive opt-in knowledge contract. The user confirms or overrides versions during Version preparation. Required knowledge/code merges establish versions; PR creation does not. Historical completion remains tied to these delivered versions.

## Plan self-check

All new requirements map to tasks and concrete DoD. Internal edges form a sequential acyclic chain; inherited tasks are excluded. Existing artifact DAG remains artifact-driven -> artifact-plane. Knowledge formats, gates, safe discovery, aggregation, browser behavior, and integration validation are covered. KISS reuses current libraries/readers and STE keeps evidence and establishment distinct. This plan awaits explicit user approval. Implementation checks have not run.

## Preparation evidence

The existing Artifact Plane task parser accepted both new plans: ADD has two tasks and one edge; Plane has four tasks and three edges, with no diagnostics. A local link check resolved all 44 Markdown links in the change snapshots and found no ancestor references. git diff --check passed. No implementation or browser acceptance checks have run.

## Authorized project adoption

The user requested project adoption during implementation. AGENTS.md now requires unit briefs for new project ADD outcomes, keeps existing gates, and links the current shared outcome. Established legacy snapshots remain unchanged. This narrow instruction/documentation extension is directly user-authorized and needs no separate implementation task. Link and format checks cover the project instructions and shared brief.

## ADD implementation result

Both upstream tasks have their concrete check results recorded. The user confirmed proposed ADD 1.2.0. Project adoption is in AGENTS.md and the current unit brief. Plane tasks remain unimplemented behind the upstream team-merge gate. Shared outcome completion is not supported until both member versions and combined checks establish.
