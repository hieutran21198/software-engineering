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

### Environment preflight

The isolated target executable at `/tmp/opencode/opencode2-native/node_modules/@opencode/cli-linux-x64/bin/opencode` reports 2.1.2. The task 01 native-runtime probe records how it was obtained without changing global user configuration. Node.js is v24.21.0 and Go is 1.26.8 on linux/amd64.

An initial `npm --prefix apps/artifact-plane run build:app` failed because the reused original-checkout dependency directory had no `postject` module. Removed only the worktree dependency symlink created for this delivery, then installed local dependencies with `npm --prefix apps/artifact-plane ci --ignore-scripts --no-audit --no-fund`. No tracked dependency manifest changed. The same build and `TMPDIR=/tmp/opencode node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` then passed. This preflight executable reports the existing package version 1.26.1; final version checks must run again after version preparation.

`go test -count=1 ./...` and `go vet ./...` passed. The logs `/tmp/opencode/opencode-plane-build-app.log` and `/tmp/opencode/opencode-plane-app-smoke.log` contain the local build and smoke results. These preflight checks do not complete native bridge activation or the final combined change checks.

The cached Playwright browser could not start because its host lacked `libnspr4.so`. A scoped Nix Chromium dependency fetch reached its first 300-second deadline. This is a test-environment fault, not a browser regression result. The selected browser suites and final bridge checks remain required; neither is replaced by static inspection or by task 01's provider fixture.
