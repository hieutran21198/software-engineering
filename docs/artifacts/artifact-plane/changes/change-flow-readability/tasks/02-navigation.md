---
id: flow-navigation
depends_on: [flow-readability]
---

# Make flow navigation consistent

## Scope and governing knowledge

Own apps/artifact-plane/src/main.jsx, Flows.jsx, existing CSS and focused browser tests. Apply requirements/flow-readability.md and specifications/flow-readability.md in this change. The first task passed its checks; preserve its readable evidence presentation.

1. Apply the common active view styling and toolbar knowledge controls. Share Established/Planning state per project while retaining the flow-only All snapshots option.
2. Preserve flow context across view switches with project-session state. Cancel stale requests and reset incompatible selections when knowledge or worktree changes.
3. Place the flow list on the left, selected graph in the center and matching evidence/source inspector on the right. Preserve participation links and dependency/unit selections when returning to their views.
4. Validate selection synchronization, controls and isolation, then update the proposed 1.11.1 snapshot and open PR #23 with new evidence.

## Definition of Done

- [ ] Active styling and aria-pressed agree in all three explorer views.
- [ ] Established/Planning controls look consistent and send the selected context; the flow-only All snapshots behavior is explicit.
- [ ] Dependencies → Flows → Units → Flows retains valid flow/search/source context and prior selections in other views.
- [ ] Left flow selections and center graph-node clicks update the right inspector without hidden artifact-selection side effects.
- [ ] Project-tab/worktree changes remain isolated; old responses cannot overwrite the new context.
- [ ] Wide/narrow screenshots, keyboard checks, focused flow and project-tab browser tests and app build pass.
- [ ] Proposed snapshot matches final change knowledge and historical snapshots/evidence remain unchanged.

## Evidence

Implementation has not started. This amendment requires explicit user approval.
