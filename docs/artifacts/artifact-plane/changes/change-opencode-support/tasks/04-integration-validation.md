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

- [x] New bridge and configuration suites pass against the verified target package and actual hook subprocesses.
- [x] Existing `agent-config`, `agent-hook`, `agent-guidance`, `agent-mcp`, `runtime-hooks`, `runtime-binding` and `runtime-store` tests pass.
- [x] `npm --prefix apps/artifact-plane test`, `npm --prefix apps/artifact-plane run build`, `go test ./...` and `go vet ./...` pass.
- [x] Build the executable with `npm --prefix apps/artifact-plane run build:app` and verify the hook and MCP smoke checks.
- [x] The knowledge validator reports `ok: true` for both member changes with no uncovered new IDs.
- [x] Live V2 evidence records version, actual plugin loading, MCP tools, context injection and recognized reserved-action refusal in a disposable repository.
- [x] Live checks preserve existing ask/deny decisions and distinguish missing observation metadata from successful task validation.
- [x] If a V2 runtime or required live check is unavailable, record the concrete blocker and do not claim verified full delivery.
- [x] Reassess final impact and flow support; update the unit's shared evidence without duplicating task results.

## Evidence

### Environment preflight

The isolated target executable at `/tmp/opencode/opencode2-native/node_modules/@opencode/cli-linux-x64/bin/opencode` reports 2.1.2. The task 01 native-runtime probe records how it was obtained without changing global user configuration. Node.js is v24.21.0 and Go is 1.26.8 on linux/amd64.

An initial `npm --prefix apps/artifact-plane run build:app` failed because the reused original-checkout dependency directory had no `postject` module. Removed only the worktree dependency symlink created for this delivery, then installed local dependencies with `npm --prefix apps/artifact-plane ci --ignore-scripts --no-audit --no-fund`. No tracked dependency manifest changed. The same build and `TMPDIR=/tmp/opencode node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` then passed. This preflight executable reports the existing package version 1.26.1; final version checks must run again after version preparation.

`go test -count=1 ./...` and `go vet ./...` passed. The logs `/tmp/opencode/opencode-plane-build-app.log` and `/tmp/opencode/opencode-plane-app-smoke.log` contain the local build and smoke results. These preflight checks do not complete native bridge activation or the final combined change checks.

The cached Playwright browser could not start because its host lacked `libnspr4.so`. Resolved it without changing the host: a scoped `nix build` of the flake's Chromium provided 155.0.8059.84, passed through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. A first attempt exceeded the 300-second dependency deadline and was retried with a longer deadline; the retry completed.

### Reached browser suites

Ran `npx playwright test test/browser/project-tabs.spec.js test/browser/discovery-recorded.spec.js` with the scoped Chromium and a private `TMPDIR`: 23 of 24 passed. The reached `project-tabs` journeys and every `discovery-recorded` case except one passed.

The failing case, "Discover behavior searches only on submit", asserts a request count after a whitespace-only search in code this change does not modify. Classified it with two further runs rather than assuming a cause. The case alone passed in 2.5 seconds, and the full 16-case suite then passed completely in 21.3 seconds, so the failure is a flaky timing assertion in untouched code and not a regression from this change. No project source, test or configuration was changed for it.

A comparison run in a detached `main` worktree could not complete: its Playwright web server timed out twice while this branch's suites start normally. That is an environment fault in the throwaway checkout and is not evidence about the test. The classification rests on the two successful runs on this branch.

These suites cover the impact reader's reached project-tab and recorded-execution paths. They do not exercise the native OpenCode entry; the native checks below do.

### Final combined checks

Ran on the integrated branch at package version 1.27.0 with Node.js v24.21.0 and Go 1.26.8 on linux/amd64.

| Check | Command | Result |
| --- | --- | --- |
| Node suite | `TMPDIR=/tmp/opencode npm --prefix apps/artifact-plane test` | 556 tests, 555 passed, 1 existing pinned-model test skipped, 0 failed |
| Go suites | `go test -count=1 ./...` | All packages passed |
| Go analysis | `go vet ./...` | No findings |
| Application build | `npm --prefix apps/artifact-plane run build:app` | Built `release/artifact-plane-linux-amd64`, version 1.27.0 |
| Executable smoke | `TMPDIR=/tmp/opencode node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` | All checks passed |
| Native OpenCode | `OPENCODE_BIN=<2.1.2> npm --prefix apps/artifact-plane run test:opencode` | All 14 checks passed |

### Native OpenCode activation

Added `scripts/opencode-smoke.mjs` and the `test:opencode` script. The check clones the repository into a disposable directory, renames its local branch to `main`, and copies only the committed entry and the fixture configuration. It starts the real OpenCode 2.1.2 server with a private HOME, private service port, private Plane state directory, auto-start off and a deterministic local OpenAI-compatible provider. The provider requests one shell command per turn; it never decides whether a command is safe.

The 14 checks establish, in the runtime's own log and API:

- the runtime is OpenCode 2.1.2 and serves the disposable location;
- the committed `.opencode/plugins/artifact-plane/index.ts` entry loads;
- the `artifact-plane` MCP server connects and offers 13 tools;
- `get_change_status` from that catalog reaches the agent tool catalog;
- the bridge appends `Artifact Plane 1.27.0: ADD state of <clone> on branch main.` and the workbench line to real model requests;
- a read-only `git rev-parse` runs in the disposable worktree;
- `git commit --dry-run` on `main` is refused, no `git commit` process starts, and the worktree stays unchanged;
- the check leaves no Plane process on its private state;
- the runtime store holds no prompt, command or result text.

The check also records the two earlier false starts so the evidence is honest. A first version of the check asserted a refusal while the clone was on an unprotected branch, where a commit is not reserved, and it read the runtime log before the log was flushed. Those were harness defects, corrected before the passing run; the final assertions read the runtime log after shutdown and use the runtime MCP route for the connection state.

This is real-runtime activation with a deterministic provider fixture. It is not model inference, a remote provider, a paid model or a claim that a live model completed a task. Validation and establishment remain separate.

### Review finding and correction

Review found that an earlier draft of the check could pass while no context was injected, because the plugin import resolved to a file that the repository protected branch did not yet contain. The corrected check builds the disposable clone from the code under test, verifies the context line from the model request, and fails when the entry is absent. No product code changed for this.

### Observation limits

The bridge records a real OpenCode completion or interruption only when durable delivery and execution events identify one unambiguous turn. The API-driven check exercises context, the MCP connection and command policy; it does not force an ambiguous multi-delivery terminal, which the mock-host suites cover. Third-party `shell-create` rewrites remain outside the verified input mapping, as the specification states. OpenCode has no stop blocking and this change does not claim it.
