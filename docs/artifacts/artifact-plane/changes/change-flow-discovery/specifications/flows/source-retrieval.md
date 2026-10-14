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
    - id: discover
      title: Find ranked flow candidates and expand explicit impact
      supports:
        - flow-contract
    - id: authorize
      title: Resolve a source ID inside the selected context
      supports:
        - flow-reader
        - query
    - id: read
      title: Read contained UTF-8 knowledge or tracked code/test support
      supports:
        - flow-reader
    - id: freshness
      title: Validate source bytes and disclose stale or partial results
      supports:
        - query
        - flow-contract
    - id: return
      title: Return bounded excerpts and full source pointers
      supports:
        - flow-contract
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
