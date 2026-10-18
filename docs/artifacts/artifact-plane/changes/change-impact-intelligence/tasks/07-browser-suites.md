---
id: browser-suites
depends_on:
  - entry-points
  - flow-reads
evidence_records:
  - id: browser-checks
    method: npx playwright test (two full runs) with the Nix Chromium; npm test; npm run build; scripts/impact-screenshots.mjs on a disposable clone
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/07-browser-suites.md#browser-checks
---

# Browser suites

## Scope and ownership

Own test/browser/impact-page.spec.js, the additions to test/browser/flow-page.spec.js and test/browser/change-page.spec.js, and the screenshot script for the owner's review.

## Governing knowledge

specifications/change-impact.md, sections Impact view and Validation. specifications/authoring-workbench.md, browser test rules.

## Prerequisites

Tasks entry-points and flow-reads satisfy their DoD.

## Definition of Done

- [x] Suites cover each entry point, the filters, the expansion by one hop, the detail panel, the graph toggle, the diagram highlight, and the empty and stale states, at 1440 and 390 pixels.
- [x] The layout suite passes for the new page: one title, one navigation, unique control names, no horizontal overflow.
- [x] The screenshot script captures the Impact page for the research cases on a disposable clone of this repository at both widths.
- [x] All browser suites pass in two consecutive runs.

## Evidence

### browser-checks

Checked on 18 October 2026 on branch claude/impact-browser (commits 7238280 and 7b1e308, merged into claude/impact-intelligence). test/browser/impact-page.spec.js builds a fixture repository in which a function change reaches only the importer of that function, an import chain goes past depth 2, a flow has an implementation support and a test support on different steps, a spec references the changed document, an artifact depends on another without references, and a commit can be diffed. It covers each entry point (change page, document page, flow step, More → Impact), the tier toggles, the kind and origin filters, "One more hop", the detail panel with a typed path and Escape, the graph and list views, the flow highlight in Steps and Diagram, the empty state with the coverage section, and the stale state with Reload, at 1440 and 390 pixels with an overflow check. The stale state is triggered by intercepting the HTTP reply, so the test covers the page, not the server's stale detection. test/browser/layout.spec.js includes the Impact page: one title, one navigation, unique control names and no overflow at 390, 700, 851 and 1440 pixels. scripts/impact-screenshots.mjs clones a repository into a temporary folder, runs the server with its own state folder, captures the research cases at both widths and deletes the clone; one run on this branch produced 12 PNGs without overflow.

`npx playwright test` with the Nix Chromium: run 1, 100 passed in 3.7 minutes; run 2, 100 passed in 4.4 minutes; no flaky test. `npm test`: 364 tests, 363 passed, 1 skipped, 0 failed. `npm run build` passed. Limits: a fresh worktree needs `npm run build` before the browser suites; at 390 pixels "Where is this used?" is inside the closed Properties section of the document page.
