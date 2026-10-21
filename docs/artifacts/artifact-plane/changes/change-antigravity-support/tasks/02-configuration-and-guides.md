---
id: configuration-and-guides
depends_on: [antigravity-hook-adapter]
covers:
  - element: requirements/agent-integration.md
    ids: [AI2, AI10, AI11, AIA9]
---

# Configuration and guides

## Scope and ownership

Coordinator. `.agents/hooks.json`, `.agents/plugins/artifact-plane/plugin.json`, `.agents/plugins/artifact-plane/mcp_config.json`, `apps/artifact-plane/integration/antigravity-hooks.example.json`, `apps/artifact-plane/integration/README.md` and `apps/artifact-plane/README.md`.

## Governing knowledge

`specifications/agent-integration.md`: Configuration.

## Definition of Done

- [x] `.agents/hooks.json` and `apps/artifact-plane/integration/antigravity-hooks.example.json` define the `"artifact-plane"` hook group with `SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse` and `Stop` calling `artifact-plane hook --event <Event>` with fail-open guards.
- [x] `.agents/plugins/artifact-plane/plugin.json` and `.agents/plugins/artifact-plane/mcp_config.json` register the `artifact-plane` stdio MCP server (`command: "artifact-plane"`, `args: ["mcp"]`).
- [x] `apps/artifact-plane/integration/README.md` and `apps/artifact-plane/README.md` document Antigravity hook and MCP setup (workspace plugin and global `~/.gemini/config/mcp_config.json`) alongside Claude Code and Codex.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Hook configuration files | `.agents/hooks.json` and `apps/artifact-plane/integration/antigravity-hooks.example.json` define the `"artifact-plane"` hook group (`SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse`, `Stop`); `test/agent-config.test.js` verifies both files and live Antigravity execution confirmed `PreToolUse` allows tool calls when Plane 1.24.0 is on `$PATH` | Passed |
| Workspace MCP plugin files | `.agents/plugins/artifact-plane/plugin.json` and `.agents/plugins/artifact-plane/mcp_config.json` register `artifact-plane mcp`; verified by `test/agent-config.test.js` | Passed |
| Integration and Plane READMEs | `apps/artifact-plane/integration/README.md` and `apps/artifact-plane/README.md` document Antigravity MCP and hook setup alongside Claude Code and Codex | Passed |
