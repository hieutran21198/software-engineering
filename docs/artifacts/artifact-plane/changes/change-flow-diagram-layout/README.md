---
tier: small
---

# Lay out the flow diagram along its transitions

## Reason and scope

On 27 October 2026 the owner reported that the edges of the flow diagram overlap and that the flow is hard to see. The screenshot of zitadel-event-intake shows the cause: `flowDiagram` puts the steps in rows of three in document order and ignores the transitions. The lines to the reject step and to the publish step run through the same space between the rows, the label placement moves the condition labels away from their lines with dotted leaders, and the retry loop on publish shows as a short stub.

Included: a layered left-to-right layout of the step diagram by its transitions, layout space for each condition label, lines along the layout points, and an arc for a loop on one step. Excluded: the behavior canvas of `flowCanvas`, the other graphs, and the flow document format.

## Plan

One task changes src/flow-canvas.js and the edge path in src/GraphLabels.jsx, and updates test/flow-canvas.test.js. The task covers W11 in requirements/authoring-workbench.md. Compatibility: patch.

## Tier decisions

One repository and one artifact. Impact: `flowDiagram` is used by the flow page and the impact highlight of the flow page; `LabelledEdge` is used by every labelled graph, and an edge without layout points keeps its smooth step path. No route, MCP tool, flow record, decision or dependency changes.

- [Task](tasks/01-deliver.md)
