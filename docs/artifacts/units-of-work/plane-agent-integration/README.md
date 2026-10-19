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
claims:
  - id: reached-flows-kept
    kind: assumption
    statement: The flows repository-exploration, change-impact, context-handoff,
      source-retrieval, knowledge-authoring and repository-refresh keep their
      steps and supports, although the impact service reaches them from this
      change.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/plane-agent-integration/README.md#impact-reconciliation
    check: Run the impact service on the branch difference with main and confirm
      that each of the six flows is reached only through the origins listed in
      the reconciliation, and that the existing tests of those origins pass
      with only the tool-name lists changed.
    risk_if_wrong: A flow record keeps steps that the delivered Plane no longer
      follows.
    about: [flow:artifact-plane:repository-exploration, flow:artifact-plane:change-impact,
      flow:artifact-plane:context-handoff, flow:artifact-plane:source-retrieval,
      flow:artifact-plane:knowledge-authoring, flow:artifact-plane:repository-refresh]
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
evidence:
  - criterion: one-command
    method: Recorded Claude Code and Codex inputs for each hook event against the dispatcher and the built executable; smoke checks of hook and runtime on six targets.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/03-hook-command.md#evidence
  - criterion: one-command
    method: Live sessions of Claude Code 2.1.301 and codex-cli 0.163.0 received the context, the refusal of a commit on main and the stop hook.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
  - criterion: fail-open
    method: Fail-open tests with invalid input, a broken store, a missing repository and slow steps, and a search of the store for forbidden fields.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/03-hook-command.md#evidence
  - criterion: fail-open
    method: Live sessions of both harnesses with Plane 1.22.0 and with no executable on the path ran their tools.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
  - criterion: inferred-binding
    method: Node tests of the binding rule and supersession, and a browser test of the binding labels.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/02-inferred-binding.md#evidence
  - criterion: inferred-binding
    method: Live subagent task reads in Claude Code and Codex created one inferred attempt each and none for the parent.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
  - criterion: mcp-status
    method: An MCP client compared get_change_status and check_records with worktreeStatus and validateKnowledge.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/04-mcp-tools.md#evidence
  - criterion: live-harnesses
    method: Live sessions of both harnesses in a clone of this branch with the committed configuration.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
  - criterion: integration
    method: Node, browser, Go and docs suites and the six executable smoke checks in the pull request CI run.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
---

# Plane agent integration

## Purpose

Agents in Claude Code and Codex use the released Plane executable: they get the state of their change, they are stopped before actions that ADD reserves for people, and the implementation graph shows their work.

## Included scope

The hook and observer commands of the executable, the session guidance hooks, the inferred binding, the MCP status and record-check tools, the README and the configuration of this repository. The [change record](../../artifact-plane/changes/change-agent-integration/README.md) lists the details.

## Excluded scope

ADD bundle and `se-adopt` changes, other harnesses, a check after each edit, other blocking rules and code signing.

## Impact reconciliation

The impact service on the branch difference with `main` (depth 2) reaches eight flows. Two are declared above. The other six keep their steps and supports:

| Flow | Reached through | Why the flow is kept |
| --- | --- | --- |
| repository-exploration | server/app.js (support of the select step) | `serve` starts the same server; the new commands are separate entries. |
| change-impact | server/flow-mcp.js (get_change_impact) | The tool keeps its input and result; the server adds two tools. |
| context-handoff | server/flow-mcp.js (review and context tools) | The tools keep their inputs and results. |
| source-retrieval | server/flow-mcp.js (flow tools) | The four flow tools keep their inputs and results. |
| knowledge-authoring | transitive, through the runtime store and the recorded page | Only the attempt labels change; no authoring step changes. |
| repository-refresh | transitive, through the runtime store | The store keeps its schema and events; only the turn of Claude Code events and the binding field are added. |

The existing MCP tests pass with only the tool-name lists and counts changed (tasks/04-mcp-tools.md of the change).

