---
flow:
  id: agent-session-recovery
  artifact: artifact-plane
  title: Recover an agent session after an interruption
  trigger: A session turn ends, its process stops, its runner is lost or its pane is missing.
  outcome: The person continues the live session, resumes the same harness session, or starts a new attempt with the same or another profile from the task, its branch and its evidence.
  entry_steps:
    - detect
  steps:
    - id: detect
      title: Detect the interruption and record its reason
      supports:
        - orchestration-contract
        - store
        - runner
    - id: choose
      title: Offer the recovery choices that the session state allows
      supports:
        - orchestration-contract
        - session-api
    - id: continue
      title: Send a new prompt to the live session
      supports:
        - orchestration-contract
    - id: resume
      title: Reattach the same harness session in a new process or pane
      supports:
        - orchestration-contract
        - adapter-decision
        - runner
    - id: respawn
      title: Start a new session and attempt with a continuation prompt
      supports:
        - orchestration-contract
        - launch-flow
        - session-api
  transitions:
    - from: detect
      to: choose
    - from: choose
      to: continue
      condition: The session is idle and its process runs.
    - from: choose
      to: resume
      condition: The session is interrupted and its agent offers resume or load, or it is a Claude Code terminal session.
    - from: choose
      to: respawn
      condition: The person selects Respawn, or resume is unavailable.
  support:
    - id: orchestration-contract
      kind: element
      artifact: artifact-plane
      element: specifications/agent-orchestration.md
      requires: Interruption reasons, state mapping, resume methods and the respawn prompt.
      basis: documented
    - id: adapter-decision
      kind: element
      artifact: artifact-plane
      element: decisions/018-agent-session-adapters.md
      requires: Support both ACP resume methods and Claude Code terminal resume.
      basis: documented
    - id: store
      kind: implementation
      path: apps/artifact-plane/server/runtime-store.js
      symbol: RuntimeStore
      requires: Keep the interrupted attempt and let an explicit binding supersede it.
      basis: static
    - id: runner
      kind: implementation
      path: apps/artifact-plane/server/session-runner.js
      symbol: SessionRunner
      requires: Mark sessions interrupted with their reason, resume the same harness session and restart a stopped herdr server or workspace.
      basis: static
    - id: session-api
      kind: implementation
      path: apps/artifact-plane/server/session-api.js
      symbol: SessionService
      requires: Offer the recovery choices, accept respawnOf only for an implementer session of the same task, and supersede the earlier attempt.
      basis: static
    - id: launch-flow
      kind: flow
      artifact: artifact-plane
      flow: agent-session-launch
      requires: Start the new session with the start rules.
      basis: documented
  gaps:
    - Fixture tests cover resume and respawn for ACP versions 1 and 2 and terminal sessions; the live check records real harness tools.
    - Uncommitted files stay in the worktree; reasoning of a stopped session that the harness did not save is lost.
  exclusions:
    - Automatic recovery without a choice of the person.
---

# Recover an agent session after an interruption

## Coverage

The structured record owns this journey. The contract in specifications/agent-orchestration.md owns the recovery rules.
