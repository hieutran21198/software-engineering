---
flow:
  id: execution-observation
  title: Observe a bound execution attempt
  trigger: A configured observer binds, or infers the binding of, an existing agent attempt to a declared
    delivery task.
  outcome: Local observation and captured graph context are inspectable without
    authorizing or independently verifying implementation.
  entry_steps:
    - bind
  steps:
    - id: bind
      title: Bind a listed task and capture its graph context
      supports:
        - ux-simplification-contract
        - ux-browser-checks
        - store
        - worktree-checks
        - agent-integration-contract
        - inferred-binding
        - binding-tests
    - id: observe
      title: Record allowlisted lifecycle observations
      supports:
        - store
        - hook-command
    - id: query
      title: Retrieve attempts and local SSE updates
      supports:
        - runtime
    - id: display
      title: Show reported execution and freshness separately from knowledge
      supports:
        - runtime-model
        - worktree-checks
    - id: retain
      title: Retain history or disclose stale/unknown observations
      supports:
        - store
        - runtime-tests
        - evidence-review-contract
        - worktree-checks
        - spacing-control-contract
        - shared-presentation
        - presentation-checks
  transitions:
    - from: bind
      to: observe
      condition: Task membership is valid and an explicit binding is supplied or
        a task file read infers one.
    - from: observe
      to: query
    - from: query
      to: display
    - from: display
      to: observe
      condition: More matching observations arrive.
    - from: display
      to: retain
      condition: Observation ends, disconnects or becomes stale.
  support:
    - id: agent-integration-contract
      kind: element
      artifact: artifact-plane
      element: specifications/agent-integration.md
      requires: Infer a binding only from one task file read under the identity
        rules, and label each binding explicit or inferred.
      basis: documented
    - id: inferred-binding
      kind: implementation
      path: apps/artifact-plane/server/runtime-store.js
      symbol: inferredBinding
      requires: Return bind arguments only for a task file read of a current change
        by a subagent or in a linked worktree.
      basis: static
    - id: hook-command
      kind: implementation
      path: apps/artifact-plane/server/agent-hook.js
      symbol: hookOutput
      requires: Record the allowlisted observation of each hook input and start
        an inferred binding without waiting for it.
      basis: static
    - id: binding-tests
      kind: test
      path: apps/artifact-plane/test/runtime-binding.test.js
      requires: Exercise explicit and inferred bindings, supersession and the
        identity rules.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/02-inferred-binding.md
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/discovery-recorded.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Keep current observation bound to the active worktree and hide navigation only after a successful empty context read.
      basis: documented
    - id: store
      kind: implementation
      path: apps/artifact-plane/server/runtime-store.js
      symbol: RuntimeStore
      requires: Keep private local observations outside repositories with scoped
        task/context identity.
      basis: static
    - id: runtime
      kind: implementation
      path: apps/artifact-plane/server/runtime-api.js
      symbol: runtimeService
      requires: Expose local observed attempts and event updates.
      basis: static
    - id: runtime-model
      kind: implementation
      path: apps/artifact-plane/src/runtime-model.js
      requires: Display observations, reported validation and freshness limits.
      basis: static
    - id: runtime-tests
      kind: test
      path: apps/artifact-plane/test/runtime-store.test.js
      requires: Exercise private storage, scope, stale observations and reported states.
      basis: static
    - id: evidence-review-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-correctness.md
      requires: Match activity to canonical worktree and task content; disclose
        captured revision.
      basis: documented
    - id: worktree-checks
      kind: test
      path: apps/artifact-plane/test/browser/discovery-recorded.spec.js
      requires: Verify matching worktree observations and retained captured identities.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present page blocks and native controls consistently without changing evidence or journey meaning.
      basis: documented
    - id: shared-presentation
      kind: implementation
      path: apps/artifact-plane/src/styles.css
      requires: Share one set of tokens, controls and page rhythm.
      basis: static
    - id: presentation-checks
      kind: test
      path: apps/artifact-plane/test/browser/layout.spec.js
      requires: Check one title, one navigation, unique control names and no horizontal overflow on every page.
      basis: static
  gaps:
    - Observed lifecycle activity and reported checks do not prove task DoD,
      plan approval or artifact establishment.
  exclusions:
    - Starting agents, granting permissions, changing artifact knowledge or
      maintaining ADD workflow state.
  artifact: artifact-plane
---

# Observe a bound execution attempt

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.

## Simpler exploration

Keep current observation bound to the active worktree and hide navigation only after a successful empty context read. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.
