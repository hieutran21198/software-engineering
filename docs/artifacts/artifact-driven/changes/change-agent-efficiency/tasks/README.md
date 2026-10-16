---
tasks:
  - 01-context-and-retention.md
  - 02-adoption-preflight.md
  - 03-json-cli.md
  - 04-integration-publication.md
---

# ADD agent efficiency implementation plan

## Approval and scope

This is a new plan awaiting explicit approval. No implementation has started.
Suggested ADD 2.4.0 is a compatible minor release; confirm or override with approval.
The existing Plane unit retains its membership and seven tasks, plus the proposed
compact extension. No cross-artifact task IDs or membership-derived gates are added.

1. [Correct retention and reduce repeated context loading](01-context-and-retention.md).
2. [Report safe adoption conflicts together](02-adoption-preflight.md).
3. [Expose adoption results as optional JSON](03-json-cli.md), after preflight.
4. [Validate, prepare ADD and coordinate review](04-integration-publication.md).

The first two tasks have independent file scopes. Use sequential execution by
default; if concurrency reduces actual elapsed work, assign separate worktrees
and branches and keep knowledge updates with the coordinator. No extra reviewer
or role session is required. TL performed Specification and Plan in this session.

## Related Plane execution and PRs

Recheck protected ADD 2.3.0 and retained delivery before pending Plane execution.
The new ADD release is not an upstream prerequisite of compact transport. Execute
the existing Plane plan with compact-context after comparison-service and before
its integration-publication join. Do not duplicate the existing seven tasks.

There is one changed Git repository. After both integrated deliveries pass, prepare
one PR containing proposed ADD 2.4.0 and Plane 1.14.0 with the two distinct unit
briefs, retained plans and linked upstream PR #28. If a failure prevents that
combined scope, report it and obtain approval for material re-scoping. Do not merge,
deploy or claim establishment. Verify exact protected delivery after team merge.

## Coverage and self-check

R1/A1 -> preflight; R2/A2 -> JSON CLI; R3-R7/A3-A5 -> context/retention;
R7/A5-A6 -> integration/publication. Benchmarks are task-owned and shared results
reference their details once. Task membership and IDs are explicit, three internal
edges resolve, and the graph is acyclic. No upstream artifact edge changes.
KISS uses existing code and tests. STE keeps cap units and gate conditions explicit.
Plan approval is the only unresolved user decision before implementation.
