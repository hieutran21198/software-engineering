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
  - id: integration
    criterion: Integrated reader and browser checks preserve read-only behavior, history, publication evidence, runtime observation, and manual recovery.
    integration: true
evidence: []
---

# Automatic updates and faster reloads

## Purpose

Keep Artifact Plane views current with repository evidence and make reloads responsive.

## Included scope

Unit tab order and initial view; repository change detection and browser updates; reload performance; recovery and integrated correctness checks.

## Excluded scope

Workflow visualization redesign, new approval/phase rules, runtime controls, source-code HMR, ADD contract changes, deployment, and automatic merge.

## Validation evidence

Preparation measured the existing selected repository on 2026-10-13: scanning took 185 ms and workflow derivation took 7,331 ms across two registered worktrees and 265 selected knowledge files. The workflow path issued 2,493 Git calls. Cumulative Git call time was 41,752 ms because some calls overlap. This is a diagnostic sample, not completed acceptance or a stable benchmark. Implementation will use a fixed corpus and record repeated before/after results in the originating tasks.
