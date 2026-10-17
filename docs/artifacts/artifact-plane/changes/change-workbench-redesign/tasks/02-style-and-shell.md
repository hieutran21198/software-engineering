---
id: style-and-shell
depends_on: [read-titles]
evidence_records: []
---

# Style and shell

## Scope and ownership

Own apps/artifact-plane/src/main.jsx presentation, the new shell components (top bar, sidebar), the shared page parts (page header, inline form, badge, phase steps, graph panel), the single stylesheet and the font dependencies. Remove NavigationTree.jsx, SourceBar.jsx, PageHeader.jsx, Rail.jsx, GraphPage.jsx, style.css, workbench.css and editing.css when no page uses them.

## Governing knowledge

specifications/authoring-workbench.md, sections Principles, Layout, Top bar, Sidebar, Graph panel, Visual style, Labels and Code structure; decision 015.

## Prerequisites

Task read-titles.

## Definition of Done

- [ ] One stylesheet defines the tokens of the Visual style table; @fontsource IBM Plex Sans, Source Serif 4 and IBM Plex Mono are bundled and no font loads from the network.
- [ ] The top bar shows the product name, project tabs, branch control with worktree menu and Create branch, Uncommitted with its count, Refresh with "Not up to date" only when not current, and More with Discover behavior, Recorded executions and Change repository.
- [ ] The sidebar shows search, Current work with change titles and phases, Artifacts with kinds and document titles (5 then Show all), and History only with the Show history switch; it has no action rows; it resizes from 200 to 400 pixels by pointer and keys.
- [ ] At 800 pixels and below the sidebar is a drawer from the menu button and the top bar is compact; no overflow at 390, 700, 851 and 1440 pixels.
- [ ] The source bar, protected banner, status footer, view switchers and Established, Planning and All snapshots controls are gone; data loading, events, unsaved-edit protection and Undo status still work.
- [ ] Screenshots of the shell at 1440 and 390 pixels match the mockups' top bar and sidebar.

## Evidence
