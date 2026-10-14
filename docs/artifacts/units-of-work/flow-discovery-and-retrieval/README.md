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
    criterion: ADD defines evidence-linked system flows and unit flow-impact assessment in its canonical and adopted bundles without changing execution DAG or legacy delivery semantics.
  - id: inventory
    criterion: Named journeys for all three artifacts have owned flow records with supporting sources and explicit coverage gaps.
  - id: discovery
    criterion: Artifact Plane visualizes shared flow participation and retrieves source-backed impact context through keyword, local semantic, and graph discovery.
  - id: agent-access
    criterion: Local HTTP and stdio MCP expose the same read-only flow retrieval operations with snapshot, freshness, and completeness information.
  - id: integration
    criterion: All member versions establish and integrated offline, freshness, isolation, retrieval, adoption, documentation, and read-only checks support the outcome.
    integration: true
evidence: []
---

# Flow discovery and retrieval

## Purpose and included scope

Maintain named system behavior flows and let people and agents retrieve their participating artifacts, knowledge elements, implementation, and evidence. ADD owns the reusable flow format and phase checks. Plane owns parsing, local SQLite indexes, visualization, local embeddings, HTTP and MCP. Story-Driven owns its project flow inventory. Initial coverage includes all three artifacts in this repository.

## Excluded scope

Hosted inference, an embedded generative model, automatic code changes, arbitrary repository-file access, full language call graphs, exhaustive runtime-path enumeration, deployment, automatic merging, and a workflow state registry. Do not modify established snapshots or prior unit membership.

## Approval and delivery boundaries

The user approved the draft plan and instructed implementation. Prepare Requirement, Specification and Plan with phase self-checks and commits. Preserve that approval for unchanged scope. ADD's required flow contract must establish before downstream Implementation. Local main establishes the previous baselines; it does not establish this new contract. PR review and merge remain required.

## Combined checks

No checks for the integrated outcome have run yet. Record actual commands and results here, and reference owning task evidence when available. Upstream-only checks cannot support downstream completion.
