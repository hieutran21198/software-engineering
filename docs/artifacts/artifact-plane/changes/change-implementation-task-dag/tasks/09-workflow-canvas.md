# Workflow canvas and inspector

## Scope and governing elements

Repository: this repository. Implementation: apps/artifact-plane/src. Requirements 21–23 and B15–B16 in requirements/explorer.md and Workflow canvas contract in specifications/explorer.md govern this task. No upstream prerequisite.

Build deterministic worktree groups, change rows, and phase nodes from the existing workflow payload. Reuse React Flow pan, zoom, and fit controls. Replace the text-first list. Integrate selection and evidence into the existing resizable inspector. Preserve independent artifact selection, source errors, explicit worktree opening, refresh semantics, and narrow layout.

## Definition of Done

- [x] All registered worktree states appear, with selected branch and path readable.
- [x] Changes show ordered phase nodes, evidence states, and inferred current phase.
- [x] Sequence lines and legend do not imply completion or dependency edges.
- [x] Selected worktree, change, and phase details show the existing evidence and complete commit IDs/messages.
- [x] Pan, zoom, fit, resize, view switching, and selection invalidation satisfy the contract.
- [x] No new dependency, backend inference change, polling, storage, or repository write.

## Self-check

Scope and DoD cover the presentation contract. KISS reuses existing libraries. STE preserves uncertainty language. Evidence awaits implementation.

## Validation evidence

The integrated change passed 24 Node tests, the production build, and all 6 Chromium browser tests. Workflow browser checks cover branch/path/selected markers, unavailable worktree diagnostics, phase selection, full completion commit IDs and subjects, unknown approval, zoom/fit/pan, inspector resizing, view and viewport retention, explicit worktree opening, and refresh invalidation of a removed change. Both inspected worktrees retained identical file and Git metadata fingerprints before intentional fixture edits. Desktop and 700-pixel screenshots were inspected; narrow layouts use the existing stacked scrollable inspector and canvas pan/zoom controls. The hidden-tab initial-fit regression was corrected by initializing Workflow on first display and retaining its mounted canvas. No dependency or backend contract changed. Existing Vite client-directive and bundle-size warnings remain non-blocking. KISS and STE self-checks passed.
