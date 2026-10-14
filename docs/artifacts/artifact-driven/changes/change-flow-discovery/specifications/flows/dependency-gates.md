---
flow:
  id: dependency-gates
  title: Resolve implementation dependency gates
  trigger: A dependent artifact or task is ready for implementation planning or
    dispatch.
  outcome: Only approved work with satisfied internal DoD and required established
    upstream contracts starts.
  entry_steps:
    - resolve
  steps:
    - id: resolve
      title: Resolve contracts and established/proposed selectors
      supports:
        - dependency-guidance
    - id: prepare
      title: Prepare against explicit proposed contracts
      supports:
        - dependency-guidance
    - id: wait
      title: Wait for required upstream publication
      supports:
        - dependency-guidance
    - id: recheck
      title: Compare established contracts with prepared knowledge
      supports:
        - dependency-guidance
    - id: revise
      title: Revise affected specifications and tasks
      supports:
        - flow-contract
    - id: dispatch
      title: Check task DoD prerequisites and available plan approval
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
      requires: Separate preparation, artifact establishment and internal task
        prerequisites.
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
      requires: Do not infer task prerequisites or authorization from
        filenames/checklists.
      basis: documented
  gaps:
    - The flow describes gating policy; it is not an observation that a task is
      currently unblocked.
  exclusions:
    - Inferring approval or publication from graph reachability.
  artifact: artifact-driven
---

# Resolve implementation dependency gates

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
