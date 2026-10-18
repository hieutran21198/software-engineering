---
flow:
  id: change-impact
  artifact: artifact-plane
  title: Explain what a change affects
  trigger: A person or an agent selects a change, a document, a flow step, a
    commit or a branch difference and asks what it affects.
  outcome: A tiered, explained and bounded answer names the affected knowledge,
    flows and steps, modules and tests, the tests to run, the places to look,
    the unresolved relationships and the coverage of the analysis.
  entry_steps:
    - select
  steps:
    - id: select
      title: Select the origins from a change, document, flow, commit or branch difference
      supports:
        - contract
        - add-contract
        - impact-page
        - entry-points
        - impact-browser
    - id: resolve
      title: Resolve changed entities, declarations, sections, renames and deletions
      supports:
        - contract
        - add-contract
        - impact-service
        - service-checks
    - id: propagate
      title: Propagate through typed declared and derived relationships within the depth
      supports:
        - contract
        - add-contract
        - impact-index
        - impact-service
        - index-checks
        - service-checks
        - benchmark
    - id: explain
      title: Rank the tiers and attach paths, evidence and the coverage statement
      supports:
        - contract
        - add-contract
        - impact-service
        - service-checks
        - benchmark
    - id: act
      title: Read the answer, expand one hop, open sources and run the verification list
      supports:
        - contract
        - impact-page
        - impact-canvas
        - entry-points
        - canvas-checks
        - impact-browser
        - layout-checks
    - id: handoff
      title: Return the compact context through HTTP, MCP or the packet
      supports:
        - contract
        - interfaces
        - mcp
        - packet
        - interface-checks
        - packet-checks
  transitions:
    - from: select
      to: resolve
    - from: resolve
      to: propagate
    - from: propagate
      to: explain
    - from: explain
      to: act
      condition: A person reads the answer in the Impact view.
    - from: explain
      to: handoff
      condition: An agent or the packet requests the answer.
    - from: act
      to: propagate
      condition: The person expands the depth by one hop or changes a filter.
    - from: act
      to: select
      condition: The person opens another origin from a path or a source.
  support:
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-impact.md
      requires: Define the index, the query, the interfaces, the Impact view and the validation of the answer.
      basis: documented
    - id: add-contract
      kind: element
      artifact: artifact-driven
      element: specifications/change-impact.md
      requires: Define the tiers, the propagation rule of each relationship type, the explanation record and the coverage statement.
      basis: documented
    - id: impact-index
      kind: implementation
      path: apps/artifact-plane/server/impact-index.js
      requires: Keep the derived import, declaration, package, embed, mirror, history and vocabulary relations incrementally in a private index.
      basis: static
    - id: impact-service
      kind: implementation
      path: apps/artifact-plane/server/impact.js
      requires: Resolve origins, propagate through typed relationships, and return tiers, explanations and coverage.
      basis: static
    - id: interfaces
      kind: implementation
      path: apps/artifact-plane/server/http.js
      requires: Serve POST /api/impact/query.
      basis: static
    - id: mcp
      kind: implementation
      path: apps/artifact-plane/server/flow-mcp.js
      requires: Expose get_change_impact and delegate get_impact_context to the impact service.
      basis: static
    - id: packet
      kind: implementation
      path: apps/artifact-plane/server/change-review.js
      requires: Add the tiered impact to review and packet replies.
      basis: static
    - id: impact-page
      kind: implementation
      path: apps/artifact-plane/src/pages/ImpactPage.jsx
      requires: Show tiers, filters, expansion, detail paths and the focused graph.
      basis: static
    - id: impact-canvas
      kind: implementation
      path: apps/artifact-plane/src/impact-canvas.js
      requires: Build the focused impact subgraph of at most 60 nodes.
      basis: static
    - id: entry-points
      kind: implementation
      path: apps/artifact-plane/src/flow-canvas.js
      requires: Highlight the affected steps of a flow opened from the Impact page.
      basis: static
    - id: benchmark
      kind: test
      path: apps/artifact-plane/scripts/impact-benchmark.mjs
      requires: Measure tiers, steps, negatives, unresolved items and timings on the nine ground-truth cases.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/02-impact-service.md
    - id: index-checks
      kind: test
      path: apps/artifact-plane/test/impact-index.test.js
      requires: Check incremental parsing, the derived relations and failed updates.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/01-impact-index.md
    - id: service-checks
      kind: test
      path: apps/artifact-plane/test/impact.test.js
      requires: Check one propagation rule per relationship type, origins, ranking, caps and the compact text.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/02-impact-service.md
    - id: interface-checks
      kind: test
      path: apps/artifact-plane/test/http.test.js
      requires: Check route validation and HTTP and MCP parity.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/03-interfaces.md
    - id: packet-checks
      kind: test
      path: apps/artifact-plane/test/change-review.test.js
      requires: Check the additive packet impact field.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/03-interfaces.md
    - id: canvas-checks
      kind: test
      path: apps/artifact-plane/test/impact-canvas.test.js
      requires: Check the focused subgraph and its grouping.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/04-impact-page.md
    - id: impact-browser
      kind: test
      path: apps/artifact-plane/test/browser/impact-page.spec.js
      requires: Exercise each entry point, the filters, expansion, detail paths, the graph and the flow highlight at 1440 and 390 pixels.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/07-browser-suites.md
    - id: layout-checks
      kind: test
      path: apps/artifact-plane/test/browser/layout.spec.js
      requires: Check one title, one navigation, unique control names and no overflow on the Impact page.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/07-browser-suites.md
  gaps:
    - Potential impact from history and vocabulary finds part of the hidden
      couplings only; the ground-truth cases record which.
    - The analysis never covers dynamic calls, injected functions or process
      boundaries; the coverage statement names them.
  exclusions:
    - Approval, establishment, repository writes and generated answers.
---

# Explain what a change affects

The journey starts from any origin a person or agent can name and ends with one bounded answer. Propagation follows the ADD change-impact contract; the Plane contract owns the index, the interfaces and the view. Expansion by one hop and origin changes loop back through propagation and selection, so a person explores progressively instead of reading the whole graph.

## Coverage and evidence

Implemented in Artifact Plane 1.18.0. Observed supports point to the task evidence of change-impact-intelligence; the nine ground-truth cases and their measurements are in the impact-service task evidence. The research prototype measurements in decisions/016-typed-impact-ledger.md motivated the design and are not delivery evidence.
