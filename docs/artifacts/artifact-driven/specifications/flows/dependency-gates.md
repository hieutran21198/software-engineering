---
flow:
  id: dependency-gates
  title: Resolve implementation dependency gates
  trigger: A dependent artifact or task is ready for implementation planning or dispatch.
  outcome: Only approved work with satisfied internal DoD and required established upstream
    contracts starts.
  entry_steps:
    - resolve
  steps:
    - id: resolve
      title: Resolve contracts and established/proposed selectors
      supports:
        - dependency-guidance
        - model-contract
        - layout-contract
      interactions:
        - from: supplier
          to: contract
          action: Select the supplying artifact’s current established version
          outcome: The required contract and its source selector are identified.
          supports:
            - dependency-guidance
    - id: prepare
      title: Prepare against explicit proposed contracts
      supports:
        - dependency-guidance
      interactions:
        - from: consumer
          to: contract
          action: Prepare specifications and tasks against an explicitly proposed contract
          outcome: The dependent change remains preparatory until its required supplier establishes.
          supports:
            - dependency-guidance
    - id: wait
      title: Wait for required upstream publication
      supports:
        - dependency-guidance
      interactions:
        - from: contract
          to: consumer
          action: Gate dependent implementation on required upstream publication
          outcome: Implementation waits until all required supplier knowledge and code have landed.
          supports:
            - dependency-guidance
    - id: recheck
      title: Compare established contracts with prepared knowledge
      supports:
        - dependency-guidance
        - layout-contract
      interactions:
        - from: contract
          to: consumer
          action: Compare the established contract with the prepared knowledge
          outcome: A matching contract permits the remaining gates to be checked; a mismatch
            requires revision.
          supports:
            - dependency-guidance
    - id: revise
      title: Revise affected specifications and tasks
      supports:
        - flow-contract
      interactions:
        - from: consumer
          to: consumer
          action: Revise affected specifications, tasks and flow knowledge
          outcome: Changed contracts and plans receive their applicable checks and renewed approval.
          supports:
            - flow-contract
    - id: dispatch
      title: Check task DoD prerequisites and available plan approval
      supports:
        - task-contract
      interactions:
        - from: consumer
          to: consumer
          action: Check internal prerequisite DoD and available plan approval
          outcome: Only approved work with the required upstream contracts and internal DoD can
            start.
          supports:
            - task-contract
  transitions:
    - from: resolve
      to: prepare
      condition: An explicit proposed supplying change is used.
    - from: prepare
      to: wait
      condition: The required new upstream version has not established.
    - from: wait
      to: recheck
      condition: All required upstream knowledge/code has landed.
    - from: resolve
      to: recheck
      condition: Established contracts already provide the required capability.
    - from: recheck
      to: revise
      condition: The published contract differs from preparation.
    - from: revise
      to: recheck
      condition: Affected phase checks and necessary plan approval are repeated.
    - from: recheck
      to: dispatch
      condition: Required contracts match and internal/approval gates are satisfied.
  support:
    - id: dependency-guidance
      kind: implementation
      path: docs/artifact-driven/02-methodology/dependencies.md
      requires: Separate preparation, artifact establishment and internal task prerequisites.
      basis: documented
    - id: flow-contract
      kind: element
      artifact: artifact-driven
      element: specifications/system-flows.md
      requires: Update affected flow support when governing contracts change.
      basis: documented
    - id: task-contract
      kind: element
      artifact: artifact-driven
      element: specifications/task-dag.md
      requires: Do not infer task prerequisites or authorization from filenames/checklists.
      basis: documented
    - id: model-contract
      kind: element
      artifact: artifact-driven
      element: specifications/model-explanations.md
      requires: Keep reusable models and evidence-linked interactions separate from prerequisite
        graphs.
      basis: documented
    - id: layout-contract
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge-layout.md
      requires: Resolve established knowledge from the protected branch and proposed knowledge from the branch difference for in-place artifacts.
      basis: documented
  gaps:
    - The flow describes gating policy; it is not an observation that a task is currently
      unblocked.
  exclusions:
    - Inferring approval or publication from graph reachability.
  artifact: artifact-driven
  participants:
    - id: supplier
      artifact: artifact-driven
      model: artifact
      requires: Own the supplying capability and declare its current established version.
    - id: contract
      artifact: artifact-driven
      model: version
      requires: Provide complete published knowledge used to resolve the supplying contract.
    - id: consumer
      artifact: artifact-driven
      model: change
      requires: Prepare and implement the dependent artifact change under the required contract
        and approval gates.
---

# Resolve implementation dependency gates

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.

## Model interactions

The selected step explains how the supplier Artifact, its Version and the consuming Change participate. Actions and outcomes describe documented policy, not observed dispatch. Existing branch conditions, the recheck/revise loop and all step identities remain unchanged. Supporting contracts explain the interaction; no model participation adds an artifact prerequisite.
