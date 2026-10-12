# Workflow canvas validation

## Scope and governing elements

Repository: this repository. Locations: apps/artifact-plane/test, apps/artifact-plane/test/browser, and application usage documentation. Depends on task 09. Requirements B15–B16 and Workflow canvas contract govern validation.

## Definition of Done

- [x] Check real multi-worktree canvas selection and phase evidence, including full IDs, messages, unknown states, and unavailable worktrees.
- [x] Check pan, zoom, fit, inspector resizing, retained view selection, and refresh invalidation.
- [x] Inspect desktop and narrow screenshots for readable nodes and evidence.
- [x] Existing repository fingerprints remain unchanged during exploration.
- [x] Node tests, production build, and Chromium browser suite pass on the integrated change.
- [x] Update usage documentation and record actual validation evidence; verify documentation hierarchy.

## Self-check

Checks cover behavior and source safety rather than copied implementation details. KISS uses existing test tools and CI. STE makes results observable. Evidence awaits implementation.

## Validation evidence

The integrated change passed 24 Node tests, the production build, and all 6 Chromium browser tests. Workflow browser checks cover branch/path/selected markers, unavailable worktree diagnostics, phase selection, full completion commit IDs and subjects, unknown approval, zoom/fit/pan, inspector resizing, view and viewport retention, explicit worktree opening, and refresh invalidation of a removed change. Both inspected worktrees retained identical file and Git metadata fingerprints before intentional fixture edits. Desktop and 700-pixel screenshots were inspected; narrow layouts use the existing stacked scrollable inspector and canvas pan/zoom controls. The hidden-tab initial-fit regression was corrected by initializing Workflow on first display and retaining its mounted canvas. No dependency or backend contract changed. Existing Vite client-directive and bundle-size warnings remain non-blocking. KISS and STE self-checks passed.

## Version preparation

The user confirmed compatible minor version 1.3.0. Prepare the full snapshot with valid requirements, specifications, decisions, and historical task evidence. Version 1.2.0 remains established on main until the knowledge and implementation merge together.
