---
id: integration-publication
depends_on: [layout-reader, git-baseline, declared-evidence, layout-navigation, knowledge-scripts, model-explanations, incremental-refresh, responsive-repair]
---

# Validate the combined outcome and prepare Plane review

## Scope and ownership

Coordinator owns integrated validation, updated flow/evidence knowledge, final snapshot/root/DAG, package version and PR handoff.

## Governing knowledge

P1-P7; requirements/knowledge-layout.md L1 to L7 and M3; specifications/knowledge-layout-reading.md; all changed specifications and shared unit criteria. The revised join awaits approval.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Run npm test, npm run build and npm run test:browser in apps/artifact-plane; all required checks pass on the integrated revision.
- [ ] Run targeted HTTP/MCP parity, immutable protected-source evidence, graph/task/unit validation and repository fingerprint checks. Repeat upstream bundle/docs checks if integration changes their inputs.
- [ ] Run the repeatable benchmark on the legacy and migrated forms of this repository: the zero-excerpt packet for the ADD change is at least 80 percent smaller and one explore issues at least 50 percent fewer git commands; record bytes, commands and elapsed time as proxies. Record combined acceptance evidence in this unit, referencing originating task details once.
- [ ] Prepare suggested Plane 1.14.0 only after version confirmation and DoD, as an in-place version record with source_change, the identity record updated, no knowledge directories under the record and a consistent package version.
- [ ] Publish according to the option chosen at approval: one coordinated repository PR with the ADD measure-and-publish task, or a Plane PR after ADD 2.4.0 establishes; include proposed Plane 1.14.0, link merged upstream #28, attach it and stop for team review/merge. Preserve separate unit memberships and evidence. Shared completion waits for exact member publication and acceptance checks.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
