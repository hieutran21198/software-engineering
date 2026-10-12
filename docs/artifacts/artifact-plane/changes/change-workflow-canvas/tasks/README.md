# Workflow canvas plan

Baseline: established 1.2.0. Implement in apps/artifact-plane only after explicit user approval. No upstream dependency changes.

1. [Workflow canvas and inspector](09-workflow-canvas.md).
2. [Integration validation](10-canvas-validation.md), after task 09.

Execute sequentially in the current session. The shared selection and inspector changes make parallel ownership unnecessary. Coordinator owns knowledge updates.

## Historical tasks

Tasks 01–08 retain earlier evidence. Their checks do not validate the new canvas.

## Delivery

Run Node tests, production build, and Chromium browser tests. Inspect desktop and narrow layouts. Verify documentation links and read-only exploration. After validation, suggest a compatible version for user confirmation, prepare the complete snapshot, and open a review PR. Stop for team merge.

## Plan self-check

Tasks cover requirements 21–23 and B15–B16. Existing inference contracts stay unchanged. KISS uses current tools with no new dependency. STE keeps checks concrete. Implementation awaits explicit approval.
