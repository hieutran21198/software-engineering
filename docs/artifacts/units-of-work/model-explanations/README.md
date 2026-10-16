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

## Reviewable implementation sequence

1. ADD: ship the additive metadata guidance, then author and validate its small model inventory. Prepare proposed 2.2.0 and an upstream review.
2. Team review and merge establish the ADD contract. Recheck it against the prepared consumer plan and reconcile the pending PR #26 predecessor.
3. Plane: extend parsing/indexing and dependency reasons; add the edge inspector; add model-aware flows and the source-backed pilot.
4. Run integrated behavior, security, browser, adoption and documentation checks. Prepare proposed 1.14.0 with retained delivery evidence and a linked review. Stop for team merge.

Suggested compatible versions are ADD 2.2.0 and Plane 1.14.0. Approval of this plan confirms these proposals unless overridden; no version is prepared or declared current during planning.

## Preparation checks

Requirement and Specification are complete in separate commits. Both task DAGs are checked for membership, IDs, resolved prerequisites and cycles. The scope covers all local requirements and shared acceptance, with explicit evidence gaps and no passing implementation claim. Application code, canonical reusable guidance, packages, old changes and established versions remain unchanged during preparation.

Preparation validation passed: seven task records, five internal prerequisite edges, two member changes, 13 retained flow records with valid YAML, and 63 existing local link targets with no ancestor-document links. All 91 changed paths are project knowledge; no application implementation or established snapshot changed. These checks validate preparation only, not model-aware product behavior.
