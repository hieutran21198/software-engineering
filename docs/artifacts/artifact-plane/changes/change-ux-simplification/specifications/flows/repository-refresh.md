---
flow:
  id: repository-refresh
  title: Refresh repository knowledge after changes
  trigger: Knowledge, relevant references, protected refs or registered worktrees
    change, or a person requests Refresh.
  outcome: The active project reloads fresh context while stale or cancelled
    results cannot overwrite another selection.
  entry_steps:
    - observe
  steps:
    - id: observe
      title: Observe shared repository fingerprints
      supports:
        - ux-simplification-contract
        - events
    - id: notify
      title: Coalesce changes into a local SSE notification
      supports:
        - events
    - id: reload
      title: Queue the active project refresh
      supports:
        - reload
    - id: invalidate
      title: Invalidate affected flow records and source evidence
      supports:
        - flow-contract
    - id: apply
      title: Apply only the current project generation
      supports:
        - explorer
        - reload-tests
  transitions:
    - from: observe
      to: notify
      condition: The repository fingerprint changes.
    - from: notify
      to: reload
    - from: reload
      to: invalidate
    - from: invalidate
      to: apply
      condition: Current context reload completed.
    - from: apply
      to: observe
      condition: Continue observing until the last client leaves.
  support:
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Refresh the active source and selected reads without stale-context replies or false empty evidence.
      basis: documented
    - id: events
      kind: implementation
      path: apps/artifact-plane/server/repository-events.js
      symbol: repositoryService
      requires: Share bounded observation, debouncing and connection cleanup.
      basis: static
    - id: reload
      kind: implementation
      path: apps/artifact-plane/src/reload.js
      symbol: refreshQueue
      requires: Coalesce loads and abort cancelled project work.
      basis: static
    - id: explorer
      kind: implementation
      path: apps/artifact-plane/src/main.jsx
      requires: Reject results from stale generations and inactive contexts.
      basis: static
    - id: reload-tests
      kind: test
      path: apps/artifact-plane/test/repository-events.test.js
      requires: Exercise fingerprint changes, SSE and observer lifecycle.
      basis: static
    - id: flow-contract
      kind: element
      artifact: artifact-plane
      element: specifications/flows.md
      requires: Describe source-backed flow queries without adding authorization or
        workflow state.
      basis: documented
  gaps:
    - Referenced implementation/test observation must be registered by a flow
      retrieval context; unreferenced code changes are outside the map.
  exclusions:
    - Recursively indexing every implementation file on every refresh.
  artifact: artifact-plane
---

# Refresh repository knowledge after changes

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Simpler exploration

Refresh the active source and selected reads without stale-context replies or false empty evidence. The detailed contract owns behavior and recovery limits. This is documented preparatory behavior; validation evidence is pending approved implementation.
