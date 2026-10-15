---
flow:
  id: project-tabs
  title: Switch independent project workspaces
  trigger: A person opens, selects, closes or restores a project tab.
  outcome: Project navigation stays independent and browser preferences contain
    only paths, order and active selection.
  entry_steps:
    - restore
  steps:
    - id: restore
      title: Validate and restore project preferences
      supports:
        - ux-simplification-contract
        - preferences
    - id: open
      title: Create or select a canonical project tab
      supports:
        - workspace
    - id: select
      title: Activate one explorer and pause inactive work
      supports:
        - workspace
    - id: navigate
      title: Maintain project-scoped graph and inspector state
      supports:
        - workspace
    - id: close
      title: Release the closed explorer and select a survivor
      supports:
        - preferences
        - workspace
        - tab-tests
  transitions:
    - from: restore
      to: open
    - from: open
      to: select
    - from: select
      to: navigate
    - from: navigate
      to: select
      condition: A different existing tab is chosen.
    - from: navigate
      to: close
      condition: The project is closed.
    - from: close
      to: open
      condition: No project remains or a new one is requested.
  support:
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Disambiguate equal project names while preserving canonical project identity and active worktree isolation.
      basis: documented
    - id: preferences
      kind: implementation
      path: apps/artifact-plane/src/project-tabs.js
      symbol: readWorkspace
      requires: Validate preference data and preserve a usable fallback.
      basis: static
    - id: workspace
      kind: implementation
      path: apps/artifact-plane/src/Workspace.jsx
      requires: Own stable tab instances, duplicate selection and lifecycle isolation.
      basis: static
    - id: tab-tests
      kind: test
      path: apps/artifact-plane/test/project-tabs.test.js
      requires: Exercise preference validation and close selection.
      basis: static
  gaps:
    - Browser persistence is a preference store, not repository evidence or a
      workflow registry.
  exclusions:
    - Persisting graph snapshots, approval or execution state in browser
      preferences.
  artifact: artifact-plane
---

# Switch independent project workspaces

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Simpler exploration

Disambiguate equal project names while preserving canonical project identity and active worktree isolation. The detailed contract owns behavior and recovery limits. This is documented preparatory behavior; validation evidence is pending approved implementation.
