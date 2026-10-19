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

- [x] The late-reply browser test fails before the fix and passes after it.
- [x] The diagram tests check that the hostile label handler never runs, and accept no CSP report other than the `script-src-attr` report of that label.
- [x] On the Chromium 156 headless shell of Playwright 1.64 (the CI browser): the full browser suite passes, and S4 passes 5 of 5 repeated runs.
- [x] On the local Chromium 149: the diagram and flow page suites pass.
- [x] `npm test` and `npm run build` pass, and the validator reports no error for this change.
- [x] The CI run of the pull request passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Late-reply test | The test holds the successful reply of "Add the next step" until the Rename step form of the new step has input. Before the fix it failed: the form was not found after the reply (Chromium 149). After the fix it passes on Chromium 149 and 156 | Passed |
| Diagram tests | The fixture label sets `window.diagramHandlerRan`; the test checks that the flag stays undefined and filters only the `script-src-attr` report. A probe page showed that Chromium 156 reports the violation for `DOMParser.parseFromString('<img src=x onerror=…>')` with a CSP and runs the handler neither with nor without the CSP; Chromium 149 makes no report. Before the change the two diagram tests failed on Chromium 156 with that report only, as in CI | Passed |
| CI browser | Playwright 1.64 headless shell, Chromium 156.0.8078.4: `npx playwright test` 109 passed, 0 failed (4.6 min); S4 with `--repeat-each=5`: 5 passed | Passed |
| Local browser | Chromium 149.0.7827.55: diagram-rendering.spec.js and flow-page.spec.js, 15 passed | Passed |
| Unit tests, build, validator | `npm test` 409 tests, 408 passed, 0 failed, 1 skipped; `npm run build` exits 0; `npm run validate` on this repository: `ok: true`, 0 errors; five `open-change-conflict` warnings name local branches of delivered or stale changes. With `--change artifact-plane/change-browser-suite-fixes`: 0 errors, declared small and allowed small, 44 changed code and test lines | Passed |
| Pull request CI | GitHub Actions run 39213669473 on PR #43 (head c9dd193): artifact-plane, go and docs jobs succeeded; the browser job ran the full suite on the Playwright headless shell | Passed |

Limitations: the single discovery-recorded failure of CI run 39198983185 did not repeat in the five later runs and is not addressed. Before this change, local runs on Chromium 149 hid the CI failures from #38 to #42.
