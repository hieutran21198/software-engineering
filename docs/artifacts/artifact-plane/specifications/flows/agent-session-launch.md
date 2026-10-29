---
flow:
  id: agent-session-launch
  artifact: artifact-plane
  title: Start and follow an agent session
  trigger: A person starts a session for an ADD role from the workbench with a launch profile.
  outcome: The harness tool of the profile runs the role in the selected worktree, and the workbench shows its state, task progress, output and permission requests without approving work.
  entry_steps:
    - choose
  steps:
    - id: choose
      title: Choose the role, change, task and launch profile, or write a request for new work
      supports:
        - orchestration-contract
    - id: validate
      title: Check the start rules and bind an implementer attempt
      supports:
        - orchestration-contract
        - task-dag-contract
        - store
    - id: start
      title: Start the harness tool through its adapter in the runner
      supports:
        - orchestration-contract
        - adapter-decision
        - runner-decision
    - id: converse
      title: Answer permission requests and send messages, or work in the terminal
      supports:
        - orchestration-contract
        - adapter-decision
        - relay-decision
    - id: observe
      title: Record states and show the task progress and output from Git
      supports:
        - orchestration-contract
        - store
        - hook-command
    - id: finish
      title: End the turn or the session
      supports:
        - orchestration-contract
        - recovery-flow
  transitions:
    - from: choose
      to: validate
    - from: validate
      to: choose
      condition: A start rule fails; the person changes the choice.
    - from: validate
      to: start
      condition: All start rules pass and the task has no open attempt.
    - from: start
      to: converse
    - from: converse
      to: observe
    - from: observe
      to: converse
      condition: More updates arrive, or the person sends another prompt.
    - from: observe
      to: finish
      condition: The turn ends, the process stops or the person ends the session.
  support:
    - id: orchestration-contract
      kind: element
      artifact: artifact-plane
      element: specifications/agent-orchestration.md
      requires: Profiles, start rules, commands, lifecycle events, states, adapters, runner and workbench behavior.
      basis: documented
    - id: task-dag-contract
      kind: element
      artifact: artifact-driven
      element: specifications/task-dag.md
      requires: Task membership and prerequisites of the task that an implementer session names.
      basis: documented
    - id: adapter-decision
      kind: element
      artifact: artifact-plane
      element: decisions/018-agent-session-adapters.md
      requires: ACP for structured sessions and herdr panes for sessions that a person drives.
      basis: documented
    - id: relay-decision
      kind: element
      artifact: artifact-plane
      element: decisions/021-embedded-terminal-relay.md
      requires: The session page embeds a terminal session through ttyd behind the server checks.
      basis: documented
    - id: runner-decision
      kind: element
      artifact: artifact-plane
      element: decisions/019-session-runner-process.md
      requires: One runner process hosts ACP sessions across server restarts.
      basis: documented
    - id: store
      kind: implementation
      path: apps/artifact-plane/server/runtime-store.js
      symbol: RuntimeStore
      requires: Bind an implementer attempt explicitly and keep events outside repositories.
      basis: static
    - id: hook-command
      kind: implementation
      path: apps/artifact-plane/server/agent-hook.js
      symbol: observe
      requires: Record hook observations of the harness session of an attempt.
      basis: static
    - id: recovery-flow
      kind: flow
      artifact: artifact-plane
      flow: agent-session-recovery
      requires: Continue, resume or respawn after the session stops.
      basis: documented
  gaps:
    - The session API, runner, adapters and workbench pages do not exist yet; the Plan adds them and their tests.
    - The live check answered the ACP shape of Command Code and the Claude plan refusal; the Gemini terminal model flag and the Antigravity terminal command stay open claims of the contract.
    - A terminal session reports coarse states only, from herdr status and hooks, and herdr does not detect every harness tool.
  exclusions:
    - Sessions that an agent starts, automatic dispatch, approvals recorded by Plane and credential handling.
---

# Start and follow an agent session

## Coverage

The structured record owns this journey. The contract in specifications/agent-orchestration.md owns the detailed rules. Implementation support is limited to the existing store and hook code that the journey reuses; the new code is planned work.
