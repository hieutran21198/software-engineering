---
unit_of_work: plane-version-source
changes:
  - artifact: artifact-plane
    change: change-version-source
affected_flows: []
flow_assessment: Discovery on 19 October 2026 read the eleven Plane flow
  records and the validator, record-check and baseline modules. Change-review
  and agent-session-guidance show validator results, and their steps stay the
  same; only the diagnostics of one scenario change. Knowledge-authoring keeps
  version preparation unchanged, because that operation is out of scope. No
  flow is created, modified or removed, and no ADD or Story-Driven flow is
  affected.
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
evidence: []
---

# Plane version source

## Purpose

The validator finds a stale version number on a change branch also after another change of the same artifact took that number on the protected branch.

## Included scope

The established-record and delivered-change tests of the validator checks. The [change record](../../artifact-plane/changes/change-version-source/README.md) lists the details.

## Excluded scope

The same test in the status views and version preparation of the Plane, and the ADD contract and guidelines.
