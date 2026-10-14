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
    criterion: Flow evidence is readable and the view switcher, knowledge controls, left list, center graph and right details show consistent selection and state.
  - id: integration
    criterion: Focused browser checks and the app build pass, including cross-view state retention, synchronized panels and project/worktree isolation.
    integration: true
evidence:
  - criterion: readability
    method: Run focused flow browser checks and review wide and narrow screenshots.
    result: incomplete
    source: docs/artifacts/artifact-plane/changes/change-flow-readability/tasks/01-presentation.md#evidence
  - criterion: integration
    method: Build the app and check focused regressions, documentation and historical retention.
    result: incomplete
    source: docs/artifacts/units-of-work/flow-readability/README.md#combined-checks
---

# Flow readability

## Outcome and scope

Make the flow explorer readable when optional semantic search is unavailable or source excerpts are shortened. Include compact notices, expandable details, spacing and checkbox alignment. Exclude automatic model downloads, backend changes, new dependencies and changes to delivered snapshots or evidence.

## Combined checks

The user explicitly approved the new plan. The app build and all six focused flow browser tests passed. Screenshots at 1440 and 700 pixels were reviewed. The implementation does not change backend responses, model installation, dependencies or existing navigation. Local documentation links resolve without ancestor destinations; the one-task graph is acyclic. The actual repository completion query reports zero diagnostics and incomplete publication, as expected for the proposed patch. Established snapshots and all existing delivered changes remain byte-identical to main. Version 1.11.1 is proposed for team review; completion requires publication of its knowledge and implementation.

## Navigation amendment

The user reported inconsistent view and knowledge controls and disconnected panels before PR #23 merged. Extend this same outcome to consistent Flows navigation and panel layout. The first task remains delivered on this branch; its six passing checks do not prove the added behavior. New checks and explicit amended-plan approval are required. Breaking backend schema changes, model installation, historical snapshots and other artifact membership stay outside scope.

The user further requested lazy loading, pagination and descending creation-date order. Include bounded flow-list requests and additive creation-date provenance. Existing cursor safety, read-only retrieval and source limits remain applicable; no new dependency or authoritative state store is introduced.
