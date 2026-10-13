# Derive history and commit recency

## Scope and contracts

Repository: this repository. Location: apps/artifact-plane/server/workflow.js and test/workflow.test.js. Requirements 24–27 and B17–B18 in requirements/explorer.md, and Workflow history and navigation contract in specifications/explorer.md govern this task.

## Prerequisites

No implementation prerequisite. User-approved plan.

## Work

Remove Approval records. Derive history, historyReason, and lastCommitAt from existing active metadata, snapshot comparisons, and the bounded Git log.

## Definition of Done

- [ ] Six phases preserve current evidence and completion associations; retained and snapshot-matching changes classify correctly; ambiguous active data stays uncertain; real Git timestamps and unknown cases are correct; repository and Git metadata remain unchanged.

## Self-check

Scope and checks cover the governing contract. KISS retains existing tools. STE preserves evidence limits. Implementation evidence is pending.
