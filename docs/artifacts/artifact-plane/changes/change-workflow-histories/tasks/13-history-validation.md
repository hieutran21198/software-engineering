# Integrated history validation

## Scope and contracts

Repository: this repository. Location: apps/artifact-plane/test/browser, regression fixtures, and application README. Requirements 24–27 and B17–B18 in requirements/explorer.md, and Workflow history and navigation contract in specifications/explorer.md govern this task.

## Prerequisites

Tasks 11 and 12. User-approved plan.

## Work

Update acceptance checks and usage documentation, exercise current/retained/ambiguous changes and toolbar stability, and inspect combined results.

## Definition of Done

- [x] Node suite, build, and Chromium browser suite pass; B17–B18 verify history order, independent expansion, collapse selection, timestamp limits, absent Approval, stable switcher position, and correct labels; desktop/narrow screenshots reviewed; existing pan/zoom/fit/resize/refresh behavior and read-only fingerprints pass; document link hierarchy passes and actual task evidence is recorded.

## Self-check

Scope and checks cover the governing contract. KISS retains existing tools. STE preserves evidence limits. Implementation evidence is recorded below.

## Validation evidence

The integrated change passed 25 Node tests, the production build, and all 7 Chromium browser tests. Real Git fixtures verify six phases, retained versus snapshot-matching history, ambiguous active metadata, committer timestamps, and uncommitted null timestamps. B17–B18 verify newest-first order despite conflicting names, natural ties, unknown times last, closed history and change containers, independent expansion, evidence preservation after collapse, absent Approval nodes, and identical centered switcher positions in both views at desktop and 700-pixel widths. Existing pan/zoom/fit, resize, refresh invalidation, and worktree-opening checks pass. Inspected repository files and Git metadata fingerprints remain unchanged. Desktop and narrow history screenshots were inspected. KISS retains existing libraries and bounded local reads; STE preserves uncertainty and retained-history meaning. Existing Vite client-directive and bundle-size warnings remain non-blocking.
