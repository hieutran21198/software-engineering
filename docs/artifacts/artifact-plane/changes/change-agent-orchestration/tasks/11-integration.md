---
id: integration
depends_on: [sessions-ui]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO13, AO16, AO18, AOA7, AOA8]
  - element: requirements/opencode-support.md
    ids: [OP8]
---

# Integration and validation

## Scope and ownership

The coordinator joins the integrated branch and runs the combined checks. The coordinator also updates the application README, `apps/artifact-plane/integration/README.md` and the three affected flow records.

## Governing knowledge

`requirements/agent-orchestration.md`, `specifications/agent-orchestration.md`, the flows `agent-session-launch`, `agent-session-recovery` and `execution-observation`, and the approved mockup canvas.

## Definition of Done

- [ ] `npm test`, `npm run test:browser`, `npm run build`, `npm run build:validator`, `npm run build:app` with the application smoke check, and the record validator for the change pass. Record the counts.
- [ ] A test runs fixture sessions of both connection kinds and then scans the runtime store: it finds no message text, prompt, request or credential. Every new route refuses a foreign Host and a foreign Origin. No started command contains a permission-bypass option (AOA7).
- [ ] Without a settings file, the hooks, MCP tools, routes and workbench pages behave as before, and the existing suites pass unchanged (AO18).
- [ ] The OpenCode plugin bridge still creates no prompt and continues no work, and its tests pass (OP8).
- [ ] No route, runner method or prompt approves a plan, checks a DoD item, merges or writes a version record (AO16).
- [ ] The application README and the integration README describe launch profiles, herdr, ttyd, the runner and the Claude plan sign-in rule.
- [ ] The three flow records match the implementation, and their Mermaid diagrams render in the workbench.
- [ ] Screenshots at desktop width and at 390 pixels show each mockup screen. The owner looked at the screenshots or at the running interface, and the evidence records what the owner looked at (AOA8).
