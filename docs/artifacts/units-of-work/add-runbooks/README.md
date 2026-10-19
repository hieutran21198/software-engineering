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
claims:
  - id: reached-flows-kept
    kind: assumption
    statement: The flows dependency-gates and unit-validation of ADD and
      knowledge-authoring, change-review, context-handoff,
      repository-exploration, repository-refresh and unit-inspection of
      Artifact Plane keep their steps and supports, although the impact
      service reaches them through specifications/knowledge-layout.md.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/add-runbooks/README.md#impact-reconciliation
    check: Run the impact service on the branch difference with main at depth
      2, confirm that each of the eight flows is reached only through the
      knowledge-layout.md references of the Plane specifications
      knowledge-editing.md and knowledge-layout-reading.md or through the
      layout contract support, and search those two specifications for a rule
      about stopped or reversed changes.
    risk_if_wrong: A Plane reader or an ADD flow follows a rule that the new
      lifecycle text changes.
    about: [flow:artifact-driven:dependency-gates, flow:artifact-driven:unit-validation,
      flow:artifact-plane:knowledge-authoring, flow:artifact-plane:change-review,
      flow:artifact-plane:context-handoff, flow:artifact-plane:repository-exploration,
      flow:artifact-plane:repository-refresh, flow:artifact-plane:unit-inspection]
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

## Impact reconciliation

The impact service on the branch difference with `main` (depth 2) reaches ten flows. Two are declared above. The other eight keep their steps and supports:

| Flow | Reached through | Why the flow is kept |
| --- | --- | --- |
| artifact-driven dependency-gates | layout contract support of the resolve and recheck steps | The two new rules add no record and do not change how established and proposed knowledge is derived. |
| artifact-driven unit-validation | layout contract support of the delivery and publication steps | A withdrawn member leaves the brief through an ordinary brief edit; the validator checks the edited brief as before (`missing-member` before, `ok: true` after, in task 03 of the change). |
| artifact-plane knowledge-authoring | knowledge-editing.md references the layout contract | The Plane writes the same records; no format changes. |
| artifact-plane change-review | knowledge-layout-reading.md references the layout contract | The comparison with the protected branch is unchanged. A branch that a withdrawn change keeps can add `open-change-conflict` warnings to later changes until the owner removes it, as the two delivered local branches do on this branch. |
| artifact-plane context-handoff | the same reference | The listed knowledge files are derived from Git as before. |
| artifact-plane repository-exploration | the same reference | Identity, change and version records keep their format. |
| artifact-plane repository-refresh | the same reference | Invalidation on a moved protected branch is unchanged. |
| artifact-plane unit-inspection | the same reference | Version records and their introducing commits resolve as before; a reversal adds an ordinary version record. |

Neither Plane specification has a rule about stopped or reversed changes (a search for withdraw, stop, reverse, abandon and pause finds no match). The Plane needs no companion change.
