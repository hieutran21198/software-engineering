---
id: browser-suites
depends_on: [work-page, artifact-document-pages, change-page, unit-flow-pages]
evidence_records: []
---

# Browser suites

## Scope and ownership

Own apps/artifact-plane/test/browser: the shared navigation helper, the rewritten suites, the layout suite, the scenario suite and the screenshot script.

## Governing knowledge

specifications/authoring-workbench.md, section Browser tests; requirements/workbench-redesign.md B3–B8.

## Prerequisites

Tasks work-page, artifact-document-pages, change-page and unit-flow-pages.

## Definition of Done

- [ ] Every suite that drove a removed control is rewritten or removed with its coverage moved to a page suite; reading, graph, delivery, review, discovery, runtime, tabs, refresh and search coverage remains.
- [ ] The layout suite checks each page at 1440 pixels for one h1, one Navigation landmark outside main, no tree inside main, no Established, Planning or All snapshots control, and unique accessible names of visible buttons and links in main.
- [ ] The scenario suite runs S1–S8 with 0 YAML, 0 typed identifiers or paths, 0 validation errors and no stray files, and fails when actions exceed S1 20, S2 7, S3 13, S4 29, S5 14, S6 10, S7 3, S8 5; it records the counts.
- [ ] Keyboard-only S1 and the overflow checks at 390, 700, 851 and 1440 pixels pass.
- [ ] The screenshot script writes the six pages at 1440 and 390 pixels to test-results.

## Evidence
