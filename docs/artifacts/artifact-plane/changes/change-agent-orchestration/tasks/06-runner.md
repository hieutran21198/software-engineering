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

- [ ] The server finds the runner through `runner.sock` in the state directory. Without an answer, it starts a detached runner and waits up to 3 seconds. A stale socket file without a listener is removed. The socket has mode 0600.
- [ ] The runner answers `hello`, `start`, `prompt`, `answer`, `cancel`, `resume`, `end`, `openTerminal`, `snapshot`, `subscribe` and `unsubscribe`, and pushes events with a sequence number. A different runner version makes the server refuse new starts with "Restart the session runner".
- [ ] A session ID has 12 random lowercase hexadecimal characters.
- [ ] A profile variable named `ARTIFACT_PLANE_LAUNCH` or `ARTIFACT_PLANE_PROMPT` makes the profile invalid.
- [ ] Resume of a Claude Code terminal session whose herdr server or workspace stopped starts them again without the initial prompt, then runs the resume command. A test covers both cases with the fake herdr.
- [ ] The store creates the `sessions` table if it does not exist, and the schema version stays 1. A test opens a store of the current release and reads its attempts unchanged.
- [ ] The runner writes the lifecycle event kinds of the contract. A test scans the store after sessions with prompts, messages, permissions and tool calls, and finds no message text, prompt, permission title, tool name, tool argument, tool output or credential in the new events and the sessions table.
- [ ] The runner sets the session state and the attempt state as the States table says, for both adapters. For a terminal session, the hooks still update the attempt, and `artifact-plane runtime report` still sets Done (reported).
- [ ] The live state holds only the last agent message and the pending permission requests, in memory.
- [ ] A test stops the agent process: the session and the attempt become `interrupted`, Resume reattaches the same harness session, and Respawn starts a new session with `respawnOf` (AOA4 with fixtures).
- [ ] A test restarts the server: the sessions keep running, and the new server shows their state again (AOA6 with fixtures).
- [ ] The runner exits 10 minutes after its last session ends while no server is connected. After a runner loss, ACP sessions end with reason `runner-lost` at the next server check, and terminal sessions continue.
- [ ] The built application runs `artifact-plane runner`, and the application smoke check passes.
