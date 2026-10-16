---
references:
  - artifact: artifact-driven
    element: specifications/model-explanations.md
    requires: Interpret reusable model identity, evidence-linked flow interactions and snapshot selection consistently.
---

# Dependency explanations and model-aware flows

## Supplier contract and boundaries

ADD 2.2.0 supplies the reusable metadata contract through merged PR #27. Recheck the protected contract before implementation. Legacy knowledge remains compatible. This is an additive consumer, not another source of domain definitions.

## Consumed model and flow contract

Consume the ADD-owned model declarations, stable identities, participant selectors and evidence-linked step interactions exactly as supplied by the structured reference above. That contract owns their format and semantic diagnostics; Plane owns the derived response and presentation below. Do not copy model definitions into flow records or replace missing models with documentation nodes.

## Dependency interaction

Keep supplier-to-consumer DAG direction. Selecting an edge or a relationship in the dependency list opens the same explanation in the existing inspector. The header says Consumer depends on Supplier. Show direct declaration, selected snapshots and edge status separately from rationale. Established, proposed-add and proposed-remove edges must remain distinct even with identical endpoints.

Collect reasons from the selected consumer's references targeting the actual supplier. Each reason retains consuming element, supplying element, selector, resolved flag and source location. Deduplicate only identical source/target/reason/selector records. Never combine historical/current/proposed reasons or claim that resolution proves runtime behavior. Missing or unresolved sources remain labelled. If none exist, show Reason not documented and the declaration source; do not invent a model relation. Transitive dependencies show their path with each direct edge explained separately.

Use one short existing recorded reason as the optional edge label, with accessible disclosure of full text; several reasons use a count. Reuse measured graph-label placement. Long text lives in the inspector. Edge selection supports pointer and keyboard, visible focus, and clear selection. Opening a source uses the contained Reader and returns to the relationship context.

## Model-aware flow presentation

For flows with participants, group named model cards by artifact and retain the existing step sequence as the journey context. Selecting a step shows only its declared interactions between model cards, labelled with action; selection reveals outcome, conditions and evidence. Default to the entry step, preserve branch/loop navigation, and allow the existing full step overview. The step selector and graph both expose selection accessibly. Do not show all supporting documents by default.

Selecting a model shows title, purpose, artifact, concrete snapshot, its declared source evidence and other known flows using the same concrete model identity. Label coverage as known participation. Switch to a selected participating flow through existing flow navigation; never merge revisions or project tabs. Supporting documents and code remain secondary sources with existing safe reading behavior. An unresolved model is a named missing target with its requested selector, not a document node substitute.

## Derived contracts and freshness

Extend the existing flow graph with kind model nodes and participates/interaction edges; retain all legacy fields and node kinds. Interaction edges retain flow, step, action, outcome, support IDs, bases and resolution. Add models and participants to selected-flow detail; graph/impact retrieval traverses explicit participates/support relationships to find known affected flows. Dependency edges gain an additive explanations list with source/target element IDs, reason, selector, resolution and source file. No new endpoint is needed.

HTTP and MCP expose equivalent additions through existing detail/graph/impact operations. Preserve old responses for clients ignoring unknown fields. Index invalidation includes model definition and referenced evidence changes, snapshot, project and worktree; rebuild derived indexes without treating cached entries as authority. Existing bounded parsing, alias controls, contained reads, HTML sanitization, cancellation and source byte preservation remain. Malformed model metadata produces a semantic diagnostic while valid legacy flow behavior stays readable.

## Pilot and validation

Author only a small owned inventory: ADD Artifact, Change and Version from existing governing knowledge; Plane Repository snapshot from its explorer contract. Extend repository-exploration scan/overview/inspect steps to explain how Plane reads and presents those ADD models, with static/documented support and no runtime-success assertion. Preserve existing flow IDs/step transitions. ADD dependency-gates supplies the reusable-model example in a second flow. Exact action wording and evidence are checked against existing contracts during task execution; unsupported claims return to Specification. Other flows remain usable and explicitly lack model coverage.

Check duplicate/missing models, unsafe paths, proposed/established/historical isolation, multi-flow identity, self interactions, branches/loops, unresolved reasons, parallel edge statuses, source navigation, keyboard focus, mobile layout, graph/impact HTTP-MCP parity, refresh and read-only protection.

## Specification self-check

P1-P6 map to explicit behavior and failure states. Upstream establishment and predecessor PR #26 are separate from task completion. KISS reuses graph controls, Reader, references and retrieval; STE separates prerequisites, interactions and evidence. No Plan blocker remains.
