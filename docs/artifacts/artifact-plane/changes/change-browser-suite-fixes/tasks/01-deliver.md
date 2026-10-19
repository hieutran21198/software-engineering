---
id: deliver
depends_on: []
covers:
  - element: requirements/authoring-workbench.md
    ids: [W11]
---

# Deliver

## Scope and ownership

Coordinator, as implementer. apps/artifact-plane/src/editing.jsx, test/browser/flow-page.spec.js, test/browser/diagram-rendering.spec.js and test/browser/diagram-fixture.md.

## Definition of Done

- [ ] The late-reply browser test fails before the fix and passes after it.
- [ ] The diagram tests check that the hostile label handler never runs, and accept no CSP report other than the `script-src-attr` report of that label.
- [ ] On the Chromium 156 headless shell of Playwright 1.64 (the CI browser): the full browser suite passes, and S4 passes 5 of 5 repeated runs.
- [ ] On the local Chromium 149: the diagram and flow page suites pass.
- [ ] `npm test` and `npm run build` pass, and the validator reports no error for this change.
- [ ] The CI run of the pull request passes.

## Evidence

Not recorded.
