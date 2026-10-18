---
id: impact-page
depends_on:
  - interfaces
evidence_records:
  - id: page-checks
    method: Screenshot review at 1440 and 390 pixels on a disposable clone; node --test test/impact-canvas.test.js; npm test; npm run build; existing browser suites
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/04-impact-page.md#page-checks
---

# Impact page

## Scope and ownership

Own apps/artifact-plane/src/pages/ImpactPage.jsx, ImpactPage.css, the page kind impact in src/main.jsx and src/Workspace.jsx, and the impact subgraph builder src/impact-canvas.js with its Node test.

## Governing knowledge

specifications/change-impact.md, section Impact view. specifications/authoring-workbench.md, the page and control rules. requirements/change-impact.md, I8.

## Prerequisites

Task interfaces satisfies its DoD.

## Definition of Done

- [x] The page shows the origins with their changed declarations or sections, the summary strip with the five counts, and the sections Direct, Transitive, Potential and Unresolved grouped by artifact, then flow with affected steps, knowledge, module and test.
- [x] Each row shows the name, a kind chip, a strength chip, the hop count and the last relationship; selecting a row opens the detail panel with every path as typed edges with evidence, affected exports, reasons and links.
- [x] Tier and kind filters, the origin filter, "One more hop (N)" with the frontier count, and "Show as graph" with at most 60 nodes work with the mouse and the keyboard.
- [x] Loading, stale, partial, empty and error states are visible and the empty state shows the coverage statement.
- [x] A screenshot review at 1440 and 390 pixels against the research mockup is recorded before this DoD is checked.

## Evidence

### page-checks

Checked on 18 October 2026 on branch claude/impact-page (commit 587df48, merged into claude/impact-intelligence). The page kind impact is registered in src/main.jsx; src/pages/ImpactPage.jsx calls POST /api/impact/query and shows the changed entities with up to three symbols each, toggles for Direct, Transitive, Potential, Verify, Investigate and Unresolved with their counts, rows grouped by artifact or by folder for code and tests, each with a kind chip, title, affected steps, last relationship, hops and evidence strength, and a detail panel with every path as typed edges, reasons, affected exports and links. Kind and origin filters, "One more hop (N)" (disabled at frontier 0 or depth 4) and "Show as graph" (src/impact-canvas.js, at most 60 nodes, grouped by artifact or folder above that) work with buttons and selects; Escape closes the detail panel. Loading, error with Retry, stale with Reload, partial with diagnostics, and empty with "No consumer found in the analyzed relationships" and the coverage section are rendered. server/impact.js adds `from` to each path edge (additive).

Screenshot review: the worker captured the RuntimeStore case, knowledge-layout.md, the change-page action and the flow highlight at 1440 and 390 pixels on a disposable clone (/tmp/claude-1000/-home-cirius-Workspaces-personal-software-engineering/2ff1f1e5-6c66-4060-a87d-2e4f2d7609e4/scratchpad/impact-page-shots/), compared them with the research mockup, and fixed seven findings (file names grouped by folder instead of wrapped paths, duplicated evidence text, one Verify row per test, at most three symbols per changed chip, model IDs hidden, muted dashed buttons for hidden tiers, muted step names with hop counts). The coordinator reviewed a-runtime-store-selected-1440.png, b-knowledge-layout-390.png and c-change-1440.png: they are readable, unclipped and follow the mockup structure. The page has no horizontal overflow at 390 pixels.

`node --test test/impact-canvas.test.js`: 5 of 5 passed. `npm test`: 364 tests, 363 passed, 1 skipped, 0 failed. `npm run build` passed. Browser suites flow-page, change-page, artifact-document, layout and shell: 46 of 46 passed. Known, not changed here: edge labels near the left edge of the existing flow diagram are partly cut off after fit-to-view.
