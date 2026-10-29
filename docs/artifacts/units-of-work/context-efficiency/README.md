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
  - id: measured-savings
    criterion: Three paired repetitions per scenario meet the approved 25 percent median input-token target with no scenario regression above 10 percent and all correctness checks passed.
  - id: integration
    criterion: Retrieval, adapter, guidance, Go embedding and build checks pass together.
    integration: true
evidence:
  - criterion: context-correctness
    method: Run compact service and real HTTP and stdio MCP parity tests.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-context-efficiency/tasks/01-retrieval.md#evidence
  - criterion: measured-savings
    method: Attempt the live Codex prerequisite and exercise the benchmark harness separately.
    result: incomplete
    source: docs/artifacts/artifact-plane/changes/change-context-efficiency/tasks/02-measurement.md#live-measurement-blocker
  - criterion: integration
    method: Run Node, build, Go and validator checks; browser integration is still running.
    result: incomplete
    source: docs/artifacts/artifact-plane/changes/change-context-efficiency/tasks/02-measurement.md#evidence
---

# Context efficiency

## Purpose

Reduce agent input usage without weakening ADD evidence or gates.

## Included scope

Selective guidance, compact and delta review retrieval, MCP output and the reproducible benchmark.

## Excluded scope

Model changes, persistent workflow stores and browser redesign.
