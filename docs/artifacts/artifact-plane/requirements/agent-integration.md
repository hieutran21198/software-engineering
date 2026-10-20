---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/agent-integration.md#requirement-self-check
---

# Agent integration

## Outcome

An agent in Claude Code, Codex or Google Antigravity gets the Plane through the released executable: it knows the state of its change when a session starts or resumes, it is stopped before three actions that ADD reserves for people, it is asked to fix record errors before it finishes, and its task shows on the implementation graph without a manual binding step.

## Need

Facts on 19 October 2026, Plane 1.22.0:

- The executable has the commands `serve`, `mcp` and `model-install` (server/app.js). The observer commands `register`, `bind`, `report`, `query` and `hook` run only from a source checkout through `node server/runtime-cli.js`. integration/hooks.example.json calls `node /absolute/path/apps/artifact-plane/server/runtime-cli.js hook`.
- The observer is documented and checked for Codex only (integration/README.md, codex-cli 0.160.1). The Claude Code hooks reference names the same input fields (`hook_event_name`, `session_id`, `cwd`, `agent_id`). No example or test covers Claude Code.
- An observer attempt exists only after an explicit `runtime-cli bind` for each session and each subagent. The delivery of 1.22.0 ran three implementers in parallel worktrees; none was bound, and this repository has no hook configuration.
- The MCP registration example in the README starts `node .../server/flow-mcp-stdio.js`. The MCP server reports the version 1.12.2, which is fixed in server/flow-mcp.js.
- The MCP server has ten read tools and two write tools. No tool returns the change status and next step of the human-guidance specification, and no tool runs the record checks of the validator. The server sends no instructions that say which tool serves which ADD activity.
- The ADD coordinator reference says "Use configured packet or MCP discovery when present" and names no tool.
- This repository registers no MCP server and no hook: `.claude` holds skills only, and `.codex/config.toml` enables agents only.
- AGENTS.md forbids an agent to commit to `main` or `master` and to merge pull requests. No hook or permission rule of this repository enforces it.
- The validator takes 1.0 to 1.4 seconds on this repository. The executable starts and prints its version in 0.12 seconds after its first start.
- Claude Code 2.1.301 and codex-cli 0.163.0, installed on this machine, support command hooks at session start (with the sources startup, resume, clear and compact), before and after a tool call, and at stop. Both accept added context at session start, a deny decision before a tool call, and a block decision with a reason at stop.
- The owner decided on 19 October 2026: keep the observer and bind automatically; commit the MCP and hook configuration of this repository; the technical lead selects the hook behaviors from research. Playbooks are out of scope.
- On 20 October 2026, the owner asked to support Google Antigravity alongside Claude Code and Codex. Antigravity loads workspace hooks from `.agents/hooks.json` and workspace MCP servers from plugins under `.agents/plugins/<name>/mcp_config.json` (or globally from `~/.gemini/config/mcp_config.json`). Its hook payloads use camelCase (`conversationId`, `workspacePaths`, `toolCall`, `invocationNum`, `executionNum`, `terminationReason`) and its hook outputs use `injectSteps`, `decision: "deny"` and `decision: "continue"`.

## Requirements

- AI1: The executable offers the observer commands with the behavior that `runtime-cli.js` has from source.
- AI2: One hook command of the executable serves the lifecycle hooks of Claude Code, Codex and Antigravity. The README gives one configuration example for each harness.
- AI3: When a session starts, resumes, clears or compacts, the hook gives the agent the state of the changes in its worktree: artifact, change, tier, status, next step and unchecked DoD items. The state comes from the change records and local Git, as the change page shows it. The hook creates no workflow state.
- AI4: Before an agent stops, when a current change of its worktree has record errors, the hook asks the agent once to fix or explain them. The hook does not ask again in the same stop sequence.
- AI5: In an ADD repository the hook refuses three agent actions, and gives the reason: a commit on the protected branch, a push to the protected branch, and the merge of a pull request.
- AI6: The observer binds an agent to a task when the agent reads a listed task file of a current plan. Each binding shows whether it is explicit or inferred. An explicit binding replaces an inferred one.
- AI7: A failure of the Plane never stops agent work. A missing executable, an older version, an error or a timeout has no effect on the agent. A hook stores no prompt, tool input, command, tool output or transcript.
- AI8: The MCP server offers the change state of AI3 and the record checks of the validator for a configured repository.
- AI9: The MCP server sends instructions that map ADD activities to its tools, and it reports the package version. When no repository is configured, it uses the Git top level of its working directory.
- AI10: The Plane README describes how to register the MCP server and the hooks of the executable in Claude Code, Codex and Antigravity, with the trust or plugin steps of each harness. The source path stays documented.
- AI11: This repository commits the MCP and hook configuration for Claude Code, Codex and Antigravity. The configuration calls the executable on the path, and it has no effect when the executable is missing or older.
- AI12: The existing observer states, MCP tools, HTTP interface and source workflow keep their behavior.
- AI13: For an Antigravity hook input, `artifact-plane hook` normalizes the session, workspace directory, turn, model and tool arguments from the camelCase payload and returns the Antigravity output shape for `SessionStart`, `PreToolUse` and `Stop`.
- AI14: On an Antigravity `Stop` event, the hook runs the stop check only on a first normal completion (`terminationReason` is `NO_TOOL_CALL` and `executionNum` is at most 1) so that a forced continuation does not repeat the stop block in the same turn.

## Acceptance criteria

- AIA1: A Node test sends recorded Claude Code, Codex and Antigravity hook inputs to the hook command of the built application and gets the context of AI3, the refusals of AI5, the stop request of AI4 and no output for other events.
- AIA2: A test shows that each of the three AI5 actions is refused only in an ADD repository and only for its condition, and that a command that only names the action in text is not refused.
- AIA3: A test shows that a hook with a missing repository, a broken store or invalid input exits with status 0 and changes nothing, and that the stored rows hold no prompt, input, command or output.
- AIA4: A test shows an inferred binding after a task file read in a linked worktree and by a subagent (including an Antigravity tool call), and an explicit binding that replaces it.
- AIA5: An MCP client lists the new tools, reads the instructions and the package version, and gets the same status as the change page and the same result as the validator for one change.
- AIA6: In this repository, a Claude Code session and a Codex session with the committed configuration start, receive the context of AI3 and list the MCP tools. The evidence records the harness versions.
- AIA7: The existing Node, browser and Go suites and the executable smoke check pass.
- AIA8: A Node test sends recorded Antigravity hook inputs (`SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse`, `Stop` with `NO_TOOL_CALL` and `executionNum` 1 versus 2) and verifies the Antigravity `injectSteps`, `decision: "deny"` and `decision: "continue"` outputs, inferred task binding from `toolCall.args.Path`, and observer turn progression.
- AIA9: This repository contains `.agents/hooks.json` and `.agents/plugins/artifact-plane/{plugin.json,mcp_config.json}`, and `apps/artifact-plane/integration/` contains `antigravity-hooks.example.json` and Antigravity setup instructions.

## Affected artifacts and flows

Artifact Plane and the agent configuration files of this repository, coordinated with `artifact-driven` in the `antigravity-support` unit of work. Flows: execution-observation and agent-session-guidance include Antigravity alongside Claude Code and Codex. `se-adopt` and the other Plane flows are not changed.

## Requirement self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` reports `ok: true`. Each fact comes from the code, the README, the configuration files, a measurement on this machine, the harness documentation or the owner's decision. Each requirement states one need and is testable through AIA1 to AIA9. The output formats, the binding rule, the detection of reserved actions and the time limits belong to Specification. KISS: one hook command, one status source shared with the change page, no new store. STE: one rule in each item. No blocker prevents Specification.
