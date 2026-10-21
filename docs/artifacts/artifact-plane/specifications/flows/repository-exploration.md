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
        - app-entry
        - app-smoke
        - app-release-contract
        - authoring-contract
        - reading-controls-browser
        - reading-controls-contract
        - ux-simplification-contract
        - ux-browser-checks
        - explorer
        - search-label-contract
        - evidence-usability-contract
        - navigation-tree
        - workbench-shell-tests
    - id: validate
      title: Resolve a readable Git root and ADD directory
      supports:
        - reader
        - evidence-usability-contract
    - id: scan
      title: Read artifact roots, knowledge selectors and references
      supports:
        - reader
        - evidence-usability-contract
        - model-presentation
        - layout-reading
      interactions:
        - from: snapshot
          to: artifact
          action: Read artifact identity
          outcome: The snapshot identifies owned knowledge and declared dependencies.
          supports:
            - model-presentation
    - id: overview
      title: Load metadata first and scoped details on demand
      supports:
        - human-guidance-contract
        - guidance-pages
        - human-guidance-browser
        - explore-response
        - explore-response-tests
        - query
        - measured-edge-labels
        - label-placement
        - label-browser-checks
        - evidence-usability-contract
        - model-presentation
        - work-page
        - workbench-shell-tests
        - concept-contract
        - concept-links
        - concept-search-tests
        - concept-row-checks
      interactions:
        - from: snapshot
          to: version
          action: Select declared version knowledge
          outcome: The snapshot exposes its selected knowledge and unresolved publication
            evidence.
          supports:
            - model-presentation
    - id: flows
      title: Discover named flows and supporting owners
      supports:
        - flow-contract
        - measured-edge-labels
        - label-placement
        - label-browser-checks
        - evidence-usability-contract
    - id: inspect
      title: Inspect selected knowledge and diagnostics
      supports:
        - authoring-contract
        - explorer
        - reader-tests
        - evidence-review-contract
        - measured-edge-labels
        - label-browser-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
        - evidence-usability-contract
        - model-presentation
        - layout-reading
        - diagram-rendering-contract
        - diagram-renderer
        - diagram-browser
        - concept-contract
        - concept-page
        - concept-links
        - concept-page-browser
        - page-links-browser
        - history-browser
      interactions:
        - from: snapshot
          to: change
          action: Inspect proposed knowledge and delivery evidence
          outcome: The reader can inspect the selected change without inferring work
            authorization.
          supports:
            - model-presentation
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
    - id: app-entry
      kind: implementation
      path: apps/artifact-plane/server/app.js
      requires: Start the server, the stdio MCP server or the model install from
        the executable or the source entry.
      basis: static
    - id: app-smoke
      kind: test
      path: apps/artifact-plane/scripts/app-smoke.mjs
      requires: Start each built executable and prove that it serves the
        application, opens a repository and lists the MCP tools.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/06-app-build.md
    - id: app-release-contract
      kind: element
      artifact: artifact-plane
      element: specifications/app-release.md
      requires: Release the Plane as one executable for each target with a
        command line, a payload cache and a plane-v release.
      basis: documented
    - id: human-guidance-contract
      kind: element
      artifact: artifact-plane
      element: specifications/human-guidance.md
      requires: Show the status and next step of each change, version labels,
        one status vocabulary, the control grammar and the glossary.
      basis: documented
    - id: guidance-pages
      kind: implementation
      path: apps/artifact-plane/src/pages/guidance.jsx
      requires: Status names, version labels, glossary terms and section links
        for the pages.
      basis: static
    - id: human-guidance-browser
      kind: test
      path: apps/artifact-plane/test/browser/human-guidance.spec.js
      requires: Prove statuses, version labels, the stepper rule, named counts,
        glossary terms, control styles and status badges on the pages.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md
    - id: explore-response
      kind: implementation
      path: apps/artifact-plane/server/explore-response.js
      symbol: exploreResponse
      requires: Omit on-demand unit data from the explore response so that a
        repository with many worktrees can be opened.
      basis: static
    - id: explore-response-tests
      kind: test
      path: apps/artifact-plane/test/explore-response.test.js
      requires: Prove a 200 response and bounded growth with 12 worktrees.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/09-explore-scale.md
    - id: authoring-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the work-centered shell, editable pages and journeys that this journey now serves.
      basis: documented
    - id: reading-controls-browser
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Check visible heading hierarchy, bounded navigation geometry and inert
        highlighted code.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: reading-controls-contract
      kind: element
      artifact: artifact-plane
      element: specifications/reading-controls.md
      requires: Show larger headings, adjustable navigation and inert highlighted
        source code.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/worktrees-links.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Switch complete worktree context and inspect purpose-first knowledge
        with independent graph disclosure.
      basis: documented
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
      path: apps/artifact-plane/test/browser/flow-page.spec.js
      requires: Check actual long, loop, reverse and parallel geometry at 1440 and 700
        widths.
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
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-and-comparison.md
      requires: Select comparison context and interpret evidence without inferring
        approval or publication.
      basis: documented
    - id: model-presentation
      kind: element
      artifact: artifact-plane
      element: specifications/model-explanations.md
      requires: Explain owned models and evidence-linked interactions in this journey.
      basis: documented
    - id: layout-reading
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-layout-reading.md
      requires: Detect each artifact layout and read in-place identity, change and version records from front matter only.
      basis: documented
    - id: navigation-tree
      kind: implementation
      path: apps/artifact-plane/src/Sidebar.jsx
      requires: One sidebar for current work and artifacts with search, keys and History.
      basis: static
    - id: work-page
      kind: implementation
      path: apps/artifact-plane/src/pages/WorkPage.jsx
      requires: Show branch state, open changes with phase chips, units and
        uncommitted knowledge.
      basis: static
    - id: workbench-shell-tests
      kind: test
      path: apps/artifact-plane/test/browser/shell.spec.js
      requires: Prove the sidebar, the branch menu, the drawer and the widths.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: diagram-renderer
      kind: implementation
      path: apps/artifact-plane/src/diagram-render.js
      symbol: renderDiagrams
      requires: Render the diagram blocks of a Markdown container as sanitized SVG
        and add the fallback note when a block does not render.
      basis: static
    - id: diagram-browser
      kind: test
      path: apps/artifact-plane/test/browser/diagram-rendering.spec.js
      requires: Check rendering, fallback notes, sanitizing, local loading and
        width at 1440 and 390 pixels.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/01-renderer.md
    - id: diagram-rendering-contract
      kind: element
      artifact: artifact-plane
      element: specifications/diagram-rendering.md
      requires: Render fenced Mermaid blocks of knowledge as sanitized SVG with
        bundled code, and keep the code panel when a block does not render.
      basis: documented
    - id: concept-contract
      kind: element
      artifact: artifact-plane
      element: specifications/concept-pages.md
      requires: Define the concept page, the concept links of existing pages, the sidebar concept rows and browser Back.
      basis: documented
    - id: concept-links
      kind: implementation
      path: apps/artifact-plane/src/pages/ConceptLinks.jsx
      requires: Load the concepts of an artifact and link names to their concept pages.
      basis: static
    - id: concept-page
      kind: implementation
      path: apps/artifact-plane/src/pages/ConceptPage.jsx
      requires: Show one concept with its documents, flows, inferred code and tests, branch changes and diagnostics.
      basis: static
    - id: concept-row-checks
      kind: test
      path: apps/artifact-plane/test/change-status.test.js
      requires: Check the concept rows of the sidebar filter and their place under each artifact.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/09-sidebar-search.md
    - id: concept-search-tests
      kind: test
      path: apps/artifact-plane/test/browser/shell.spec.js
      requires: Find a concept in the sidebar search, open Discover from it and focus the search with the / key at 1440 and 390 pixels.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/09-sidebar-search.md
    - id: concept-page-browser
      kind: test
      path: apps/artifact-plane/test/browser/concept-page.spec.js
      requires: Check the concept page order, wording, rows, sections and layout at 1440 and 390 pixels.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/05-concept-page.md
    - id: page-links-browser
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Check the artifact Concepts section and the document Concepts property, and their absence without models.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/06-page-links.md
    - id: history-browser
      kind: test
      path: apps/artifact-plane/test/browser/history.spec.js
      requires: Check that browser Back moves the active tab one page back and restores the Discover query and the open brief rows.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/04-browser-back.md
  gaps:
    - The flow documents discovery behavior, not complete knowledge coverage or
      artifact establishment.
    - New contextual review navigation is specified but not implemented or
      browser-validated yet.
    - The evidence-and-usability extension is specified; implementation and
      current integrated validation remain pending.
  exclusions:
    - Arbitrary filesystem browsing and automatic repository edits.
  artifact: artifact-plane
  participants:
    - id: snapshot
      artifact: artifact-plane
      model: repository-snapshot
      requires: Represent selected repository knowledge.
    - id: artifact
      artifact: artifact-driven
      model: artifact
      requires: Supply artifact identity and owned knowledge.
    - id: change
      artifact: artifact-driven
      model: change
      requires: Supply proposed knowledge and retained delivery evidence.
    - id: version
      artifact: artifact-driven
      model: version
      requires: Supply complete version knowledge and provenance.
---

# Explore a local ADD repository

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Evidence presentation

The flow explorer shows compact evidence status and expandable diagnostic and shortened-source details. Optional semantic-model failure leaves keyword and graph discovery available.

The explorer uses a lazy flow list with newest-first browsing and exact/relevance-first nonempty search in the sidebar, a selected graph in the center, and matching evidence/source details in the right inspector. Shared knowledge controls and per-project selections remain consistent across view switches. Creation dates describe the selected document record and are unknown when Git history cannot prove them.

The approved search/readability change has tracked implementation and browser support. Static support identifies source responsibility; validation in the originating tasks does not prove exhaustive behavior or publication.

## Simpler exploration

Switch complete worktree context and inspect purpose-first knowledge with independent graph disclosure. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.

## Requested reading controls

The reading-controls contract adds heading hierarchy, a bounded accessible sidebar divider and local syntax colors. Executed reading-control browser checks and their source-preservation limits are recorded in the originating validation task. Observed fixture support does not prove exhaustive usability or establish the proposal.
