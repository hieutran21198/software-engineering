# Workflow history controls and toolbar

## Scope and contracts

Repository: this repository. Location: apps/artifact-plane/src/workflow-canvas.js, src/Workflow.jsx, src/main.jsx, and src/style.css. Requirements 24–27 and B17–B18 in requirements/explorer.md, and Workflow history and navigation contract in specifications/explorer.md govern this task.

## Prerequisites

Task 11. User-approved plan.

## Work

Add closed history groups and closed individual changes, sort by commit recency, keep selection independent of visibility, rename the switcher, and center it consistently.

## Definition of Done

- [x] Histories expand and collapse independently; newest timestamps sort first, nulls last, ties deterministic; hidden selection preserves its evidence; six-phase connections remain correct; Dependencies / Workflow stays centered at fixed desktop width and usable at narrow width.

## Self-check

Scope and checks cover the governing contract. KISS retains existing tools. STE preserves evidence limits. Implementation evidence is recorded below.

## Validation evidence

The integrated change passed 25 Node tests, the production build, and all 7 Chromium browser tests. Real Git fixtures verify six phases, retained versus snapshot-matching history, ambiguous active metadata, committer timestamps, and uncommitted null timestamps. B17–B18 verify newest-first order despite conflicting names, natural ties, unknown times last, closed history and change containers, independent expansion, evidence preservation after collapse, absent Approval nodes, and identical centered switcher positions in both views at desktop and 700-pixel widths. Existing pan/zoom/fit, resize, refresh invalidation, and worktree-opening checks pass. Inspected repository files and Git metadata fingerprints remain unchanged. Desktop and narrow history screenshots were inspected. KISS retains existing libraries and bounded local reads; STE preserves uncertainty and retained-history meaning. Existing Vite client-directive and bundle-size warnings remain non-blocking.
