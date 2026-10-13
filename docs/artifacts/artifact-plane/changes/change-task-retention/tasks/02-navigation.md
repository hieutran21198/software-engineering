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

- [x] Browser checks show Dependencies and Units of work without a standalone Workflow button; unit Workflow remains operable.
- [x] Repositories with no briefs expose ungrouped change phases, full commits, histories, task graphs, and Back to dependencies.
- [x] Explicit worktree opening, detached/unavailable details, refresh/selection reset, inspector resizing, keyboard and narrow-screen controls pass.
- [x] Recorded executions, exact task evidence navigation, and read-only fingerprints remain valid.

## Evidence

Ten targeted Chromium browser acceptance cases passed for task graphs, unit views, new-layout retained evidence, history ordering, primary navigation, worktree details/opening, refresh/selection reset, safe Markdown, responsive layout, and read-only fingerprints. Three additional runtime/recorded-history and pointer/keyboard resize cases passed. Commands: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<installed system Chromium> npx playwright test for workflow, workflow-histories, task-graph, visualization-clarity, units-of-work, runtime, and resize specs. npm run build passed. git diff --check passed.

The initial browser pass caught a selection-reset error on repository opening; the condition was corrected, the production bundle rebuilt, and the affected worktree/task checks passed. Local sockets required sandbox escalation; no test failure was treated as passing. Wide and narrow screenshots were inspected.

The standalone Workflow component/helper and unused state/styles are removed. Delivery.jsx supplies sidebar worktrees and change phase/evidence inspection; existing TaskGraph provides Back to dependencies. Unit Workflow and recorded executions remain. KISS reuses existing graph/rendering/selection and STE labels evidence uncertainty. All navigation DoD criteria are satisfied.
