---
id: guidance-functions
depends_on: []
covers:
  - element: requirements/agent-integration.md
    ids: [AI3, AI4, AI5, AIA2]
---

# Guidance functions

## Scope and ownership

Implementer, own worktree. A new module `server/agent-guidance.js` with the change state of one worktree, the session context text, the reserved-action check and the stop check, and its Node tests. No command line, hook dispatch or MCP code.

## Governing knowledge

specifications/agent-integration.md: Session context, Reserved actions, Stop check; specifications/human-guidance.md: Change status.

## Definition of Done

- [ ] `worktreeStatus(cwd)` returns the record of `get_change_status` for the worktree of `cwd` and reads no other worktree; its statuses equal `changeStatus` of src/work-model.js on the change status test fixture.
- [ ] `sessionContext(status)` returns the text of Session context, at most 4,000 characters, with the truncation line when task lines are removed.
- [ ] `reservedAction(input)` passes the test table of the specification Validation section, and returns null outside an ADD repository.
- [ ] `stopCheck(input)` fails only for error diagnostics of a current change, lists at most ten, and returns null when `stop_hook_active` is true.
- [ ] The time of `worktreeStatus` on this repository is recorded (claim status-latency).
- [ ] `npm test` passes.

## Evidence
