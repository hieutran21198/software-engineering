---
id: integration-publication
depends_on: [publication-evidence, comparison-service, comparison-interface, model-explanations, incremental-refresh, responsive-repair, compact-context]
---

# Validate the combined outcome and prepare Plane review

## Scope and ownership

Coordinator owns integrated validation, updated flow/evidence knowledge, final snapshot/root/DAG, package version and PR handoff.

## Governing knowledge

P1-P7; requirements/agent-efficiency.md; specifications/compact-context.md; all
changed specifications and shared unit criteria. The revised join awaits approval.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Run npm test, npm run build and npm run test:browser in apps/artifact-plane; all required checks pass on the integrated revision.
- [ ] Run targeted HTTP/MCP parity, immutable protected-source evidence, graph/task/unit validation and repository fingerprint checks. Repeat upstream bundle/docs checks if integration changes their inputs.
- [ ] Record fresh performance evidence and combined acceptance evidence in this unit, referencing originating task details once.
- [ ] Prepare suggested Plane 1.14.0 only after version confirmation and DoD: complete knowledge, source_change, delivery_tasks: change, no tasks in snapshot and consistent proposed root/DAG/package.
- [ ] Coordinate one combined repository PR with the ADD efficiency integration task, include proposed Plane 1.14.0 and link merged upstream #28; attach it and stop for team review/merge. Preserve separate unit memberships and evidence. Shared completion waits for exact member publication and acceptance checks.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
