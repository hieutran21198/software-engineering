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
        - contract
    - id: compare
      title: Compare contract knowledge with the declared current version
      supports:
        - contract
    - id: impact
      title: Trace recorded relationships on both comparison sides
      supports:
        - contract
    - id: evidence
      title: Read governing sources and missing review proof
      supports:
        - contract
    - id: return
      title: Return to delivery or capture the reviewed context
      supports:
        - contract
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
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-review.md
      requires: Define safe source context, evidence limits, revision recovery and
        read-only behavior.
      basis: documented
  gaps:
    - Implementation and executable behavior evidence remain pending.
    - Declared current is not a historical code predecessor; recorded
      relationships are not exhaustive impact.
  exclusions:
    - Code-diff review, historical code reconstruction, approval and repository
      writes.
---

# Review a selected artifact change

This proposed flow has documented contract support. Add tracked implementation/test support and actual validation evidence after plan approval.
