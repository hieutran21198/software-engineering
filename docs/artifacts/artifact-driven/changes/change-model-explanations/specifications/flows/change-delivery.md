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
      title: Discover the outcome, scope and candidate flows
      supports:
        - knowledge
    - id: specification
      title: Define contracts and assess affected flow support
      supports:
        - knowledge
        - flow-contract
    - id: plan
      title: Create fresh dependency-ordered tasks and DoD
      supports:
        - task-contract
    - id: approval
      title: Obtain explicit approval for the concrete plan
      supports:
        - knowledge
    - id: gate
      title: Check upstream establishment and internal prerequisites
      supports:
        - dependency-flow
    - id: implement
      title: Implement approved tasks and validate combined behavior
      supports:
        - knowledge
    - id: publication
      title: Prepare version and team review
      supports:
        - publication-flow
  transitions:
    - from: requirement
      to: specification
      condition: Requirement self-check passes.
    - from: specification
      to: plan
      condition: Specification self-check passes.
    - from: plan
      to: approval
      condition: Plan self-check passes.
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
  gaps:
    - Approval is available conversation/Git evidence, not a field in this map.
  exclusions:
    - An autonomous scheduler, workflow database and automatic merges.
  artifact: artifact-driven
---

# Deliver an artifact change

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
