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

- [ ] `.agents/hooks.json` and `apps/artifact-plane/integration/antigravity-hooks.example.json` define the `"artifact-plane"` hook group with `SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse` and `Stop` calling `artifact-plane hook --event <Event> || true`.
- [ ] `.agents/plugins/artifact-plane/plugin.json` and `.agents/plugins/artifact-plane/mcp_config.json` register the `artifact-plane` stdio MCP server (`command: "artifact-plane"`, `args: ["mcp"]`).
- [ ] `apps/artifact-plane/integration/README.md` and `apps/artifact-plane/README.md` document Antigravity hook and MCP setup (workspace plugin and global `~/.gemini/config/mcp_config.json`) alongside Claude Code and Codex.
