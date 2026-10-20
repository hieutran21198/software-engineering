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

- [ ] `GET /api/plane` returns status 200 with `name` `artifact-plane` and the package version; another method returns 405; a wrong host returns 403.
- [ ] With a free port, `workbenchStep` starts one detached `serve` process with `PORT` set, and returns the ready line with the address once the probe answers (UDA1).
- [ ] With a Plane server at the port, it returns the ready line and starts no process (UDA2).
- [ ] With another HTTP server at the port, it returns the unavailable line, which holds no address, and starts no process (UDA3).
- [ ] With `ARTIFACT_PLANE_AUTOSTART=0` and a free port, it returns the off line with the start command and starts no process (UDA5).
- [ ] A started process that exits returns the ready line when a Plane then answers, else the unavailable line; a process that runs past 3 seconds without an answer returns the starting line.
- [ ] `PORT=3000` without `ARTIFACT_PLANE_PORT` gives an address with port 4310; `ARTIFACT_PLANE_PORT=4399` gives port 4399 and the command `PORT=4399 artifact-plane serve` (claim hook-port-variable).
- [ ] The hook output for source `startup` has `systemMessage` and `additionalContext` that ends with `Workbench for people: <line>`; for source `compact` it has no `systemMessage` (UDA1).
- [ ] Outside an ADD repository the hook gives `{}` and starts no process; a failing workbench step keeps the session context and the hook exits with status 0 (UDA6).
- [ ] No test opens a browser or leaves a server process running; `npm test` passes.

## Evidence
