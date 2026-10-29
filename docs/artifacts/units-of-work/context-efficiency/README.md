---
unit_of_work: context-efficiency
changes:
  - artifact: artifact-driven
    change: change-context-efficiency
  - artifact: artifact-plane
    change: change-context-efficiency
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
flow_assessment: Inspected role cores, guidance, review service, MCP adapters and review tests. The outcome changes how agents load governing context and how Plane transmits review sources. No dependency or approval semantics change. Flow identifiers will be checked against the validator.
acceptance:
  - id: context-correctness
    criterion: Compact and incremental reads preserve source identity, uncertainty and governing evidence with compatible legacy behavior.
  - id: measured-savings
    criterion: Three paired repetitions per scenario meet the approved 25 percent median input-token target with no scenario regression above 10 percent and all correctness checks passed.
  - id: integration
    criterion: Retrieval, adapter, guidance, Go embedding and build checks pass together.
    integration: true
evidence: []
---

# Context efficiency

## Purpose

Reduce agent input usage without weakening ADD evidence or gates.

## Included scope

Selective guidance, compact and delta review retrieval, MCP output and the reproducible benchmark.

## Excluded scope

Model changes, persistent workflow stores and browser redesign.
