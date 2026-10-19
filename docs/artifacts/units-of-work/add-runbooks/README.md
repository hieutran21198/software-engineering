---
unit_of_work: add-runbooks
changes:
  - artifact: artifact-driven
    change: change-runbooks
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-driven
    flow: version-publication
    effect: modify
flow_assessment: Discovery on 19 October 2026 read the five ADD flow records,
  the workflow, the coordinator reference, the layout contract and the
  continuous-integration pattern. Change-delivery changes because its
  requirement, approval and implement steps follow the reverse, amendment,
  stop, live-check and failed-check runbooks. Version-publication changes
  because its version, establish and shared steps follow the renumber and
  after-merge runbooks. Adoption, dependency-gates and unit-validation keep
  their steps; a withdrawn member leaves a unit through the existing brief
  edit. No Artifact Plane or Story-Driven flow is affected.
acceptance:
  - id: runbooks-complete
    criterion: The bundle has seven runbooks with when, inputs, steps, done
      condition and owner decisions, and the coordinator skill links each
      situation to its runbook.
  - id: replay
    criterion: Each runbook, applied to its situation from this repository,
      gives steps that the coordinator can follow without other guidance.
  - id: integration
    criterion: Links resolve without parent links, the Go tests pass, the
      website builds and the validator reports no new diagnostic.
    integration: true
evidence:
  - criterion: runbooks-complete
    method: Reading check of the guide against the seven contract rows, and of the Read-when rows and the core size of the coordinator skill.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-runbooks/tasks/01-runbook-guide.md#evidence
  - criterion: runbooks-complete
    method: Reading check of the lifecycle rules, the Corrections link and the seven coordinator rows.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-runbooks/tasks/02-rule-guidance.md#evidence
  - criterion: replay
    method: Replay on four recorded situations of this repository and on renumber, stop and reverse in a disposable clone.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-runbooks/tasks/03-validation.md#evidence
  - criterion: integration
    method: Link script, Go tests, website build and the validator on the change and the repository.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-runbooks/tasks/03-validation.md#evidence
---

# ADD runbooks

## Purpose

A coordinator who meets a recurring situation finds one ordered procedure for it in the bundle, with the owner decisions marked.

## Included scope

Seven runbooks in the ADD bundle, the rules for a change that stops and for the reversal of an established version, and the links from the coordinator skill. The [change record](../../artifact-driven/changes/change-runbooks/README.md) lists the details.

## Excluded scope

Plane features or hooks that run a runbook, runbooks for other roles, release automation, release tag policy of consumer projects, and the adopted bundle of Story-Driven.
