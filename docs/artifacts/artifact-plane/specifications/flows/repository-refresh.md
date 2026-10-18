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
        - ux-browser-checks
        - events
        - evidence-usability-contract
        - hidden-tab-contract
        - explorer
        - hidden-tab-checks
    - id: notify
      title: Coalesce changes into a local SSE notification
      supports:
        - events
        - evidence-usability-contract
    - id: reload
      title: Queue the active project refresh
      supports:
        - reload
        - evidence-usability-contract
    - id: invalidate
      title: Invalidate affected flow records and source evidence
      supports:
        - flow-contract
        - evidence-usability-contract
        - layout-reading
    - id: apply
      title: Apply only the current project generation
      supports:
        - authoring-contract
        - explorer
        - reload-tests
        - evidence-usability-contract
        - document-page
        - document-tests
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
    - id: authoring-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the work-centered shell, editable pages and journeys that this journey now serves.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/lazy-reload.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Refresh the active source and selected reads without stale-context
        replies or false empty evidence.
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
      requires: Reject results from stale generations and inactive contexts, and
        observe only while the project is active and the browser tab is visible.
      basis: static
    - id: hidden-tab-contract
      kind: element
      artifact: artifact-plane
      element: specifications/project-tabs.md
      requires: Close both event streams in a hidden browser tab and reconcile
        evidence when the tab is visible again.
      basis: documented
    - id: hidden-tab-checks
      kind: test
      path: apps/artifact-plane/test/browser/project-tabs.spec.js
      requires: Prove that reads in the visible tab answer while other tabs are
        hidden, and that a tab reconnects when it is visible again.
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
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/incremental-observation.md
      requires: Invalidate safe changed sources and periodically reconcile missed
        filesystem events.
      basis: documented
    - id: layout-reading
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-layout-reading.md
      requires: Invalidate in-place baselines and comparisons when the protected ref or working knowledge changes.
      basis: documented
    - id: document-page
      kind: implementation
      path: apps/artifact-plane/src/pages/DocumentPage.jsx
      requires: Keep unsaved editor text through a refresh and mark the document
        changed on disk.
      basis: static
    - id: document-tests
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Prove that a refresh keeps editor text.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
  gaps:
    - Referenced implementation/test observation must be registered by a flow
      retrieval context; unreferenced code changes are outside the map.
    - The evidence-and-usability extension is specified; implementation and
      current integrated validation remain pending.
  exclusions:
    - Recursively indexing every implementation file on every refresh.
  artifact: artifact-plane
---

# Refresh repository knowledge after changes

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Simpler exploration

Refresh the active source and selected reads without stale-context replies or false empty evidence. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.
