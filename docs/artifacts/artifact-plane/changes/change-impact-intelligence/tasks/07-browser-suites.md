---
id: browser-suites
depends_on:
  - entry-points
  - flow-reads
---

# Browser suites

## Scope and ownership

Own test/browser/impact-page.spec.js, the additions to test/browser/flow-page.spec.js and test/browser/change-page.spec.js, and the screenshot script for the owner's review.

## Governing knowledge

specifications/change-impact.md, sections Impact view and Validation. specifications/authoring-workbench.md, browser test rules.

## Prerequisites

Tasks entry-points and flow-reads satisfy their DoD.

## Definition of Done

- [ ] Suites cover each entry point, the filters, the expansion by one hop, the detail panel, the graph toggle, the diagram highlight, and the empty and stale states, at 1440 and 390 pixels.
- [ ] The layout suite passes for the new page: one title, one navigation, unique control names, no horizontal overflow.
- [ ] The screenshot script captures the Impact page for the research cases on a disposable clone of this repository at both widths.
- [ ] All browser suites pass in two consecutive runs.

## Evidence

No checks have run.
