---
id: workbench-step
depends_on: []
covers:
  - element: requirements/ui-discovery.md
    ids: [UD1, UD2, UD3, UD5, UD6, UD7, UD8, UD10, UDA1, UDA2, UDA3, UDA5, UDA6]
---

# Workbench step

## Scope and ownership

Implementer. `apps/artifact-plane/server/http.js` (route `GET /api/plane`), a new `server/workbench.js` (exported `workbenchStep`), `server/agent-hook.js` (the parallel SessionStart step and the output parts), and the tests `test/workbench.test.js`, `test/http.test.js` and `test/agent-hook.test.js`. The other hook events, the MCP server and the session context text stay unchanged.

## Governing knowledge

specifications/ui-discovery.md: Identity route, Workbench step, Lines, Hook output; specifications/agent-integration.md: Hook command.

## Definition of Done

- [x] `GET /api/plane` returns status 200 with `name` `artifact-plane` and the package version; another method returns 405; a wrong host returns 403.
- [x] With a free port, `workbenchStep` starts one detached `serve` process with `PORT` set, and returns the ready line with the address once the probe answers (UDA1).
- [x] With a Plane server at the port, it returns the ready line and starts no process (UDA2).
- [x] With another HTTP server at the port, it returns the unavailable line, which holds no address, and starts no process (UDA3).
- [x] With `ARTIFACT_PLANE_AUTOSTART=0` and a free port, it returns the off line with the start command and starts no process (UDA5).
- [x] A started process that exits returns the ready line when a Plane then answers, else the unavailable line; a process that runs past 3 seconds without an answer returns the starting line.
- [x] `PORT=3000` without `ARTIFACT_PLANE_PORT` gives an address with port 4310; `ARTIFACT_PLANE_PORT=4399` gives port 4399 and the command `PORT=4399 artifact-plane serve` (claim hook-port-variable).
- [x] The hook output for source `startup` has `systemMessage` and `additionalContext` that ends with `Workbench for people: <line>`; for source `compact` it has no `systemMessage` (UDA1).
- [x] Outside an ADD repository the hook gives `{}` and starts no process; a failing workbench step keeps the session context and the hook exits with status 0 (UDA6).
- [x] No test opens a browser or leaves a server process running; `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Identity route | test/http.test.js "GET /api/plane names the Plane and its version; another method and a foreign host are refused": 200 with name and package version; POST, PUT, DELETE and HEAD give 405; a foreign Host or Origin gives 403 | Passed |
| Free port (UDA1) | test/workbench.test.js "UDA1: with a free port the step starts one detached serve process": one real child with last argument `serve` in its own process group; the probe answers plane at ARTIFACT_PLANE_PORT and free at the harness PORT; ready line; a second call starts nothing | Passed |
| Plane at the port (UDA2) | "UDA2: with a Plane server at the port": ready line, no start | Passed |
| Another program (UDA3) | "UDA3: with another HTTP server at the port": an HTML page, JSON with another name, a 404 and a server that never answers each give the unavailable line without `http://` and no start | Passed |
| Turned off (UDA5) | "UDA5: with ARTIFACT_PLANE_AUTOSTART=0": off line with `PORT=<port> artifact-plane serve`, no start; the value 1 still starts | Passed |
| Exit and starting | "a started process that exits gives ready when a Plane then answers, else unavailable" (also a spawn error and a throwing start); "a process that runs past 3 seconds without an answer gives the starting line": 15 polls at 200 ms with a fake clock | Passed |
| Port variable | "PORT is never read; ARTIFACT_PLANE_PORT selects the port; an invalid value is a failed start": PORT=3000 gives 4310; 4399 gives the command `PORT=4399 artifact-plane serve`; 0, 65536, 43.5, abc and -1 give unavailable with no probe | Passed |
| Hook output (UDA1) | test/agent-hook.test.js "UDA1: at a free port the hook starts one detached server": startup has systemMessage and additionalContext ending with "Workbench for people: <line>"; resume, clear and compact give the same context; compact has no systemMessage; one process starts | Passed |
| Outside ADD and failures (UDA6) | "UDA6: outside an ADD repository the hook gives {} and starts nothing; a failing workbench step keeps the session context"; "UDA6: a failed start in the hook process exits with status 0 and keeps the session context" | Passed |
| No browser, no leftover server | No code path opens a browser; real-server tests kill the child in `t.after`; `pgrep -af "app.js serve"` empty after the runs. `npm test` on the integrated branch: 480 tests, 479 passed, 0 failed, 1 skipped | Passed |

The commit of the task is "Artifact Plane: workbench step at session start and GET /api/plane" on branch impl/workbench-step. With no session context text, the context is the bare line, as Hook output states.
