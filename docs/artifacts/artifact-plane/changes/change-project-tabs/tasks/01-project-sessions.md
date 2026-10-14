---
id: project-sessions
depends_on: []
---

# Isolate project sessions

## Scope and location

Own apps/artifact-plane/src/main.jsx and any extracted project explorer component. Refactor existing behavior into a project-scoped explorer with an active flag and path/open callback. Keep current APIs unchanged. Add lifecycle handling for observation, runtime connections, queued reads, detail controllers, generation checks, and canvas reactivation.

## Governing references

Artifact Plane requirements/project-tabs.md and specifications/project-tabs.md in this change. Existing live-reload and lazy-loading specifications remain applicable. Shared acceptance is owned by the project-tabs unit brief.

## Prerequisites

Explicit approval of this plan and the listed internal prerequisites with their DoD satisfied. No new upstream establishment gate.

## Definition of Done

- [x] Existing single-project exploration works after extraction.
- [x] Two mounted explorers retain independent selections, filters, worktrees, views, panels, and graph viewport.
- [x] Deactivation cancels reads and closes automatic observation/runtime connections; reactivation refreshes without resetting valid navigation.
- [x] Close/unmount releases resources; delayed callbacks cannot update another explorer.
- [x] Focused browser checks exercise switching, repository edits while inactive, delayed reads, and canvas dimensions.

## Evidence

ProjectExplorer owns React state and request generations; active flags gate repository detail, history, Markdown, completion, and runtime observation. Runtime fetches now use cancellation. Per-project control IDs prevent labels from targeting hidden projects. Review confirmed project-scoped ownership and cleanup, with no API or repository-writing change.

The Chromium project-tab cases verified equal artifact identities in separate fixtures, independent selection, delayed-read close, pause on focus while inactive, viewport retention, reactivation edits, exactly two active observation streams and zero after closing all projects. Existing worktree, unit/task, resize, runtime, and recorded-execution cases passed. KISS and STE self-checks passed.
