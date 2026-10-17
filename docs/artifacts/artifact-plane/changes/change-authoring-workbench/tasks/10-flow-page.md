---
id: flow-page
depends_on: [flow-operations, edit-interfaces, workbench-shell]
evidence_records: []
---

# Flow page

## Scope and ownership

Own the flow page: header fields, step list with supports and next chips, support list with pickers over documents, flows and tracked implementation and test files, gaps and exclusions, Move up and Move down, the graph toggle over the existing flow canvas, read-only models, participants and interactions, the advanced front-matter editor and the Discover action that keeps behavior discovery reachable.

## Governing knowledge

specifications/authoring-workbench.md, section Pages (flow); specifications/knowledge-editing.md flow operations; specifications/flows.md for discovery.

## Prerequisites

Tasks flow-operations, edit-interfaces and workbench-shell.

## Definition of Done

- [ ] Add flow creates a valid flow from title, trigger, outcome and first step and opens the page; steps, transitions and supports are added, edited, reordered and removed through the operations with pickers that make invalid endpoints impossible.
- [ ] The graph toggle mounts the existing flow canvas for the current record; the model layer is shown read-only and editable through the advanced front-matter editor with validation.
- [ ] Behavior discovery and the artifact scope selector remain reachable from the Flows kind.
- [ ] Browser tests cover S4 and the widths; fixture bytes outside the flow document are unchanged.

## Evidence

Implementation has not started.
