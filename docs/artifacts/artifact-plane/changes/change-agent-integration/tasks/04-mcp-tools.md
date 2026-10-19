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

- [x] An MCP client lists the two new tools with read-only annotations and receives the instructions text and the package version.
- [x] `get_change_status` equals `worktreeStatus` and `check_records` equals `validateKnowledge` for one change of the fixture.
- [x] Without `--repository`, the server uses the Git top level of its working directory, and fails with the usage error outside a Git work tree.
- [x] The existing MCP tools keep their inputs and results: the existing MCP tests pass, and only their lists and counts of tool names change; `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Tools, instructions, version | test/agent-mcp.test.js "AIA5": the client lists `get_change_status` and `check_records` with read-only, non-destructive, idempotent and closed-world annotations; `getInstructions()` equals the specification text; `getServerVersion()` is `artifact-plane-flows` with the package version | Passed |
| Same results | "AI8" on the change status fixture: `get_change_status` equals `worktreeStatus` for the main and a linked worktree; `check_records` equals `validateKnowledge` for one change, for the whole repository and for a linked worktree; an unregistered worktree gives 422, an unconfigured path 403, a relative path 400 and an unknown change 400 | Passed |
| Default root | Two "AI9" tests: `app.js mcp` started in `<root>/docs/artifacts` without `--repository` reads `root`; outside a Git work tree it exits with status 1 and "Configure at least one --repository root." | Passed |
| Existing tools | Only the tool-name counts and the sorted name list changed in test/app.test.js, test/flow-adapters.test.js and test/review-adapters.test.js; `npm test` 447 tests, 446 passed, 0 failed, 1 skipped (commit 58d962b) | Passed |

