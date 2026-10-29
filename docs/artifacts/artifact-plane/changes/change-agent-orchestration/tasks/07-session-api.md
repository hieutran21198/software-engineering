---
id: session-api
depends_on: [runner, output-reader]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO1, AO2, AO5, AO8, AO10, AO11, AO13, AO15, AO16, AO19, AO20, AO26, AO27, AOA5, AOA11, AOA12]
---

# Session API and orchestrator

## Scope and ownership

One implementer adds the orchestrator (start rules, binding, initial prompts and respawn) and the session routes, the session stream and the output routes in `apps/artifact-plane/server`, with Node HTTP tests against a fake runner.

## Governing knowledge

`specifications/agent-orchestration.md`: Commands, Start rules, Roles and initial prompts, Lifecycle events, Output, Recovery, Workbench and Failures. `specifications/codex-execution.md` for the binding. The task DAG contract of artifact-driven.

## Definition of Done

- [x] The routes of the Commands table exist with their bodies and effects. They keep the loopback, Host, Origin and JSON checks, the 16 KiB body limit (64 KiB for `prompt`), the existing error shape and the statuses 400, 404, 409 and 503. Tests confirm a refusal for a foreign Host and a foreign Origin on each route.
- [x] The orchestrator checks start rules 1 to 8 in order and refuses with the first failed rule. A test covers each rule, and the refusal of a role session with an ACP profile has the exact message of rule 5 (AOA12).
- [x] Only a `coordinator` takes `request`, nonempty and at most 8 KiB. A coordinator without a change needs one. A test confirms that the store holds no request text after the start (AOA11 with fixtures).
- [x] A second start for a task with an open attempt returns that attempt with `existing: true` and starts nothing. Concurrent starts for one task create one session (AOA5).
- [x] An implementer start creates an explicit binding with the Plane session ID, and the harness session ID replaces it when it is known.
- [x] The initial prompt of each role matches the contract table, and its placeholders hold only validated names. A respawn adds the respawn sentence with the reason. `respawnOf` accepts only an ended or interrupted session of the same task.
- [x] The stream sends the live state, the state changes and the output notices of one session, and follows the lifecycle of the existing streams.
- [x] The output and diff routes use the output reader. The diff route refuses a path that is not in the current changed-file list.
- [x] For a `waiting` terminal session, the query returns the tool name of the newest `PermissionRequest` hook observation of its harness session after the session became `waiting`, or no tool name.
- [x] No route and no runner method approves a plan, checks a DoD item, merges or writes a version record. A test confirms that a start, an end and a failure change no repository file and no Git metadata.

## Evidence

Commit f7d2c49 adds `server/session-api.js`, the session routes and the stream in `server/http.js`, four store methods, and `test/session-api.test.js`. Tests use an injected fake runner, and one test uses a real runner that hosts the fake ACP agent and the fake herdr.

- Routes: the ten POST routes and the stream exist. On each route, a foreign or `localhost` Host, a foreign or `localhost` Origin and `Sec-Fetch-Site: cross-site` get 403 and reach no runner method; the body limits are 16 KiB and 64 KiB for `prompt`; the statuses are 400, 404, 409 and 503.
- Start rules: one test refuses each rule with input that also fails a later rule, so the first failed rule wins; the refusal is 409 with the rule number; rule 5 gives the exact message for the three role sessions (AOA12); a refused start reaches no runner and creates no attempt.
- Request: empty, NUL and 8193-byte requests, a request of another role and a coordinator without change or request are refused. With the real runner, the fake pane receives the coordinator prompt with the request, and the database, WAL and shared-memory bytes do not contain it (AOA11 with fixtures).
- Open attempt: three concurrent starts for one task and one for another give two runner starts; the repeated starts return `existing: true` with the same session and attempt (AOA5). Without the lock, the test fails.
- Binding: the attempt is explicit with the Plane session ID, and with the real runner it moves to the harness session ID.
- Prompts: each role prompt equals the contract text; a respawn adds the respawn sentence, supersedes the earlier attempt, and refuses an unknown session, another task and a role session.
- Stream: a snapshot first, then state, live and output events; pushes at or below the snapshot sequence are dropped; a closed client leaves no listener; a runner loss ends the stream.
- Output: the routes return commits, files and DoD progress through the output reader; unlisted and `../` paths get 400; a base revision that is not in the repository gets 409.
- Waiting tool: the query returns the tool of the newest `PermissionRequest` observation of the harness session within the contract bound; the fourth amendment moves the bound, and task `sessions-ui` applies it.
- Boundaries: approve, report, validate, merge, establish, version and DoD routes do not exist (405); with the real runner, starts, a failed sign-in and ends leave the repository and worktree fingerprints, `.git` included, unchanged, with no report event and no Done attempt.
- The implementer broke behavior in ten ways, for example the lock, the rule order and the request leak; each made a test fail.

The coordinator ran the full suite on the task branch: 702 tests, 701 passed, 1 skipped (the existing pinned-model network test), 0 failed, and no fake process stayed alive.
