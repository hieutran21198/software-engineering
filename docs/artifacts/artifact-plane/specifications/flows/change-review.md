---
flow:
  id: change-review
  artifact: artifact-plane
  title: Review a selected artifact change
  trigger: A reviewer opens Review change from delivery details.
  outcome: Declared-current knowledge differences, explicit flow impact and
    unresolved evidence are visible with exact source context.
  entry_steps:
    - select
  steps:
    - id: select
      title: Select the registered worktree and artifact change
      supports:
        - human-guidance-contract
        - change-status-model
        - change-status-tests
        - human-guidance-browser
        - authoring-contract
        - ux-simplification-contract
        - ux-browser-checks
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - evidence-usability-contract
        - change-page
        - change-unit-tests
    - id: compare
      title: Compare contract knowledge with the declared current version
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - evidence-usability-contract
        - layout-reading
    - id: impact
      title: Trace recorded relationships on both comparison sides
      supports:
        - impact-contract
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - evidence-usability-contract
    - id: evidence
      title: Read governing sources and missing review proof
      supports:
        - authoring-contract
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - evidence-usability-contract
        - layout-reading
        - change-page
        - change-unit-tests
    - id: brief
      title: Answer the seven review questions and record a person's check
      supports:
        - change-status-model
        - change-status-tests
        - delivery-support-contract
        - brief-contract
    - id: return
      title: Return to delivery or capture the reviewed context
      supports:
        - delivery-support-contract
        - authoring-contract
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
        - evidence-usability-contract
  transitions:
    - from: select
      to: compare
    - from: compare
      to: impact
    - from: impact
      to: evidence
    - from: evidence
      to: brief
    - from: brief
      to: return
    - from: return
      to: select
      condition: The source selection changes or a stale/error reply requires a new read.
  support:
    - id: human-guidance-contract
      kind: element
      artifact: artifact-plane
      element: specifications/human-guidance.md
      requires: Show the status and next step of each change, version labels,
        one status vocabulary, the control grammar and the glossary.
      basis: documented
    - id: change-status-model
      kind: implementation
      path: apps/artifact-plane/src/work-model.js
      symbol: changeStatus
      requires: Derive one status and next step for each change from records and
        local Git.
      basis: static
    - id: change-status-tests
      kind: test
      path: apps/artifact-plane/test/change-status.test.js
      requires: Prove each change status, Current work membership, the stepper
        rule and the brief difference.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/01-status-model.md
    - id: human-guidance-browser
      kind: test
      path: apps/artifact-plane/test/browser/human-guidance.spec.js
      requires: Prove statuses, version labels, the stepper rule, named counts,
        glossary terms, control styles and status badges on the pages.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md
    - id: impact-contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-impact.md
      requires: Derive the tiered, explained impact of the changed knowledge records instead of a flow-only reverse closure.
      basis: documented
    - id: authoring-contract
      kind: element
      artifact: artifact-plane
      element: specifications/authoring-workbench.md
      requires: Define the work-centered shell, editable pages and journeys that this journey now serves.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Read purpose and changed passages first with bounded full comparison
        and explicit partial-source fallback.
      basis: documented
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-review.md
      requires: Define safe source context, evidence limits, revision recovery and
        read-only behavior.
      basis: documented
    - id: review-service
      kind: implementation
      path: apps/artifact-plane/server/change-review.js
      requires: Derive safe comparison, explicit impact and revision-bound source
        context.
      basis: static
    - id: review-interface
      kind: implementation
      path: apps/artifact-plane/src/pages/ChangePageReview.jsx
      requires: Present captured context, source comparisons, recovery and local exports.
      basis: static
    - id: review-checks
      kind: test
      path: apps/artifact-plane/test/change-review.test.js
      requires: Exercise comparison, evidence, impact and contained source boundaries.
      basis: static
    - id: browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
      requires: Exercise review navigation, exports, refresh and delayed replies.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present page blocks and native controls consistently without changing evidence or journey meaning.
      basis: documented
    - id: shared-presentation
      kind: implementation
      path: apps/artifact-plane/src/styles.css
      requires: Share one set of tokens, controls and page rhythm.
      basis: static
    - id: presentation-checks
      kind: test
      path: apps/artifact-plane/test/browser/layout.spec.js
      requires: Check one title, one navigation, unique control names and no horizontal overflow on every page.
      basis: static
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-and-comparison.md
      requires: Select comparison context and interpret evidence without inferring
        approval or publication.
      basis: documented
    - id: layout-reading
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-layout-reading.md
      requires: Compare in-place working knowledge with the protected-branch baseline through Git and derive declared evidence.
      basis: documented
    - id: change-page
      kind: implementation
      path: apps/artifact-plane/src/pages/ChangePage.jsx
      requires: Show the Review tab with comparison, diagnostics, commit and version actions.
      basis: static
    - id: change-unit-tests
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
      requires: Prove the Review tab actions in the browser.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: brief-contract
      kind: element
      artifact: artifact-plane
      element: specifications/review-brief.md
      requires: Derive the change brief, the verification ladder and the claim facts from the review and impact services, and record claim checks through the operations.
      basis: documented
    - id: delivery-support-contract
      kind: element
      artifact: artifact-plane
      element: specifications/delivery-support.md
      requires: Show the tier check and the PR description of the change.
      basis: documented
  gaps:
    - Declared current is not a historical code predecessor; recorded
      relationships are not exhaustive impact.
    - The evidence-and-usability extension is specified; implementation and
      current integrated validation remain pending.
  exclusions:
    - Code-diff review, historical code reconstruction, approval and repository
      writes.
---

# Review a selected artifact change

Tracked implementation and tests support this flow. Actual validation evidence remains in the originating delivery tasks; static support does not prove exhaustive behavior or approval.

## Simpler exploration

Read purpose and changed passages first with bounded full comparison and explicit partial-source fallback. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.
