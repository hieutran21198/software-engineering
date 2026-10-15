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
        - query
        - flow-reader
        - http
        - mcp
    - id: discover
      title: Find ranked flow candidates and expand explicit impact
      supports:
        - flow-contract
        - index
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
  transitions:
    - from: context
      to: discover
      condition: Semantic, keyword or impact discovery requested.
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

The explorer uses a lazy flow list with newest-first browsing and exact/relevance-first nonempty search in the sidebar, a selected graph in the center, and matching evidence/source details in the right inspector. Shared knowledge controls and per-project selections remain consistent across view switches. Creation dates describe the selected document record and are unknown when Git history cannot prove them.
