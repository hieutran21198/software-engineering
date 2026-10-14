---
unit_of_work: flow-readability
changes:
  - artifact: artifact-plane
    change: change-flow-readability
affected_flows:
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
flow_assessment: Inspected flow rendering, CSS, source excerpt controls and existing browser coverage. This changes presentation of exploration and source retrieval; index, model installation and other journeys are excluded. The screenshot does not prove a graph-rendering failure.
acceptance:
  - id: readability
    criterion: Flow status and shortened sources are readable, with exact details available on demand and an accessible supporting-node toggle.
  - id: integration
    criterion: Focused browser checks and the app build pass without changing retrieval or navigation contracts.
    integration: true
evidence: []
---

# Flow readability

## Outcome and scope

Make the flow explorer readable when optional semantic search is unavailable or source excerpts are shortened. Include compact notices, expandable details, spacing and checkbox alignment. Exclude automatic model downloads, backend changes, new dependencies and changes to delivered snapshots or evidence.

## Combined checks

Validation has not run. The new plan requires user approval before implementation.
