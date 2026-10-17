---
id: workbench-shell
depends_on: []
evidence_records:
  - id: shell-browser-tests
    method: npm run test:browser
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/07-workbench-shell.md#shell-browser-tests
---

# Workbench shell

## Scope and ownership

Own the split of src/main.jsx into a shell (source bar with the branch control and edit state, navigation tree, page router keyed by project and worktree) and page components for the work page and the graph page, the responsive drawer, style.css rules for pages and forms, and the removal of the view switchers, sidebars and inspector variants other than the graph details rail. Reuse Workspace.jsx, SearchField.jsx, canvas.js, GraphLabels.jsx and the existing details content.

## Governing knowledge

specifications/authoring-workbench.md, sections Shell, Navigation tree, Pages (work and graph), Labels and vocabulary, Responsive and accessibility, Reuse, modification and replacement. Decision 014.

## Prerequisites

Explicit plan approval. No internal prerequisite; pages that need operations use the read services until task edit-interfaces lands and are completed by tasks document-editing, change-unit-pages and flow-page.

## Definition of Done

- [x] After opening a repository the work page shows branch state, open changes with phase chips and next-step hints, units with completion, and empty states; the protected-branch banner offers Create branch (wired in task change-unit-pages if the Git route is not yet available, otherwise here).
- [x] The navigation tree lists current work, artifacts with kinds, documents, flows and delivery history, and units; search filters all groups; rows open pages; roving tabindex with arrow, Home and End works; expansion persists per project in the session.
- [x] The source bar branch control lists registered worktrees with branches and switches context like the former selector; the Read-only badge is removed; the edit state shows unsaved and uncommitted counts.
- [x] The graph page mounts the existing dependency canvas with Established and Planning, element expansion and the details rail, and keeps viewport state while other pages are shown.
- [x] No open change shows as No open change; the Dependencies, Units of work and Flows switchers and the artifact filter list are gone while every former capability is reachable from the tree or a page.
- [x] At 390, 700, 851 and 1440 pixels there is no horizontal page overflow; below 800 the tree is a drawer; browser tests cover the tree, work page, branch control and widths; existing browser tests that targeted removed controls are rewritten or removed with their coverage moved.

## Evidence

### shell-browser-tests

Checked in apps/artifact-plane at commit 0c6ee0d with the Nix Chromium: 102 of 102 browser tests passed; later commits change only documentation. test/browser/workbench-shell.spec.js covers tree search over every group, roving Arrow, Home and End keys, rows that open pages, the work page with open changes and next-step hints, the branch control that switches worktrees, the protected-branch banner with Create branch, the drawer below 800 pixels and no horizontal overflow at 390, 700, 851 and 1440 pixels. Earlier suites that drove the removed view switchers and sidebars were rewritten for the tree and pages and pass. Assertions show 'No open change' and no 'Ambiguous'. Implementation: src/main.jsx, src/NavigationTree.jsx, src/SourceBar.jsx, src/pages/WorkPage.jsx and src/pages/GraphPage.jsx. Unit completion labels appear after a unit page loads them; until then the tree shows the member count.
