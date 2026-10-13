---
id: integration
depends_on: [browser-updates]
---

# Validate integrated outcome and prepare delivery

## Scope and ownership

Own integrated tests, user documentation for automatic updates/performance, and artifact-local delivery evidence under coordinator control. Run combined validation, record shared evidence in the unit brief, and prepare the proposed version/review handoff after user version confirmation.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [ ] Run the complete Artifact Plane Node suite, Chromium browser suite, and production build with actual results recorded.
- [ ] Repeat the fixed-corpus benchmark against the integrated revision and record target compliance and output equivalence.
- [ ] Exercise end-to-end save bursts, reconnection/server restart, worktree changes, protected-ref movement, manual recovery, and canvas preservation.
- [ ] Verify read-only repository fingerprints, documentation link targets/hierarchy, valid task/unit metadata, and unchanged runtime/evidence contracts.
- [ ] Record shared acceptance evidence in the unit brief with references to originating tasks; do not assert establishment before required merge.
- [ ] After version confirmation, prepare complete task-free knowledge with source_change/delivery_tasks provenance, consistent root/DAG updates, and a review PR; stop before merge.

## Evidence

Not executed. Record commands, observed results, and material limitations during approved implementation.
