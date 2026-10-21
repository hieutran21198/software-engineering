---
tasks:
  - 01-guidance-and-profiles.md
  - 02-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-opencode-support/tasks/README.md#plan-self-check
---

# OpenCode ADD plan

Implement the [OpenCode harness contract](../../../specifications/opencode-support.md) in this repository. The compatibility level is minor because the change adds supported harness setup without changing existing ADD contracts or adoption behavior.

The task list defines the graph. Validate the bundle and native setup, prepare the proposed ADD version, then publish for team review. Do not start the Plane member implementation until the required ADD knowledge establishes. Do not merge or enable auto-merge.

## Plan self-check

KISS uses two tasks and existing skill entries. STE keeps setup and verification distinct. Every new requirement and acceptance ID has task coverage. The task IDs are unique; the validation task depends on the setup task. No unresolved claim changes this member's implementation scope. No browser UI changes require screenshots. Validator results are recorded below when executed.

Ran `validateKnowledge(process.cwd(), {change: "artifact-driven/change-opencode-support"})` through the unchanged validator at `/home/cirius/Workspaces/personal/software-engineering/apps/artifact-plane/scripts/validate-knowledge.mjs`: `ok: true`, zero diagnostics. The working directory was `/tmp/opencode/software-engineering-opencode`. `git diff --check` passed. These checks validate planning records, not implementation.
