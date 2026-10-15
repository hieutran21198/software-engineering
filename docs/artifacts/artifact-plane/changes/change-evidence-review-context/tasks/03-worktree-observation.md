---
id: worktree-observation
depends_on: []
---

# Bind current observations to their source worktree

## Scope and ownership

Own runtime-store.js, runtime-api.js if needed, src/runtime-model.js, Runtime.jsx, task/unit/recorded component identity plumbing and their runtime tests. Coordinate any main.jsx identity changes with the coordinator; later review UI work waits for this task. Preserve other edits. Do not edit shared knowledge or historical observation records destructively.

Governing knowledge: E4/E5, specifications/evidence-correctness.md worktree identity and specifications/codex-execution.md. Consume the unit's trustworthy-evidence criterion.

## Definition of Done

- [x] New attempts/capture identity include canonical worktree and captured revision; identical plans in separate worktrees or capture revisions remain distinct.
- [x] Current task matching requires source worktree and task content; same-worktree unchanged content across unrelated HEAD changes remains labeled with captured revision.
- [x] Legacy ambiguous identity never supplies current activity; stored history remains readable through explicit recorded context without a destructive migration.
- [x] Real two-worktree fixtures with identical task bytes, alias paths, distinct sessions, changed content/HEAD and removed sources prove attribution and archival behavior.
- [x] Stale/disconnected, retry, mixed-report, privacy and fail-open hook checks pass; return evidence and code commits to coordinator.

## Evidence

Capture identity now includes canonical source worktree and source revision. New attempts store sourceWorktree/sourceRevision; current runtime/signature matching and task/unit plumbing require source-worktree identity. Captured revision labels remain explicit across HEAD changes. Legacy ambiguous records remain archived-only without a destructive migration.

The 16 focused runtime checks passed, including real identical-task worktrees, canonical aliases, changed HEAD/content, removed sources and legacy captured observations. The worker full Node run passed 183 with one optional-model skip; the coordinator actual-model run is separately required. All three runtime browser cases passed, including real worktree switching. Build and diff checks passed. The integrated first publication/runtime revision passed 96 checks. Hook privacy, retry and fail-open behavior remains. No actual live Codex execution is asserted; fixtures verify the observer path. KISS uses additive JSON fields and existing contexts; STE separates capture revision, reported validation and current activity.
