---
flow:
  id: unit-inspection
  title: Inspect a unit of work and delivery evidence
  trigger: A person selects a documented deliverable outcome.
  outcome: Participating changes, task/phase views and shared evidence are visible
    with honest completion limits.
  entry_steps:
    - brief
  steps:
    - id: brief
      title: Read the unit brief and unique membership
      supports:
        - units
    - id: resolve
      title: Resolve delivered versions and exact originating plans
      supports:
        - units
    - id: graph
      title: Project existing artifact/task prerequisites
      supports:
        - graphs
    - id: criteria
      title: Inspect shared criteria and evidence
      supports:
        - units
        - unit-tests
    - id: impact
      title: Follow affected flow references
      supports:
        - flow-contract
    - id: conclusion
      title: Report supported completion or missing proof
      supports:
        - units
        - evidence-review-contract
  transitions:
    - from: brief
      to: resolve
      condition: Membership is readable.
    - from: resolve
      to: graph
      condition: Applicable component graphs are available.
    - from: resolve
      to: criteria
    - from: criteria
      to: conclusion
      condition: Requested completion evidence is loaded.
    - from: brief
      to: impact
      condition: Flow assessment is declared.
    - from: impact
      to: criteria
      condition: Review returns to the unit evidence.
  support:
    - id: units
      kind: implementation
      path: apps/artifact-plane/server/units-of-work.js
      symbol: readUnitsOfWork
      requires: Resolve historical provenance, retained delivery work and documented
        shared checks.
      basis: static
    - id: graphs
      kind: implementation
      path: apps/artifact-plane/server/unit-graphs.js
      symbol: buildUnitGraphs
      requires: Keep artifact, phase and task graph meanings distinct.
      basis: static
    - id: unit-tests
      kind: test
      path: apps/artifact-plane/test/units-of-work.test.js
      requires: Exercise legacy, protected-ref, ambiguous and modified delivery evidence.
      basis: static
    - id: flow-contract
      kind: element
      artifact: artifact-plane
      element: specifications/flows.md
      requires: Describe source-backed flow queries without adding authorization or
        workflow state.
      basis: documented
    - id: evidence-review-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-correctness.md
      requires: Accept only member/version-scoped actual review assertions and
        disclose missing merge proof.
      basis: documented
  gaps:
    - Recorded passing assertions are not independently executed tests; missing
      merge evidence stays unresolved.
    - Scoped publication-recognition corrections are specified; implementation
      validation remains pending.
  exclusions:
    - Creating unit members from shared flow participation.
  artifact: artifact-plane
---

# Inspect a unit of work and delivery evidence

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.
