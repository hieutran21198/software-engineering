---
unit_of_work: plane-version-source
changes:
  - artifact: artifact-plane
    change: change-version-source
affected_flows: []
flow_assessment: Discovery on 19 October 2026 read the eleven Plane flow
  records and the validator, record-check and baseline modules, and ran the
  impact service at depth 2 on the three changed modules. No flow is created,
  modified or removed; the impact reconciliation explains the eight reached
  flows. No ADD or Story-Driven flow is affected.
claims:
  - id: reached-flows-kept
    kind: assumption
    statement: The eight Plane flows that the impact service reaches from the
      changed modules keep their steps and supports; only the diagnostics of the
      same-path scenario change.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-version-source/tasks/02-validation.md#evidence
    check: Run the Node and browser suites on the integrated branch and confirm
      that the existing tests of the reached steps pass without edits.
    risk_if_wrong: A flow record keeps steps that the delivered Plane no longer
      follows.
    about: [flow:artifact-plane:agent-session-guidance, flow:artifact-plane:change-impact,
      flow:artifact-plane:change-review, flow:artifact-plane:context-handoff,
      flow:artifact-plane:knowledge-authoring, flow:artifact-plane:repository-exploration,
      flow:artifact-plane:source-retrieval, flow:artifact-plane:unit-inspection]
acceptance:
  - id: stale-number
    criterion: The validator reports version-number-invalid for a branch version
      record at the path of a protected record of another change.
  - id: delivered-change
    criterion: A change whose number another change took on the protected branch
      stays undelivered for requirement-uncovered and the tier check.
  - id: bundle-parity
    criterion: The built bundle validator and the Plane validator give the same
      result on the new fixtures.
  - id: integration
    criterion: The Node suite passes, the validator reports ok true for this
      repository, and the disposable-clone scenario of change-runbooks gives
      the expected error.
    integration: true
evidence:
  - criterion: stale-number
    method: Fixture test of a branch record at the path of a protected record of another change, failing before the fix.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-version-source/tasks/01-established-versions.md#evidence
  - criterion: delivered-change
    method: The same fixture gives requirement-uncovered for an added ID and tier-mismatch from the tier check.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-version-source/tasks/01-established-versions.md#evidence
  - criterion: bundle-parity
    method: The built add-validate.mjs and validate-knowledge.mjs compared on both fixtures and in the live check.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-version-source/tasks/02-validation.md#evidence
  - criterion: integration
    method: Node and browser suites, the repository validator and the change-runbooks scenario in a disposable clone.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-version-source/tasks/02-validation.md#evidence
---

# Plane version source

## Purpose

The validator finds a stale version number on a change branch also after another change of the same artifact took that number on the protected branch.

## Included scope

The established-record and delivered-change tests of the validator checks. The [change record](../../artifact-plane/changes/change-version-source/README.md) lists the details.

## Excluded scope

The same test in the status views and version preparation of the Plane, and the ADD contract and guidelines.

## Impact reconciliation

The impact service (`get_change_impact`, origins `server/record-checks.js`, `server/knowledge-baseline.js` and `scripts/validate-knowledge.mjs`, depth 2) reported complete and fresh coverage on 19 October 2026: 17 direct and 47 transitive entities, all in artifact-plane, 24 reached steps in 8 flows, and 0 unresolved items. The flows are agent-session-guidance, change-impact, change-review, context-handoff, knowledge-authoring, repository-exploration, source-retrieval and unit-inspection. Each one is reached through an import of the record checks or the baseline reader. The behavior that these steps use stays the same, except for the diagnostics of the same-path scenario (claim reached-flows-kept). Version preparation in knowledge-authoring is out of scope.
