---
flow:
  id: source-retrieval
  title: Retrieve source-backed knowledge context
  trigger: A person or agent requests relevant knowledge or a source referenced by
    a selected flow.
  outcome: Only scoped safe source content is returned with revision, freshness,
    completeness and omission information.
  entry_steps:
    - context
  steps:
    - id: context
      title: Select the repository, worktree and knowledge context
      supports:
        - reading-controls-browser
        - reading-controls-contract
        - ux-simplification-contract
        - ux-browser-checks
        - query
        - flow-reader
        - http
        - mcp
        - search-label-contract
        - named-scope-index
        - named-scope-adapters
        - flow-search-controls
        - search-browser-checks
    - id: discover
      title: Filter named flows, discover behavior or expand explicit participation
      supports:
        - model-install
        - app-release-contract
        - impact-contract
        - flow-contract
        - index
        - named-scope-index
        - named-scope-adapters
        - flow-search-controls
        - search-browser-checks
        - concept-contract
        - concept-operations
        - concept-mcp-checks
    - id: authorize
      title: Resolve a source ID inside the selected context
      supports:
        - flow-reader
        - query
        - index
    - id: read
      title: Read contained UTF-8 knowledge or tracked code/test support
      supports:
        - authoring-contract
        - flow-reader
        - reader-tests
        - document-page
        - document-tests
        - diagram-rendering-contract
        - diagram-renderer
        - diagram-browser
    - id: freshness
      title: Validate source bytes and disclose stale or partial results
      supports:
        - query
        - flow-contract
        - index
    - id: return
      title: Return bounded excerpts and full source pointers
      supports:
        - authoring-contract
        - flow-contract
        - index
        - adapters-tests
        - evidence-review-contract
        - ranking-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
  transitions:
    - from: context
      to: discover
      condition: Title, behavior or explicit participation discovery requested.
    - from: context
      to: authorize
      condition: A known scoped source is requested.
    - from: discover
      to: authorize
      condition: The caller selects a returned source pointer.
    - from: authorize
      to: read
      condition: The source is safe, readable and inside the selected flow context.
    - from: read
      to: freshness
    - from: freshness
      to: return
  support:
    - id: model-install
      kind: implementation
      path: apps/artifact-plane/server/flow-model-install.js
      symbol: installFlowModel
      requires: Install and verify the pinned semantic model from the source
        script and the executable.
      basis: static
    - id: app-release-contract
      kind: element
      artifact: artifact-plane
      element: specifications/app-release.md
      requires: Release the Plane as one executable for each target with a
        command line, a payload cache and a plane-v release.
      basis: documented
    - id: impact-contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-impact.md
      requires: Apply the discovery score cutoff and delegate the impact operation to the impact service without changing its result shape.
      basis: documented
    - id: authoring-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the work-centered shell, editable pages and journeys that this journey now serves.
      basis: documented
    - id: reading-controls-browser
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Check visible heading hierarchy, bounded navigation geometry and inert highlighted code.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: reading-controls-contract
      kind: element
      artifact: artifact-plane
      element: specifications/reading-controls.md
      requires: Show larger headings, adjustable navigation and inert highlighted source code.
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
      requires: Open exact allowed sources directly with contained local links and a scoped return path.
      basis: documented
    - id: query
      kind: implementation
      path: apps/artifact-plane/server/repository-query.js
      symbol: queryRepository
      requires: Restrict existing knowledge reads to scoped contexts and recheck
        changed inputs.
      basis: static
    - id: flow-reader
      kind: implementation
      path: apps/artifact-plane/server/flow-reader.js
      symbol: readFlowSource
      requires: Restrict code/test support to tracked safe text sources with
        fingerprints.
      basis: static
    - id: reader-tests
      kind: test
      path: apps/artifact-plane/test/flows.test.js
      requires: Exercise flow source guards, content changes and escaping symlinks.
      basis: static
    - id: flow-contract
      kind: element
      artifact: artifact-plane
      element: specifications/flows.md
      requires: Describe source-backed flow queries without adding authorization or
        workflow state.
      basis: documented
    - id: index
      kind: implementation
      path: apps/artifact-plane/server/flow-index.js
      symbol: createFlowService
      requires: Rank local candidates, traverse explicit consumers and page safe
        registered sources with revision validation.
      basis: static
    - id: http
      kind: implementation
      path: apps/artifact-plane/server/http.js
      symbol: createAppServer
      requires: Apply local host/origin and bounded request guards to the shared flow
        service.
      basis: static
    - id: mcp
      kind: implementation
      path: apps/artifact-plane/server/flow-mcp.js
      symbol: createFlowMcpServer
      requires: Expose four read-only tools using the same context and diagnostics as
        HTTP.
      basis: static
    - id: adapters-tests
      kind: test
      path: apps/artifact-plane/test/flow-adapters.test.js
      requires: Check adapter parity, stdio framing, root isolation, pagination,
        repeated edits and unchanged repository bytes.
      basis: static
    - id: evidence-review-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-correctness.md
      requires: Keep exact/relevance-first search and source-backed review context
        bounded and revision-safe.
      basis: documented
    - id: ranking-checks
      kind: test
      path: apps/artifact-plane/test/flow-index.test.js
      requires: Verify exact/relevance ordering before paging and offline
        installed-model retrieval.
      basis: static
    - id: search-label-contract
      kind: element
      artifact: artifact-plane
      element: specifications/search-label-usability.md
      requires: Define named filtering, explicit discovery and readable labelled graph
        presentation without changing graph meaning.
      basis: documented
    - id: named-scope-index
      kind: implementation
      path: apps/artifact-plane/server/flow-index.js
      requires: Filter complete title metadata and explicit artifact participation
        before ranking and paging.
      basis: static
    - id: named-scope-adapters
      kind: test
      path: apps/artifact-plane/test/flow-adapters.test.js
      requires: Verify HTTP/MCP selector parity, scoped cursors and unchanged
        inspected sources.
      basis: static
    - id: flow-search-controls
      kind: implementation
      path: apps/artifact-plane/src/pages/DiscoverPage.jsx
      requires: Submit a behavior search and open the matching flow.
      basis: static
    - id: search-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/discovery-recorded.spec.js
      requires: Verify complete named matches, cross-owner participation, contextual
        entry and delayed replies.
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
    - id: document-page
      kind: implementation
      path: apps/artifact-plane/src/pages/DocumentPage.jsx
      requires: Read and edit a document with contained links on one page.
      basis: static
    - id: document-tests
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Prove document reading and editing in the browser.
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
      requires: Define the concepts and concept operations, get_concept and the kinds input of search_flows.
      basis: documented
    - id: concept-operations
      kind: implementation
      path: apps/artifact-plane/server/concepts.js
      requires: Answer the concepts and concept operations from the flow record.
      basis: static
    - id: concept-mcp-checks
      kind: test
      path: apps/artifact-plane/test/flow-adapters.test.js
      requires: Check get_concept, search_flows with kinds and the 1.24.0 answer without kinds.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/03-concept-mcp.md
  gaps:
    - Retrieval ranks candidates; it does not prove compatibility or complete
      system discovery.
  exclusions:
    - Arbitrary paths, credential files, hosted embedding calls and inferred
      approval.
  artifact: artifact-plane
---

# Retrieve source-backed knowledge context

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Evidence presentation

The flow explorer shows compact evidence status and expandable diagnostic and shortened-source details. Optional semantic-model failure leaves keyword and graph discovery available.

The explorer uses a lazy flow list with newest-first browsing and complete title/ID filtering or explicitly submitted behavior discovery in the sidebar, a selected graph in the center, and matching evidence/source details in the right inspector. Shared knowledge controls and per-project selections remain consistent across view switches. Creation dates describe the selected document record and are unknown when Git history cannot prove them.

The approved search/readability change has tracked implementation and browser support. Static support identifies source responsibility; validation in the originating tasks does not prove exhaustive behavior or publication.

## Simpler exploration

Open exact allowed sources directly with contained local links and a scoped return path. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.

## Requested reading controls

The reading-controls contract adds heading hierarchy, a bounded accessible sidebar divider and local syntax colors. Executed reading-control browser checks and their source-preservation limits are recorded in the originating validation task. Observed fixture support does not prove exhaustive usability or establish the proposal.
