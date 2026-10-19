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

- [x] `worktreeStatus(cwd)` returns the record of `get_change_status` for the worktree of `cwd` and reads no other worktree; its statuses equal `changeStatus` of src/work-model.js on the change status test fixture.
- [x] `sessionContext(status)` returns the text of Session context, at most 4,000 characters, with the truncation line when task lines are removed.
- [x] `reservedAction(input)` passes the test table of the specification Validation section, and returns null outside an ADD repository.
- [x] `stopCheck(input)` fails only for error diagnostics of a current change, lists at most ten, and returns null when `stop_hook_active` is true.
- [x] `validateKnowledge` with a change scope reports the errors of a unit brief whose metadata cannot be parsed.
- [x] The time of `worktreeStatus` on this repository is recorded (claim status-latency).
- [x] `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Worktree status | test/agent-guidance.test.js "AI3: worktreeStatus equals changeStatus…": on the change status fixture the statuses equal `changeStatus` at In progress, Unchecked items, Ready for team review and Waiting for merge; a git spy shows no read outside the worktree of `cwd` and no `worktree list` | Passed |
| Session context | Two sessionContext tests: exact format, the unit part left out, "No current change in this worktree.", the 4,000-character limit with task lines and then change lines removed and "More in get_change_status." after the last change line. On this branch the text names change-agent-integration with unit plane-agent-integration, status Implementation and six task lines | Passed |
| Reserved actions | AIA2 table test with 44 rows and 3 array forms, including every row of the specification, `HEAD` on main, `--all`, `--mirror`, `cd <main worktree> && git commit`, `/usr/bin/git`, `["bash","-lc","git commit -m x"]` and quoted text; null outside an ADD repository for each action | Passed |
| Stop check | "AI4" test: null with `stop_hook_active`, one validation for each current change, delivered change skipped, ten errors listed and the final sentence, warnings never fail, agreement with the real `validateKnowledge` | Passed |
| Unit brief scope | Test "validateKnowledge with a change scope reports the errors of a unit brief whose metadata cannot be parsed": `ok: false` with `invalid-unit`; a parsed brief of another change stays out. Found during this task: the brief of this unit had invalid metadata and the scoped validator passed it (fixed in f3d54b7) | Passed |
| Status time | `worktreeStatus` on this repository: 450–677 ms on main with no current change, 496–673 ms on this branch with one current change, 5 runs each; module import about 55 ms (claim status-latency) | Passed |
| Suite | `npm test`: 443 tests, 442 passed, 0 failed, 1 skipped (commit 2cb9c33) | Passed |

