---
tasks:
  - 04-task-contract.md
  - 05-delivery-checks.md
---

# Implementation task DAG plan

Baseline: established 1.0.0. Tasks 01–03 are retained historical context and excluded from this plan. This plan uses the proposed task contract in specifications/task-dag.md; it does not claim that contract is established.

## Execution

1. [Update method and delivered guidance](04-task-contract.md).
2. [Validate bundle delivery and prepare publication](05-delivery-checks.md), after task-contract.

Execute sequentially because delivery validation consumes the updated guidance. The coordinator owns knowledge and evidence. Independent useful work can use delegated implementers after approval, with isolated worktrees; no concurrent task is necessary for this two-task chain.

## Coverage and validation

Task-contract covers D1–D7 through foundation, methodology, writing, role, and packaged guidance. Delivery-checks verifies canonical/packaged parity, required skill references, legacy rules, task examples, documentation hierarchy, Go adoption, and website publishing. Reuse existing tests; do not add a standalone workflow runner or status store.

## Publication and downstream gate

After DoD passes, propose ADD 1.1.0 for user confirmation: an additive task format with historical-plan compatibility. Prepare its complete snapshot and consistent root/index updates, then push a dedicated branch and open the upstream PR. Stop for team review and merge. Keep prepared Artifact Plane knowledge on a companion branch/PR rather than including unimplemented Plane release state in the ADD release. It may be reviewed as preparation, but no Plane implementation starts before the required ADD version lands on main. No merges or deployments are authorized.

## Plan self-check

All D requirements map to concrete work and checks. The graph has task-contract -> delivery-checks, no missing IDs or cycles, and excludes copied historical tasks. There is no ADD upstream artifact gate. KISS uses the existing bundle and validation commands. STE preserves proposed/established distinctions. Plan is complete and awaits explicit user approval.

## Preparation checks

A local Node check verified declared task paths, unique IDs, resolved prerequisites, acyclicity, and exclusion of historical tasks for both plans. All 31 Markdown links in the two complete change snapshots resolve and do not link to ancestors. git diff --check passed. Implementation checks have not run.
