---
id: integration
depends_on: [sessions-ui, antigravity-provider]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO13, AO16, AO18, AO29, AOA7, AOA8, AOA14]
  - element: requirements/opencode-support.md
    ids: [OP8]
---

# Integration and validation

## Scope and ownership

The coordinator joins the integrated branch and runs the combined checks. The coordinator also updates the application README, `apps/artifact-plane/integration/README.md` and the three affected flow records.

## Governing knowledge

`requirements/agent-orchestration.md`, `specifications/agent-orchestration.md`, the flows `agent-session-launch`, `agent-session-recovery` and `execution-observation`, and the approved mockup canvas.

## Definition of Done

- [x] `npm test`, `npm run test:browser`, `npm run build`, `npm run build:validator`, `npm run build:app` with the application smoke check, and the record validator for the change pass. Record the counts.
- [x] A test runs fixture sessions of both connection kinds and then scans the runtime store: it finds no message text, prompt, request or credential. Every new route refuses a foreign Host and a foreign Origin. No started command contains a permission-bypass option (AOA7).
- [x] Without a settings file, the hooks, MCP tools, routes and workbench pages behave as before, and the existing suites pass unchanged (AO18).
- [x] The OpenCode plugin bridge still creates no prompt and continues no work, and its tests pass (OP8).
- [x] No route, runner method or prompt approves a plan, checks a DoD item, merges or writes a version record (AO16).
- [x] The application README and the integration README describe launch profiles, herdr, ttyd, the runner, the Claude plan sign-in rule and the hook trust of `cmd acp` (claim `commandcode-acp-hook-trust`).
- [x] The integration README lists each external program of agent sessions (herdr, ttyd, the ACP agent programs and the terminal programs of the harness tools, Antigravity CLI included) with its use, the checked version and the sessions that it enables, and gives the adoption check: the adopting agent runs each `--version`, reports present and missing programs to the person, and installs nothing without consent. A run of the check on this computer lists the present and missing programs (AO29, AOA14).
- [x] The three flow records match the implementation, and their Mermaid diagrams render in the workbench.
- [x] Screenshots at desktop width and at 390 pixels show each mockup screen. The owner looked at the screenshots or at the running interface, and the evidence records what the owner looked at (AOA8).

## Evidence

The coordinator ran the combined checks on `claude/agent-orchestration` at cc31072 with a fresh `npm ci`: `npm run build`, `npm run build:validator`, `npm test` (718 tests, 717 passed, 1 skipped for the existing pinned-model network test, 0 failed), `npm run build:app` with `scripts/app-smoke.mjs release/artifact-plane-linux-amd64` ("All checks passed", including the runner check), the browser suite with the Nix Chromium (196 passed in 9.3 minutes), and `npm run validate` (`ok: true`). The record validator for the change reports `ok: true`.

- AOA7: the runner test scans the sessions rows, the session events and the raw database and WAL bytes after ACP and terminal fixture sessions and finds no message text, prompt, request or credential (task `runner`); the session API test scans the store after a coordinator start (task `session-api`); every session, settings and relay route refuses a foreign Host and Origin (tasks `settings`, `session-api`, `terminal-relay`); no catalog command holds a permission-bypass option, and a profile with one is invalid (tasks `settings`, `antigravity-provider`).
- AO18: without a settings file, the settings and sessions browser tests show no session control, and the existing suites pass unchanged, golden captures included.
- OP8: the OpenCode bridge tests in the Node suite pass; the bridge creates no prompt.
- AO16: the session API has no approve, report, validate, merge, establish, version or DoD route, and a start, an end and a failure leave the repository and Git metadata unchanged (task `session-api`).
- Guide: `integration/README.md` has the section Agent sessions with the program table, the adoption check, the launch profiles, the session runner and the limits, including the hook trust of `cmd acp`; the application README points to it (cc31072).
- Adoption check on this computer, 2026-10-29 18:48 +07, `--version` only: herdr 0.9.5, ttyd 1.7.7, claude 2.1.312, claude-agent-acp 0.99.0, codex 0.165.0, codex-acp 2.3.0, opencode2 2.2.0, cmd 1.88.0, agy 1.4.9 and Ghostty 1.3.1 are present; `opencode` and `gemini` are missing, so Gemini CLI profiles are unavailable (AOA14).
- Flows: the launch and recovery flows name the new modules as implementation support. The flow reader of the workbench reads both flows as valid with all 16 and 6 support relations resolved and no diagnostic; the execution observation flow has no change in this step. These flows have no Mermaid block.
- Owner look (AOA8): the owner looked at the screenshots at 1440 and 390 pixels of the Sessions page, the ACP session, the terminal role session, the waiting notice, the launch dialog, recovery, Start ADD work, Agent settings, the profile editor and the Antigravity rows, and accepted them on 2026-10-29.
