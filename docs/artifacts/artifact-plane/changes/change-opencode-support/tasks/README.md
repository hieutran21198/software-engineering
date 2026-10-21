---
tasks:
  - 01-verify-v2-contract.md
  - 02-lifecycle-bridge.md
  - 03-project-setup.md
  - 04-integration-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/README.md#plan-self-check
---

# OpenCode Plane plan

Implement the [native V2 integration contract](../../../specifications/opencode-support.md). The compatibility level is minor because OpenCode support is additive and retains existing command hooks, MCP tools, runtime schema and browser behavior.

## Claims and boundaries

The specification's `v2-runtime-contract` and `live-activation` claims remain open. The first task verifies the target SDK before bridge implementation. No `opencode` executable is available in the current shell. An incompatible API requires a specification amendment and renewed approval. Live activation is a delivery check, not a fixture assertion.

The ADD supplier change must establish before this member's implementation starts. Recheck the specification reference against protected Git after that merge. Membership does not bypass the gate.

## Execution and publication

The task declarations define the graph. Contract verification precedes bridge and setup work. Those tasks can run in separate implementer worktrees if their scopes do not overlap. Integration joins both. The coordinator owns flow updates, evidence, shared checks and the proposed version. Publish the dependent branch for team review; never merge it automatically.

## Plan self-check

KISS uses one bridge around the existing hook executable. STE keeps unknown runtime behavior separate from promised behavior. All OP and OPA IDs have coverage. Four unique task IDs form an acyclic graph with a validation join. The two flow records point to the documented contract and disclose evidence gaps. No browser UI changes require screenshots. Validator results are recorded below when executed.

Ran `validateKnowledge(process.cwd(), {change: "artifact-plane/change-opencode-support"})` through the unchanged validator at `/home/cirius/Workspaces/personal/software-engineering/apps/artifact-plane/scripts/validate-knowledge.mjs`: `ok: true`, zero diagnostics. The working directory was `/tmp/opencode/software-engineering-opencode`. `git diff --check` passed. These checks validate planning records, not implementation or the open runtime claims.
