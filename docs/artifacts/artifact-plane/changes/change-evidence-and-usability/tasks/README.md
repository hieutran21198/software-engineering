---
tasks:
  - 01-publication-evidence.md
  - 02-comparison-service.md
  - 03-comparison-interface.md
  - 04-model-explanations.md
  - 05-incremental-refresh.md
  - 06-responsive-repair.md
  - 07-integration-publication.md
---

# artifact-plane evidence and usability plan

## Gates and sequence

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs.

1. [Interpret evidence and reconcile publication context](01-publication-evidence.md)
2. [Add explicit comparison targets to HTTP and MCP](02-comparison-service.md)
3. [Show comparison context and actionable evidence](03-comparison-interface.md)
4. [Explain dependencies and model interactions](04-model-explanations.md)
5. [Reduce idle full reads with bounded recovery](05-incremental-refresh.md)
6. [Resolve the merged browser regressions](06-responsive-repair.md)
7. [Validate the combined outcome and prepare Plane review](07-integration-publication.md)

## Execution

Execute sequentially on dedicated branches. Parsing, presentation and validation share sources; sequence keeps integration review simple. If later parallel work is useful, use separate worktrees with nonconflicting ownership and coordinator-owned knowledge. Do not copy prior tasks or claim prior checks validate this delivery.

## Plan self-check

All requirements map to tasks with explicit ownership, governing contracts, prerequisites and observable DoD. Membership and acyclicity are checked before handoff. KISS reuses existing files/services and limits the scaffold to guidance. STE preserves verification and uncertainty boundaries. The user approved this concrete plan and proposed versions in the conversation. Delivery results remain task-owned.

## Plan approval

The user explicitly approved the ten-task plan and suggested ADD 2.3.0 and Plane 1.14.0 versions. The unchanged approved tasks retain that authorization. Required upstream establishment remains a separate execution gate; material scope or contract changes require renewed approval.
