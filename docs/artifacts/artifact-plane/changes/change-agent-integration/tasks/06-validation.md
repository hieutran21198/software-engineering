---
id: validation
depends_on: [configuration]
covers:
  - element: requirements/agent-integration.md
    ids: [AI12, AIA6, AIA7]
---

# Validation

## Scope and ownership

Coordinator. The live check with both harnesses, the flow records, the claims, the unit evidence and the version.

## Governing knowledge

specifications/agent-integration.md: Flows, Validation; the unit brief plane-agent-integration.

## Definition of Done

- [ ] A Claude Code session and a Codex session in this repository start with the committed configuration and the executable built by CI: each receives the session context and lists the MCP tools; the harness versions are recorded.
- [ ] The same sessions with Plane 1.22.0 on the path, and with no executable, run tools without a refusal (claim harness-launch).
- [ ] The PreToolUse input of a Codex subagent is recorded (claim codex-subagent-identity); the five claims have a status from evidence.
- [ ] specifications/flows/agent-session-guidance.md exists and execution-observation has the new supports; the validator reports no error.
- [ ] The Node, browser and Go suites and the executable smoke check pass; the unit evidence is complete.

## Evidence
