---
id: task-graph-interface
depends_on: [task-graph-reader]
---

# Display task graphs and details

## Scope and governing references

Repository: software-engineering. Own apps/artifact-plane/src task graph canvas, Workflow/main integration, styles, graph layout tests, and focused browser cases. Reuse React Flow/dagre and sanitized Markdown rendering.

P1–P5; specifications/task-dag.md; existing explorer and workflow contracts.

## Prerequisites

Task task-graph-reader must pass; established ADD gate remains required. Explicit user approval of this plan is required.

## Definition of Done

- [x] Change selection offers View task graph; Back preserves selected change and history expansion. Graph layout shows correct direction, disconnected/single nodes, and prerequisite legend.
- [x] Task inspector shows ID, source, prerequisites, scope, DoD, evidence, and counts using safe Markdown rendering without claims of approval or independently verified completion.
- [x] Invalid/unavailable/empty plans show clear states and safely readable task records without execution edges.
- [x] Desktop and narrow layouts support fit/pan/zoom, inspector resize, refresh invalidation, and explicit worktree opening. Focused layout/browser checks pass.

## Evidence

Implemented the task canvas and details, namespaced selection, Back navigation, refresh invalidation, and shared sanitized Markdown rendering. All 60 Node tests and the Vite production build passed. The three focused Chromium acceptance cases passed using the installed Chromium executable selected with PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. They verify fork/join arrows, historical exclusion, scope/DoD/evidence, script/resource sanitization, return/history context, inspector resize, desktop/narrow layout, legacy/empty/invalid graphs, worktree isolation, refresh invalidation, and unchanged fingerprints. The downloaded Chromium initially could not launch because libnspr4.so was unavailable; the installed Nix Chromium supplied its dependencies. Desktop and narrow screenshots were inspected. Existing Vite directive/chunk-size warnings remain nonblocking. KISS reuses existing readers/libraries and no stored workflow state. STE keeps prerequisites and evidence distinct from authorization and verification.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
