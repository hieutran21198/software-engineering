---
id: browser-suites
depends_on: [work-page, artifact-document-pages, change-page, unit-flow-pages]
evidence_records:
  - id: browser-suites
    method: Full browser suite twice with the Nix Chromium
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md#browser-suites
  - id: scenario-counts
    method: npx playwright test test/browser/authoring-scenarios.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md#scenario-counts
---

# Browser suites

## Scope and ownership

Own apps/artifact-plane/test/browser: the shared navigation helper, the rewritten suites, the layout suite, the scenario suite and the screenshot script.

## Governing knowledge

specifications/authoring-workbench.md, section Browser tests; requirements/workbench-redesign.md B3–B8.

## Prerequisites

Tasks work-page, artifact-document-pages, change-page and unit-flow-pages.

## Definition of Done

- [x] Every suite that drove a removed control is rewritten or removed with its coverage moved to a page suite; reading, graph, delivery, review, discovery, runtime, tabs, refresh and search coverage remains.
- [x] The layout suite checks each page at 1440 pixels for one h1, one Navigation landmark outside main, no tree inside main, no Established, Planning or All snapshots control, and unique accessible names of visible buttons and links in main.
- [x] The scenario suite runs S1–S8 with 0 YAML, 0 typed identifiers or paths, 0 validation errors and no stray files, and fails when actions exceed S1 20, S2 7, S3 13, S4 29, S5 14, S6 10, S7 3, S8 5; it records the counts.
- [x] Keyboard-only S1 and the overflow checks at 390, 700, 851 and 1440 pixels pass.
- [x] The screenshot script writes the six pages at 1440 and 390 pixels to test-results.

## Evidence

### browser-suites

`npx playwright test` with PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH set to the Nix Chromium and a 0700 state directory: 93 of 93 passed in both runs (3.4 and 3.3 minutes).

There are 13 suites:
- shell and layout;
- work-page, artifact-document, change-page, unit-page, flow-page and discovery-recorded;
- authoring-scenarios, project-tabs, lazy-reload and worktrees-links.

The old suites that drove removed controls are rewritten or removed, and their coverage is moved. The mapping is in the commit messages of each suite branch. Removed with their controls:
- the inspector resize and the canvas element expansion;
- the view switchers and Established/Planning toggles;
- the graph page and the tree action rows.

The layout suite writes the seven pages at 1440 and 390 pixels to test-results/pages. Keyboard-only S1 and the overflow checks at 390, 700, 851 and 1440 pixels pass. The `npm test` Node tests: 337 tests, 336 passed, 1 skipped.

### scenario-counts

`authoring-scenarios.spec.js`: 10 of 10 passed in two runs. Every scenario used 0 raw front-matter edits and 0 validation errors and changed no unexpected file. Actions per scenario against the 1.16.0 limit:

| Scenario | Actions | Limit |
| --- | --- | --- |
| S1 | 20 | 20 |
| S2 | 7 | 7 |
| S3 | 12 | 13 |
| S4 | 28 | 29 |
| S5 | 14 | 14 |
| S6 | 9 | 10 |
| S7 | 3 | 3 |
| S8 | 5 | 5 |

Each scenario finished in 0.3 to 5.6 seconds. The S4 fixture starts with an open change on the artifact, because the contract shows "+ New flow" only for an open change.
