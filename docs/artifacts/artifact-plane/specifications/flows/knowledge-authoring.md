---
flow:
  id: knowledge-authoring
  artifact: artifact-plane
  title: Author ADD knowledge in the Plane
  trigger: A person starts or resumes work on an artifact in a selected worktree.
  outcome: The repository contains valid, consistently derived ADD records that
    Git shows as proposed changes on a non-protected branch, ready for a phase
    commit, version preparation or team review.
  entry_steps:
    - select-work
  steps:
    - id: select-work
      title: Choose current work or start a change
      supports:
        - workbench-contract
        - editing-contract
    - id: guard-branch
      title: Confirm a non-protected branch in the selected worktree
      supports:
        - editing-contract
    - id: edit
      title: Edit a document body or apply a domain operation
      supports:
        - workbench-contract
        - editing-contract
    - id: validate
      title: Validate the post-image with the readers and preview the files
      supports:
        - editing-contract
        - layout-contract
    - id: write
      title: Write atomically with digests and a journal entry
      supports:
        - editing-contract
    - id: review
      title: Review changed knowledge, diagnostics and readiness
      supports:
        - workbench-contract
        - review-contract
    - id: commit
      title: Commit selected knowledge paths on the branch
      supports:
        - editing-contract
    - id: version
      title: Prepare the version record and identity record together
      supports:
        - editing-contract
        - layout-contract
  transitions:
    - from: select-work
      to: guard-branch
    - from: guard-branch
      to: edit
      condition: The worktree has a non-protected branch checked out.
    - from: guard-branch
      to: select-work
      condition: The person creates a branch or selects another worktree.
    - from: edit
      to: validate
    - from: validate
      to: write
      condition: No new error diagnostic and the expected digests match.
    - from: validate
      to: edit
      condition: Diagnostics or a digest conflict require a correction or reload.
    - from: write
      to: edit
      condition: More edits follow; Undo stays available while the post-image is current.
    - from: write
      to: review
    - from: review
      to: commit
      condition: The person selects knowledge paths and a message.
    - from: review
      to: version
      condition: The readiness checklist is complete.
    - from: version
      to: review
  support:
    - id: workbench-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the navigation tree, pages, journeys, feedback and labels.
      basis: documented
    - id: editing-contract
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-editing.md
      requires: Define the writer, operations, validation, Git actions and interfaces.
      basis: documented
    - id: layout-contract
      kind: element
      artifact: artifact-driven
      element: specifications/knowledge-layout.md
      requires: Keep every written record consistent with the in-place layout and its derived facts.
      basis: documented
    - id: review-contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-review.md
      requires: Compare proposed knowledge with the protected baseline.
      basis: documented
  gaps:
    - This journey is specified; implementation and observed browser evidence are added by the approved tasks.
    - Approval and publication are decisions outside the files and are not steps of this journey.
  exclusions:
    - Push, pull requests, merge, edits to established versions and the flow model layer.
---

# Author ADD knowledge in the Plane

## Coverage

The structured record owns this journey. It covers the person's path from choosing work to a phase commit or version preparation. Validation happens before every write; the readers that govern reading also govern writing. Support is documented until the implementation tasks add static and observed evidence.

## Branches

A protected branch or a detached HEAD returns the person to the branch control. A validation failure or a digest conflict returns to editing with the diagnostics or both versions shown. Undo is available after a write while no later edit touched the same files.
