---
id: deliver
depends_on: []
covers:
  - element: requirements/authoring-workbench.md
    ids: [W11]
---

# Deliver the flow diagram layout

## Scope and location

apps/artifact-plane/src/flow-canvas.js, src/GraphLabels.jsx and test/flow-canvas.test.js.

## Definition of Done

- [x] `flowDiagram` places the steps with a left-to-right dagre layout of the transitions and gives each condition label layout space.
- [x] An edge with layout points follows them, rounded at each bend; an edge without points keeps the smooth step path.
- [x] A transition from a step to itself is an arc above the step with its label above the arc.
- [x] Node tests show the flow diagram case of A10 on the steps and transitions of zitadel-event-intake, and npm test passes.
- [x] The browser tests flow-page, impact-page and work-page pass.
- [x] A screenshot at 1440 and 390 pixels of zitadel-event-intake shows each label on its own line and no horizontal page overflow.

## Evidence

Implementation commit 7f046f7: 55 changed code and test lines.

Ran npm test: 517 tests, 516 passed, 0 failed, 1 skipped. The new test "document diagram keeps labels off the steps, draws a loop above its step and puts a side branch beside the main path" passes.

Ran npx playwright test test/browser/flow-page.spec.js test/browser/impact-page.spec.js test/browser/work-page.spec.js with the Nix Chromium: 25 passed, including "diagram labels separate long parallel, reverse and loop transitions at wide and narrow widths".

Screenshots of the flow page Diagram of zitadel-event-intake in a disposable clone, served by this branch: at 1440 pixels the main path verify, validate, store, publish runs left to right, reject is beside it, each condition label sits on its own line, and the retry loop is an arc above publish. At 390 pixels the same layout fits the panel; neither width has horizontal page overflow.

Version preparation: package.json and package-lock.json give 1.26.2, and nix/lib/npm-deps.nix has the new npm dependency hash; prefetch-npm-deps reproduces the previous hash from the previous lock file.
