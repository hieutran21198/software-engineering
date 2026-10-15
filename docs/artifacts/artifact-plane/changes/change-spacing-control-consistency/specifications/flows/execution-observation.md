---
flow:
  id: execution-observation
  title: Observe an explicitly bound execution attempt
  trigger: A configured observer binds an existing agent attempt to a declared
    delivery task.
  outcome: Local observation and captured graph context are inspectable without
    authorizing or independently verifying implementation.
  entry_steps:
    - bind
  steps:
    - id: bind
      title: Bind a listed task and capture its graph context
      supports:
        - store
        - worktree-checks
    - id: observe
      title: Record allowlisted lifecycle observations
      supports:
        - store
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
  transitions:
    - from: bind
      to: observe
      condition: Task membership is valid and explicit binding is supplied.
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
      path: apps/artifact-plane/test/browser/runtime.spec.js
      requires: Verify matching worktree observations and retained captured identities.
      basis: static
    - id: spacing-control-contract
      kind: element
      artifact: artifact-plane
      element: specifications/spacing-control-consistency.md
      requires: Present inspector blocks and native controls consistently without
        changing evidence or journey meaning.
      basis: documented
  gaps:
    - Observed lifecycle activity and reported checks do not prove task DoD,
      plan approval or artifact establishment.
    - New spacing and dropdown consistency requires approved implementation and
      rendered validation.
  exclusions:
    - Starting agents, granting permissions, changing artifact knowledge or
      maintaining ADD workflow state.
  artifact: artifact-plane
---

# Observe an explicitly bound execution attempt

## Coverage

The structured record owns this named journey, source reasons, evidence basis, gaps and exclusions. Sources are documented/static support; recorded task checks validate this map separately.
