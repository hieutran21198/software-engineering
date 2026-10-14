---
id: worktree-observation
depends_on: []
---

# Bind current observations to their source worktree

## Scope and ownership

Own runtime-store.js, runtime-api.js if needed, src/runtime-model.js, Runtime.jsx, task/unit/recorded component identity plumbing and their runtime tests. Coordinate any main.jsx identity changes with the coordinator; later review UI work waits for this task. Preserve other edits. Do not edit shared knowledge or historical observation records destructively.

Governing knowledge: E4/E5, specifications/evidence-correctness.md worktree identity and specifications/codex-execution.md. Consume the unit's trustworthy-evidence criterion.

## Definition of Done

- [ ] New attempts/capture identity include canonical worktree and captured revision; identical plans in separate worktrees or capture revisions remain distinct.
- [ ] Current task matching requires source worktree and task content; same-worktree unchanged content across unrelated HEAD changes remains labeled with captured revision.
- [ ] Legacy ambiguous identity never supplies current activity; stored history remains readable through explicit recorded context without a destructive migration.
- [ ] Real two-worktree fixtures with identical task bytes, alias paths, distinct sessions, changed content/HEAD and removed sources prove attribution and archival behavior.
- [ ] Stale/disconnected, retry, mixed-report, privacy and fail-open hook checks pass; return evidence and code commits to coordinator.

## Evidence

Implementation has not started. Pure selector inspection identified the gap but does not prove this task is delivered.
