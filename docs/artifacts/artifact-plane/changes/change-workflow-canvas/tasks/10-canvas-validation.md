# Workflow canvas validation

## Scope and governing elements

Repository: this repository. Locations: apps/artifact-plane/test, apps/artifact-plane/test/browser, and application usage documentation. Depends on task 09. Requirements B15–B16 and Workflow canvas contract govern validation.

## Definition of Done

- [ ] Check real multi-worktree canvas selection and phase evidence, including full IDs, messages, unknown states, and unavailable worktrees.
- [ ] Check pan, zoom, fit, inspector resizing, retained view selection, and refresh invalidation.
- [ ] Inspect desktop and narrow screenshots for readable nodes and evidence.
- [ ] Existing repository fingerprints remain unchanged during exploration.
- [ ] Node tests, production build, and Chromium browser suite pass on the integrated change.
- [ ] Update usage documentation and record actual validation evidence; verify documentation hierarchy.

## Self-check

Checks cover behavior and source safety rather than copied implementation details. KISS uses existing test tools and CI. STE makes results observable. Evidence awaits implementation.
