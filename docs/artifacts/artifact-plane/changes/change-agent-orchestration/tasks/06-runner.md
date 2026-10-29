---
id: runner
depends_on: [acp-client, terminal-adapter]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO6, AO9, AO10, AO12, AO13, AO19, AOA4, AOA6]
---

# Session runner

## Scope and ownership

One implementer adds the `artifact-plane runner` command with its help text in `server/app.js`, the runner process and its socket protocol, the server client of the runner, the `sessions` table and the lifecycle events in `server/runtime-store.js`, and the runner availability in the settings query. It also adds the reserved profile variable names to the settings validity, and the restart of a stopped herdr server or workspace to the terminal resume. Tests use the fake ACP agent and the fake herdr.

## Governing knowledge

`specifications/agent-orchestration.md`: Runner, Lifecycle events, States, Recovery and Failures. ADR 019.

## Definition of Done

- [x] The server finds the runner through `runner.sock` in the state directory. Without an answer, it starts a detached runner and waits up to 3 seconds. A stale socket file without a listener is removed. The socket has mode 0600.
- [x] The runner answers `hello`, `start`, `prompt`, `answer`, `cancel`, `resume`, `end`, `openTerminal`, `snapshot`, `subscribe` and `unsubscribe`, and pushes events with a sequence number. A different runner version makes the server refuse new starts with "Restart the session runner".
- [x] A session ID has 12 random lowercase hexadecimal characters.
- [x] A profile variable named `ARTIFACT_PLANE_LAUNCH` or `ARTIFACT_PLANE_PROMPT` makes the profile invalid.
- [x] Resume of a Claude Code terminal session whose herdr server or workspace stopped starts them again without the initial prompt, then runs the resume command. A test covers both cases with the fake herdr.
- [x] The store creates the `sessions` table if it does not exist, and the schema version stays 1. A test opens a store of the current release and reads its attempts unchanged.
- [x] The runner writes the lifecycle event kinds of the contract. A test scans the store after sessions with prompts, messages, permissions and tool calls, and finds no message text, prompt, permission title, tool name, tool argument, tool output or credential in the new events and the sessions table.
- [x] The runner sets the session state and the attempt state as the States table says, for both adapters. For a terminal session, the hooks still update the attempt, and `artifact-plane runtime report` still sets Done (reported).
- [x] The live state holds only the last agent message and the pending permission requests, in memory.
- [x] A test stops the agent process: the session and the attempt become `interrupted`, Resume reattaches the same harness session, and Respawn starts a new session with `respawnOf` (AOA4 with fixtures).
- [x] A test restarts the server: the sessions keep running, and the new server shows their state again (AOA6 with fixtures).
- [x] The runner exits 10 minutes after its last session ends while no server is connected. After a runner loss, ACP sessions end with reason `runner-lost` at the next server check, and terminal sessions continue.
- [x] The built application runs `artifact-plane runner`, and the application smoke check passes.

## Evidence

Commit 53e7a2b (rebased from 13b180a) adds `server/session-runner.js`, `server/runner-client.js` and their tests, the `artifact-plane runner` command, the `sessions` table and the session records in `server/runtime-store.js`, the reserved variable names in `server/agent-settings.js`, the restart of a stopped herdr server or workspace in `server/terminal-adapter.js`, and a runner check in `scripts/app-smoke.mjs`.

- Runner start: a detached runner answers in less than 3 seconds; a second client finds the same process; a start that never listens returns `unavailable` (503); a stale socket is removed; `runner.sock` has mode 0600.
- Protocol: each method answers; pushed events carry a sequence number that grows by one; `unsubscribe` stops them; a client of another version gets "Restart the session runner" on start.
- Session IDs: 2000 IDs match 12 lowercase hexadecimal characters and are unique. Reserved names: `ARTIFACT_PLANE_LAUNCH` and `ARTIFACT_PLANE_PROMPT` make ACP and terminal profiles invalid.
- Terminal resume: with the server stopped, the calls are `tab create`, `server`, `workspace create`, `pane run`; without a workspace, `tab create`, `workspace create`, `pane run`; neither carries `ARTIFACT_PLANE_PROMPT`, and the pane runs `--resume <id>`.
- Store: a store with only the release tables reads unchanged; the writer adds the `sessions` table with the contract DDL; `user_version` stays 1. After ACP sessions with prompts, message chunks, thoughts, tool calls and permission requests, and a terminal session, a scan of the sessions rows, the `session:*` events and the raw database and WAL bytes finds no prompt, message, permission title, option name, tool title, argument, output, credential or variable value.
- States: every ACP row of the States table and the terminal rows hold; hooks still update terminal attempts; `runtime report validated` sets Done and keeps it.
- AOA4 with fixtures (protocol versions 1 and 2 and a terminal session): after the agent process is killed, the session and the attempt are `interrupted`; Resume sends `session/load` or `session/resume` for the same harness session without a new session; Respawn sets `respawnOf` and keeps the base revision.
- AOA6 with fixtures: a detached runner keeps a waiting ACP session and a working terminal session; a new client finds the same process, the same states and the pending request, answers it, and the turn completes.
- Idle exit and runner loss: the runner exits after its last session ends while no client is connected; after a killed runner, the ACP session is `interrupted` with `runner-lost`, and the terminal session stays `working`.
- `npm run build:app` builds the Linux executable, and the smoke check passes, including "runner answers hello on runner.sock and stops on SIGTERM".

The coordinator ran the full suite on the rebased branch: 683 tests, 682 passed, 1 skipped (the existing pinned-model network test), 0 failed, and no runner or fake process stayed alive.
