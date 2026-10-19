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

- [ ] The four repository files have the entries of the Configuration section; `.codex/config.toml` keeps its `[agents]` table.
- [ ] integration/hooks.example.json is replaced by the two example files, and a test parses both and checks their events and commands.
- [ ] integration/README.md and the Plane README describe registration, trust steps and bind commands for both harnesses with the executable, and keep the source path.
- [ ] The documentation link check passes.

## Evidence
