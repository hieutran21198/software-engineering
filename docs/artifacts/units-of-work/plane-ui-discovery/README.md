---
unit_of_work: plane-ui-discovery
changes:
  - artifact: artifact-plane
    change: change-ui-discovery
affected_flows:
  - artifact: artifact-plane
    flow: agent-session-guidance
    effect: modify
  - artifact: artifact-plane
    flow: project-tabs
    effect: modify
flow_assessment: Discovery on 20 October 2026 read the application command
  line, the hook command, the session guidance, the server start, the project
  tab module, the integration guide and the session start hook references of
  Claude Code and Codex. Agent-session-guidance changes its start step, which
  starts the server and shows the address. Project-tabs changes its open step,
  which opens a repository from the address. The other Plane flows and the ADD
  and Story-Driven flows are not reached by the requirements.
acceptance:
  - id: address-shown
    criterion: A new Claude Code or Codex session in an ADD repository shows the
      person the workbench address, and a Plane server answers at it.
  - id: repository-opened
    criterion: The address opens the repository of the session in the workbench.
  - id: safe-start
    criterion: The hook starts no second server, gives no address of another
      program, can be turned off, and never stops agent work.
  - id: integration
    criterion: The Node, browser and Go suites and the executable smoke check
      pass, and the validator reports ok true for the change.
    integration: true
---

# Plane UI discovery

## Purpose

A new user learns about the workbench when a session starts, and reaches the repository of the session from one address.

## Included scope

The server start and address line of the session start hook, the repository address of the workbench, the turn-off setting and the integration README. The [change record](../../artifact-plane/changes/change-ui-discovery/README.md) lists the details.

## Excluded scope

Opening a browser, the MCP tools, `se-adopt`, the ADD bundle and the install of the executable.
