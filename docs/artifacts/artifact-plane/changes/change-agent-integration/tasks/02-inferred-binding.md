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

- [ ] `bind` stores `binding: explicit` by default and `inferred` with `--binding inferred`; it rejects an inferred binding when the session and agent have an open attempt.
- [ ] `inferredBinding(input, store)` returns the bind arguments for a subagent read and for a linked worktree read, and null for a read in the main worktree without agent_id, for a session with a SubagentStart event, for `tasks/README.md` and for a change that is not current.
- [ ] An explicit bind supersedes an open inferred attempt; existing attempts without the field read as explicit.
- [ ] The attempt inspector shows "Inferred from a task file read" for an inferred binding (browser test).
- [ ] `npm test` and the runtime browser tests pass.

## Evidence
