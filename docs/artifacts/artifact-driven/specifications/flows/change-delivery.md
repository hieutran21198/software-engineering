---
flow:
  id: change-delivery
  title: Deliver an artifact change
  trigger: A user requests a new governed capability or revision.
  outcome: The change has reviewed requirements, contracts, approved tasks,
    delivery evidence and a proposed or established complete version.
  entry_steps:
    - requirement
  steps:
    - id: requirement
      title: Discover the outcome, scope, tier and candidate flows
      supports:
        - tier-contract
        - impact-contract
        - efficiency-contract
        - knowledge
        - evidence-usability-contract
        - explicit-evidence-guide
        - layout-contract
        - visual-contract
    - id: specification
      title: Define contracts and assess affected flow support
      supports:
        - impact-contract
        - knowledge
        - flow-contract
        - evidence-usability-contract
        - explicit-evidence-guide
        - visual-contract
        - claim-contract
    - id: plan
      title: Create fresh dependency-ordered tasks and DoD
      supports:
        - tier-contract
        - checks-contract
        - task-contract
        - evidence-usability-contract
        - explicit-evidence-guide
        - minimal-scaffold-check
        - layout-contract
        - visual-contract
    - id: approval
      title: Obtain explicit approval for the concrete plan
      supports:
        - knowledge
        - evidence-usability-contract
        - explicit-evidence-guide
        - claim-contract
    - id: gate
      title: Check upstream establishment and internal prerequisites
      supports:
        - dependency-flow
        - evidence-usability-contract
        - explicit-evidence-guide
    - id: implement
      title: Implement approved tasks and validate combined behavior
      supports:
        - knowledge
        - evidence-usability-contract
        - explicit-evidence-guide
        - visual-contract
        - claim-contract
    - id: publication
      title: Prepare version and team review
      supports:
        - tier-contract
        - publication-flow
        - evidence-usability-contract
        - explicit-evidence-guide
        - layout-contract
        - claim-contract
  transitions:
    - from: requirement
      to: specification
      condition: Requirement self-check passes.
    - from: specification
      to: plan
      condition: Specification self-check passes.
    - from: plan
      to: approval
      condition: Plan self-check passes and the change is medium or large.
    - from: plan
      to: gate
      condition: The change is small; the owner's request is the plan approval and the
        plan goes to the PR description.
    - from: approval
      to: gate
      condition: Explicit approval is available.
    - from: gate
      to: implement
      condition: Required upstream versions establish and internal task prerequisites
        satisfy DoD.
    - from: implement
      to: publication
      condition: Task and integration checks pass.
    - from: implement
      to: specification
      condition: A contract gap requires correction and renewed approval if material.
  support:
    - id: impact-contract
      kind: element
      artifact: artifact-driven
      element: specifications/change-impact.md
      requires: Use the tiers, the propagation rules and the coverage statement to find candidates and assess compatibility.
      basis: documented
    - id: knowledge
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge.md
      requires: Apply the five-phase change and approval responsibilities.
      basis: documented
    - id: flow-contract
      kind: element
      artifact: artifact-driven
      element: specifications/system-flows.md
      requires: Discover and maintain affected named system journeys.
      basis: documented
    - id: task-contract
      kind: element
      artifact: artifact-driven
      element: specifications/task-dag.md
      requires: Declare a fresh task list and prerequisites.
      basis: documented
    - id: dependency-flow
      kind: flow
      artifact: artifact-driven
      flow: dependency-gates
      requires: Recheck upstream requirements before dependent implementation.
      basis: documented
    - id: publication-flow
      kind: flow
      artifact: artifact-driven
      flow: version-publication
      requires: Publish complete resulting knowledge with retained delivery evidence.
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
    - id: minimal-scaffold-check
      kind: test
      path: src/archs/artifact-driven/bundle_test.go
      symbol: TestMinimalChangeScaffold
      requires: Validate copied scaffold files, references, task structure and absent
        initial completion claims.
      basis: observed
      evidence:
        - docs/artifacts/artifact-driven/changes/change-evidence-and-usability/tasks/02-minimal-scaffold.md
    - id: efficiency-contract
      kind: element
      artifact: artifact-driven
      element: specifications/agent-efficiency.md
      requires: Reuse current context and recover with explicit approval and dependency gates.
      basis: documented
    - id: layout-contract
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge-layout.md
      requires: Edit working knowledge in place, record versions and changes without copies, and derive established and proposed knowledge from the protected branch.
      basis: documented
    - id: claim-contract
      kind: element
      artifact: artifact-driven
      element: specifications/claim-records.md
      requires: Record consequential claims with evidence and checks, read open claims
        before approval, and report unchecked claims at version preparation.
      basis: documented
    - id: visual-contract
      kind: element
      artifact: artifact-driven
      element: specifications/visual-knowledge.md
      requires: Select, check and maintain representations of knowledge inside the existing phase self-checks.
      basis: documented
    - id: tier-contract
      kind: element
      artifact: artifact-driven
      element: specifications/delivery-tiers.md
      requires: Assign the tier, follow the records, commits and gates of that tier, and keep the five guarantees.
      basis: documented
    - id: checks-contract
      kind: element
      artifact: artifact-driven
      element: specifications/record-checks.md
      requires: Declare requirement IDs and covers, write single-source records and use the validator result in self-checks.
      basis: documented
  gaps:
    - Approval is available conversation/Git evidence, not a field in this map.
    - Claim checks are recorded assertions; the map does not show who performed
      a check beyond the verified_by value of the record.
    - Guidance and scaffold checks do not independently verify consumer
      execution, approval or remote publication.
  exclusions:
    - An autonomous scheduler, workflow database and automatic merges.
  artifact: artifact-driven
---

# Deliver an artifact change

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
