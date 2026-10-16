---
unit_of_work: model-explanations
changes:
  - artifact: artifact-driven
    change: change-model-explanations
  - artifact: artifact-plane
    change: change-model-explanations
affected_flows:
  - artifact: artifact-driven
    flow: dependency-gates
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
flow_assessment: Inspected dependency projection, element-reference reasons, flow parsing, canvas and inspectors, canonical flow guidance and ADD/Plane/Story contracts. Pilot coverage includes dependency gates and repository exploration. Other journeys remain readable without claimed model coverage; exhaustive runtime discovery and Story inventory migration are excluded.
acceptance:
  - id: explanations
    criterion: Dependency selection explains direction and recorded reasons with exact evidence, or an explicit information gap.
  - id: domain-journey
    criterion: A maintained ADD-to-Plane journey shows reusable owned models, actions and outcomes with source evidence.
  - id: compatibility
    criterion: Legacy flows, snapshot selection, read-only controls and HTTP/MCP behavior remain valid.
  - id: integration
    criterion: Required upstream and predecessor publication is verified and combined contract, browser, adoption and documentation checks support delivery.
    integration: true
evidence: []
---

# Understand why artifacts depend and how their models interact

## Included scope

ADD owns the additive model/flow contract and a small verified model inventory. Plane owns parsing, indexing, edge explanations, model-aware flow presentation and its inventory. Reuse element-reference reasons rather than introduce a parallel rationale registry.

## Excluded scope

Automatic inferred domain authoring, full code call graphs, editing knowledge through the UI, historical snapshot rewrites, a mandatory DDD taxonomy, new execution scheduling, Story-Driven migration and exhaustive model coverage.

## Delivery boundaries

Preparation starts from the pending PR #26 tree on a separate branch. Keep that review unchanged. Reconcile its merged implementation before downstream work. ADD preparation can proceed, but Plane implementation waits for required new ADD contracts to establish. Unit membership does not bypass those gates. No passing delivery evidence is asserted during preparation.
