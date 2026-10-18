# Navigation tree hierarchy

## Need and observed facts

On 18 October 2026 the owner shared a screenshot of the sidebar's Artifacts section in Artifact Plane 1.17.0. The owner reported two problems. First, a parent and its children have no clear separation: no indent, symbol or line. Second, the space between two artifacts is the same as the space between rows in one artifact.

Observed facts in the 1.17.0 source:

- styles.css indents only `.tree-row.level-2` (28 pixels) and `.tree-row.level-3` (48 pixels). Level-1 rows have the same 8-pixel left padding as level-0 rows. The kinds under an artifact (Requirements, Specifications, Decisions, Flows) and the open changes under Current work are level-1 rows, so they start at the same position as their parent.
- `.tree` separates all rows with the same 2-pixel gap. Nothing marks where one artifact's group ends and the next artifact starts.
- Artifact rows and kind rows use the same weight (400), size (14 pixels) and color.

In the interview the owner chose these treatments:

- Indent the children and draw a thin vertical guide line under the parent's chevron.
- Add extra space before each artifact group.
- Give artifact rows medium weight.

## Requirements

N1. Indentation. Each tree level starts one fixed step to the right of its parent level. A level-1 row starts one step to the right of its level-0 parent, and a level-2 row starts one more step to the right. This applies to every section of the sidebar, including Current work and search results.

N2. Guide line. A row below level 0 shows one thin vertical line for each ancestor level, aligned under that ancestor's chevron. The lines of adjacent rows join without gaps, so one line runs the full height of a parent's visible children. The lines do not hide a row's chevron, label, badge or count, and they stay visible on hover and selected rows.

N3. Group space. A level-0 row has more space above it than the gap between rows in one group, except for the first row after a section heading. The space between two artifacts is therefore visibly larger than the space between an artifact and its first child.

N4. Parent weight. Artifact rows (expandable level-0 rows) use medium weight. Other rows keep their current weight, except selected rows, which keep their existing selected style.

N5. Preserve behavior. Rows, labels, counts, badges, the selection style, the tree roles and aria attributes, the keyboard behavior, search, history, sidebar resizing and the drawer at 800 pixels and below do not change. No horizontal overflow occurs at 390, 700, 851 and 1440 pixels. Long titles still truncate with an ellipsis.

## Scope

Included: the sidebar tree presentation in the browser application and its browser tests.

Excluded: page content, the top bar, sidebar contents and row order, the History switch, the readers, HTTP and MCP interfaces, and ADD contracts.

## Acceptance criteria

- NA1: In the rendered sidebar, each child's chevron starts one step to the right of its parent's chevron, at every level.
- NA2: Child rows show joined guide lines under their ancestors' chevrons, also on hover and selected rows.
- NA3: The space above each artifact row, except the first after the heading, is larger than the gap between rows in one group.
- NA4: Artifact rows use medium weight, and kind and document rows use regular weight.
- NA5: The existing browser tests pass, and no horizontal overflow occurs at the four widths.
- NA6: The owner accepts screenshots of the sidebar at 1440 and 390 pixels on this repository.

## Affected artifacts and flows

Only artifact-plane is affected. The repository-exploration flow lists Sidebar.jsx as its navigation-tree support. The flow's steps and that support's requirement (one sidebar for current work and artifacts with search, keys and History) do not change. No ADD contract and no artifact dependency changes.

## Requirement self-check

The requirements come from the owner's screenshot, the owner's interview choices and the 1.17.0 stylesheet. KISS: the need is presentation only and can reuse the existing level classes and attributes. STE: each requirement states one visible rule, and N5 lists the behavior that must not change. No Requirement blocker prevents Specification.
