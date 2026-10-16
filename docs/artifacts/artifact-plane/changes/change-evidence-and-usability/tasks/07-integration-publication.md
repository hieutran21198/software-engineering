---
id: integration-publication
depends_on: [publication-evidence, comparison-service, comparison-interface, model-explanations, incremental-refresh, responsive-repair]
---

# Validate the combined outcome and prepare Plane review

## Scope and ownership

Coordinator owns integrated validation, updated flow/evidence knowledge, final snapshot/root/DAG, package version and PR handoff.

## Governing knowledge

P1-P7; all changed specifications and shared unit criteria.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Run npm test, npm run build and npm run test:browser in apps/artifact-plane; all required checks pass on the integrated revision.
- [ ] Run targeted HTTP/MCP parity, immutable protected-source evidence, graph/task/unit validation and repository fingerprint checks. Repeat upstream bundle/docs checks if integration changes their inputs.
- [ ] Record fresh performance evidence and combined acceptance evidence in this unit, referencing originating task details once.
- [ ] Prepare suggested Plane 1.14.0 only after version confirmation and DoD: complete knowledge, source_change, delivery_tasks: change, no tasks in snapshot and consistent proposed root/DAG/package.
- [ ] Push the dedicated downstream branch, open and attach a PR linked to the merged upstream review; stop for team review/merge. Shared completion waits for both exact member deliveries and acceptance evidence. Preserve earlier outcomes and historical snapshots.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
