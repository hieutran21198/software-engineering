---
id: publication-evidence
depends_on: []
---

# Interpret evidence and reconcile publication context

## Scope and ownership

Own server/workflow.js, server/units-of-work.js, shared evidence parsing and focused tests. Coordinator owns root/unit reconciliation and publication detail.

## Governing knowledge

P1, P3; specifications/evidence-and-comparison.md; established ADD evidence contract.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Tests cover valid explicit records, absent legacy records, malformed explicit fields, conflicting/failed/incomplete results, unsafe/missing/empty evidence and exact protected delivery path sets.
- [ ] A document self-check never completes unrelated documents or grants approval; invalid explicit evidence cannot fall back to a positive legacy claim.
- [ ] Inspector data keeps declared version, inspected revision, publication and validation facts separate, with exact gap/action/source.
- [ ] Audit PR #26 and required predecessor scopes and retained evidence before preparing any root correction; preserve failed historical checks and established snapshots.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
