---
tasks:
  - 01-reload-performance.md
  - 02-repository-observation.md
  - 03-browser-updates.md
  - 04-integration.md
---

# Automatic update implementation plan

## Tasks

1. [Measure and reduce reload cost](01-reload-performance.md).
2. [Observe repository input changes](02-repository-observation.md).
3. [Update browser views and reorder tabs](03-browser-updates.md).
4. [Validate the integrated outcome and prepare delivery](04-integration.md).

## Gates and execution

Execute this chain sequentially. The reader, observation service, and browser refresh path share contracts and benefit from incremental validation. The current capable session completed Specification and Plan; no additional agent is needed. Existing artifact-driven 2.0.0 is established on main after PR #13, and Artifact Plane 1.8.0 after PR #14. No proposed upstream gate exists. Recheck the established upstream contracts before implementation. Explicit approval of this plan is still required.

## Performance and acceptance

Capture a fixed corpus baseline before modifying the reader. Compare five-run medians and actual Git subprocess counts on the same corpus and machine. Warm unchanged and task-edit reloads target at least 70% lower median time and 80% fewer Git subprocesses; cold reloads target at least 30% lower median time. Compare normalized evidence outputs for equivalence, accounting only for the intended edit. The browser fixture must show a saved change within five seconds and preserve context. Exact budgets and recovery behavior are defined in specifications/live-reload.md.

## Delivery

Keep actual task evidence here. Prepare a complete task-free snapshot with source_change: change-live-reload and delivery_tasks: change after validation and user version confirmation. Suggest a minor Plane version because the observation endpoint and automatic updates are additive; decide the exact version during preparation. Preserve historical snapshots and shared evidence. Push/open a linked review PR after validated implementation; stop for team review and merge. No deployment or merge is authorized.

## Plan self-check

R1 maps to browser-updates; R2/R4/R7 map to repository-observation and browser-updates; R3 maps to browser-updates; R5/R6 map to reload-performance; integration joins all scopes. Each task has concrete DoD, unique ID, and resolved prerequisites. The chain is acyclic. KISS uses sequential execution and existing reader/SSE/UI conventions. STE keeps measured results distinct from targets and current inputs distinct from runtime activity. Implementation has not started.

## Preparation validation

The existing task parser accepted four tasks and three prerequisite edges with no diagnostics. The unit brief parser accepted the member and shared criteria without diagnostics. All ten relative Markdown links in the new change and brief resolved, with no ancestor README links. git diff --check passed. Self-check removed copied manual-only refresh restrictions from the new baseline; established snapshots remain intact. These results validate preparation, not implemented automatic updates or performance targets.
