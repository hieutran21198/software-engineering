---
unit_of_work: live-reload
changes:
  - artifact: artifact-plane
    change: change-live-reload
acceptance:
  - id: navigation
    criterion: Unit tabs appear as Artifacts, Workflow, Implementation and new unit exploration starts with Artifacts.
  - id: automatic-updates
    criterion: Relevant repository and registered-worktree changes update the views automatically with recovery and preserved user context.
  - id: performance
    criterion: Repeatable reload measurements meet the design targets without weakening evidence correctness.
  - id: lazy-loading
    criterion: Overview loads before deferred detail; only selected views and required evidence load, unloaded evidence remains explicit, and inactive detail is released.
  - id: memory
    criterion: Fixed-corpus measurements report server/browser memory, payload size, and idle polling costs and verify bounded detail retention.
  - id: integration
    criterion: Integrated reader and browser checks preserve read-only behavior, history, publication evidence, runtime observation, and manual recovery.
    integration: true
evidence:
  - criterion: navigation
    method: Run tab-order, default-view, and recorded-execution browser checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/03-browser-updates.md#evidence
  - criterion: automatic-updates
    method: Run saved-edit, viewport, offline/reconnect, manual-recovery, and stale-response browser checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/03-browser-updates.md#evidence
  - criterion: performance
    method: Compare five-run full reload medians and Git commands with equal snapshot results on the fixed corpus.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/04-integration.md#evidence
  - criterion: lazy-loading
    method: Compare scoped graphs/conclusions against full reads and verify deferred sections and inactive-detail release.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/01a-lazy-reader.md#evidence
  - criterion: memory
    method: Measure server/browser memory, response bytes, navigation retention, and 60-second large-corpus idle polling.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/04-integration.md#final-memory-and-payload-measurements
  - criterion: integration
    method: Run the complete Node/Chromium suites, production build, metadata/link checks, and read-only fixture fingerprints.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-live-reload/tasks/04-integration.md#evidence
---

# Automatic updates and faster reloads

## Purpose

Keep Artifact Plane views current with repository evidence and make reloads responsive.

## Included scope

Unit tab order and initial view; repository change detection and browser updates; reload performance and lazy loading; memory measurement; recovery and integrated correctness checks.

## Excluded scope

Workflow visualization redesign, new approval/phase rules, runtime controls, source-code HMR, ADD contract changes, deployment, and automatic merge.

## Validation evidence

Preparation measured the existing selected repository on 2026-10-13: scanning took 185 ms and workflow derivation took 7,331 ms across two registered worktrees and 265 selected knowledge files. The workflow path issued 2,493 Git calls. Cumulative Git call time was 41,752 ms because some calls overlap. This is a diagnostic sample, not completed acceptance or a stable benchmark. Implementation will use a fixed corpus and record repeated before/after results in the originating tasks.

## Combined checks

Integrated implementation passed 132 Node checks, 22 Chromium acceptance cases, the production build, five-run equal-work reload comparisons, both scoped payload/memory corpora, browser memory/navigation checks, and documentation/task metadata checks. Actual commands and measurements remain in the originating task evidence above. Warm full reloads improved about 88%, with 91.5% fewer Git subprocesses. Deferred overview payload was 2.2% of full output on the small corpus and 0.59% on the large corpus.

Read-only file/Git fingerprints, exact publication/task-source checks, unsafe path/origin validation, runtime/recorded execution regressions, and active-stream cleanup passed. Large full-content polling remains a measured limitation: about 4.4 seconds per 100,610-file sample plus the two-second gap, with material idle CPU/I/O. Passing shared checks are preparatory until the member version and required implementation land on main; no completed outcome is asserted here.
