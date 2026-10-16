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
        - ux-simplification-contract
        - ux-browser-checks
        - units
        - search-label-contract
        - shared-search-field
        - search-browser-checks
        - evidence-usability-contract
    - id: resolve
      title: Resolve delivered versions and exact originating plans
      supports:
        - units
        - evidence-usability-contract
    - id: graph
      title: Project existing artifact/task prerequisites
      supports:
        - graphs
        - evidence-usability-contract
    - id: criteria
      title: Inspect shared criteria and evidence
      supports:
        - units
        - unit-tests
        - evidence-usability-contract
    - id: impact
      title: Follow affected flow references
      supports:
        - flow-contract
        - evidence-usability-contract
    - id: conclusion
      title: Report supported completion or missing proof
      supports:
        - units
        - evidence-review-contract
        - publication-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
        - completion-feedback
        - evidence-usability-contract
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
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/units-of-work.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-ux-simplification/tasks/07-integration-publication.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Read the brief first and automatically request completion only for the
        selected active unit.
      basis: documented
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
    - id: publication-checks
      kind: test
      path: apps/artifact-plane/test/publication-review.test.js
      requires: Reject instructional/unscoped claims and preserve real member/version
        assertions.
      basis: static
    - id: search-label-contract
      kind: element
      artifact: artifact-plane
      element: specifications/search-label-usability.md
      requires: Define named filtering, explicit discovery and readable labelled graph
        presentation without changing graph meaning.
      basis: documented
    - id: shared-search-field
      kind: implementation
      path: apps/artifact-plane/src/SearchField.jsx
      requires: Provide consistent named filtering and clear behavior.
      basis: static
    - id: search-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/search-usability.spec.js
      requires: Exercise live unit filtering, clear and consistent flow controls.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present inspector blocks and native controls consistently without
        changing evidence or journey meaning.
      basis: documented
    - id: shared-presentation
      kind: implementation
      path: apps/artifact-plane/src/style.css
      requires: Share native dropdown appearance and scoped inspector rhythm.
      basis: static
    - id: presentation-checks
      kind: test
      path: apps/artifact-plane/test/browser/presentation.spec.js
      requires: Check measured gaps, native dropdown styles, keyboard access and
        completion feedback.
      basis: static
    - id: completion-feedback
      kind: implementation
      path: apps/artifact-plane/src/UnitsOfWork.jsx
      requires: Keep one unloaded summary and preserve distinct reasons.
      basis: static
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-and-comparison.md
      requires: Select comparison context and interpret evidence without inferring
        approval or publication.
      basis: documented
  gaps:
    - Recorded passing assertions are not independently executed tests; missing
      merge evidence stays unresolved.
    - The evidence-and-usability extension is specified; implementation and
      current integrated validation remain pending.
  exclusions:
    - Creating unit members from shared flow participation.
  artifact: artifact-plane
---

# Inspect a unit of work and delivery evidence

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

The approved search/readability change has tracked implementation and browser support. Static support identifies source responsibility; validation in the originating tasks does not prove exhaustive behavior or publication.

## Simpler exploration

Read the brief first and automatically request completion only for the selected active unit. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.
