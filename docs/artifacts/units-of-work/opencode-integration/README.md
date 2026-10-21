---
unit_of_work: opencode-integration
changes:
  - artifact: artifact-driven
    change: change-opencode-support
  - artifact: artifact-plane
    change: change-opencode-support
affected_flows:
  - artifact: artifact-plane
    flow: agent-session-guidance
    effect: modify
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
flow_assessment: Discovery inspected ADD adoption and role guidance, the existing
  Antigravity outcome, Plane agent integration and execution contracts, both
  affected flow records, and the official OpenCode V2 configuration, skills,
  agents and plugin documentation. ADD adoption and delivery steps do not
  change. Plane guidance and observation gain a V2 plugin entry. Other Plane
  flows and browser presentation remain unchanged. Live plugin activation,
  shell permission resources and lifecycle event shapes need verification.
acceptance:
  - id: add-setup
    criterion: OpenCode users can load the six canonical ADD skills and select
      repository role profiles without copying the methodology.
  - id: plane-setup
    criterion: Project configuration connects OpenCode V2 to the Plane MCP
      server and loads the lifecycle bridge without changing other harnesses.
  - id: lifecycle
    criterion: Verified V2 interfaces supply change context, reserved-command
      guardrails and privacy-preserving observations with explicit capability limits.
  - id: integration
    criterion: Combined knowledge, bundle, bridge and regression checks pass,
      with live and fixture evidence distinguished.
    integration: true
evidence:
  - criterion: add-setup
    method: Run static registration and native profile checks, bundle and adoption Go suites, website build and knowledge validation.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-opencode-support/tasks/02-validation.md#automated-checks
publication_reviews:
  - artifact: artifact-driven
    version: 3.3.0
    source: docs/artifacts/units-of-work/opencode-integration/README.md#upstream-publication
    required_changes:
      - repository: https://github.com/hieutran21198/software-engineering
        scope: ADD knowledge, retained delivery tasks, bundle guidance, native OpenCode profiles and regression tests.
        pull_request: https://github.com/hieutran21198/software-engineering/pull/57
---

# Integrate ADD with OpenCode V2

## Purpose

Support the full ADD setup in OpenCode alongside the existing harnesses.

## Included scope

- Canonical bundle adoption guidance, repository instructions and four OpenCode role profiles.
- Project-local MCP configuration and a native V2 lifecycle plugin for Artifact Plane.
- Contract, fixture, failure-path and integration validation.

## Excluded scope

- OpenCode V1, global user configuration, new workflow state, automatic approval, merges and deployment.
- Automatic continuation after idle, invented stop interception, or browser UI changes.

## Delivery boundary

The Plane consumes established ADD knowledge. Implement and publish the ADD member first. Start dependent Plane implementation only after the required upstream change establishes on the protected branch. Membership does not replace this gate.

## Combined checks

The ADD member's implementation checks are recorded in its validation task. Its required knowledge and code have landed. The Plane member is checking its target runtime contracts before releasing bridge implementation. The unit's lifecycle and combined-integration criteria are not yet satisfied. No live OpenCode activation is claimed.

## Upstream publication

Verified PR 57 is merged into `main` through GitHub and fetched protected Git. Compared the complete predecessor delivery tree with the fetched protected revision using `git diff --exit-code`; the trees matched. Fast-forwarded the clean local `main` checkout to that fetched revision. The protected branch contains ADD 3.3.0's identity and version records, originating task path set and bytes, canonical guidance, four profiles and registration tests. No companion implementation repository is required for this ADD member.

The protected-branch CI runs were queued or running when inspected. Local implementation checks remain recorded in the delivered task. Publication is verified separately from those pending CI results and does not establish the undelivered Plane member. Rechecked the Plane plan's upstream specification reference against the established contract; no difference changes the approved scope.
