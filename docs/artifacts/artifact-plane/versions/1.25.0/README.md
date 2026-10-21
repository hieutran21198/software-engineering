---
source_change: change-antigravity-support
---

# artifact-plane 1.25.0

Minor: `artifact-plane hook` accepts `--event <name>`, normalizes Antigravity camelCase hook inputs (`conversationId`, `workspacePaths`, `toolCall`, `invocationNum`, `executionNum`, `terminationReason`), infers task bindings from Antigravity tool calls and emits Antigravity output shapes (`injectSteps`, `decision: "allow"` or `"deny"`, and `decision: "continue"`). This repository commits `.agents/hooks.json` and `.agents/plugins/artifact-plane/{plugin.json,mcp_config.json}`, and `apps/artifact-plane/integration/` adds `antigravity-hooks.example.json` and Antigravity setup instructions. Existing Claude Code and Codex hook behavior, MCP tools and HTTP routes do not change.

The plan and its evidence are in the [retained change](../../changes/change-antigravity-support/tasks/README.md).
