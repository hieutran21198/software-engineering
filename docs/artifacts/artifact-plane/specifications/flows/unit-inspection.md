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
        - human-guidance-contract
        - status-vocabulary
        - human-guidance-browser
        - authoring-contract
        - ux-simplification-contract
        - ux-browser-checks
        - units
        - search-label-contract
        - shared-search-field
        - search-browser-checks
        - evidence-usability-contract
        - unit-page
        - change-unit-tests
    - id: resolve
      title: Resolve delivered versions and exact originating plans
      supports:
        - units
        - evidence-usability-contract
        - layout-reading
    - id: graph
      title: Project existing artifact/task prerequisites
      supports:
        - graphs
        - evidence-usability-contract
    - id: criteria
      title: Inspect shared criteria and evidence
      supports:
        - authoring-contract
        - units
        - unit-tests
        - evidence-usability-contract
        - unit-page
        - change-unit-tests
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
        - unit-page
        - scenario-tests
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
    - id: human-guidance-contract
      kind: element
      artifact: artifact-plane
      element: specifications/human-guidance.md
      requires: Show the status and next step of each change, version labels,
        one status vocabulary, the control grammar and the glossary.
      basis: documented
    - id: status-vocabulary
      kind: implementation
      path: apps/artifact-plane/src/glossary.js
      requires: Hold the status families, kinds, differences and glossary terms
        that every page uses.
      basis: static
    - id: human-guidance-browser
      kind: test
      path: apps/artifact-plane/test/browser/human-guidance.spec.js
      requires: Prove statuses, version labels, the stepper rule, named counts,
        glossary terms, control styles and status badges on the pages.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md
    - id: authoring-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the work-centered shell, editable pages and journeys that this journey now serves.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/unit-page.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
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
      path: apps/artifact-plane/test/browser/discovery-recorded.spec.js
      requires: Exercise live unit filtering, clear and consistent flow controls.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present page blocks and native controls consistently without changing evidence or journey meaning.
      basis: documented
    - id: shared-presentation
      kind: implementation
      path: apps/artifact-plane/src/styles.css
      requires: Share one set of tokens, controls and page rhythm.
      basis: static
    - id: presentation-checks
      kind: test
      path: apps/artifact-plane/test/browser/layout.spec.js
      requires: Check one title, one navigation, unique control names and no horizontal overflow on every page.
      basis: static
    - id: completion-feedback
      kind: implementation
      path: apps/artifact-plane/src/pages/UnitPage.jsx
      requires: Keep one unloaded summary and preserve distinct reasons.
      basis: static
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-and-comparison.md
      requires: Select comparison context and interpret evidence without inferring
        approval or publication.
      basis: documented
    - id: layout-reading
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-layout-reading.md
      requires: Resolve in-place version records and their introducing commits for member delivery.
      basis: documented
    - id: unit-page
      kind: implementation
      path: apps/artifact-plane/src/pages/UnitPage.jsx
      requires: Edit members, criteria, evidence and affected flows and name a missing
        publication review.
      basis: static
    - id: change-unit-tests
      kind: test
      path: apps/artifact-plane/test/browser/unit-page.spec.js
      requires: Prove unit editing in the browser.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: scenario-tests
      kind: test
      path: apps/artifact-plane/test/browser/authoring-scenarios.spec.js
      requires: Prove the missing publication review label and its action.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
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
