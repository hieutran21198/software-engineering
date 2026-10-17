---
id: unit-flow-pages
depends_on: [style-and-shell]
evidence_records:
  - id: unit-flow-review
    method: Page build and screenshot comparison with the Unit and Flow mockups
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/06-unit-flow-pages.md#unit-flow-review
  - id: unit-flow-suite
    method: npx playwright test test/browser/unit-page.spec.js test/browser/flow-page.spec.js test/browser/discovery-recorded.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/06-unit-flow-pages.md#unit-flow-suite
---

# Unit and flow pages

## Scope and ownership

Own apps/artifact-plane/src/pages/UnitPage.jsx, FlowPage.jsx, FlowEditor.jsx and the Discover behavior and Recorded executions pages, with the parts of UnitsOfWork.jsx, Flows.jsx and RecordedExecutions.jsx that they still need.

## Governing knowledge

specifications/authoring-workbench.md, sections Unit page, Flow page, More menu pages and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [x] The unit page shows the eyebrow, title once, Edit brief, purpose, one completion line with the publication review link where needed, changes with "+ Add a change" and Show graph.
- [x] Criteria rows show ID, text, Integration and evidence badges with the "N of M have evidence" summary; selecting the text edits it in place, selecting the badge records evidence in place, and "+ Add criterion" adds one; affected flows show as chips with Edit.
- [x] The flow page shows the title once, Steps and Diagram, editable Starts when and Ends with boxes, numbered steps with support counts and transitions, an expanded step with grouped supports and its six actions, "+ Add step", gaps and exclusions, and the read-only Model disclosure.
- [x] Discover behavior and Recorded executions open from the More menu as pages; a discovery result opens its flow page.
- [x] Screenshots at 1440 and 390 pixels match the Unit and Flow mockups.

## Evidence

### unit-flow-review

Checked on a disposable clone at 390, 700, 851 and 1440 pixels with no overflow. The coordinator compared the screenshots with the Unit and Flow mockups. The checks covered:
- the unit page: eyebrow, title, Edit brief, purpose, one completion line with the publication-review link, changes with "+ Add a change", Show graph, criteria edited in place, evidence from the badge, "+ Add criterion" and affected flows;
- the flow page: title, Steps and Diagram, editable "Starts when" and "Ends with", numbered steps with counts and transitions, an expanded step with grouped supports and six actions, "+ Add step", gaps, exclusions and the Model disclosure;
- the Discover behavior and Recorded executions pages from the More menu.

The coordinator added a per-support Remove control and a source page for code and test supports.

Implementation: src/pages/UnitPage.jsx, UnitPageGraph.jsx, FlowPage.jsx, FlowPageParts.jsx, SourcePage.jsx, DiscoverPage.jsx, RecordedPage.jsx and their CSS.

### unit-flow-suite

`unit-page.spec.js`, `flow-page.spec.js` and `discovery-recorded.spec.js` all passed. The suites found 4 product defects and 5 smaller issues; all are fixed:
- the evidence source lacked member tasks;
- a stale source cursor after an update;
- lost carriage returns;
- discovery pages from mixed rankings;
- symbol supports could not be opened;
- two flow editors could interfere;
- legacy phases stayed on Reading;
- members with equal titles had the same control name.
