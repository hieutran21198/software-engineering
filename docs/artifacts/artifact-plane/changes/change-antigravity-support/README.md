---
tier: large
---

# Support Antigravity in Artifact Plane hooks and MCP configuration

## Reason and scope

On 20 October 2026 the owner asked to support Google Antigravity alongside Claude Code and Codex. In Plane 1.24.0, `artifact-plane hook` parses only the `snake_case` hook input of Claude Code and Codex (`hook_event_name`, `session_id`, `cwd`, `tool_input`) and writes only their output shapes (`hookSpecificOutput` and `decision: "block"`). Antigravity sends `protojson` camelCase hook payloads (`conversationId`, `workspacePaths`, `toolCall`, `invocationNum`, `terminationReason`) and expects Antigravity output shapes (`injectSteps`, `decision: "deny"`, `decision: "continue"`). In addition, this repository commits hook and MCP configurations for Claude Code and Codex only.

The tier is large because this change is part of a two-artifact unit of work and updates the agent-session-guidance and execution-observation flows.

Included:

- Antigravity input normalization and output formatting in `artifact-plane hook` (`SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse`, `Stop`), including optional `--event <name>` disambiguation;
- reserved-action refusal and inferred task binding from Antigravity tool calls (`run_command`, `read_file`, `view_file` and equivalents);
- single-pass stop check for Antigravity (`decision: "continue"` only on the initial normal stop, preventing infinite loops);
- `.agents/hooks.json` and `.agents/plugins/artifact-plane/` (`plugin.json` and `mcp_config.json`) committed in this repository, plus `integration/antigravity-hooks.example.json` and setup documentation in `integration/README.md` and `README.md`.

Excluded: changes to MCP tool schemas, HTTP routes, SQLite schema, or automatic edits to `~/.gemini/config/`.

Knowledge is edited in place on this branch. The unit brief is [Antigravity support](../../../units-of-work/antigravity-support/README.md).

- [Requirements: agent integration](../../requirements/agent-integration.md)
