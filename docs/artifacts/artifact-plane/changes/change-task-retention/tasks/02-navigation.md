---
id: navigation
depends_on: ["delivery-reader"]
---

# Remove standalone Workflow navigation

## Scope and ownership

Repository: this repository. Locations: apps/artifact-plane/src/main.jsx, UnitsOfWork.jsx, Workflow.jsx, workflow-canvas.js, TaskGraph.jsx, style.css, relevant components/helpers and browser tests.

Remove the top-level Workflow tab/canvas and unused state. Add shared sidebar worktree access and dependency-inspector change/phase details with existing task graph navigation. Keep unit Workflow, histories and runtime observation. Remove only dead standalone helpers/tests; retain shared reader/rendering behavior.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md. Requires established ADD specifications/task-retention.md from change-task-retention and a recorded contract recheck before any implementation. Explicit plan approval is also required. Internal prerequisites: delivery-reader. Required predecessor DoD must pass before starting.

## Definition of Done

- [ ] Browser checks show Dependencies and Units of work without a standalone Workflow button; unit Workflow remains operable.
- [ ] Repositories with no briefs expose ungrouped change phases, full commits, histories, task graphs, and Back to dependencies.
- [ ] Explicit worktree opening, detached/unavailable details, refresh/selection reset, inspector resizing, keyboard and narrow-screen controls pass.
- [ ] Recorded executions, exact task evidence navigation, and read-only fingerprints remain valid.

## Evidence

Not executed. Record check commands, observed results, and relevant implementation references here after approved implementation.
