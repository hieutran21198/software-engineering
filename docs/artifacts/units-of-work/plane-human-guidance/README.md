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
evidence: []
---

# Plane human guidance

## Purpose

People install the Plane like `se-adopt` and see on each page what to do next and which element is which.

## Included scope

The release of the Plane as executable files, and human guidance and visual distinction on the work, artifact, document, change, unit and flow pages. The [change record](../../artifact-plane/changes/change-human-guidance/README.md) lists the details.

## Excluded scope

ADD bundle and `se-adopt` changes, a requirement-ID coverage view, an Impact page default, History grouping, a dark theme, paid code signing, installers and auto-update. No acceptance criterion is a framework score: the scores stay with independent assessors.
