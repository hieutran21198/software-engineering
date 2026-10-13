# Derive history and commit recency

## Scope and contracts

Repository: this repository. Location: apps/artifact-plane/server/workflow.js and test/workflow.test.js. Requirements 24–27 and B17–B18 in requirements/explorer.md, and Workflow history and navigation contract in specifications/explorer.md govern this task.

## Prerequisites

No implementation prerequisite. User-approved plan.

## Work

Remove Approval records. Derive history, historyReason, and lastCommitAt from existing active metadata, snapshot comparisons, and the bounded Git log.

## Definition of Done

- [x] Six phases preserve current evidence and completion associations; retained and snapshot-matching changes classify correctly; ambiguous active data stays uncertain; real Git timestamps and unknown cases are correct; repository and Git metadata remain unchanged.

## Self-check

Scope and checks cover the governing contract. KISS retains existing tools. STE preserves evidence limits. Implementation evidence is recorded below.

## Validation evidence

The integrated change passed 25 Node tests, the production build, and all 7 Chromium browser tests. Real Git fixtures verify six phases, retained versus snapshot-matching history, ambiguous active metadata, committer timestamps, and uncommitted null timestamps. B17–B18 verify newest-first order despite conflicting names, natural ties, unknown times last, closed history and change containers, independent expansion, evidence preservation after collapse, absent Approval nodes, and identical centered switcher positions in both views at desktop and 700-pixel widths. Existing pan/zoom/fit, resize, refresh invalidation, and worktree-opening checks pass. Inspected repository files and Git metadata fingerprints remain unchanged. Desktop and narrow history screenshots were inspected. KISS retains existing libraries and bounded local reads; STE preserves uncertainty and retained-history meaning. Existing Vite client-directive and bundle-size warnings remain non-blocking.
