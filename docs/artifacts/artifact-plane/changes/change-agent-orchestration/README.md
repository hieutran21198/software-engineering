---
tier: medium
---

# Run ADD sessions across harness tools

## Reason and scope

Plane observes ADD work today. The owner wants Plane to also start and coordinate agent sessions across harness tools. Vendors restrict their subscription models to their own harness tools, so one harness tool cannot serve every model. With Plane as the coordinator, a person can give hard ADD roles to a frontier model and easy tasks to a fast model, each in the vendor's own harness tool.

This change adds person-started agent sessions, agent settings for providers, profiles and role defaults, a view of task progress and output for each session, permission requests, and recovery after an interruption. Observation stays as delivered. The shared outcome is in `docs/artifacts/units-of-work/agent-orchestration/README.md`.

The change edits one artifact in this repository. It adds requirement IDs, two decisions and two flows, so it is medium. The owner approves the UI/UX mockups before the implementation plan.

Impact assessment: the impact reader names the hook command, the runtime store, the OpenCode bridge and their tests as potential code impact. No other artifact consumes the changed elements. The only new reference is the task DAG contract of artifact-driven.

## Exclusions

Sessions that an agent starts, automatic dispatch, remote runners and team mode, a terminal inside the workbench, approvals recorded by Plane, and credential handling.
