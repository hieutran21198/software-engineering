---
unit_of_work: agent-orchestration
changes:
  - artifact: artifact-plane
    change: change-agent-orchestration
affected_flows:
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
  - artifact: artifact-plane
    flow: agent-session-launch
    effect: create
  - artifact: artifact-plane
    flow: agent-session-recovery
    effect: create
flow_assessment: Inspected the execution observation and agent session guidance flows, the runtime store, the hook command, the HTTP server and the change page task details. Sessions that a person starts bind to tasks like observed attempts, so execution observation changes. Session start and session recovery are new journeys; the Specification defines them. Agent session guidance keeps its behavior, because started sessions use the existing hooks and MCP server.
acceptance:
  - id: orchestration
    criterion: A person starts, follows, stops and recovers agent sessions of Claude Code, Codex, OpenCode V2, Command Code and Antigravity CLI from the workbench, with a chosen model for each session.
  - id: boundaries
    criterion: Plane stores no message text or credential, skips no permission prompt, approves nothing and keeps the delivered observation unchanged.
  - id: integration
    criterion: Node, browser and record checks and the live harness check pass together, and the workbench matches the approved UI/UX mockups.
    integration: true
evidence: []
---

# Agent orchestration

## Purpose

Run ADD sessions across several harness tools from Artifact Plane. Each vendor's model runs in that vendor's own harness tool, and a person picks the harness tool and model for each role and task.

## Included scope

A start of ADD work with a written request, role sessions in a terminal that the session page embeds, person-started sessions with launch profiles, agent settings (providers, profiles and a default profile for each role), task progress and output for each session, permission requests, waiting indicators and open-terminal actions for terminal sessions, and recovery after an interruption.

## Excluded scope

Sessions that an agent starts, automatic dispatch, remote runners and team mode, approvals recorded by Plane and credential handling. These need later outcomes.
