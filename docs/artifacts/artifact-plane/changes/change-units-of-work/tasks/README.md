---
tasks:
  - 17-unit-reader.md
  - 18-unit-graphs.md
  - 19-unit-interface.md
  - 20-unit-integrated-validation.md
---

# Units-of-work implementation plan

## Current work

- [Read unit knowledge and derive establishment evidence](17-unit-reader.md).
- [Derive aggregate dependency and implementation graphs](18-unit-graphs.md).
- [Explore units and their three aggregate views](19-unit-interface.md).
- [Validate integrated outcome and prepare Plane publication](20-unit-integrated-validation.md).

Copied earlier tasks remain historical/contextual and are excluded from this graph. Their prior test results do not validate this change.

## Execution and external gates

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Execute the task chain sequentially. Its dependencies do not justify parallel implementer worktrees. Preserve all valid knowledge and unrelated implementation. Do not introduce a workflow state registry.

## Coordination and publication

The shared outcome is unit-of-work grouping and aggregate exploration across ADD and Plane. Create its brief during approved upstream implementation. Publish ADD first; only after team merge and contract recheck may Plane implementation begin. Shared outcome completion waits for both delivered versions and shared acceptance/integration evidence.

Propose 1.6.0 for additive exploration and response fields. The user confirms or overrides versions during Version preparation. Required knowledge/code merges establish versions; PR creation does not. Historical completion remains tied to these delivered versions.

## Plan self-check

All new requirements map to tasks and concrete DoD. Internal edges form a sequential acyclic chain; inherited tasks are excluded. Existing artifact DAG remains artifact-driven -> artifact-plane. Knowledge formats, gates, safe discovery, aggregation, browser behavior, and integration validation are covered. KISS reuses current libraries/readers and STE keeps evidence and establishment distinct. This plan awaits explicit user approval. Implementation checks have not run.

## Preparation evidence

The existing Artifact Plane task parser accepted both new plans: ADD has two tasks and one edge; Plane has four tasks and three edges, with no diagnostics. A local link check resolved all 44 Markdown links in the change snapshots and found no ancestor references. git diff --check passed. No implementation or browser acceptance checks have run.
