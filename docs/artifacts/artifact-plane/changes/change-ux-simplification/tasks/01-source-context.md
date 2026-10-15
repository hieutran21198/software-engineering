---
id: source-context
depends_on: []
---

# Unify worktree source context

## Scope and ownership

Own source activation in apps/artifact-plane/src/main.jsx, Delivery.jsx and Runtime provider inputs, with focused fixtures in test/browser/workflow.spec.js and project-tabs.spec.js. Keep the canonical project-root boundary distinct from the committed activeWorktree. Selecting a readable worktree reads and installs the entire target overview in one action. Route all current knowledge, flow, review, source and observation inputs through that source; retain recorded execution identity. Remove Open worktree. Preserve the original presentation branch and all other contributors' edits.

## Governing knowledge

UX1, UX11; specifications/ux-simplification.md sections Source identity and one-step worktree switching and Honest loading, completion and recovery; existing project-tabs/live-reload/evidence-correctness contracts.

## Prerequisites

No internal task prerequisite. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [ ] Distinct real registered worktrees with equal artifact/unit/task IDs display their own branch, dependencies, knowledge, delivery, review, flow and runtime context after a single selection; no Git checkout occurs.
- [ ] A→B→C delayed replies, failed/unavailable target, refresh and project deactivation preserve committed source identity and reject obsolete data and errors.
- [ ] Canonical project-tab identity/persistence remains the opened root; active worktree selection cannot close or replace another project tab.
- [ ] Focused browser checks pass and fixture file/Git fingerprints remain unchanged.

## Evidence

No implementation checks have run for this task. Record actual commands, observed results, source references and limitations here after approved execution.
