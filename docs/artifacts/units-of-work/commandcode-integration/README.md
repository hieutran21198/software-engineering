---
unit_of_work: commandcode-integration
changes:
  - artifact: artifact-driven
    change: change-commandcode-support
  - artifact: artifact-plane
    change: change-commandcode-support
affected_flows:
  - artifact: artifact-plane
    flow: agent-session-guidance
    effect: modify
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
flow_assessment: Discovery inspected ADD adoption and role guidance, the OpenCode
  delivery, Plane agent integration and both affected flow records, and Command
  Code 1.85.1 on this machine. Live probes recorded skill discovery, project MCP
  discovery and the four hook payloads. ADD phases, adoption copy behavior and
  publication gates do not change. Plane guidance and observation gain a command
  hook entry. Browser presentation and other Plane flows remain unchanged.
  Headless mode did not fire SessionStart, hook inputs carry no agent_id, and
  plan mode skips hooks; the affected contracts state these limits.
acceptance:
  - id: add-setup
    criterion: A Command Code user loads the six canonical ADD skills, reads
      focused AGENTS.md instructions and delegates an approved implementer task
      without copying the bundle.
  - id: plane-setup
    criterion: Project .mcp.json and .commandcode/settings.json connect Command
      Code to the Plane and leave other harness configuration unchanged.
  - id: lifecycle
    criterion: Command Code hook payloads supply session context,
      reserved-action refusals, the stop check and task binding under the
      existing policy.
  - id: integration
    criterion: Combined ADD, Plane and live headless checks pass, with
      SessionStart fixture evidence and the headless limit distinguished.
    integration: true
evidence:
  - criterion: add-setup
    method: Run the ADD Go, link and website checks and live skill and MCP discovery.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-commandcode-support/tasks/02-validation.md#evidence
  - criterion: plane-setup
    method: Run the Command Code configuration test and the executable smoke check.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/02-project-setup.md#evidence
  - criterion: lifecycle
    method: Run recorded payload tests and a live headless refusal and binding check.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/03-integration-validation.md#live-headless-check
publication_reviews:
  - artifact: artifact-driven
    version: 3.5.0
    source: docs/artifacts/units-of-work/commandcode-integration/README.md#add-publication
    required_changes:
      - repository: https://github.com/hieutran21198/software-engineering
        scope: ADD knowledge, implementer profile, guidance and regression tests.
        pull_request: https://github.com/hieutran21198/software-engineering/pull/65
---

# Integrate ADD with Command Code

## Purpose

Support the full ADD setup in Command Code alongside the existing harnesses. The
ADD bundle owns guidance, skill discovery and the implementer profile. Artifact
Plane owns project MCP and lifecycle hook configuration.

## Included scope

- Command Code setup guidance, repository instructions and one native
  implementer profile.
- Project `.commandcode/settings.json` hooks and reuse of the existing
  `.mcp.json` server registration.
- Hook input compatibility for the documented and observed Command Code payloads.
- Contract, fixture and live headless validation, with the recorded limits.

## Excluded scope

- Global user configuration, new workflow state, automatic approval, merges and
  deployment.
- Interactive Command Code mode automation, force continuation and browser UI
  changes.
- A native profile for the coordinator, product owner or technical lead, because
  a Command Code subagent cannot interview the person.

## Delivery boundary

The Plane consumes established ADD knowledge. Implement and publish the ADD
member first. Start dependent Plane implementation only after the required
upstream change establishes on the protected branch. Membership does not replace
this gate.

## Combined checks

The ADD member passed the Go suites, the website build, the knowledge validator
and live skill and MCP discovery. Its 3.5.0 version is established on `main`.
The Plane member passed the full Node suite, the production build, the built
executable smoke check, the Go suites, the validator, and a live headless refusal
and inferred binding. The local browser suite could not launch Chromium because
`libnspr4.so` is absent; CI runs it. The integration criterion stays open until
the Plane pull request merges.

## Add publication

Verified PR 65 is merged into `main` through GitHub and fetched protected Git.
The protected branch contains ADD 3.5.0's identity and version records, the
originating task path set and bytes, the canonical guidance, the implementer
profile and its regression tests. No companion implementation repository is
required for this member. The Plane plan was proposed knowledge in that pull
request; its implementation started only after this merge.

## Evidence limits

Command Code 1.85.1 discovered the six project skills and the project MCP server.
A headless run recorded PreToolUse, PostToolUse and Stop payloads, and did not
fire SessionStart on startup or resume. Context injection therefore stays a
fixture check until an interactive session records activation. Hook inputs carry
no agent_id, and Command Code skips hooks in plan mode.
