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
        - ux-simplification-contract
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
    - id: compare
      title: Compare contract knowledge with the declared current version
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
    - id: impact
      title: Trace recorded relationships on both comparison sides
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
    - id: evidence
      title: Read governing sources and missing review proof
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
    - id: return
      title: Return to delivery or capture the reviewed context
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
  transitions:
    - from: select
      to: compare
    - from: compare
      to: impact
    - from: impact
      to: evidence
    - from: evidence
      to: return
    - from: return
      to: select
      condition: The source selection changes or a stale/error reply requires a new read.
  support:
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Read purpose and changed passages first with bounded full comparison and explicit partial-source fallback.
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
      path: apps/artifact-plane/src/ChangeReview.jsx
      requires: Present captured context, source comparisons, recovery and local exports.
      basis: static
    - id: review-checks
      kind: test
      path: apps/artifact-plane/test/change-review.test.js
      requires: Exercise comparison, evidence, impact and contained source boundaries.
      basis: static
    - id: browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-review.spec.js
      requires: Exercise review navigation, exports, refresh and delayed replies.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present inspector blocks and native controls consistently without
        changing evidence or journey meaning.
      basis: documented
    - id: shared-presentation
      kind: implementation
      path: apps/artifact-plane/src/style.css
      requires: Share native dropdown appearance and scoped inspector rhythm.
      basis: static
    - id: presentation-checks
      kind: test
      path: apps/artifact-plane/test/browser/presentation.spec.js
      requires: Check measured gaps, native dropdown styles, keyboard access and
        completion feedback.
      basis: static
  gaps:
    - Declared current is not a historical code predecessor; recorded
      relationships are not exhaustive impact.
  exclusions:
    - Code-diff review, historical code reconstruction, approval and repository
      writes.
---

# Review a selected artifact change

Tracked implementation and tests support this flow. Actual validation evidence remains in the originating delivery tasks; static support does not prove exhaustive behavior or approval.

## Simpler exploration

Read purpose and changed passages first with bounded full comparison and explicit partial-source fallback. The detailed contract owns behavior and recovery limits. This is documented preparatory behavior; validation evidence is pending approved implementation.
