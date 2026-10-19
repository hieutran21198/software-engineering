---
id: mcp-tools
depends_on: [guidance-functions]
covers:
  - element: requirements/agent-integration.md
    ids: [AI8, AI9, AIA5]
---

# MCP tools

## Scope and ownership

Implementer, own worktree. `server/flow-mcp.js`: the tools `get_change_status` and `check_records`, the instructions, the package version and the default root; MCP tests.

## Governing knowledge

specifications/agent-integration.md: MCP; specifications/record-checks.md of artifact-driven (validator result).

## Definition of Done

- [ ] An MCP client lists the two new tools with read-only annotations and receives the instructions text and the package version.
- [ ] `get_change_status` equals `worktreeStatus` and `check_records` equals `validateKnowledge` for one change of the fixture.
- [ ] Without `--repository`, the server uses the Git top level of its working directory, and fails with the usage error outside a Git work tree.
- [ ] The existing MCP tools keep their inputs and results: the existing MCP tests pass, and only their lists and counts of tool names change; `npm test` passes.

## Evidence
