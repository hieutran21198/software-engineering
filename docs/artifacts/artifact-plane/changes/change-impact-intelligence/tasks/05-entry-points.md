---
id: entry-points
depends_on:
  - impact-page
evidence_records:
  - id: entry-checks
    method: Screenshot review of each entry point and the flow highlight; node --test test/flow-canvas.test.js; npm test; existing browser suites
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/05-entry-points.md#entry-checks
---

# Entry points

## Scope and ownership

Own the actions in src/pages/ChangePage.jsx, DocumentPage.jsx and FlowPage.jsx, the More menu entry in src/Sidebar.jsx or src/TopBar.jsx, and the affected-step highlight in src/flow-canvas.js and FlowPage.jsx with its Node test.

## Governing knowledge

specifications/change-impact.md, section Impact view, paragraphs Entry points and A flow page opened from the impact view. requirements/change-impact.md, I8.

## Prerequisites

Task impact-page satisfies its DoD.

## Definition of Done

- [x] The change page action "What does this change affect?" opens the Impact page for the branch difference against the protected ref.
- [x] The document page action "Where is this used?" and the flow page action on a step's sources open the Impact page for that origin.
- [x] The More menu entry Impact accepts a path or a commit and opens the page.
- [x] A flow page opened from the Impact page highlights the affected steps, dims the others, and lists the affected supports of a selected step.

## Evidence

### entry-checks

Checked on 18 October 2026 on branch claude/impact-page (commit a16d0c5, merged into claude/impact-intelligence). The change page shows "What does this change affect?" in the Changed knowledge section; it opens the branch difference against main, so it includes code and other changes on the branch (c-change-1440.png: 103 changed files, 27 direct, 9 unresolved). The document page shows "Where is this used?" under Used by. An expanded flow step shows "What do this step's sources affect?". The More menu has an Impact entry with a form for a path with optional symbols, or a commit. A flow opened from the Impact page shows "The change affects N steps…", highlights the affected steps in the Steps and Diagram views and dims the others; an expanded step marks its affected supports (flow-highlight-1440.png, flow-highlight-diagram-1440.png). Each page header keeps one action. The highlight helper in src/flow-canvas.js has a Node test. `npm test`: 364 tests, 363 passed, 1 skipped, 0 failed; the existing browser suites listed in page-checks passed.
