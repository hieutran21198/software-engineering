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
        - workbench-shell
        - scenario-tests
    - id: guard-branch
      title: Confirm a non-protected branch in the selected worktree
      supports:
        - editing-contract
        - writer-module
        - git-module
        - writer-tests
        - git-tests
    - id: edit
      title: Edit a document body or apply a domain operation
      supports:
        - workbench-contract
        - editing-contract
        - operations-module
        - edit-routes
        - operation-tests
        - interface-tests
        - edit-forms
        - document-page
        - flow-editor
        - scenario-tests
        - document-tests
        - flow-page-tests
        - brief-contract
    - id: validate
      title: Validate the post-image with the readers and preview the files
      supports:
        - editing-contract
        - layout-contract
        - operations-module
        - operation-tests
        - edit-forms
        - scenario-tests
    - id: write
      title: Write atomically with digests and a journal entry
      supports:
        - editing-contract
        - writer-module
        - writer-tests
        - document-page
        - scenario-tests
        - document-tests
    - id: review
      title: Review changed knowledge, diagnostics and readiness
      supports:
        - workbench-contract
        - review-contract
        - workbench-shell
        - change-page
        - scenario-tests
        - change-unit-tests
    - id: commit
      title: Commit selected knowledge paths on the branch
      supports:
        - editing-contract
        - git-module
        - edit-routes
        - git-tests
        - change-page
        - scenario-tests
        - change-unit-tests
    - id: version
      title: Prepare the version record and identity record together
      supports:
        - editing-contract
        - layout-contract
        - operations-module
        - operation-tests
        - change-page
        - change-unit-tests
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
      requires: Define the top bar, sidebar, pages, labels and visual style.
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
    - id: writer-module
      kind: implementation
      path: apps/artifact-plane/server/knowledge-writer.js
      requires: Contain writes, refuse protected branches and records, splice front
        matter and sections, write atomically with digests and keep the undo
        journal.
      basis: static
    - id: operations-module
      kind: implementation
      path: apps/artifact-plane/server/knowledge-operations.js
      requires: Derive identifiers, paths and records, validate the post-image with
        the readers and plan the file edits.
      basis: static
    - id: git-module
      kind: implementation
      path: apps/artifact-plane/server/knowledge-git.js
      requires: Report branch state, create branches, commit selected knowledge paths
        and discard edits.
      basis: static
    - id: edit-routes
      kind: implementation
      path: apps/artifact-plane/server/http.js
      requires: Expose the edit and Git routes with local origin checks and mapped errors.
      basis: static
    - id: writer-tests
      kind: test
      path: apps/artifact-plane/test/knowledge-writer.test.js
      requires: Prove containment, byte preservation, atomic recovery, digests and undo.
      basis: observed
      evidence:
        - apps/artifact-plane/test/knowledge-writer.test.js
    - id: operation-tests
      kind: test
      path: apps/artifact-plane/test/knowledge-operations.test.js
      requires: Prove derived records, refusals, validation and exact written files
        for the operations.
      basis: observed
      evidence:
        - apps/artifact-plane/test/knowledge-operations.test.js
    - id: git-tests
      kind: test
      path: apps/artifact-plane/test/knowledge-git.test.js
      requires: Prove branch protection, selective commits and discard.
      basis: observed
      evidence:
        - apps/artifact-plane/test/knowledge-git.test.js
    - id: interface-tests
      kind: test
      path: apps/artifact-plane/test/knowledge-interfaces.test.js
      requires: Prove HTTP limits and errors and MCP and HTTP parity.
      basis: observed
      evidence:
        - apps/artifact-plane/test/knowledge-interfaces.test.js
    - id: workbench-shell
      kind: implementation
      path: apps/artifact-plane/src/main.jsx
      requires: Route pages by project and worktree, run operations and show the
        status with Undo.
      basis: static
    - id: edit-forms
      kind: implementation
      path: apps/artifact-plane/src/editing.jsx
      requires: Inline forms, operation errors and diagnostics at the field.
      basis: static
    - id: document-page
      kind: implementation
      path: apps/artifact-plane/src/pages/DocumentPage.jsx
      requires: Edit bodies, references, self-checks and front matter with conflict handling.
      basis: static
    - id: change-page
      kind: implementation
      path: apps/artifact-plane/src/pages/ChangePage.jsx
      requires: Plan tasks, show readiness, commit, prepare versions and record
        publication reviews.
      basis: static
    - id: flow-editor
      kind: implementation
      path: apps/artifact-plane/src/pages/FlowPage.jsx
      requires: Edit flow steps, transitions and support with pickers.
      basis: static
    - id: scenario-tests
      kind: test
      path: apps/artifact-plane/test/browser/authoring-scenarios.spec.js
      requires: Run the S1–S8 scenarios with measurements, keyboard use and widths.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: document-tests
      kind: test
      path: apps/artifact-plane/test/browser/artifact-document.spec.js
      requires: Prove editing, conflicts, references, self-checks and undo in the browser.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: change-unit-tests
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
      requires: Prove change, plan, commit, version and unit actions in the browser.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: flow-page-tests
      kind: test
      path: apps/artifact-plane/test/browser/flow-page.spec.js
      requires: Prove flow editing in the browser.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: brief-contract
      kind: element
      artifact: artifact-plane
      element: specifications/review-brief.md
      requires: Derive the change brief, the verification ladder and the claim facts from the review and impact services, and record claim checks through the operations.
      basis: documented
  gaps:
    - The scenario tests limit user actions to the 1.16.0 measurements; the
      workbench redesign replaced the earlier action targets.
    - Approval and publication are decisions outside the files and are not steps
      of this journey.
  exclusions:
    - Push, pull requests, merge, edits to established versions and the flow model layer.
---

# Author ADD knowledge in the Plane

## Coverage

The structured record owns this journey. It covers the person's path from choosing work to a phase commit or version preparation. Validation happens before every write; the readers that govern reading also govern writing. Static support names the implementing modules; observed support names the Node and browser tests that exercise each step.

## Branches

A protected branch or a detached HEAD returns the person to the branch control. A validation failure or a digest conflict returns to editing with the diagnostics or both versions shown. Undo is available after a write while no later edit touched the same files.
