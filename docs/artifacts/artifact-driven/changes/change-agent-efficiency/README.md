# Agent efficiency and reliable adoption

## Reason

The repository audit found repeated context loading across ADD roles, a first-conflict-only adoption preflight, and contradictory snapshot-retention guidance. Humans and agents need clear next actions with less repeated work. The existing five phases, ownership, evidence and approval gates remain authoritative.

## Scope

Start from the complete ADD 2.3.0 requirements, specifications and applicable decisions. Add aggregate adoption diagnostics, progressive role context loading and recovery in the same capable session, and consistent guidance for change-owned delivery evidence. Plan creates fresh tasks; historical tasks and delivered README provenance are excluded from this change.

This change does not add a harness registrar, scaffold runner, workflow database, role, automatic approval or automatic publication. It does not rewrite established knowledge snapshots or remove historical delivery evidence. Artifact Plane owns compact context retrieval in its existing evidence-and-usability change. The coordinator owns the shared outcome and membership.

- [Agent efficiency requirements](requirements/agent-efficiency.md)
- [Baseline requirements](requirements/baseline.md)
- [Knowledge contract](specifications/knowledge.md)
- [Delivery contract](specifications/delivery.md)

## Preparation limits

These files describe proposed knowledge. Preparation does not authorize implementation or establish a version. The completed plan requires explicit user approval, and dependent implementation requires its upstream established contracts.
