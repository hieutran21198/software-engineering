---
unit_of_work: plane-agent-integration
changes:
  - artifact: artifact-plane
    change: change-agent-integration
affected_flows:
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
  - artifact: artifact-plane
    flow: agent-session-guidance
    effect: create
flow_assessment: Discovery on 19 October 2026 read the ten Plane flow records,
  the application command line, the runtime CLI and store, the MCP server, the
  integration guide, the README sections on MCP and the observer, the agent
  configuration of this repository, and the hook references of Claude Code and
  Codex. Execution-observation changes because the executable runs the hook and
  a task file read binds an agent. Agent-session-guidance is new, with context at
  session start, refusal of reserved actions and the record check at stop.
  Context-handoff and source-retrieval keep their steps; their MCP tools keep
  their behavior. Change-review, change-impact, knowledge-authoring,
  project-tabs, repository-exploration, repository-refresh and unit-inspection
  are not reached. No ADD or Story-Driven flow is affected.
acceptance:
  - id: one-command
    criterion: The executable runs the observer commands and one hook command,
      and recorded Claude Code and Codex hook inputs get the context, the
      refusals and the stop request of the requirement.
  - id: fail-open
    criterion: A missing executable, an older version, a broken store or invalid
      input never stops agent work, and no prompt, input, command or output is
      stored.
  - id: inferred-binding
    criterion: A task file read binds an agent in a linked worktree and a
      subagent, and an explicit binding replaces it.
  - id: mcp-status
    criterion: An MCP client gets the change state and the record checks with
      the same results as the change page and the validator.
  - id: live-harnesses
    criterion: A Claude Code session and a Codex session in this repository
      start with the committed configuration, receive the change state and list
      the MCP tools.
  - id: integration
    criterion: The Node, browser and Go suites and the executable smoke check
      pass.
    integration: true
evidence: []
---

# Plane agent integration

## Purpose

Agents in Claude Code and Codex use the released Plane executable: they get the state of their change, they are stopped before actions that ADD reserves for people, and the implementation graph shows their work.

## Included scope

The hook and observer commands of the executable, the session guidance hooks, the inferred binding, the MCP status and record-check tools, the README and the configuration of this repository. The [change record](../../artifact-plane/changes/change-agent-integration/README.md) lists the details.

## Excluded scope

ADD bundle and `se-adopt` changes, other harnesses, a check after each edit, other blocking rules and code signing.
