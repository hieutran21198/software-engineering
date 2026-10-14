---
flow:
  id: version-publication
  title: Publish resulting artifact knowledge
  trigger: An approved change passes its applicable task and integration checks.
  outcome: A complete proposed snapshot and retained delivery record become
    established only through required team review and merge.
  entry_steps:
    - validate
  steps:
    - id: validate
      title: Verify applicable DoD and dependency evidence
      supports:
        - validation-guidance
    - id: version
      title: Propose semantic version for user review
      supports:
        - validation-guidance
    - id: snapshot
      title: Prepare complete knowledge with delivery provenance
      supports:
        - retention-contract
    - id: review
      title: Push feature branch and open linked PRs
      supports:
        - knowledge
    - id: establish
      title: Wait for required team review and merge
      supports:
        - knowledge
    - id: shared
      title: Reassess shared outcome and release eligible downstream work
      supports:
        - unit-flow
  transitions:
    - from: validate
      to: version
      condition: All applicable checks passed.
    - from: version
      to: snapshot
      condition: The version selection is confirmed or explicitly proposed for review.
    - from: snapshot
      to: review
      condition: Root, knowledge snapshot, provenance and DAG are consistent.
    - from: review
      to: establish
      condition: PRs are available for team review.
    - from: establish
      to: shared
      condition: All required knowledge/code and originating delivery evidence land on
        main/master.
  support:
    - id: validation-guidance
      kind: implementation
      path: docs/artifact-driven/02-methodology/validation.md
      requires: Apply validation and version review within existing phase boundaries.
      basis: documented
    - id: retention-contract
      kind: element
      artifact: artifact-driven
      element: specifications/task-retention.md
      requires: New versions exclude task copies and identify source_change and
        delivery_tasks.
      basis: documented
    - id: knowledge
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge.md
      requires: Prepare PRs; stop for team review and required merges.
      basis: documented
    - id: unit-flow
      kind: flow
      artifact: artifact-driven
      flow: unit-validation
      requires: Assess the complete shared outcome from delivered member evidence.
      basis: documented
  gaps:
    - A proposed snapshot or PR alone does not establish the version.
  exclusions:
    - Automatic merging, deployment, release tagging and deleting referenced
      delivery records.
  artifact: artifact-driven
---

# Publish resulting artifact knowledge

## Coverage and evidence

This record describes the named repository journey from the linked knowledge and static sources. It is not a live runtime trace. Branch conditions describe documented behavior; evidence gaps and exclusions remain in the structured record. The delivery task records checks of this inventory.
