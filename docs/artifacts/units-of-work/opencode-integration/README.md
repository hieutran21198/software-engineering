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
  flows and browser presentation remain unchanged. Target 2.1.2 package and
  native-runtime probes verified supported tool and event shapes. Branch impact
  analysis also reached project-tabs through the shared ui-discovery document;
  the changed section only describes native context output, not tab behavior.
  Final integration checks cover the reached browser paths and evidence limits.
claims:
  - id: project-tabs-unchanged
    kind: assumption
    statement: Adding OpenCode context output to the shared discovery contract
      does not change the project-tabs journey.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/opencode-integration/README.md#impact-assessment
      - docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/04-integration-validation.md#reached-browser-suites
    check: Compare the branch with protected browser and workbench sources and
      run the reached project-tabs and recorded-execution browser suites.
    risk_if_wrong: A reached flow would be omitted from the declared change scope.
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
  - criterion: plane-setup
    method: Run native project configuration checks, the full Node suite and a real OpenCode 2.1.2 activation with a private MCP connection.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/04-integration-validation.md#final-combined-checks
  - criterion: lifecycle
    method: Run both OpenCode bridge suites and the native activation check covering context, MCP catalog, an allowed command and a refused reserved action.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/04-integration-validation.md#native-opencode-activation
  - criterion: integration
    method: Run the combined Node, Go, executable smoke, reached browser suites and both knowledge validators, then classify the one flaky browser case.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/04-integration-validation.md#final-combined-checks
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

The ADD member's implementation checks are recorded in its validation task. Its required knowledge and code have landed. The Plane member is implemented and validated, and its proposed 1.27.0 version awaits team review. OpenCode has no stop blocking, ambiguous execution terminals stay unknown, and third-party shell rewrites remain outside the verified mapping. Final completion requires the Plane PR to merge.

## Combined checks

All member checks are recorded in the tasks they belong to. The Plane validation task holds the final combined Node, Go, executable, browser and native OpenCode results with their commands. The ADD validation task holds the bundle, profile and website results. This brief references them rather than copying results.

## Native activation evidence

The real OpenCode 2.1.2 runtime loaded the committed plugin entry, connected the Plane MCP server with 13 tools, received the change context and workbench line in model requests, ran a permitted command, and refused a reserved commit on a local protected branch before starting a process. The check used a deterministic local provider, so it proves harness activation and policy behavior, not model inference, validation or establishment.

## Upstream publication

Verified PR 57 is merged into `main` through GitHub and fetched protected Git. Compared the complete predecessor delivery tree with the fetched protected revision using `git diff --exit-code`; the trees matched. Fast-forwarded the clean local `main` checkout to that fetched revision. The protected branch contains ADD 3.3.0's identity and version records, originating task path set and bytes, canonical guidance, four profiles and registration tests. No companion implementation repository is required for this ADD member.

The protected-branch CI runs were queued or running when inspected. Local implementation checks remain recorded in the delivered task. Publication is verified separately from those pending CI results and does not establish the undelivered Plane member. Rechecked the Plane plan's upstream specification reference against the established contract; no difference changes the approved scope.

## Impact assessment

The configured Plane MCP `get_change_impact` ran on the branch difference against `main` with depth 2. It reached the two declared flows and `project-tabs`; it reported no unresolved entity. The extra journey is reached through the shared `ui-discovery.md` document. Its only changed section describes OpenCode context output. `git diff main` confirmed no changes to Workspace.jsx, the workbench, hook dispatcher, runtime store, shared guidance or MCP implementation. The browser tab address contract and implementation remain unchanged. This is a source-backed static assessment; integration task evidence records the selected regression checks separately.

Coverage includes declared knowledge, ESM/Go relationships, mirrors, history and shared vocabulary. It excludes dynamic calls, injected functions and process/HTTP boundaries. The native bridge's subprocess boundary therefore needs the explicit runtime checks in the plan. Historical and lexical candidates in shared hook/MCP/reader/Nix files do not imply changed behavior; unchanged source contracts and their executed regressions supply the review boundary.
