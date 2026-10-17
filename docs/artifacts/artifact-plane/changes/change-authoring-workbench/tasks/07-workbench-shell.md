---
id: workbench-shell
depends_on: []
evidence_records: []
---

# Workbench shell

## Scope and ownership

Own the split of src/main.jsx into a shell (source bar with the branch control and edit state, navigation tree, page router keyed by project and worktree) and page components for the work page and the graph page, the responsive drawer, style.css rules for pages and forms, and the removal of the view switchers, sidebars and inspector variants other than the graph details rail. Reuse Workspace.jsx, SearchField.jsx, canvas.js, GraphLabels.jsx and the existing details content.

## Governing knowledge

specifications/authoring-workbench.md, sections Shell, Navigation tree, Pages (work and graph), Labels and vocabulary, Responsive and accessibility, Reuse, modification and replacement. Decision 014.

## Prerequisites

Explicit plan approval. No internal prerequisite; pages that need operations use the read services until task edit-interfaces lands and are completed by tasks document-editing, change-unit-pages and flow-page.

## Definition of Done

- [ ] After opening a repository the work page shows branch state, open changes with phase chips and next-step hints, units with completion, and empty states; the protected-branch banner offers Create branch (wired in task change-unit-pages if the Git route is not yet available, otherwise here).
- [ ] The navigation tree lists current work, artifacts with kinds, documents, flows and delivery history, and units; search filters all groups; rows open pages; roving tabindex with arrow, Home and End works; expansion persists per project in the session.
- [ ] The source bar branch control lists registered worktrees with branches and switches context like the former selector; the Read-only badge is removed; the edit state shows unsaved and uncommitted counts.
- [ ] The graph page mounts the existing dependency canvas with Established and Planning, element expansion and the details rail, and keeps viewport state while other pages are shown.
- [ ] No open change shows as No open change; the Dependencies, Units of work and Flows switchers and the artifact filter list are gone while every former capability is reachable from the tree or a page.
- [ ] At 390, 700, 851 and 1440 pixels there is no horizontal page overflow; below 800 the tree is a drawer; browser tests cover the tree, work page, branch control and widths; existing browser tests that targeted removed controls are rewritten or removed with their coverage moved.

## Evidence

Implementation has not started.
