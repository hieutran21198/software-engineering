---
tasks:
  - 01-deliver.md
compatibility: patch
self_check:
  result: passed
  source: docs/artifacts/nix-packages/changes/change-plane-npm-deps-hash/tasks/README.md#plan-self-check
---

# Refresh the dependency hash

Make the Nix package check build the 1.29.0 Plane sources again. The task list
defines the one-task graph.

## Plan self-check

KISS changes one hash and records the rule that keeps it current. STE states the
observed values. NP5 has task coverage, and the DoD is observable at the
`x86_64-linux` package check.
