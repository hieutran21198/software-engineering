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
        - launch-dialog
    - id: validate
      title: Check the start rules and bind an implementer attempt
      supports:
        - orchestration-contract
        - task-dag-contract
        - store
        - session-api
    - id: start
      title: Start the harness tool through its adapter in the runner
      supports:
        - orchestration-contract
        - adapter-decision
        - runner-decision
        - runner
        - acp-client
        - terminal-adapter
    - id: converse
      title: Answer permission requests and send messages, or work in the terminal
      supports:
        - orchestration-contract
        - adapter-decision
        - relay-decision
        - terminal-relay
        - session-page
    - id: observe
      title: Record states and show the task progress and output from Git
      supports:
        - orchestration-contract
        - store
        - hook-command
        - session-output
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
    - id: session-api
      kind: implementation
      path: apps/artifact-plane/server/session-api.js
      symbol: SessionService
      requires: Check the start rules in order, bind the implementer attempt, build the initial prompt and serialize starts of one task.
      basis: static
    - id: runner
      kind: implementation
      path: apps/artifact-plane/server/session-runner.js
      symbol: SessionRunner
      requires: Host the adapters outside the server, keep live state in memory and write lifecycle events without text.
      basis: static
    - id: acp-client
      kind: implementation
      path: apps/artifact-plane/server/acp-client.js
      symbol: AcpSession
      requires: Negotiate ACP versions 1 and 2, set the profile model and level, and keep permission requests pending until the person answers.
      basis: static
    - id: terminal-adapter
      kind: implementation
      path: apps/artifact-plane/server/terminal-adapter.js
      symbol: TerminalSession
      requires: Start a named herdr session with the profile command and send no text or keys after the start.
      basis: static
    - id: terminal-relay
      kind: implementation
      path: apps/artifact-plane/server/terminal-relay.js
      symbol: TerminalRelays
      requires: Run ttyd on a private socket and forward only the bytes of the browser after the Host and Origin checks.
      basis: static
    - id: session-output
      kind: implementation
      path: apps/artifact-plane/server/session-output.js
      symbol: readOutput
      requires: Read the commits, changed files, diffs and DoD progress since the base revision without writing Git metadata.
      basis: static
    - id: launch-dialog
      kind: implementation
      path: apps/artifact-plane/src/pages/LaunchDialog.jsx
      symbol: LaunchDialog
      requires: Select the role default, show the start-rule warnings and refusals, and take the request of Start ADD work.
      basis: static
    - id: session-page
      kind: implementation
      path: apps/artifact-plane/src/pages/SessionPage.jsx
      symbol: SessionPage
      requires: Show permission requests, the embedded terminal, the waiting notice and the output, and no tool log or chat.
      basis: static
    - id: recovery-flow
      kind: flow
      artifact: artifact-plane
      flow: agent-session-recovery
      requires: Continue, resume or respawn after the session stops.
      basis: documented
  gaps:
    - Node and browser tests use fake agents, a fake herdr and a fake ttyd; the live check of task live-check records the real harness tools.
    - The live check answered the ACP shape of Command Code and the Claude plan refusal; the Gemini terminal model flag and the Antigravity terminal command stay open claims of the contract.
    - A terminal session reports coarse states only, from herdr status and hooks, and herdr does not detect every harness tool.
  exclusions:
    - Sessions that an agent starts, automatic dispatch, approvals recorded by Plane and credential handling.
---

# Start and follow an agent session

## Coverage

The structured record owns this journey. The contract in specifications/agent-orchestration.md owns the detailed rules. Implementation support is limited to the existing store and hook code that the journey reuses; the new code is planned work.
