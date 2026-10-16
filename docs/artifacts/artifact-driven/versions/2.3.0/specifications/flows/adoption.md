---
flow:
  id: adoption
  title: Adopt the ADD bundle
  trigger: A consumer requests the reusable ADD architecture.
  outcome: The selected workspace receives the complete bundle, a dry-run report,
    or an explicit conflict/error without overwriting consumer edits.
  entry_steps:
    - select
  steps:
    - id: select
      title: Select architecture, workspace and destination
      supports:
        - cli
    - id: preflight
      title: Validate paths and preflight all destination assets
      supports:
        - copy
    - id: preview
      title: Report dry-run counts without writing
      supports:
        - copy
        - copy-tests
    - id: copy
      title: Copy pending assets and retain identical files
      supports:
        - copy
        - copy-tests
    - id: conflict
      title: Report invalid inputs or conflicts; preserve consumer files
      supports:
        - copy
        - copy-tests
  transitions:
    - from: select
      to: preflight
      condition: The architecture is supported.
    - from: preflight
      to: preview
      condition: Dry-run requested and preflight passed.
    - from: preflight
      to: copy
      condition: Preflight passed and copying requested.
    - from: preflight
      to: conflict
      condition: A destination is unsafe, differs, or is not a regular file.
  support:
    - id: cli
      kind: implementation
      path: cmd/se-adopt/main.go
      symbol: run
      requires: Select the catalog entry and parse CLI inputs.
      basis: static
    - id: copy
      kind: implementation
      path: internal/adopt/adopt.go
      symbol: Copy
      requires: Preflight before copying; reject escaping paths and conflicts.
      basis: static
    - id: copy-tests
      kind: test
      path: internal/adopt/adopt_test.go
      requires: Exercise repeat, dry-run and consumer-conflict preservation.
      basis: static
  gaps:
    - Write-time failures attempt file rollback; this map does not prove
      transactionality or observe an actual consumer run.
  exclusions:
    - Consumer harness installation, project artifact creation and automatic
      upgrades.
  artifact: artifact-driven
---

# Adopt the ADD bundle

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
