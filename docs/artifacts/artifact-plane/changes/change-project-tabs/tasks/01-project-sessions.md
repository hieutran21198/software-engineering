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

- [ ] Existing single-project exploration works after extraction.
- [ ] Two mounted explorers retain independent selections, filters, worktrees, views, panels, and graph viewport.
- [ ] Deactivation cancels reads and closes automatic observation/runtime connections; reactivation refreshes without resetting valid navigation.
- [ ] Close/unmount releases resources; delayed callbacks cannot update another explorer.
- [ ] Focused browser checks exercise switching, repository edits while inactive, delayed reads, and canvas dimensions.

## Evidence

Implementation has not started. No validation success is asserted.
