---
flow:
  id: repository-exploration
  title: Explore a local ADD repository
  trigger: A person opens a configured repository or registered worktree.
  outcome: The explorer shows scoped artifact knowledge and diagnostics without
    editing repository files.
  entry_steps:
    - select
  steps:
    - id: select
      title: Select the project and worktree
      supports:
        - explorer
        - search-label-contract
    - id: validate
      title: Resolve a readable Git root and ADD directory
      supports:
        - reader
    - id: scan
      title: Read artifact roots, knowledge selectors and references
      supports:
        - reader
    - id: overview
      title: Load metadata first and scoped details on demand
      supports:
        - query
        - measured-edge-labels
        - label-placement
        - label-browser-checks
    - id: flows
      title: Discover named flows and supporting owners
      supports:
        - flow-contract
        - measured-edge-labels
        - label-placement
        - label-browser-checks
    - id: inspect
      title: Inspect selected knowledge and diagnostics
      supports:
        - explorer
        - reader-tests
        - evidence-review-contract
        - measured-edge-labels
        - label-browser-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
  transitions:
    - from: select
      to: validate
    - from: validate
      to: scan
      condition: The selected root is readable and contains ADD knowledge.
    - from: scan
      to: overview
    - from: overview
      to: inspect
      condition: Artifact/dependency inspection selected.
    - from: overview
      to: flows
      condition: Flow inspection selected.
    - from: flows
      to: inspect
      condition: Relevant knowledge is selected.
  support:
    - id: explorer
      kind: implementation
      path: apps/artifact-plane/src/main.jsx
      requires: Provide project-scoped repository opening and inspection.
      basis: static
    - id: reader
      kind: implementation
      path: apps/artifact-plane/server/reader.js
      symbol: scanRepository
      requires: Read contained knowledge and Git metadata.
      basis: static
    - id: query
      kind: implementation
      path: apps/artifact-plane/server/repository-query.js
      symbol: queryRepository
      requires: Load scoped sections with revision/completeness information.
      basis: static
    - id: reader-tests
      kind: test
      path: apps/artifact-plane/test/reader.test.js
      requires: Exercise containment, refresh and byte-preserving reads.
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
      element: specifications/change-review.md
      requires: Open selected-change review without losing artifact and delivery
        navigation.
      basis: documented
    - id: search-label-contract
      kind: element
      artifact: artifact-plane
      element: specifications/search-label-usability.md
      requires: Define named filtering, explicit discovery and readable labelled graph
        presentation without changing graph meaning.
      basis: documented
    - id: measured-edge-labels
      kind: implementation
      path: apps/artifact-plane/src/GraphLabels.jsx
      requires: Measure rendered node and edge-label bounds with accessible
        clear-space disclosure.
      basis: static
    - id: label-placement
      kind: implementation
      path: apps/artifact-plane/src/label-placement.js
      requires: Place displaced labels deterministically outside cards and other labels.
      basis: static
    - id: label-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/edge-labels.spec.js
      requires: Check actual long, loop, reverse and parallel geometry at 1440 and 700
        widths.
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
  gaps:
    - The flow documents discovery behavior, not complete knowledge coverage or
      artifact establishment.
    - New contextual review navigation is specified but not implemented or
      browser-validated yet.
  exclusions:
    - Arbitrary filesystem browsing and automatic repository edits.
  artifact: artifact-plane
---

# Explore a local ADD repository

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Evidence presentation

The flow explorer shows compact evidence status and expandable diagnostic and shortened-source details. Optional semantic-model failure leaves keyword and graph discovery available.

The explorer uses a lazy flow list with newest-first browsing and exact/relevance-first nonempty search in the sidebar, a selected graph in the center, and matching evidence/source details in the right inspector. Shared knowledge controls and per-project selections remain consistent across view switches. Creation dates describe the selected document record and are unknown when Git history cannot prove them.

The approved search/readability change has tracked implementation and browser support. Static support identifies source responsibility; validation in the originating tasks does not prove exhaustive behavior or publication.
