---
id: style-and-shell
depends_on: [read-titles]
evidence_records:
  - id: shell-suite
    method: npx playwright test test/browser/shell.spec.js test/browser/layout.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/02-style-and-shell.md#shell-suite
  - id: shell-review
    method: Screenshots of the shell at 1440 and 390 pixels compared with the approved mockups
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/02-style-and-shell.md#shell-review
---

# Style and shell

## Scope and ownership

Own apps/artifact-plane/src/main.jsx presentation, the new shell components (top bar, sidebar), the shared page parts (page header, inline form, badge, phase steps, graph panel), the single stylesheet and the font dependencies. Remove NavigationTree.jsx, SourceBar.jsx, PageHeader.jsx, Rail.jsx, GraphPage.jsx, style.css, workbench.css and editing.css when no page uses them.

## Governing knowledge

specifications/authoring-workbench.md, sections Principles, Layout, Top bar, Sidebar, Graph panel, Visual style, Labels and Code structure; decision 015.

## Prerequisites

Task read-titles.

## Definition of Done

- [x] One stylesheet defines the tokens of the Visual style table; @fontsource IBM Plex Sans, Source Serif 4 and IBM Plex Mono are bundled and no font loads from the network.
- [x] The top bar shows the product name, project tabs, branch control with worktree menu and Create branch, Uncommitted with its count, Refresh with "Not up to date" only when not current, and More with Discover behavior, Recorded executions and Change repository.
- [x] The sidebar shows search, Current work with change titles and phases, Artifacts with kinds and document titles (5 then Show all), and History only with the Show history switch; it has no action rows; it resizes from 200 to 400 pixels by pointer and keys.
- [x] At 800 pixels and below the sidebar is a drawer from the menu button and the top bar is compact; no overflow at 390, 700, 851 and 1440 pixels.
- [x] The source bar, protected banner, status footer, view switchers and Established, Planning and All snapshots controls are gone; data loading, events, unsaved-edit protection and Undo status still work.
- [x] Screenshots of the shell at 1440 and 390 pixels match the mockups' top bar and sidebar.

## Evidence

### shell-suite

Checked with the Nix Chromium. `shell.spec.js`, 3 of 3 passed in 4 repeated runs:
- sidebar titles, phases and New/Changed badges;
- search with Enter, roving keys, and History behind the switch;
- branch menu, Create branch and worktree switching;
- uncommitted count and sidebar resize from 200 to 400 pixels by keys and pointer;
- the drawer at 851, 700 and 390 pixels with Escape.

`layout.spec.js`, 3 of 3 passed:
- one h1 per page, one Navigation landmark outside main, no tree or mode control inside main, unique control names;
- no horizontal overflow at 390, 700, 851 and 1440 pixels on seven pages;
- page screenshots.

The production build bundles IBM Plex Sans, Source Serif 4 and IBM Plex Mono from @fontsource. No font request leaves the local server.

The suites found two defects, fixed in the shell: Enter opened the parent artifact instead of the match, and Escape did not close the drawer from the top bar. The browser suites also found that the `[hidden]` rule had lost its `!important`; this is restored.

### shell-review

The coordinator compared screenshots of the top bar and sidebar at 1440 and 390 pixels on this repository with the Main and Phone mockups. The top bar has product name, project tabs, branch, Uncommitted, Refresh and More. The sidebar has search, Current work, Artifacts with kinds and documents by title, and Show history. The source bar, navigation tree with action rows, status footer, graph page, view switchers and Established/Planning controls are removed, together with style.css, workbench.css and editing.css.
