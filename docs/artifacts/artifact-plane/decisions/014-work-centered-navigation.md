# Organize the application around current work instead of graph types

## Context

The explorer offers three sibling views, Dependencies, Units of work and Flows, each with its own sidebar list, selection state and toolbar, with a reader overlay and four inspector variants. The dependency canvas is the home screen. Adding editing to this structure would add buttons to every variant and leave the person without a place that answers what their current work is and what to do next. The user asked to re-evaluate the information architecture rather than add editing controls.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Keep the views, add edit controls | Add Edit, Add and Record buttons to the inspector variants and the reader. | Fastest. Keeps three navigation models, the canvas-first home and the mixed inspector; editing would be scattered across eight panels. Rejected. |
| B. Work-centered shell with content pages | One navigation tree (current work, artifacts, units), one page at a time (work, artifact, document, change, unit, flow, graph), editing in place on the page, graphs mounted on demand. | Fewer concepts and panels, one selection model, the existing canvases and readers reused as page sections. Requires splitting main.jsx and rewriting browser tests that target the removed controls. Selected. |
| C. Separate edit mode or editor application | A second application or a global Edit mode with its own layout. | Doubles navigation and state, forces mode switches for routine edits, and duplicates reading code. Rejected. |

## Decision

Adopt option B as specified in specifications/authoring-workbench.md. The tree replaces the view switchers and sidebars; pages replace the inspector variants except the graph details rail; the worktree selector moves to the source bar as the branch control; read and edit share one page.

## Consequences

The home screen changes from the canvas to the work page, and the Dependencies, Units of work and Flows switchers disappear; the same capabilities remain reachable from the tree and pages. Existing browser tests for those controls are rewritten. State labels are corrected where they misled. The graph canvases, readers, comparison, search, tabs and runtime overlays are reused without semantic change.

## Amendment

Decision 015 keeps the work-centered choice and replaces the navigation tree, the graph details rail and the source bar with a sidebar, inline graph panels and a top bar.
