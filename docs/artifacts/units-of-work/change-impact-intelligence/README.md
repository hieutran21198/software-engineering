---
unit_of_work: change-impact-intelligence
changes:
  - artifact: artifact-driven
    change: change-impact-semantics
  - artifact: artifact-plane
    change: change-impact-intelligence
affected_flows:
  - artifact: artifact-plane
    flow: change-impact
    effect: create
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-driven
    flow: dependency-gates
    effect: modify
flow_assessment: Discovery on 18 October 2026 read the 17 flow records, the
  Plane readers (flow-model.js, flow-index.js, change-review.js, flow-mcp.js),
  the ADD contracts that mention impact, and the Git history of this repository.
  The Plane gets one new journey, change-impact. Change review and context
  handoff change because their impact step and packet field use the new result.
  Source retrieval changes because its discover step and the impact operation
  of the flow query delegate to the new service. The ADD change-delivery and
  dependency-gates flows change because Requirement, Specification and the
  recheck step consume the new impact contract. Repository exploration,
  repository refresh, unit inspection, knowledge authoring, execution
  observation, project tabs, adoption, unit validation, version publication and
  the Story-Driven flows are excluded; their steps and supports do not change.
  Gap - dynamic calls, injected functions and process boundaries are not
  analyzed by any planned reader; the contract reports them as not analyzed.
  Reconciliation on the delivery branch - the impact service on the difference
  against main reached all six declared flows and six more that are not
  declared - repository-exploration and repository-refresh through
  src/main.jsx (a new page kind), unit-inspection and execution-observation
  through src/styles.css (the step highlight), knowledge-authoring through
  server/http.js (a new route), and project-tabs through src/TopBar.jsx (a new
  More menu entry). Each edit only adds an entry; the steps of those journeys
  do not change and their browser suites pass, so they are not declared as
  modified.
acceptance:
  - id: semantics
    criterion: The ADD change-impact contract defines the tiers changed, direct,
      transitive, potential and unresolved, a propagation rule for every
      relationship type, the explanation record and the coverage statement, and
      the end-user guideline explains how the phases use them.
  - id: accuracy
    criterion: On the nine ground-truth cases built from real commits of this
      repository, the direct tier has precision and recall 1.0 for every case
      with changed declarations, affected steps match the expected steps in
      every case, no hard negative appears in the direct or transitive tier, and
      the three prerequisite-without-reference cases are reported as unresolved.
  - id: explanation
    criterion: Every reported entity carries its tier, hops, evidence strength,
      origins and a typed path with per-edge evidence; every answer carries a
      coverage statement; an empty answer never claims absence of impact.
  - id: interfaces
    criterion: POST /api/impact/query, the MCP tool get_change_impact and the
      additive packet field return the same facts; the existing flow and review
      tools and their tests pass without edits.
  - id: usability
    criterion: The owner opens the Impact view on a real change of this
      repository at 1440 and 390 pixels, can answer what might break, why and
      where to look first, and accepts the view.
  - id: performance
    criterion: On this repository the full index builds in at most 2 seconds, an
      incremental update after one file change takes at most 300 milliseconds,
      an impact query returns in at most 100 milliseconds, and the compact agent
      output of the nine cases stays under 8 kilobytes each.
  - id: integration
    criterion: Node, browser, Go and website checks pass for the combined change,
      both bundle copies are identical for changed files, and validate-knowledge
      reports no error.
    integration: true
evidence:
  - criterion: semantics
    method: Review of the ADD contract, the definition row and the guideline in both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-impact-semantics/tasks/02-validation.md#validation-checks
  - criterion: accuracy
    method: Nine ground-truth cases with scripts/impact-benchmark.mjs on the delivery branch.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/08-integration-version.md#combined-checks
  - criterion: explanation
    method: Service tests of the explanation record, coverage statement and empty answers.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/02-impact-service.md#service-checks
  - criterion: interfaces
    method: Route, MCP parity, delegation and packet tests; existing flow and review tests.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/03-interfaces.md#interface-checks
  - criterion: performance
    method: Benchmark index, incremental, query and output-size measurements on the delivery branch.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/08-integration-version.md#combined-checks
  - criterion: integration
    method: Node, browser, build, Go, website, validate-knowledge and bundle mirror checks on the combined branch.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/08-integration-version.md#combined-checks
---

# Explain what a change affects

## Purpose

Give people and agents a tiered, explained and bounded answer to the question "what might break if I change this, why, and where should I investigate first" for ADD knowledge, flows, contracts, implementation and tests, without maintaining relationships by hand.

## Included scope

The ADD contract for change impact (tiers, propagation rules per relationship type, explanations, coverage) and its end-user guideline. The Plane impact service with derived code, mirror and history relations, the HTTP and MCP interfaces, the packet field, the Impact view, the ground-truth validation suite, and the search and flow-reading corrections that the research measured.

## Excluded scope

A graph database, a second vector store, a hosted model, generated answers, numeric confidence scores, a workflow registry, dynamic or runtime tracing, and changes to artifact prerequisites, approval or establishment rules. Story-Driven knowledge does not change.

## Validation evidence

Six criteria passed on 18 October 2026; the check details are in the task evidence named in the front matter. On the delivery branch the benchmark measured direct precision and recall 1.0 for the eight symbol-seeded cases, 15 of 15 step checks, no hard negative, a full index in about 1 second, an incremental update in 35 ms and warm queries of at most 56 ms. The usability criterion is open until the owner reviews the Impact page. The research prototype measurements in the Plane decision record are not delivery evidence.
