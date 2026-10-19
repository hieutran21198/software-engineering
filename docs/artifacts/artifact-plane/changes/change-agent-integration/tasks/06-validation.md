---
id: validation
depends_on: [configuration]
covers:
  - element: requirements/agent-integration.md
    ids: [AI12, AIA6, AIA7]
---

# Validation

## Scope and ownership

Coordinator. The live check with both harnesses, the flow records, the claims, the unit evidence and the version.

## Governing knowledge

specifications/agent-integration.md: Flows, Validation; the unit brief plane-agent-integration.

## Definition of Done

- [x] A Claude Code session and a Codex session in this repository start with the committed configuration and the executable built by CI: each receives the session context and lists the MCP tools; the harness versions are recorded.
- [x] The same sessions with Plane 1.22.0 on the path, and with no executable, run tools without a refusal (claim harness-launch).
- [x] The PreToolUse input of a Codex subagent is recorded (claim codex-subagent-identity); the five claims have a status from evidence.
- [x] specifications/flows/agent-session-guidance.md exists and execution-observation has the new supports; the validator reports no error.
- [ ] The Node, browser and Go suites and the executable smoke check pass; the unit evidence is complete.

## Evidence

Live check on 19 October 2026 in a disposable clone of branch claude/plane-agent-integration (with a local `main`), with Claude Code 2.1.301 (model claude-haiku-5-5, `claude -p`) and codex-cli 0.163.0 (`codex exec`, the project trusted by `-c projects."<clone>".trust_level="trusted"`, and `--dangerously-bypass-hook-trust` for this check only, with the owner's permission). The executable is the Linux AMD64 file of CI run 39255201333. A wrapper on the path recorded each hook input and answer in the session scratchpad; the records were deleted after the check.

| DoD item | Check | Result |
| --- | --- | --- |
| Context and MCP tools | Claude Code: the agent quoted "Artifact Plane 1.22.0: ADD state of <clone> on branch claude/plane-agent-integration." and the change line, and listed the 12 tools of `artifact-plane` from `.mcp.json` without `--repository`. Codex: the same two lines and the same 12 tools from `.codex/config.toml` | Passed |
| Refusal | On `main` with the committed configuration, both agents ran `git commit --allow-empty -m live-check`; both received "ADD reserves commits to main for people (AGENTS.md). Work on a change branch and stop for team review." and HEAD did not change. Codex sends `tool_input` as `{"command": "<string>"}` | Passed |
| Older and missing executable | Plane 1.22.0 on the path: each harness called the hook 6 times, each call ended with status 2 inside `\|\| true`, and `git status` ran. No executable on the path: `git status` ran in both harnesses (claim harness-launch) | Passed |
| Subagent identity | A Claude Code subagent (Explore) and a Codex subagent read tasks/06-validation.md. Both inputs carried the parent `session_id` and the subagent `agent_id`; Codex also sent the subagent's own `turn_id`. Each run created one inferred attempt for the subagent and none for the parent, whose spawn input named the task path (Claude Code) or held an encrypted message (Codex). Claim codex-subagent-identity is refuted | Passed |
| Flows and validator | specifications/flows/agent-session-guidance.md is new; execution-observation has the supports agent-integration-contract, inferred-binding, hook-command and binding-tests; the validator reports `ok: true` for the change and for the repository | Passed |

Finding: Claude Code sends `prompt_id` and no `turn_id`, so the observer showed each Claude Code attempt as Unknown. Commit caf7472 uses `prompt_id` as the turn; test/runtime-store.test.js "Claude Code prompt_id correlates a turn like turn_id" covers it.

