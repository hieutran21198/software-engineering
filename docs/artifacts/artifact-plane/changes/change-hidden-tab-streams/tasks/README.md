---
tasks:
  - 01-hidden-tab-streams.md
  - 02-reply-guard.md
  - 03-validation.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/README.md#plan-self-check
---

# Hidden-tab streams plan

1. [Close event streams in hidden browser tabs](01-hidden-tab-streams.md)
2. [Guard JSON replies so a failure cannot stop the server](02-reply-guard.md)
3. [Validate the combined result](03-validation.md), after tasks hidden-tab-streams and reply-guard

Tasks hidden-tab-streams and reply-guard change different files and can run in either order.

## Approval and prerequisites

Present this plan for explicit user approval before implementation. The owner approved it on 18 October 2026. ADD 2.8.0 and Artifact Plane 1.18.0 are established on main; no upstream contract is proposed. A material change to the hidden-tab rules or the reply guard requires renewed approval.

After all tasks pass, the coordinator suggests version 1.18.1 (compatible patch: no API, route or contract consumer changes), adds the version record and the unit evidence, and opens one PR.

## Plan self-check

Task hidden-tab-streams covers R11 and the Hidden browser tab rules in project-tabs.md; task reply-guard covers R12 and the reply rule in explorer.md; task validation covers the unit criteria hidden-tabs, return, reply-guard and preserved on the combined result, including the three-tab reproduction from the diagnosis. The graph has three listed tasks, unique IDs and two edges (hidden-tab-streams → validation, reply-guard → validation); it has no cycle. No artifact edge changes. KISS: one small hook, one changed condition in two places, and a reordered reply function; tests extend existing suites. STE: each DoD item names one observable check.
