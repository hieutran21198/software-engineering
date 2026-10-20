---
tasks:
  - 01-workbench-step.md
  - 02-repository-address.md
  - 03-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/README.md#plan-self-check
---

# Workbench discovery plan

1. [Workbench step](01-workbench-step.md): the identity route, the workbench step, its hook output and the Node tests.
2. [Repository address](02-repository-address.md): the `repository` query parameter of the workbench and its browser test.
3. [Validation](03-validation.md): the integration README, the suites, the live check, the claims, the unit evidence and the version.

Tasks 01 and 02 have no dependency on each other and can run in parallel worktrees. Task 03 depends on both. The coordinator keeps the knowledge edits and task 03.

## Plan self-check

Every ID of requirements/ui-discovery.md is in the `covers` of a task. The graph has three tasks, no cycle and one end. Each DoD item names an observable check. Compatibility is minor: the hook adds output fields, the server adds one route and the workbench adds one query parameter; no existing output, route, tool or command changes. The six claims of the specification are open; tasks 01, 02 and 03 check them. KISS: one module, one route, one parameter and two environment variables; no store. STE: one check in each DoD item.
