---
id: configuration
depends_on: [hook-command, mcp-tools]
covers:
  - element: requirements/agent-integration.md
    ids: [AI10, AI11]
---

# Configuration and guides

## Scope and ownership

Coordinator. `.mcp.json`, `.claude/settings.json`, `.codex/config.toml`, `.codex/hooks.json`, the two example files under integration/, integration/README.md and the Plane README sections on MCP and the observer.

## Governing knowledge

specifications/agent-integration.md: Configuration.

## Definition of Done

- [x] The four repository files have the entries of the Configuration section; `.codex/config.toml` keeps its `[agents]` table.
- [x] integration/hooks.example.json is replaced by the two example files, and a test parses both and checks their events and commands.
- [x] integration/README.md and the Plane README describe registration, trust steps and bind commands for both harnesses with the executable, and keep the source path.
- [x] The documentation link check passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Repository files | `.mcp.json`, `.claude/settings.json`, `.codex/hooks.json` and `.codex/config.toml` (with its `[agents]` table kept) hold the entries of the Configuration section; test/agent-config.test.js compares them with the examples | Passed |
| Example files | integration/hooks.example.json is removed; test/agent-config.test.js parses integration/claude-settings.example.json and integration/codex-hooks.example.json and checks each event, command and timeout | Passed |
| Guides | integration/README.md describes MCP, hooks and trust steps for Claude Code and Codex, the runtime commands of the executable, the source commands and the Windows limit of the store; the Plane README lists `hook` and `runtime`, registers MCP with the executable and keeps the source path | Passed |
| Link check | CI run 39257515159 on commit b8bf50c: the docs job built the website; a local check of the relative links that this change adds to the two READMEs found no missing target | Passed |
