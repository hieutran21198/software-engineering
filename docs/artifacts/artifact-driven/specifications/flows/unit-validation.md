---
flow:
  id: unit-validation
  title: Validate a shared deliverable outcome
  trigger: A coordinator reviews delivery evidence for a unit of work.
  outcome: Completion is supported only when all members establish and every
    shared criterion has applicable passing evidence; missing proof stays
    unresolved.
  entry_steps:
    - membership
  steps:
    - id: membership
      title: Resolve unique artifact/change membership and flow impact
      supports:
        - unit-contract
        - flow-contract
        - evidence-usability-contract
        - explicit-evidence-guide
    - id: delivery
      title: Resolve delivered versions and exact originating plans
      supports:
        - retention-contract
        - evidence-usability-contract
        - explicit-evidence-guide
        - layout-contract
    - id: criteria
      title: Check shared acceptance and combined integration evidence
      supports:
        - unit-contract
        - evidence-usability-contract
        - explicit-evidence-guide
    - id: publication
      title: Verify protected-ref knowledge/code publication
      supports:
        - retention-contract
        - evidence-usability-contract
        - explicit-evidence-guide
        - layout-contract
    - id: report
      title: Report supported completion or explicit missing evidence
      supports:
        - unit-contract
        - evidence-usability-contract
        - explicit-evidence-guide
  transitions:
    - from: membership
      to: delivery
      condition: Membership and owner references are valid.
    - from: delivery
      to: criteria
      condition: Each delivery record resolves unambiguously.
    - from: criteria
      to: publication
      condition: Every shared criterion has applicable passing evidence.
    - from: publication
      to: report
      condition: All required publication proof is available.
    - from: membership
      to: report
      condition: Membership is ambiguous or missing.
    - from: criteria
      to: report
      condition: A required criterion lacks passing evidence.
    - from: publication
      to: report
      condition: Required merge evidence is unavailable.
  support:
    - id: unit-contract
      kind: element
      artifact: artifact-driven
      element: specifications/units-of-work.md
      requires: Assess member versions and shared evidence without inventing workflow
        state.
      basis: documented
    - id: retention-contract
      kind: element
      artifact: artifact-driven
      element: specifications/task-retention.md
      requires: Resolve exact retained delivery work and publication proof.
      basis: documented
    - id: flow-contract
      kind: element
      artifact: artifact-driven
      element: specifications/system-flows.md
      requires: Record affected flows without creating members or prerequisites.
      basis: documented
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-driven
      element: specifications/evidence-records.md
      requires: Interpret recorded checks and publication claims with explicit source
        validation.
      basis: documented
    - id: explicit-evidence-guide
      kind: implementation
      path: docs/artifact-driven/06-guidelines/evidence-records.md
      requires: Record explicit evidence and reconcile version declarations using
        source and merge checks.
      basis: documented
    - id: layout-contract
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge-layout.md
      requires: Resolve in-place version records and their introducing commits for member delivery and publication checks.
      basis: documented
  gaps:
    - Documented evidence is not independently verified test success; this
      record does not assert any unit is complete.
    - Guidance and scaffold checks do not independently verify consumer
      execution, approval or remote publication.
  exclusions:
    - Retroactive legacy membership and replacing a historical plan with current
      tasks.
  artifact: artifact-driven
---

# Validate a shared deliverable outcome

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
