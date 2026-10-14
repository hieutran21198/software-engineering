---
unit_of_work: flow-discovery-and-retrieval
changes:
  - artifact: artifact-driven
    change: change-flow-discovery
  - artifact: artifact-plane
    change: change-flow-discovery
  - artifact: story-driven
    change: change-flow-discovery
acceptance:
  - id: flow-knowledge
    criterion: ADD defines evidence-linked system flows and unit flow-impact
      assessment in its canonical and adopted bundles without changing execution
      DAG or legacy delivery semantics.
  - id: inventory
    criterion: Named journeys for all three artifacts have owned flow records with
      supporting sources and explicit coverage gaps.
  - id: discovery
    criterion: Artifact Plane visualizes shared flow participation and retrieves
      source-backed impact context through keyword, local semantic, and graph
      discovery.
  - id: agent-access
    criterion: Local HTTP and stdio MCP expose the same read-only flow retrieval
      operations with snapshot, freshness, and completeness information.
  - id: integration
    criterion: All member versions establish and integrated offline, freshness,
      isolation, retrieval, adoption, documentation, and read-only checks
      support the outcome.
    integration: true
evidence:
  - criterion: flow-knowledge
    method: Review the flow contract, validate authored records and links, and run
      canonical/bundle/adoption and documentation checks.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-flow-discovery/tasks/03-validation.md#evidence
  - criterion: inventory
    method: Check availability of downstream delivery and required upstream
      publication.
    result: incomplete
    source: docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md#combined-checks
  - criterion: discovery
    method: Check availability of downstream delivery and required upstream
      publication.
    result: incomplete
    source: docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md#combined-checks
  - criterion: agent-access
    method: Check availability of downstream delivery and required upstream
      publication.
    result: incomplete
    source: docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md#combined-checks
  - criterion: integration
    method: Check availability of downstream delivery and required upstream
      publication.
    result: incomplete
    source: docs/artifacts/units-of-work/flow-discovery-and-retrieval/README.md#combined-checks
affected_flows:
  - artifact: artifact-driven
    flow: adoption
    effect: create
  - artifact: artifact-driven
    flow: change-delivery
    effect: create
  - artifact: artifact-driven
    flow: dependency-gates
    effect: create
  - artifact: artifact-driven
    flow: unit-validation
    effect: create
  - artifact: artifact-driven
    flow: version-publication
    effect: create
  - artifact: artifact-plane
    flow: repository-exploration
    effect: create
  - artifact: artifact-plane
    flow: unit-inspection
    effect: create
  - artifact: artifact-plane
    flow: source-retrieval
    effect: create
  - artifact: artifact-plane
    flow: repository-refresh
    effect: create
  - artifact: artifact-plane
    flow: project-tabs
    effect: create
  - artifact: artifact-plane
    flow: execution-observation
    effect: create
  - artifact: story-driven
    flow: authoring
    effect: create
  - artifact: story-driven
    flow: revision-impact
    effect: create
  - artifact: story-driven
    flow: adoption
    effect: create
flow_assessment: Investigated named journeys in all three artifacts using
  artifact contracts, shipped guidance, entry points and tests. ADD records are
  supplied in its member change. Plane and Story-Driven inventories remain
  planned until the new ADD contract establishes; their current absence is
  explicit preparatory work. No exhaustive runtime-path coverage is asserted.
---

# Flow discovery and retrieval

## Purpose and included scope

Maintain named system behavior flows and let people and agents retrieve their participating artifacts, knowledge elements, implementation, and evidence. ADD owns the reusable flow format and phase checks. Plane owns parsing, local SQLite indexes, visualization, local embeddings, HTTP and MCP. Story-Driven owns its project flow inventory. Initial coverage includes all three artifacts in this repository.

## Excluded scope

Hosted inference, an embedded generative model, automatic code changes, arbitrary repository-file access, full language call graphs, exhaustive runtime-path enumeration, deployment, automatic merging, and a workflow state registry. Do not modify established snapshots or prior unit membership.

## Approval and delivery boundaries

The user approved the draft plan and instructed implementation. Prepare Requirement, Specification and Plan with phase self-checks and commits. Preserve that approval for unchanged scope. ADD's required flow contract must establish before downstream Implementation. Local main establishes the previous baselines; it does not establish this new contract. PR review and merge remain required.

## Combined checks

ADD upstream checks passed: Go tests/vet; canonical and embedded bundle fidelity; fresh/repeated/dry-run/conflict adoption; five flow records with 29 steps, 30 transitions and 15 readable supporting sources; new task DAGs; 167 changed local links/headings across 127 Markdown files; historical snapshot/delivery retention; website build. Existing Plane regression tests passed 136 checks after the sandbox subprocess restriction was resolved, and its existing build passed. No application source was changed. Detailed reproducible evidence remains in ADD task 03.

Combined flow-system acceptance is incomplete: ADD 2.1.0 has not established; Plane and Story-Driven implementation wait for that upstream merge and contract recheck. The nine downstream flow records, new Flows UI, local embeddings, HTTP/MCP, browser acceptance and semantic/impact benchmarks are not delivered or validated yet. This brief does not assert completed shared acceptance or establishment.

## Publication review

[PR #20](https://github.com/hieutran21198/software-engineering/pull/20) proposes ADD 2.1.0 with the upstream flow contract and prepared downstream knowledge/plans. It does not establish the new version. After required review/merge, verify the published contract and retained ADD delivery evidence before executing the Plane and Story-Driven plans. No shared completion is asserted.
