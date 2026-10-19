---
unit_of_work: plane-human-guidance
changes:
  - artifact: artifact-plane
    change: change-human-guidance
affected_flows:
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: knowledge-authoring
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
flow_assessment: Discovery on 19 October 2026 read the ten Plane flow records,
  the work model, the change brief, the top bar, the sidebar, the editing
  forms, the server entry, the model installer, the CI workflow and
  screenshots of the Plane at 1440 and 390 pixels. Repository-exploration
  changes because the person starts an executable and the work and artifact
  pages show status, next step and version state. Change-review changes
  because the change page shows the status, the stepper agrees with the
  tasks and counts name what they count. Knowledge-authoring changes because
  destructive controls get labels or confirmations. Unit-inspection changes
  because it uses the shared status vocabulary. Source-retrieval changes
  because the executable installs the model. The steps of these flows keep
  their meaning; their supports change. Change-impact, context-handoff,
  execution-observation, project-tabs and repository-refresh keep their steps
  and supports. No ADD or Story-Driven flow is affected.
claims:
  - id: reached-flows-kept
    kind: assumption
    statement: The flows project-tabs, repository-refresh, change-impact,
      context-handoff and execution-observation keep their steps and supports,
      although the impact service reaches them from this change.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/plane-human-guidance/README.md#impact-reconciliation
    check: Run the impact service on the branch difference at depth 2 and confirm
      that each of the five flows is reached only through the origins listed in
      the reconciliation, each of which changes labels, styles or the location
      of an unchanged function.
    risk_if_wrong: A flow record keeps steps that the delivered Plane no longer
      follows.
    about: [flow:artifact-plane:project-tabs, flow:artifact-plane:repository-refresh,
      flow:artifact-plane:change-impact, flow:artifact-plane:context-handoff,
      flow:artifact-plane:execution-observation]
acceptance:
  - id: install
    criterion: A person downloads the Linux AMD64 executable built by CI, checks
      it against SHA256SUMS and opens this repository in it without Node.js on
      the path; every target file passes its start check in CI.
  - id: next-step
    criterion: On a branch with a change that waits for merge, the work page
      lists the change under Current work with its status and next step, and
      the change page agrees.
  - id: consistent
    criterion: No fixture page shows two states of one fact that disagree, and
      prepared and established versions have different labels.
  - id: distinct
    criterion: Links, actions, primary actions, destructive actions and statuses
      have their own computed styles on the six main pages, and every status
      term opens its explanation.
  - id: owner-look
    criterion: The owner looked at screenshots of the work, artifact, change and
      flow pages at 1440 and 390 pixels and at the downloaded executable
      before the version.
  - id: many-worktrees
    criterion: POST /api/explore returns 200 on this repository with its
      registered worktrees and on a fixture with 12 worktrees.
  - id: integration
    criterion: The Node, browser and Go suites pass, and the release workflow
      check refuses a plane-v tag that differs from current_version.
    integration: true
evidence:
  - criterion: install
    method: Download the CI artifact, check SHA256SUMS and run the Linux AMD64 file without Node.js; every target passes its start check in CI.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/08-validation.md#evidence
  - criterion: next-step
    method: Browser tests of statuses, next steps and Current work membership on the work and change pages.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md#evidence
  - criterion: consistent
    method: Node and browser tests of the stepper rule, named counts and version labels.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/01-status-model.md#evidence
  - criterion: consistent
    method: Browser tests of prepared and established labels and the stepper with an unchecked item.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md#evidence
  - criterion: distinct
    method: Browser tests of control styles, badges and glossary terms on the six pages.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/04-guidance-validation.md#evidence
  - criterion: owner-look
    method: The owner looked at screenshots and executable checks and answered accepted.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/08-validation.md#evidence
  - criterion: many-worktrees
    method: POST /api/explore on a 12-worktree fixture and on this repository.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/09-explore-scale.md#evidence
  - criterion: integration
    method: Node, browser and Go suites in the pull request CI run, and the release version check tests.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/08-validation.md#evidence
---

# Plane human guidance

## Purpose

People install the Plane like `se-adopt` and see on each page what to do next and which element is which.

## Included scope

The release of the Plane as executable files, and human guidance and visual distinction on the work, artifact, document, change, unit and flow pages. The [change record](../../artifact-plane/changes/change-human-guidance/README.md) lists the details.

## Excluded scope

ADD bundle and `se-adopt` changes, a requirement-ID coverage view, an Impact page default, History grouping, a dark theme, paid code signing, installers and auto-update. No acceptance criterion is a framework score: the scores stay with independent assessors.

## Impact reconciliation

The impact service on the branch difference at depth 2 (19 October 2026) reaches five flows that the brief does not declare, each directly through one or two origins:

| Flow | Origins | Why the steps stay |
| --- | --- | --- |
| project-tabs | specifications/authoring-workbench.md | The amendment changes the Labels table and the empty state only. |
| repository-refresh | src/main.jsx, src/Sidebar.jsx | Refresh keeps loaded evidence of current changes with `isCurrent`, and the sidebar changes labels and badges; observe and apply keep their meaning. |
| change-impact | server/flow-mcp.js | `runFlowMcpStdio` moved from flow-mcp-stdio.js into this module; the tools and their behavior are unchanged. |
| context-handoff | server/flow-mcp.js | The same move. |
| execution-observation | src/styles.css | The stylesheet changes control and badge styles only. |
