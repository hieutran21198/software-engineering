---
id: integration-validation
depends_on: [lifecycle-bridge, project-setup]
covers:
  - element: requirements/opencode-support.md
    ids: [OP6, OP7, OPA1, OPA2, OPA3, OPA4]
---

# Validate the combined OpenCode integration

## Scope and ownership

Implementer runs integration checks; the coordinator records shared evidence and prepares publication. Governing contract: `specifications/opencode-support.md`. Scope includes mock V2 tests, hook subprocesses, MCP configuration and a disposable live V2 session. No global user settings or permissions are changed.

## Definition of Done

- [ ] New bridge and configuration suites pass against the verified target package and actual hook subprocesses.
- [ ] Existing `agent-config`, `agent-hook`, `agent-guidance`, `agent-mcp`, `runtime-hooks`, `runtime-binding` and `runtime-store` tests pass.
- [ ] `npm --prefix apps/artifact-plane test`, `npm --prefix apps/artifact-plane run build`, `go test ./...` and `go vet ./...` pass.
- [ ] Build the executable with `npm --prefix apps/artifact-plane run build:app` and verify the hook and MCP smoke checks.
- [ ] The knowledge validator reports `ok: true` for both member changes with no uncovered new IDs.
- [ ] Live V2 evidence records version, actual plugin loading, MCP tools, context injection and recognized reserved-action refusal in a disposable repository.
- [ ] Live checks preserve existing ask/deny decisions and distinguish missing observation metadata from successful task validation.
- [ ] If a V2 runtime or required live check is unavailable, record the concrete blocker and do not claim verified full delivery.
- [ ] Reassess final impact and flow support; update the unit's shared evidence without duplicating task results.

## Evidence

No implementation checks have run. The current shell has Node.js v24.21.0 but no `opencode` executable. Fixture tests cannot replace the live activation check.
