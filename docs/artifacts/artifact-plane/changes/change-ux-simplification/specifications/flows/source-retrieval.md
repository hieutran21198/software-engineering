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
        - flow-contract
        - index
        - named-scope-index
        - named-scope-adapters
        - flow-search-controls
        - search-browser-checks
    - id: authorize
      title: Resolve a source ID inside the selected context
      supports:
        - flow-reader
        - query
        - index
    - id: read
      title: Read contained UTF-8 knowledge or tracked code/test support
      supports:
        - flow-reader
        - reader-tests
    - id: freshness
      title: Validate source bytes and disclose stale or partial results
      supports:
        - query
        - flow-contract
        - index
    - id: return
      title: Return bounded excerpts and full source pointers
      supports:
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
    - id: reading-controls-contract
      kind: element
      artifact: artifact-plane
      element: specifications/reading-controls.md
      requires: Show larger headings, adjustable navigation and inert highlighted source code.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/ux-simplification.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-ux-simplification/tasks/07-integration-publication.md
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
      path: apps/artifact-plane/src/Flows.jsx
      requires: Select artifact scope and title filtering or explicitly submitted
        behavior discovery.
      basis: static
    - id: search-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/search-usability.spec.js
      requires: Verify complete named matches, cross-owner participation, contextual
        entry and delayed replies.
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

The reading-controls contract adds heading hierarchy, a bounded accessible sidebar divider and local syntax colors. This extension has documented support only; existing observed checks cover the prior behavior. Fresh task evidence is required before treating these additions as observed.
