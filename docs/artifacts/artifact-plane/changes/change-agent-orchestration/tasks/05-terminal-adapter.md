---
id: terminal-adapter
depends_on: [verify-interfaces, settings]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO7, AO17, AO26, AO27, AOA3]
---

# Terminal adapter

## Scope and ownership

One implementer adds the terminal adapter in `apps/artifact-plane/server` and a fake `herdr` program for tests. The task also changes `server/agent-hook.js`, so that the SessionStart hook records the harness session ID of a Plane session.

## Governing knowledge

`specifications/agent-orchestration.md`: Terminal adapter, Roles and initial prompts, States and Failures. ADR 018. The live evidence of `verify-interfaces`.

## Definition of Done

- [x] Start runs a detached `herdr --session plane-<session ID> server`, waits up to 5 seconds for it, and runs `workspace create` with the worktree, the label, `ARTIFACT_PLANE_LAUNCH`, `ARTIFACT_PLANE_PROMPT`, the profile variables and `--no-focus`. It reads `.result.root_pane.pane_id` and `.result.tab.tab_id`. Every herdr call names `--session plane-<session ID>`.
- [x] `pane run` gets the profile command, each argument quoted for a POSIX shell, plus `"$ARTIFACT_PLANE_PROMPT"` in the form of the Initial prompt column (`--prompt` for OpenCode). A test confirms that the command line holds no prompt text.
- [x] After `pane run`, the adapter calls only `pane list`, `session attach` and `server stop`, and `tab create` with `pane run` for a resume in a new tab. A test records every herdr call and confirms that no call sends text or keys to a pane.
- [x] Every 2 seconds, the adapter maps the `pane list` `agent_status` values `working`, `blocked`, `done` and `idle` to the session states, and keeps the state for `unknown`. A missing pane interrupts the session with reason `pane-missing`.
- [x] Open in terminal app runs the `terminal.open` arguments plus `herdr session attach plane-<session ID>` as a detached process without a shell.
- [x] Resume of a `claude-code` session runs `tab create` in the same named session and the profile command plus `--resume <harness session ID>`. Other harness tools in a terminal offer only respawn.
- [x] End runs `herdr --session plane-<session ID> server stop`.
- [x] With `ARTIFACT_PLANE_LAUNCH`, the Claude Code SessionStart hook records `session:harness-id` with the hook `session_id` and `model`. Without the variable, the existing hook tests pass unchanged.

## Evidence

Commit 8d60109 adds `server/terminal-adapter.js` (`TerminalSession`, `terminalCommandLine`, `TerminalError`), a fake `herdr` program, their tests, and the harness session ID record in `server/agent-hook.js`. Tests put only the fake herdr, a fake terminal app and stub harness programs on `PATH`.

- Start: the server call runs detached; the calls are `pane list` until the server answers, `workspace create` with `--cwd`, `--label`, `ARTIFACT_PLANE_LAUNCH`, `ARTIFACT_PLANE_PROMPT`, the profile variables and `--no-focus`, then `pane run`. Every call starts with `--session plane-<id>`. A failed start stops the server again.
- Command line: exact lines for Claude Code, Codex, OpenCode (`opencode2 mini … --prompt "$ARTIFACT_PLANE_PROMPT"`) and `other`. Each line runs through `/bin/sh` with a prompt that holds quotes, `$HOME`, backticks, `$(…)` and a newline; the program receives the profile command and the prompt unchanged, and no injected command runs. No herdr call carries the prompt text, except the `ARTIFACT_PLANE_PROMPT` value of `workspace create`.
- After `pane run`, a run through watch, a missing pane, resume, Open in terminal app and end makes only `pane list`, `tab create` with `pane run` for the resume, and `server stop`; no call sends text or keys.
- Status: `working`, `blocked`, `done`, `idle` and `unknown` map as the States table says; `unknown` keeps the state; a missing pane or a stopped server gives `interrupted` with `pane-missing`; the poll runs every 2 seconds.
- Open in terminal app runs the `terminal.open` arguments plus `herdr session attach plane-<id>` detached, with hostile arguments unchanged. Resume of Claude Code runs `tab create` and `--resume <id>`; other harness tools give `resume-unavailable`. End stops only its own named session.
- Hook: with `ARTIFACT_PLANE_LAUNCH`, each Claude Code SessionStart source records `session:harness-id` with `harnessSession` and `model`, the hook process exits 0, and other events record nothing. The existing hook tests pass unchanged against the new code.

The coordinator reran the terminal adapter, hook and runtime hook suites: 29 tests passed. The implementer ran `npm test`: 621 tests, 620 passed, 1 skipped (the existing pinned-model network test), 0 failed.

Open points for the contract: resume after the named server or its workspace stopped, an event for a terminal session that becomes idle, and profile variables that reuse the names `ARTIFACT_PLANE_LAUNCH` or `ARTIFACT_PLANE_PROMPT`.
