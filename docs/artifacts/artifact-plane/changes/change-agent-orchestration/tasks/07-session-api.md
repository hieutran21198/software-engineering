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

- [ ] The routes of the Commands table exist with their bodies and effects. They keep the loopback, Host, Origin and JSON checks, the 16 KiB body limit (64 KiB for `prompt`), the existing error shape and the statuses 400, 404, 409 and 503. Tests confirm a refusal for a foreign Host and a foreign Origin on each route.
- [ ] The orchestrator checks start rules 1 to 8 in order and refuses with the first failed rule. A test covers each rule, and the refusal of a role session with an ACP profile has the exact message of rule 5 (AOA12).
- [ ] Only a `coordinator` takes `request`, nonempty and at most 8 KiB. A coordinator without a change needs one. A test confirms that the store holds no request text after the start (AOA11 with fixtures).
- [ ] A second start for a task with an open attempt returns that attempt with `existing: true` and starts nothing. Concurrent starts for one task create one session (AOA5).
- [ ] An implementer start creates an explicit binding with the Plane session ID, and the harness session ID replaces it when it is known.
- [ ] The initial prompt of each role matches the contract table, and its placeholders hold only validated names. A respawn adds the respawn sentence with the reason. `respawnOf` accepts only an ended or interrupted session of the same task.
- [ ] The stream sends the live state, the state changes and the output notices of one session, and follows the lifecycle of the existing streams.
- [ ] The output and diff routes use the output reader. The diff route refuses a path that is not in the current changed-file list.
- [ ] For a `waiting` terminal session, the query returns the tool name of the newest `PermissionRequest` hook observation of its harness session after the session became `waiting`, or no tool name.
- [ ] No route and no runner method approves a plan, checks a DoD item, merges or writes a version record. A test confirms that a start, an end and a failure change no repository file and no Git metadata.
