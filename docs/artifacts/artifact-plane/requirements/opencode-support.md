---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/opencode-support.md#requirement-self-check
---

# OpenCode integration

## Outcome and facts

OpenCode V2 users can connect the Plane and receive supported lifecycle guidance. The owner selected project integration, not changes to global user settings. Official V2 documentation provides native MCP configuration, plugin context hooks, permission evaluation hooks and tool hooks. It does not document a stop-blocking hook. The shell environment used for discovery has no `opencode` executable.

## Requirements

- OP1: Project configuration connects the existing Plane stdio MCP server through OpenCode V2.
- OP2: A native V2 plugin supplies change context and the workbench address for the session's actual worktree.
- OP3: Supported shell permission checks refuse recognized actions reserved for people without relaxing existing permissions.
- OP4: Verified lifecycle and tool interfaces record only existing allowlisted observations and preserve task-binding identity rules.
- OP5: Missing executables, unavailable stores, malformed responses and timeouts do not stop ordinary agent work.
- OP6: Integration documentation distinguishes supported behavior, unavailable stop blocking, fixture results and live activation evidence.
- OP7: Existing Claude Code, Codex, Antigravity, MCP and observer behavior remains compatible.
- OP8: The integration never creates prompts, automatically continues work, approves plans or treats an observation as task validation.

## Acceptance criteria

- OPA1: Tests verify native project configuration and plugin registration without user-global settings.
- OPA2: Adapter tests cover session location changes, distinct sessions sharing an agent profile, child isolation, ambiguous turns, context translation and reserved-action decisions.
- OPA3: Failure and privacy tests cover missing binaries, deadlines, invalid or oversized responses and exclusion of prompt, command and result payloads from stored observations.
- OPA4: Regression and knowledge checks pass; live evidence records the target V2 version and actual activated behavior, or names the missing capability as a delivery blocker.

## Impact

The `agent-session-guidance` and `execution-observation` flows gain OpenCode entry support. The ADD supplier owns role and harness guidance. Browser presentation, stored state models and unrelated flows do not change.

## Requirement self-check

Requirements preserve the selected full scope but do not promise an undocumented stop API. KISS reuses the existing hook command, policy and runtime store. STE separates observed facts from unverified runtime behavior. No blocker prevents specification; verification of target SDK shapes and live activation remains explicit implementation work. Validator results are recorded below when executed.

Ran the existing validator from `/home/cirius/Workspaces/personal/software-engineering/apps/artifact-plane/scripts/validate-knowledge.mjs` with `--repository /tmp/opencode/software-engineering-opencode --change artifact-plane/change-opencode-support`: `ok: true`. Coverage warnings are expected until Plan. The worktree-local validator lacks installed Node dependencies; the original checkout supplies the unchanged validator and its dependencies.
