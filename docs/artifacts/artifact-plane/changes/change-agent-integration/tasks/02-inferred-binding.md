---
id: inferred-binding
depends_on: []
covers:
  - element: requirements/agent-integration.md
    ids: [AI6, AIA4]
---

# Inferred binding

## Scope and ownership

Implementer, own worktree. `server/runtime-store.js` (the `binding` field), `server/runtime-cli.js` (`--binding inferred`), a function that decides an inferred binding from a hook input, the attempt inspector label, and their tests.

## Governing knowledge

specifications/agent-integration.md: Inferred binding; specifications/codex-execution.md: Identity and retained graph context, Codex lifecycle adapter.

## Definition of Done

- [x] `bind` stores `binding: explicit` by default and `inferred` with `--binding inferred`; it rejects an inferred binding when the session and agent have an open attempt.
- [x] `inferredBinding(input, store)` returns the bind arguments for a subagent read and for a linked worktree read, and null for a read in the main worktree without agent_id, for a session with a SubagentStart event, for `tasks/README.md` and for a change that is not current.
- [x] An explicit bind supersedes an open inferred attempt; existing attempts without the field read as explicit.
- [x] The attempt inspector shows "Inferred from a task file read" for an inferred binding and "Bound explicitly" for an explicit binding (browser test).
- [x] `npm test` and the runtime browser tests pass.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Binding field | test/runtime-binding.test.js "bind stores explicit by default and inferred on request…": `runtime-cli bind` stores `explicit` by default and `inferred` with `--binding inferred`, rejects an inferred bind while the session and agent have an open attempt, and rejects another value | Passed |
| Inference rule | Three `inferredBinding` tests: bind arguments for a subagent read (with its member unit) and for a linked worktree read through a shell command; null for a main worktree read without agent_id, a session with a SubagentStart event, tasks/README.md, a change that is not current, two distinct task paths and an open attempt; only the worktree of `cwd` is read | Passed |
| Supersede and old attempts | "an explicit bind supersedes…": the inferred attempt becomes `superseded`; an attempt without the field reads `explicit`; user_version stays 1 | Passed |
| Labels | test/browser/discovery-recorded.spec.js "the attempt list of a recorded task labels inferred and explicit bindings": "Inferred from a task file read" for the inferred attempt, "Bound explicitly" for the explicit attempt and for an attempt without the field | Passed |
| Suites | `npm test` 449 tests, 448 passed, 0 failed, 1 skipped; after `npm run build`, the discovery-recorded, change-page and unit-page browser specs 34 passed, 0 failed (commit c275f33). A first run had two failures in change-page export timing tests that do not touch runtime code; they passed on rerun | Passed |

