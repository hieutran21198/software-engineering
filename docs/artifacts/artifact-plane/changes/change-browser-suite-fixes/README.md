---
tier: small
---

# Keep a newly opened step form open, and pass the browser suite on the CI browser

## Reason and scope

The browser job of CI failed on every push to main from d931d07 (#38) to 8aab51b (#42). The local runs used Chromium 149; CI uses the Chromium 156 headless shell of Playwright 1.64. Two causes:

1. The diagram test failed on every run. Chromium 156 reports a `script-src-attr` CSP violation when the sanitizer parses the hostile label `<img src=x onerror=…>` of the fixture in an inert document. The handler does not run, with or without the CSP; Chromium 149 and 155 make no report.
2. Scenario S4 failed in 2 of 5 runs. It is a product defect: after "Add the next step", the form waits for the reply and for the refresh. The repository events show the new step earlier. When the person opens the new step and its Rename step form in that time, the late reply calls the close callback of the old form and closes the new form, and its input is lost.

Included: the form fix, a browser test that holds the reply, and a diagram test that checks that the handler never runs and accepts only that one report. Excluded: a change to the CSP, to Mermaid or to the sanitizing profile, and the single discovery-recorded failure of run 39198983185, which did not repeat.

## Plan

One task fixes `ActionForm` in src/editing.jsx so that a form that left the page calls no close callback, adds the late-reply test to flow-page.spec.js, and changes the diagram fixture and test. The task covers W11 in requirements/authoring-workbench.md. Compatibility: patch.

## Tier decisions

One repository: the form, the tests and the knowledge are in this repository; no other repository uses the Plane code.

Impact: `ActionForm` is used only by Plane pages (src/pages and src/editing.jsx). The fix changes when its close callback runs and nothing else. The diagram change is in test files only. No flow record, decision, requirement ID or referenced element changes, and no other artifact imports Plane code.

- [Requirements](../../requirements/authoring-workbench.md)
- [Specification](../../specifications/authoring-workbench.md)
- [Task](tasks/01-deliver.md)
