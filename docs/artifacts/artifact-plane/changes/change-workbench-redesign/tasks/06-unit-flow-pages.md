---
id: unit-flow-pages
depends_on: [style-and-shell]
evidence_records: []
---

# Unit and flow pages

## Scope and ownership

Own apps/artifact-plane/src/pages/UnitPage.jsx, FlowPage.jsx, FlowEditor.jsx and the Discover behavior and Recorded executions pages, with the parts of UnitsOfWork.jsx, Flows.jsx and RecordedExecutions.jsx that they still need.

## Governing knowledge

specifications/authoring-workbench.md, sections Unit page, Flow page, More menu pages and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [ ] The unit page shows the eyebrow, title once, Edit brief, purpose, one completion line with the publication review link where needed, changes with "+ Add a change" and Show graph.
- [ ] Criteria rows show ID, text, Integration and evidence badges with the "N of M have evidence" summary; selecting the text edits it in place, selecting the badge records evidence in place, and "+ Add criterion" adds one; affected flows show as chips with Edit.
- [ ] The flow page shows the title once, Steps and Diagram, editable Starts when and Ends with boxes, numbered steps with support counts and transitions, an expanded step with grouped supports and its six actions, "+ Add step", gaps and exclusions, and the read-only Model disclosure.
- [ ] Discover behavior and Recorded executions open from the More menu as pages; a discovery result opens its flow page.
- [ ] Screenshots at 1440 and 390 pixels match the Unit and Flow mockups.

## Evidence
