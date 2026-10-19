---
id: hook-command
depends_on: [guidance-functions, inferred-binding]
covers:
  - element: requirements/agent-integration.md
    ids: [AI1, AI2, AI7, AIA1, AIA3]
---

# Hook command

## Scope and ownership

Implementer. `server/app.js` (commands `hook` and `runtime`, lazy imports), the hook dispatcher with its error boundaries and time limits, the detached inferred bind, `scripts/app-smoke.mjs`, and tests with recorded Claude Code and Codex inputs.

## Governing knowledge

specifications/agent-integration.md: Command line, Hook command, Inferred binding; specifications/app-release.md: Command line.

## Definition of Done

- [ ] `artifact-plane hook` and `artifact-plane runtime <command>` behave as the Command line section; `node server/runtime-cli.js` keeps its output.
- [ ] Recorded inputs of both harnesses for each event of the Hook command table get the specified output, from the dispatcher and once from the built executable.
- [ ] The fail-open tests of the Validation section exit 0 and leave no forbidden field in the store.
- [ ] A PreToolUse with an inferred binding returns within 2 seconds, and the binding appears in `runtime query` after the detached process ends (claim detached-inferred-bind).
- [ ] The smoke check runs `hook` with a SessionStart input and `runtime query` on every CI target.
- [ ] `npm test` passes; CI passes on the six targets.

## Evidence
