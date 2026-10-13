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

All new requirements map to tasks and concrete DoD. Internal edges form a sequential acyclic chain; inherited tasks are excluded. Existing artifact DAG remains artifact-driven -> artifact-plane. Knowledge formats, gates, safe discovery, aggregation, browser behavior, and integration validation are covered. KISS reuses current libraries/readers and STE keeps evidence and establishment distinct. The user explicitly approved this plan. ADD 1.2.0 established before dependent execution; the upstream recheck passed. Implementation evidence is recorded in the listed tasks.

## Preparation evidence

The existing Artifact Plane task parser accepted both new plans: ADD has two tasks and one edge; Plane has four tasks and three edges, with no diagnostics. A local link check resolved all 44 Markdown links in the change snapshots and found no ancestor references. git diff --check passed. No implementation or browser acceptance checks have run.

## Integrated result

All four approved tasks have concrete implementation and check evidence. Node tests (91), production build, Chromium acceptance (13), and repository Go adoption/fidelity checks passed. The user confirmed Plane 1.6.0. Shared outcome checks are recorded in its brief; completion still requires Plane publication. No workflow state or duplicate DAG was introduced.

## Review handoff

[PR #11](https://github.com/hieutran21198/software-engineering/pull/11) contains the validated Plane implementation, shared outcome evidence, and user-confirmed proposed 1.6.0 snapshot. Upstream [ADD PR #10](https://github.com/hieutran21198/software-engineering/pull/10) is merged. Stop for team review and merge; no deployment, tag, automatic merge, or establishment is claimed for Plane.
