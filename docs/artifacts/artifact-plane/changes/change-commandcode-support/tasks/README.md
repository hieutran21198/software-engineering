---
tasks:
  - 01-hook-input.md
  - 02-project-setup.md
  - 03-integration-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/README.md#plan-self-check
---

# Command Code Plane plan

Implement the [Command Code integration contract](../../../specifications/commandcode-support.md).
The compatibility level is minor because the change adds a harness entry and
retains existing command hooks, MCP tools, runtime schema and browser behavior.

## Claims and boundaries

The `commandcode-payload` and `headless-sessionstart` claims are recorded from a
live 1.85.1 probe. The headless context limit cannot become live evidence
without an interactive session; the validation task records that limit rather
than claiming activation. The ADD supplier change must establish before this
member's implementation starts. Membership does not bypass the gate.

## Execution and publication

The task declarations define the graph. Hook input work and project setup can
run in separate implementer worktrees if their scopes do not overlap.
Integration joins both. The coordinator owns flow updates, evidence, shared
checks and the proposed version. Publish the dependent branch for team review;
never merge it automatically.

## Plan self-check

KISS reuses the existing hook command and adds one small input normalization.
STE keeps unknown behavior separate from promised behavior. All CP and CPA IDs
have coverage. Three unique task IDs form an acyclic graph with a validation
join. No browser UI change requires screenshots.

Ran `node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-plane/change-commandcode-support`: `ok: true`.
