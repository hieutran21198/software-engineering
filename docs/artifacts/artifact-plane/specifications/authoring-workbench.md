---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/authoring-workbench.md#specification-self-check
---

# Authoring workbench contract

Governs D1–D11 and B1–B8 in requirements/workbench-redesign.md, and W1, W2, W7, W10–W12, A1, A7 and A10 in requirements/authoring-workbench.md. The knowledge editing contract supplies every write and does not change. The owner approved the mockups of this contract on 17 October 2026 (design canvas "Artifact Plane redesign mockups": work, artifact, document, change, unit, flow and work at 390 pixels). Where this text and the mockups differ, this text applies.

## Principles

- Writing first. The home page is the person's current work. Reading, graphs and history support writing.
- One of each. One top bar, one sidebar, one page. A page shows its title once. An action has one control in one place: the page of the thing that it changes.
- Document first. Knowledge is shown as readable text with titles, not as file names, nodes or panels.
- Graphs on request. A graph opens inside the page that owns it and shows the working branch.
- Quiet status. A message appears only where it applies and only when it needs attention.
- Derived facts are labels, not inputs. The Plane never asks for a path, an identifier or a YAML line in the normal path.

## Layout

The window has a top bar of 52 pixels, a sidebar and a content area. The sidebar is 264 pixels wide by default. A divider resizes it between 200 and 400 pixels by pointer and by the arrow, Home and End keys; the width stays with its project for the session.

The content area scrolls. Its padding is 40 pixels at the top and 56 pixels at the sides. The page column is at most 880 pixels wide, and the change page column is at most 960 pixels. The document page has a text column of at most 720 pixels and a properties column of 240 to 280 pixels.

Every page header has the same parts in this order: an optional eyebrow line with links to the parent records, the title, an optional subtitle, and at most one secondary or quiet action at the right.

At 800 pixels and below:

- The top bar has a menu button, the repository name with the branch below it, the uncommitted-files button and the More button.
- The sidebar opens as a drawer from the menu button and closes when a page opens.
- The padding is 24 pixels at the top and 16 pixels at the sides. Buttons are 44 pixels high, and primary actions in cards use the full width.
- Tables become stacked rows. No page overflows horizontally at 390, 700, 851 and 1440 pixels.

## Top bar

From left to right:

1. The product name.
2. The project tabs. Their behavior does not change.
3. The branch control. It shows a status dot and the branch of the selected worktree. Its menu lists the registered worktrees with branch, path, HEAD, availability and the detached, locked and prunable states; selecting a readable worktree switches the context in one action. On main, master or a detached HEAD the dot is grey, the control says "Read only", and the menu offers Create branch.
4. Uncommitted, with the number of uncommitted knowledge files. It opens the work page at its Uncommitted knowledge section. It is hidden when the number is 0.
5. Refresh. While a refresh runs, the icon turns. When the observation is disconnected or the last update failed, a short text "Not up to date" appears beside Refresh. No text appears when the data is current.
6. More. Its menu has Discover behavior, Recorded executions (only when execution contexts exist) and Change repository.

The source bar, the protected-branch banner, the status footer and the Read-only badge are removed.

## Sidebar

From top to bottom:

- Search. One field filters the sidebar by title and identifier with the existing name normalization. Enter opens the first match. An empty result says "Nothing matches this title or ID."
- Current work. The first row opens the work page. One row follows for each open change: the change title, and below it the artifact title and the current phase.
- Artifacts. One row for each artifact, by title. An expanded artifact shows Requirements, Specifications, Decisions and Flows with their counts. An expanded kind shows its first 5 documents by title, then "Show all N", which opens that section of the artifact page. New, changed and removed documents carry a small badge.
- History, only when the Show history switch is on. It lists delivered changes, newest first, and units of work whose members are all delivered.
- Show history. A switch at the bottom of the sidebar. It is off by default and is remembered for the project during the session.

The sidebar has no action rows, no Dependency graph row and no System flows row. Open units of work are reached from the eyebrow of their changes. The tree keyboard behavior of 1.16.0 stays: roving tabindex, arrows, Home, End, Enter and Space.

### Tree presentation

These rules govern N1–N5 in [navigation hierarchy requirements](../requirements/navigation-hierarchy.md). They apply in every sidebar section, in search results and in the drawer.

| Rule | Value |
| --- | --- |
| Indent step | 20 pixels: the 14-pixel chevron column plus its 6-pixel gap, so a child's chevron starts under its parent's label. A row's left padding is 8 pixels plus one step per level: 8, 28 and 48 pixels for levels 0, 1 and 2. |
| Guide lines | A row at level 1 or 2 draws one 1-pixel vertical line in the `--control` color (#D9D8D3) per ancestor level. The first line is 15 pixels from the row's left edge, under the center of the level-0 chevron; each further line is 20 pixels to the right. The lines extend 1 pixel above and below the row, across the 2-pixel row gap, so that the lines of adjacent rows join. They are drawn above the row background, ignore the pointer and do not change the row's size. |
| Group space | A level-0 row has an 8-pixel top margin in addition to the 2-pixel row gap. The first row of the tree and the first row after a section heading have no added margin. |
| Parent weight | An artifact row (a level-0 row with aria-expanded) uses weight 500. Kind, document, change and history rows keep weight 400; a selected row keeps the selected style. Sizes stay 14 pixels for levels 0 and 1 and 13 pixels for level 2. |

The rules are CSS only and use the existing `level-N` row classes and aria attributes. The rows, their order and content, the roles and aria attributes, keyboard behavior, search, History, resizing and the drawer do not change. Titles keep their ellipsis truncation, and the sidebar has no horizontal overflow at 390, 700, 851 and 1440 pixels.

## Pages

### Work page

- Header: title "Current work", the subtitle "<repository> · N open changes", and the actions Start a change (secondary) and New unit (quiet).
- On a protected branch, a notice says "This branch is <branch>. Create a branch to edit knowledge." and offers Create branch.
- Open change cards. Each card shows:
  - the eyebrow: the artifact title, the change identifier and the unit link;
  - the change title;
  - the phase steps;
  - the line "Next: <hint>";
  - Continue (primary), which opens the change page.
- Start a change opens an inline card below the header with these fields:
  - Artifact: the in-place artifacts without an open change, plus "A new artifact". A new artifact needs a title and a purpose. It runs artifact.create, which also creates change-initial.
  - Title and reason.
  - Unit of work: new unit, an existing unit or none.
- New unit opens an inline card with title, purpose, participating changes, criteria and flow assessment. This is the 1.16.0 form.
- Uncommitted knowledge section:
  - one row per file: a checkbox, the document title or the path, the kind, a New, Changed or Deleted badge, and Discard (named "Discard <title>", with a confirmation);
  - the commit message, prefilled as in 1.16.0, and "Commit N files".
  - When there are no files, the section says "All knowledge is committed."
- Dependencies section: one sentence that names the edges, and Show graph, which opens the dependency graph inline.
- Empty state: "No open change." with Start a change.

### Artifact page

- Header:
  - title: the artifact title;
  - subtitle: "Version <current>", the proposed version when it differs, and "depends on" with links to the prerequisite artifacts;
  - Edit (quiet) beside the dependencies, on an editable branch. It opens an inline checklist of artifacts and runs artifact.dependencies.set. A cycle is refused with its path.
- Show dependencies (quiet): opens the graph of this artifact's prerequisites and dependents inline. Selecting an edge shows the existing explanation of why the dependency exists below the graph.
- Purpose: the README body without its first heading. The first paragraph is the lead, and the rest is behind "Read the overview", which opens the README as a document page.
- A notice names the open change with a link. Without an open change, Start a change appears on an editable branch.
- Requirements, Specifications, Decisions and Flows sections:
  - each shows its count, the first 5 documents by title with badges, and "Show all N", which expands the section in place;
  - "+ New <kind>" appears only when the artifact has an open change on an editable branch. It opens an inline card with a title and optional text, as in 1.16.0.
- Versions section: the latest version with its source change and merge date, and "Show versions", which lists all version records newest first.
- A legacy artifact shows a notice that its knowledge is read-only and offers Migrate, with the 1.16.0 preview and confirmation.
- Error diagnostics of this artifact appear as one notice at the top of the page with their Fix actions.

### Document page

- Header: an eyebrow "<artifact> / <kind>", the document title, and Edit (secondary).
- Body: the rendered Markdown without its first heading, in the document type style. Headings, contained links and code highlighting behave as in 1.16.0.
- Properties column. At 1100 pixels and below it becomes a Properties disclosure under the title. It contains:
  - Kind.
  - In this branch: New, Changed, Removed or "Same as main". New and changed documents offer Compare with main.
  - Self-check: Passed, Failed or Not recorded, with a link to its section, and Record self-check.
  - References: each target with its reason and state (resolved or unresolved, with Fix), a Remove control named "Remove reference to <target>", and "+ Add reference".
  - Used by: the changes, units and flows that name this document.
  - File: the repository path in monospace.
  - Edit front matter: the 1.16.0 advanced editor.
  - Delete document, with a confirmation.
- Edit mode:
  - the body becomes a monospace editor at least 480 pixels high, with Write and Preview tabs, Save (primary), Cancel and Ctrl+S;
  - the 1.16.0 conflict dialog, unsaved-edit protection and refresh behavior stay.

### Change page

- Header: an eyebrow with the artifact link, the change identifier and the unit link (or "No unit · Add to unit"), the change title, and "Read reason and scope" (quiet). Reason and scope opens the change README as a document page, which has Edit.
- Phase steps: Requirement, Specification, Plan, Implementation and Version. A completed step links to the document or plan whose self-check completed it. The current step shows "Record self-check" when its document exists and has no recorded self-check.
- Plan section:
  - a summary "N tasks · M done", a List and Graph switch, and the task table with status, ID, task, After (prerequisite IDs) and Done (checked of total DoD items);
  - selecting a row expands it in place. The expanded row shows the Definition of Done checkboxes, which apply at once, the evidence entries, and the actions Record evidence, Edit task and Open task document. Edit task holds Remove task.
  - "+ Add task" is the last row and opens an inline row form with title, prerequisites and DoD lines.
  - Record plan self-check appears when tasks exist and no plan self-check is recorded.
  - Graph shows the existing task canvas inline.
- Changed knowledge section: the knowledge of this change that differs from main, by title and kind with badges. Compare opens the existing line comparison inline.
- Ready for a version section:
  - the 1.16.0 readiness items, each unmet item with a link to the place that fixes it;
  - Prepare version, enabled when all items are met or after the person acknowledges unchecked DoD items. It opens the 1.16.0 inline form with the preview of both files.
  - Record publication review appears when a version record of this change is on main without a review.
- The Overview, Plan and Review tabs are removed.

### Unit page

- Header:
  - eyebrow: "Unit of work · <id>";
  - title, and Edit brief (quiet), which opens the brief as a document page;
  - lead: the purpose;
  - under the lead, one completion line: Complete, Incomplete or Unknown with its first reason. When the reason is a missing publication review, the line links to Record publication review.
- Changes section: one row per member with the change title link, artifact, identifier and phase or delivered version, and "+ Add a change". Show graph opens the unit's artifact graph inline.
- Acceptance criteria section:
  - the summary "N of M have evidence";
  - each row shows the ID, the criterion, an Integration badge where it applies, and an evidence badge (Passed, Failed, Incomplete or No evidence);
  - selecting the criterion text edits it in place, with Integration criterion, Remove, Cancel and Save;
  - selecting the evidence badge opens the evidence form in place, with method, result and source;
  - "+ Add criterion" is the last row.
- Affected flows section: chips with the flow title and effect that open the flow page, and Edit, which opens the inline checklist, effect and flow assessment.

### Flow page

- Header: an eyebrow "<artifact> / Flows", the flow title, and a Steps and Diagram switch.
- "Starts when" (trigger) and "Ends with" (outcome) boxes. Selecting a box edits it in place.
- Steps:
  - a numbered list in step order;
  - each step shows its title, its support counts by knowledge, code and tests, and its outgoing transitions as "→ <n> <short title> when <condition>". A transition to an earlier step uses "↩".
  - Selecting a step expands it. The expanded step lists its supports grouped as Knowledge, Code and Tests, with their basis and evidence state, and the actions Add support, Rename step, Add a next step, Move up, Move down and Remove step.
  - "+ Add step" is the last item.
- Gaps and exclusions: gaps in a warning tone and exclusions in plain text, each with Edit.
- Models, participants and interactions: read only, behind a Model disclosure, with the advanced front matter editor.
- Diagram shows the existing flow canvas.

### More menu pages

- Discover behavior: a page with the existing behavior discovery search and its results. A result opens its flow page.
- Recorded executions: a page with the existing recorded execution list, view and details.
- Runtime badges keep their place in the expanded task row of the change page.

## Graph panel

Graphs use one inline panel: 420 pixels high, or 320 pixels at 800 pixels and below, with zoom controls and the legend. The panel reuses the existing canvas builders with the working branch knowledge. Proposed additions and removals compared with main are shown with the existing edge styles and named in the legend. Selecting a node opens its page. There is no Established, Planning or All snapshots control and no graph page.

## Visual style

One stylesheet defines the tokens. It replaces style.css, workbench.css and editing.css.

| Token | Value |
| --- | --- |
| Page background | #FFFFFF |
| Sidebar background | #F6F6F3 |
| Border, divider | #E6E5E0, #EFEEEA |
| Text, secondary text | #1D1F23, #5E636B |
| Accent (links, primary buttons, focus) | #1F5BD8; selected row #E4EAF8 with text #173F9A |
| Success, warning, danger | #1E7B4F on #E7F4EC; #7A4A00 on #FDF2DE; #B42318 |
| UI type | IBM Plex Sans 14/1.5; section headings 15 semibold; labels 12 |
| Titles and document text | Source Serif 4: titles 32 semibold, prose 17/1.65, card titles 22 |
| Paths and identifiers | IBM Plex Mono 12 |
| Spacing scale | 4, 8, 12, 16, 24, 32, 40, 56 pixels |
| Radius | 6 for controls, 10 for cards and lists |
| Buttons | primary, secondary, quiet and danger-quiet; 36 pixels high, 44 at 800 pixels and below |

The fonts are bundled with the application from @fontsource packages, so the Plane needs no network. Text meets 4.5:1 contrast. Focus is a 2-pixel accent outline. There is no dark theme.

## Labels

| Concept | Label |
| --- | --- |
| Phases | Requirement, Specification, Plan, Implementation, Version. The declared Validation step counts as Implementation; Version preparation is Version. |
| Document compared with main | New, Changed, Removed; no badge when it is the same |
| Change after its version record merges | Delivered <version> |
| Change with a version record that is not on main | Version <version> prepared |
| No open change | No open change |
| Unit completion | Complete, Incomplete, Unknown, with the first reason |
| Evidence of a criterion | Passed, Failed, Incomplete, No evidence |
| Freshness | nothing when current; "Not up to date" beside Refresh otherwise |

"Delivered v1.16.0 · proposed" and similar combinations are not shown. Every existing uncertainty sentence about approval, independent verification and establishment stays where its evidence is shown.

## Read data additions

Pages show titles. The overview response adds two optional fields and changes no other field:

- Each artifact element has a `title`: the text of the first level-1 heading of its body, or the file name without `.md` when there is no heading.
- Each workflow change has a `title`: the first level-1 heading of `changes/<name>/README.md`, or null when there is none.

The packet schemas, MCP read tools and HTTP routes are otherwise unchanged.

## Code structure

- Keep the data and logic modules: reload.js, request.js, knowledge-api.js, editing helpers and EditContext, work-model.js, project-tabs.js, the canvas builders (canvas.js, task-canvas.js, unit-canvas.js, flow-canvas.js, graph.js, GraphLabels.jsx, label-placement.js, prerequisite-view.js), Markdown.jsx, CodePanel.jsx, code-highlight.js, knowledge-navigation.js, line-comparison.js, ReviewDiff.jsx, context-packet.js, elements.js, model.js and Runtime.jsx.
- main.jsx keeps repository loading, events, scoped section loads, the page route and the edit context. Presentation moves to the shell (top bar, sidebar) and the page components.
- Remove the components that only serve removed controls: NavigationTree.jsx, SourceBar.jsx, PageHeader.jsx, Rail.jsx, GraphPage.jsx, Workspace.jsx's view switcher, the inspector parts of Delivery.jsx, UnitsOfWork.jsx, Flows.jsx, ChangeReview.jsx, TaskGraph.jsx and RecordedExecutions.jsx. Keep the logic that pages still use in modules without presentation.
- Add no UI framework, router, editor library or state store. The only new dependencies are the three font packages.

## Browser tests

- Rewrite the browser suites that drive removed controls for the new pages, with one shared navigation helper.
- A layout suite checks every page at 1440 pixels for:
  - exactly one h1;
  - one Navigation landmark outside main;
  - no tree or navigation list inside main;
  - no Established, Planning or All snapshots control;
  - unique accessible names among the visible buttons and links of main.
- The scenario suite keeps S1–S8 and their measurement. It fails when a scenario needs more actions than its 1.16.0 measurement: S1 20, S2 7, S3 13, S4 29, S5 14, S6 10, S7 3, S8 5.
- The keyboard-only S1 and the overflow checks at 390, 700, 851 and 1440 pixels stay.
- A screenshot script captures the six pages at 1440 and 390 pixels for the owner's comparison with the mockups.

## Affected flows

The steps of knowledge-authoring, repository-exploration, source-retrieval, unit-inspection, change-review, project-tabs, repository-refresh and execution-observation keep their meaning. Their support paths change to the new page modules and rewritten browser suites. Their observed supports are recorded again from the new test runs. The knowledge-authoring gap about action targets is replaced by the B6 rule. Context-handoff does not change.

## Specification self-check

- D1–D11 map to the layout, top bar, sidebar, pages, graph panel, visual style and labels sections.
- B1 is the owner's approval of 17 October 2026. B2, B3, B5, B6 and B8 map to the browser tests and the screenshot script. B4 maps to the sidebar, and B7 to the code structure and read data additions.
- Decision 015 records the choice to rebuild the pages.
- N1–N5 map to Tree presentation. The owner chose the treatment on 18 October 2026; the `--control` color keeps the guide lines visible on the sidebar, hover and selected backgrounds, where `--border` almost matches the selected background. The rules reuse the row classes, so the tree logic does not change.
- KISS:
  - the server operations are reused without change;
  - the read data gains two optional fields;
  - the presentation-only views are removed;
  - one stylesheet;
  - three font packages and no framework.
- STE: each control has an exact label.
- The superseded requirement statements are amended in place.
- No blocker prevents Plan.
