---
tasks:
  - 01-verify-interfaces.md
  - 02-output-reader.md
  - 03-settings.md
  - 04-acp-client.md
  - 05-terminal-adapter.md
  - 06-runner.md
  - 07-session-api.md
  - 08-terminal-relay.md
  - 09-settings-ui.md
  - 10-sessions-ui.md
  - 11-integration.md
  - 12-live-check.md
  - 13-antigravity-provider.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/README.md#plan-self-check
---

# Agent orchestration plan

Implement the [agent orchestration contract](../../../specifications/agent-orchestration.md) and the approved mockups. The compatibility level is minor. The change adds commands, routes, a settings file, a `sessions` table and workbench pages. The runtime schema version stays 1, and the existing hooks, MCP tools, routes and pages keep their behavior. Without a launch profile, Plane behaves as before (requirement AO18).

1. [Verify the harness interfaces](01-verify-interfaces.md).
2. [Session output reader](02-output-reader.md).
3. [Settings service and provider catalog](03-settings.md).
4. [ACP client and provider check](04-acp-client.md).
5. [Terminal adapter](05-terminal-adapter.md).
6. [Session runner](06-runner.md).
7. [Session API and orchestrator](07-session-api.md).
8. [Embedded terminal relay](08-terminal-relay.md).
9. [Agent settings pages](09-settings-ui.md).
10. [Session pages and dialogs](10-sessions-ui.md).
11. [Integration and validation](11-integration.md).
12. [Live harness check](12-live-check.md).
13. [Antigravity provider](13-antigravity-provider.md).

## Claims and gates

The first task checks the open claims of the Specification before any adapter code: `commandcode-acp-shape`, `claude-acp-plan-sign-in`, `terminal-model-flags`, `herdr-named-sessions` and `provider-check-history`. It also checks the supported claims `acp-agent-interfaces` and `per-model-effort-discovery` and the requirement claim `harness-session-interfaces`. A refuted claim goes to the Specification through the Amendment runbook. A material amendment needs new plan approval before the dependent task starts.

The only upstream reference is the task DAG contract of artifact-driven, and it is established. Implementation waits for no upstream version. This branch is stacked on PR #70 (Plane 1.30.0 and ADD 3.6.0). After that PR merges, the coordinator rebases this branch with the Renumber runbook before the version record.

## Execution

The task declarations define the graph. The waves are:

| Wave | Tasks |
| --- | --- |
| 1 | `verify-interfaces`, `output-reader` |
| 2 | `settings` |
| 3 | `acp-client`, `terminal-adapter` |
| 4 | `runner`, `settings-ui` |
| 5 | `session-api`, `terminal-relay` |
| 6 | `sessions-ui` |
| 7 | `antigravity-provider` |
| 8 | `integration` |
| 9 | `live-check` |

Tasks of one wave run in separate implementer worktrees and branches. The coordinator integrates their commits on `claude/agent-orchestration`, owns all knowledge edits, claims, flows and shared evidence, and prepares the version and the PR. The live tasks follow the Live check runbook: a disposable clone, private state and configuration directories, and no relaxed permission without the owner's consent. Programs that are missing on this computer are installed only in that disposable environment, after the owner agrees.

## Plan self-check

- KISS: the tasks follow the components of the contract. Each task adds one component with its tests, and no task adds a layer that the contract does not name. Fake ACP agents, a fake herdr and a fake ttyd keep the Node and browser checks offline; only the two live tasks start real harness tools.
- Coverage: every AO, AOA and changed OP ID is in the `covers` of a task. Each DoD item names an observable result.
- Graph: thirteen unique task IDs, two roots, joins at `runner`, `session-api` and `sessions-ui`, a sequential end with `antigravity-provider`, `integration` and `live-check`, and no cycle. The fifth amendment added `antigravity-provider` after the owner confirmed that Antigravity CLI replaced Gemini CLI.
- UI: the session and settings tasks match the approved mockup artboards, and `integration` holds the owner look at screenshots.
- STE: one rule in each sentence or table row, in active voice.
