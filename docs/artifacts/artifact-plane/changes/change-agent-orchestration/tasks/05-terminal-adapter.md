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

- [ ] Start runs `herdr --session plane-<session ID> tab create` with the worktree, the label, `ARTIFACT_PLANE_LAUNCH`, `ARTIFACT_PLANE_PROMPT`, the profile variables and `--no-focus`, and reads the pane and tab IDs from the JSON output.
- [ ] `pane run` gets the profile command, each argument quoted for a POSIX shell, plus `"$ARTIFACT_PLANE_PROMPT"`. A test confirms that the command line holds no prompt text.
- [ ] After `pane run`, the adapter calls only `pane list`, `session attach`, `tab create` for a resume and `server stop`. A test records every herdr call and confirms that no call sends text or keys to a pane.
- [ ] Every 2 seconds, the adapter maps the `pane list` status `working`, `blocked`, `done`, `idle` and `unknown` to the session states. A missing pane interrupts the session with reason `pane-missing`.
- [ ] Open in terminal app runs the `terminal.open` arguments plus `herdr session attach plane-<session ID>` as a detached process without a shell.
- [ ] Resume of a `claude-code` session runs the profile command plus `--resume <harness session ID>` in a new tab of the same named session. Other harness tools in a terminal offer only respawn.
- [ ] End runs `herdr --session plane-<session ID> server stop`.
- [ ] With `ARTIFACT_PLANE_LAUNCH`, the Claude Code SessionStart hook records `session:harness-id` with the hook `session_id` and `model`. Without the variable, the existing hook tests pass unchanged.
