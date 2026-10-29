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
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
flow_assessment: Inspected role cores, guidance, review service, MCP adapters and review tests. The outcome changes how agents load governing context and how Plane transmits review sources. No dependency or approval semantics change. Context handoff and source retrieval also change their bounded selection and continuation behavior.
acceptance:
  - id: context-correctness
    criterion: Compact and incremental reads preserve source identity, uncertainty and governing evidence with compatible legacy behavior.
  - id: integration
    criterion: Retrieval, adapter, guidance, Go embedding and build checks pass together.
    integration: true
evidence:
  - criterion: context-correctness
    method: Run compact service and real HTTP and stdio MCP parity tests.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-context-efficiency/tasks/01-retrieval.md#evidence
  - criterion: integration
    method: Run Node and all 177 browser tests, build, Go and scoped record validators.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-context-efficiency/tasks/02-measurement.md#evidence
---

# Context efficiency

## Purpose

Reduce agent input usage without weakening ADD evidence or gates.

## Included scope

Selective guidance, compact and delta review retrieval, MCP output and the reproducible benchmark.

## Excluded scope

Model changes, persistent workflow stores and browser redesign.

The live token-savings run and its 25 percent median target are also excluded. The owner deferred them to a later change, because the model endpoint returned HTTP 403. The [measurement task](../../artifact-plane/changes/change-context-efficiency/tasks/02-measurement.md#deferred-live-run) records the blocker.
