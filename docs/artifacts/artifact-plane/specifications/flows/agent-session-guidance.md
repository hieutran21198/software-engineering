---
flow:
  id: agent-session-guidance
  title: Guide an agent session with the change state and the ADD limits
  trigger: Claude Code, Codex or Antigravity runs the hook command of the
    executable, or an agent calls an MCP tool of the Plane.
  outcome: The person sees the workbench address of the repository, the agent
    knows the state of its change, cannot run the three actions
    that ADD reserves for people through a recognized command, and fixes or
    explains record errors before it stops.
  entry_steps:
    - start
  steps:
    - id: start
      title: Give the change state of the worktree at session start or on request
      supports:
        - contract
        - status
        - dispatcher
        - mcp
        - guidance-tests
        - mcp-tests
        - workbench-contract
        - workbench
        - workbench-tests
    - id: act
      title: Refuse a commit or push to main or master and a pull request merge
      supports:
        - contract
        - reserved
        - dispatcher
        - guidance-tests
        - hook-tests
    - id: finish
      title: Ask once for a fix of record errors before the agent stops
      supports:
        - contract
        - stop
        - dispatcher
        - mcp
        - guidance-tests
        - hook-tests
  transitions:
    - from: start
      to: act
    - from: act
      to: act
      condition: The agent calls another tool.
    - from: act
      to: finish
      condition: The agent stops.
    - from: finish
      to: act
      condition: The stop check fails and the agent continues.
  support:
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/agent-integration.md
      requires: Define the hook outputs, the session context, the reserved
        actions, the stop check, the MCP tools and the fail-open rules.
      basis: documented
    - id: status
      kind: implementation
      path: apps/artifact-plane/server/agent-guidance.js
      symbol: worktreeStatus
      requires: Derive the state of the changes of one worktree with the
        functions of the change page.
      basis: static
    - id: reserved
      kind: implementation
      path: apps/artifact-plane/server/agent-guidance.js
      symbol: reservedAction
      requires: Find a commit or push to a protected branch and a pull request
        merge in a shell command without running it.
      basis: static
    - id: stop
      kind: implementation
      path: apps/artifact-plane/server/agent-guidance.js
      symbol: stopCheck
      requires: Fail only on record errors of a current change, once for each
        stop sequence.
      basis: static
    - id: dispatcher
      kind: implementation
      path: apps/artifact-plane/server/agent-hook.js
      symbol: hookOutput
      requires: Answer each hook event with one JSON object within its time
        limit and never stop agent work on a failure.
      basis: static
    - id: mcp
      kind: implementation
      path: apps/artifact-plane/server/flow-mcp.js
      symbol: createFlowMcpServer
      requires: Offer get_change_status and check_records with the same results
        as the hook and the validator, and send the instructions.
      basis: static
    - id: workbench-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ui-discovery.md
      requires: Define the identity route, the workbench step, its states and
        lines, and the parts of the SessionStart output.
      basis: documented
    - id: workbench
      kind: implementation
      path: apps/artifact-plane/server/workbench.js
      symbol: workbenchStep
      requires: Find or start a Plane server at the port and give the line for
        the person without opening a browser.
      basis: static
    - id: workbench-tests
      kind: test
      path: apps/artifact-plane/test/workbench.test.js
      requires: Check the four states, the turn-off variable, the port variable
        and the hook output with a free, a Plane and another server.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/01-workbench-step.md
    - id: guidance-tests
      kind: test
      path: apps/artifact-plane/test/agent-guidance.test.js
      requires: Exercise the status, the context text, the reserved-action table
        and the stop check.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/01-guidance-functions.md
    - id: hook-tests
      kind: test
      path: apps/artifact-plane/test/agent-hook.test.js
      requires: Send recorded Claude Code, Codex and Antigravity inputs and
        check the outputs, the fail-open cases and the stored fields.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/03-hook-command.md
        - docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/01-antigravity-hook-adapter.md
    - id: mcp-tests
      kind: test
      path: apps/artifact-plane/test/agent-mcp.test.js
      requires: Check the tools, the instructions, the version and the default
        root through an MCP client.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/04-mcp-tools.md
  gaps:
    - An alias, a script, a subshell or command substitution that runs git is
      not inspected; the skills and the team review remain the control.
    - The live behavior of each harness is checked on the versions recorded in
      the validation evidence only.
  exclusions:
    - Approving plans, pushing, merging, establishing versions or starting
      agents.
  artifact: artifact-plane
---

# Guide an agent session with the change state and the ADD limits

## Coverage

The structured record owns this journey, its source reasons, evidence basis, gaps and exclusions. The hook and the MCP tools are two entries to the same functions. A refusal or a stop request is a guardrail for a recognized command or a record error; it does not prove that a session follows ADD.
