---
id: flow-page
depends_on: [flow-operations, edit-interfaces, workbench-shell]
evidence_records:
  - id: flow-browser-tests
    method: npm run test:browser
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/10-flow-page.md#flow-browser-tests
---

# Flow page

## Scope and ownership

Own the flow page: header fields, step list with supports and next chips, support list with pickers over documents, flows and tracked implementation and test files, gaps and exclusions, Move up and Move down, the graph toggle over the existing flow canvas, read-only models, participants and interactions, the advanced front-matter editor and the Discover action that keeps behavior discovery reachable.

## Governing knowledge

specifications/authoring-workbench.md, section Pages (flow); specifications/knowledge-editing.md flow operations; specifications/flows.md for discovery.

## Prerequisites

Tasks flow-operations, edit-interfaces and workbench-shell.

## Definition of Done

- [x] Add flow creates a valid flow from title, trigger, outcome and first step and opens the page; steps, transitions and supports are added, edited, reordered and removed through the operations with pickers that make invalid endpoints impossible.
- [ ] The graph toggle mounts the existing flow canvas for the current record; the model layer is shown read-only and editable through the advanced front-matter editor with validation.
- [x] Behavior discovery and the artifact scope selector remain reachable from the Flows kind.
- [x] Browser tests cover S4 and the widths; fixture bytes outside the flow document are unchanged.

## Evidence

### flow-browser-tests

Checked at commit 0c6ee0d: 102 of 102 browser tests passed. test/browser/flow-page.spec.js creates a flow from title, trigger, outcome and first step, then adds, edits, moves and removes steps, transitions and support through pickers; a second test proves that the model layer, comments and unknown keys survive step edits. The S4 scenario writes only the flow document and validate-knowledge reports 0 errors. Behavior discovery and the artifact selector stay on the flow page. Deviation: the existing flow canvas stays visible below the editor instead of behind a Graph toggle, so the DoD item about the toggle is not checked. Implementation: src/pages/FlowEditor.jsx and src/pages/FlowPage.jsx; the flow detail response now names the flow file, and the support target picker lists tracked files from the files Git read.
