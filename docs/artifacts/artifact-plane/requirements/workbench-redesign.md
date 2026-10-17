---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/workbench-redesign.md#requirement-self-check
---

# Use the workbench without friction

## Need

Artifact Plane 1.16.0 lets a person create and change ADD knowledge without YAML. After the merge, the owner ran the application and reported: "it's like a mess. No one, even me want to use." A tool that nobody wants to open gives no value, even when every action works. The need is a calm workbench where writing and changing knowledge is the main path. Reading, graphs and history support that path and do not compete with it.

## Verified findings

The owner's report was checked on 17 October 2026. The application ran from main on this repository at 1440 pixels, and the screens and the source in apps/artifact-plane/src were inspected.

| ID | Finding | Root cause |
| --- | --- | --- |
| G1 | Two navigations on most pages. The flow page has its own artifact filter, search field, mode control and flow list beside the sidebar. The unit and graph pages embed the 1.15.0 canvas and inspector. | The 1.16.0 pages wrap Flows.jsx, UnitsOfWork.jsx and the dependency workspace instead of replacing them. |
| G2 | The unit title appears three times: page header, canvas header and inspector. | Same cause as G1. |
| G3 | About 200 pixels of controls before content: project tabs, a source bar with the full worktree path, then the page header. | The 1.16.0 shell added a page header and kept both earlier bars. |
| G4 | Duplicated actions. Start a change and New unit are sidebar rows and buttons on the work page. Dependency graph is a sidebar row and a button. Flows are under each artifact and under System flows. | Actions are placed as navigation rows and as page buttons. |
| G5 | The sidebar lists all 17 units although 16 are finished, and lists documents by truncated file name. | The tree shows every record without a filter for finished work. |
| G6 | Each list item carries its own collapsed forms. For example, every unit criterion has Edit, Remove and Record evidence controls. Scenario S4 took 29 actions and S5 took 14. | Each operation got its own form instead of inline editing. |
| G7 | Warnings appear on pages that they do not concern. A legacy-record warning shows on the flow list, and the footer says Stale while the data is current. A change shows "Delivered v1.16.0 · proposed". | Diagnostics and freshness are global, not scoped to the record or page. |
| G8 | Established, Planning and All snapshots controls on graph, unit and flow pages. | Kept from 1.15.0. |
| G9 | Different page margins, button sizes and heading sizes between pages. The artifact overview repeats the artifact title under Purpose. | Three style sheets (style.css, workbench.css, editing.css) with no shared scale. |

## Owner decisions

The owner made these decisions on 17 October 2026:

- The main job is to write and change knowledge.
- Established and Planning controls, finished units and changes, and Codex execution views leave the main navigation.
- The style is document-first and light.
- The result is measured by usability: the owner approves mockups, and the built pages match them. Per-click targets no longer apply.
- Project tabs stay.

## Requirements

- D1: Use one top bar, one sidebar and one content column. The top bar shows the open repository, the branch and whether knowledge can be edited, the number of uncommitted files and Refresh. A page has no second navigation and shows its title once.
- D2: Open on the person's current work. Show each open change with its next step and one primary action. Show the uncommitted knowledge files with Commit. When no change is open, show one Start a change action.
- D3: The sidebar lists current work and artifacts. An artifact expands to its documents, grouped by kind and shown by title. Delivered changes and finished units appear only when the person turns on History. Actions are not sidebar rows.
- D4: Each action has one place, on the page of the thing that it changes. One screen does not show two controls for the same action.
- D5: A graph opens on request inside the page that owns it: dependencies on the artifact page and the repository home, the task plan on the change page, steps on the flow page, members on the unit page. Graphs show the working branch. Differences from main appear as badges on the items. There is no Established, Planning or All snapshots control.
- D6: Edit lists in place. A person clicks an item to edit it, and each list has one Add row. Document properties appear in one properties panel. Items do not carry stacked, collapsed forms.
- D7: Show a diagnostic only on the page of the record that it concerns, with its fix action. Show freshness only when the data is not current. Labels do not contradict each other.
- D8: Use a light, document-first visual style with one type scale, one spacing scale, one family of buttons (primary, secondary, quiet) and the same page margins on every page.
- D9: Codex execution views and behavior discovery are available from one menu in the top bar, not from the sidebar.
- D10: Keep the 1.16.0 operations, safety rules, undo, conflict handling, HTTP and MCP interfaces, project tabs, keyboard operation, unsaved-edit protection on refresh and navigation, and use without horizontal overflow at 390, 700, 851 and 1440 pixels.
- D11: The owner approves static mockups of the main pages before implementation. The built pages match the approved mockups.

## Acceptance criteria

- B1: The owner approves mockups of the work page, an artifact page with a document, a change page with its plan, a flow page and a unit page.
- B2: Screenshots of the built pages at 1440 and 390 pixels match the approved mockups, and the owner accepts them.
- B3: Browser tests show that no page has a second navigation list or a repeated title, and that no screen shows two controls with the same action name.
- B4: By default the sidebar shows only open work and artifacts. Delivered changes and finished units appear only with History.
- B5: No Established, Planning or All snapshots control exists. Items that differ from main carry a badge.
- B6: Scenarios S1 to S8 pass with 0 YAML lines, 0 typed identifiers or paths, 0 validation errors and no file changed outside the operations' files. The recorded action count of each scenario is not higher than its 1.16.0 measurement.
- B7: The Node tests, read endpoints, MCP tools and safety tests pass without change. The updated browser suites pass.
- B8: No horizontal overflow at 390, 700, 851 and 1440 pixels, and the keyboard-only S1 test passes.

## Superseded statements

These earlier statements described the 1.15.0 and 1.16.0 layouts. This requirement replaces them; the Specification phase amends their files.

- authoring-workbench.md: W1, the per-scenario action targets, A1 for action counts, A7 for the page list.
- explorer.md: 21 (worktree selection in the repository sidebar), 27 (the view switcher and its Established and Planning controls), B10 (the resizable inspector).
- flow-readability.md: the Established, Planning and All snapshots controls.
- ux-simplification.md: UX2 and UX5 where they describe the graph and inspector layout.
- live-reload.md: R3 where it names the inspector width.
- spacing-control-consistency.md: C1 and C4 where they name inspectors.

## Facts, assumptions and exclusions

Facts: the server operations, writer, Git actions and their tests are in place and pass on main. The browser application in apps/artifact-plane/src has about 5,100 lines in 53 files, including three style sheets. The scenario tests record action counts.

Assumptions: the redesign needs no change to the HTTP or MCP contracts. The Specification phase confirms this. If a page needs a new read field, it is added without breaking the existing responses.

Exclusions: server, writer, Git and MCP behaviour; ADD contracts; AI features; a dark theme; drag-and-drop graph editing; new kinds of knowledge.

## Affected artifacts and flows

Artifact Plane is the only affected artifact; its `depends_on` stays `[artifact-driven]`. Affected flows, all modified: knowledge-authoring, repository-exploration, source-retrieval, unit-inspection, change-review, project-tabs, repository-refresh and execution-observation, because their browser steps and test supports change. Context-handoff is not affected; its packets and MCP tools do not change.

## Requirement self-check

Each finding has screen or source evidence and a root cause. Each requirement states what is needed; the owner decisions are recorded with their date. The acceptance criteria are observable: B1 and B2 by owner approval and screenshots, the others by tests. KISS: no new server mechanism, one style sheet scale, one place per action. STE: short sentences, explicit obligations, and the exclusions are listed. The superseded statements are named for amendment in Specification. No blocker prevents Specification.
