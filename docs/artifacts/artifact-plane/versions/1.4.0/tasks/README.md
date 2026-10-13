# Workflow histories and navigation plan

Baseline: established 1.3.0. Implementation workspace: apps/artifact-plane. No upstream artifact dependency exists. Implement only after explicit plan approval.

1. [Derive history and commit recency](11-history-evidence.md).
2. [Workflow history controls and toolbar](12-history-interface.md), after task 11.
3. [Integrated validation](13-history-validation.md), after task 12.

Execute sequentially in the current session because the API fields, phase sequence, and UI tests share contracts. Coordinator owns artifact updates. Tasks 01–10 remain historical; their evidence does not validate these changes.

## Delivery

Run Node tests, production build, and Chromium browser acceptance. Inspect desktop and narrow layouts, check documentation hierarchy, and verify repository/Git fingerprints. After validation, suggest a compatible version for user confirmation, prepare a complete snapshot, and open the review PR. Stop for team merge.

## Plan self-check

Tasks cover requirements 24–27 and B17–B18. Existing read-only and evidence boundaries remain intact. KISS uses the existing log, plain functions, React Flow, and test tools. STE makes checks and uncertainty explicit. Implementation awaits user approval.
