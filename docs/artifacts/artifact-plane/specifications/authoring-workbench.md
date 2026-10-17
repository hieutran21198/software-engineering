---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/authoring-workbench.md#specification-self-check
---

# Authoring workbench contract

Governs W1, W2, W7, W10–W12 and A1, A7, A10 in requirements/authoring-workbench.md. The knowledge editing contract supplies every write. Reuse React, React Flow, the scoped query services, the sanitizer, project tabs, the shared search field, the line comparison helper and the stylesheet. Add no UI framework, router library, editor library or state store.

## Principles

Content first: the page shows the knowledge a person works on; graphs are one page among others. One navigation: a single tree replaces the three view switchers and their sidebars. Progressive disclosure: identifiers, provenance, raw front matter and diagnostics details stay behind disclosures until they matter. Derived facts are labels, not inputs: the Plane shows "changed since main", "no open change" or "ready to prepare 1.16.0" and never asks for a path, an ID or a YAML line in the normal path. Honest states: every label keeps the existing distinction between loading, absent, unknown, documented and verified.

## Shell

The project tab bar is unchanged. The source bar shows the project name, a branch control that lists the registered worktrees with their branches and replaces the sidebar worktree selector, the edit state (Clean, N unsaved, N uncommitted knowledge files), Refresh and Change repository. When the selected worktree has main, master or a detached HEAD checked out, a banner explains that knowledge cannot be edited there and offers Create branch, which asks for a name and runs the branch operation. The Read-only badge is removed.

## Navigation tree

The left panel holds one search field and one tree with three groups.

- Current work lists every open change as artifact / change with a phase chip (the first non-complete declared step) and a next-step hint, and every unit whose members include an open change with its completion label. The group header offers Start a change and New unit.
- Artifacts lists every artifact. An expanded artifact shows Overview, Requirements, Specifications, Decisions, Flows and Delivery history; a kind expands to its documents with a status pill: new, changed or removed since main, or no pill when unchanged. Delivery history is collapsed and sorted as today. A kind header offers Add.
- Units of work lists every brief with its member count and completion label.

The search field filters all three groups by title and ID with the existing normalization. Selecting any row opens its page. The tree uses roving tabindex with arrow, Home and End navigation and remembers expansion per project during the session. The three view switchers, the artifact filter, the unit list, the flow list and the flow artifact selector are removed; behavior discovery stays reachable from the Flows kind through a Discover action that opens the discovery search in the page.

## Pages

The main area shows one page. Each page has a breadcrumb (project / artifact / page), a title, a status line and actions. Pages keep their scroll and form state while another page is visible only within the same project and worktree.

Work page. Shown after a repository opens. It states the branch and protected state, lists open changes with their phase chips, next-step hints, unit, last edited file and actions Open and Review, lists units with completion, and shows Uncommitted knowledge changes grouped by artifact, change and unit with a commit form: a message prefilled from the artifact, change and phase of the selected files, a path checklist and Commit. Empty states explain how to start a change or create an artifact.

Artifact page. Title, established version and proposed version, purpose rendered from the README body with Edit, current work card (open change with Open, or Start a change), knowledge lists by kind with status pills and Add, dependencies with upstream and downstream, the existing Why explanations and Add dependency and Remove actions, flows with Add flow, and Delivery history collapsed. Legacy artifacts show their read-only state and Migrate to in-place, which previews the migration plan and applies it on confirmation.

Document page. Breadcrumb, title, kind and status since main. A properties strip shows references (target, reason, resolved or unresolved, Add, Remove), the self-check state with Record self-check, and for specifications the declared models. Below it the body renders as today with heading navigation and contained links. Edit switches the body to a plain monospace editor with a Preview toggle, Save, Discard and Ctrl+S. Save sends the body with the loaded digest. A conflict shows the current content beside the editor text and offers Reload or Overwrite; Overwrite repeats the save with the current digest. Compare with main opens the line comparison of the existing review helper. Advanced front matter shows the raw front-matter text with its own Save, validated by the properties operation.

Change page. Tabs Overview, Plan and Review. Overview shows the reason and scope (README body with Edit), unit membership with Add to unit, declared phase evidence with a Record action per document and for the plan, and the readiness checklist: open change, plan valid, all DoD items checked, all self-checks recorded, no error diagnostics, branch not protected; each unmet item links to the page that fixes it. Plan shows the task table (sequence, id, title, prerequisites, DoD progress, evidence count) with Add task, Edit, Remove, a Graph toggle that mounts the existing task canvas, and the task detail with DoD checkboxes, Record evidence and Open task document. Review shows the changed knowledge of this change against main with the existing comparison, the live diagnostics for the artifact, the commit form scoped to these files, Prepare version (level, reason, summary, suggested version, unchecked DoD acknowledgment) with a preview of both files, and Record publication review for a version record present on main without a review.

Unit page. Brief body with Edit, members with Add member (open changes of other artifacts) and Remove, acceptance criteria with Add, Edit, Remove and the integration flag, evidence per criterion with Record evidence (method, result, source chosen from task evidence sections of member changes or the brief's Combined checks section, detail text for the latter), affected flows with Set, flow assessment with Edit, and the completion derivation with its reasons and, when the reason is a missing publication review, a link to Record publication review.

Flow page. Header fields title, trigger and outcome with Edit; the step list with id, title, supports and transitions shown as next chips with conditions, Add step, Edit, Remove, Move up and Move down; the support list with kind, target, reason, basis and evidence, Add support, Edit, Remove; gaps and exclusions with Edit; a Graph toggle that mounts the existing flow canvas; models, participants and interactions rendered read-only with an Advanced front matter editor for changes. Pickers: a support target is chosen from documents of any artifact, flows, or tracked implementation and test files found with a path filter; a step support is chosen from the flow's support list.

Graph page. The existing dependency canvas with Established and Planning, element expansion and the legend. Selecting a node or edge opens a details rail with the existing artifact, element, reference and dependency explanations and a button to open the page of the selection.

Discovery, review export, recorded executions and runtime overlays keep their existing presentation inside the Flows kind, the change Review tab and the task detail.

## Journeys

Action counts are user actions after the repository is open. Baseline counts come from the requirement measurements; targets are the scenario thresholds.

| Journey | Before | After |
| --- | --- | --- |
| Start a single-artifact change with one requirement, one task and a unit (S1) | Create 6 files by hand with about 24 YAML lines and 7 identifiers; validate with a script; commit with Git | Work → Start a change → artifact, title, reason, new unit → Add requirement → title, body → Record self-check → Plan → Add task → title, DoD → Commit. 10 actions, 0 YAML |
| Group two changes into a unit (S2) | Write a brief with about 30 YAML lines and 9 identifiers | Work → New unit → title, purpose, pick two open changes, criteria → Create. 8 actions |
| Add and explain a dependency (S3) | Edit depends_on in one file and references in another; rerun validation for cycles | Artifact → Add dependency → pick artifact → Document → Add reference → pick target, reason. 6 actions; cycles rejected inline |
| Create and modify a flow (S4) | Write about 45 YAML lines with 7 ids and 2 paths | Artifact → Add flow → title, trigger, outcome, first step → Add step ×2 → set next ×2 → Add support ×2 → Edit step → Remove support. 14 actions |
| Edit two documents and record self-checks (S5) | Edit bodies, write source fragments and headings | Document → Edit → Save → Record self-check, twice. 6 actions |
| Resume a change (S6) | Find files by path, edit checklist characters and evidence YAML, commit | Work → Open change → Plan → check two DoD items → Record evidence → Commit. 7 actions |
| Fix an unresolved reference and a concurrent edit (S7) | Read a diagnostic, find and edit YAML; concurrent edits silently overwrite | Diagnostic → Fix → pick target. 3 actions; a conflicting save shows both versions with Reload and Overwrite |

## Feedback and states

Saving shows a pending state on the action and an accessible status message on completion. Operation failures show the diagnostics inline at the field or record they name, with Fix actions where the operation can derive the correction (pick a target, rename an ID, remove a stale prerequisite). Applied operations show an Undo action for the journal entry while it remains valid. Navigation away from unsaved editor text asks for confirmation. A repository refresh keeps editor text and marks the document as changed on disk when the digest differs, with Reload and Overwrite. Loading, empty, unknown and error states keep the distinctions of ux-simplification.md.

## Labels and vocabulary

| Concept | Label | Replaces |
| --- | --- | --- |
| Working file equal to main | no pill | Working · established |
| Working file differing from main | changed, new or removed since main | Working · proposed (changed or new) |
| Artifact without an open change | No open change | Active change: Ambiguous |
| Unit missing a publication review | Completion unknown: no publication review for <artifact> <version> — Record publication review | Completion unknown with reasons only |
| Dependency graph after proposals | Planning | unchanged |
| Reader document view | Document page | Knowledge reader |
| Delivery history | Delivery history | Delivery history and Historical documents |

Every existing uncertainty sentence about approval, independent verification and establishment stays where its evidence is shown.

## Responsive and accessibility

At 800 pixels and below the navigation tree becomes a drawer opened from the source bar, pages use the full width, editors keep a 240 pixel minimum height and tables become stacked cards. At 390, 700, 851 and 1440 pixels no page overflows horizontally. All actions are buttons or links with names, pickers are listboxes or selects, form fields have labels, status messages use aria-live, and dialogs trap focus and return it. The existing resize dividers remain for the tree and the details rail. S1 is completed by keyboard alone in a browser test.

## Reuse, modification and replacement

Reuse unchanged: Markdown.jsx, CodePanel.jsx, code-highlight.js, knowledge-navigation.js, canvas.js, GraphLabels.jsx, label-placement.js, task-canvas.js, TaskGraph.jsx, unit-canvas.js, flow-canvas.js, line-comparison.js, ReviewDiff.jsx, context-packet.js, SearchField.jsx, Workspace.jsx, project-tabs.js, request.js, reload.js, panel-layout.js, Runtime.jsx, RecordedExecutions.jsx, Reader.jsx as the document body presenter, and every server read module. Modify: main.jsx is split into a shell (source bar, navigation tree, page router keyed by project and worktree) and page components; Delivery.jsx keeps ChangeDetails evidence rendering and loses the worktree selector; ChangeReview.jsx and Flows.jsx become page sections instead of portal views; style.css gains page and form rules and loses the view-switcher and sidebar-variant rules. Replace: the view toggles, the artifact filter list, the unit and flow sidebars, the inspector variants other than the graph details rail, and the standalone flow inspector. Browser tests that drive the removed controls are rewritten for the pages; Node tests do not change.

## Measurement

The scenario tests count user actions as Playwright click, fill, select and key actions after the repository is open, count YAML lines typed as zero when no raw front-matter editor is used, list files written from operation responses, run validate-knowledge on the fixture after each scenario, and compare the pre-image and post-image of every touched file line by line against the targeted keys and sections. Results are recorded in the integration task with the baseline table of the requirements.

## Specification self-check

W1, W2, W7, W10–W12 map to the shell, tree, pages, journeys, feedback, labels, responsive and measurement sections; A1, A7 and A10 map to the journeys, pages and measurement. The design reuses every canvas, reader, comparison and search component and removes the parallel sidebars and switchers. KISS adds no framework, router or editor dependency. STE keeps labels, limits and derived states explicit. No blocker prevents Plan.
