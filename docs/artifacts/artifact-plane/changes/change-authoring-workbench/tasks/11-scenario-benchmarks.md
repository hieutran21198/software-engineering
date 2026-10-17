---
id: scenario-benchmarks
depends_on: [document-editing, change-unit-pages, flow-page]
evidence_records:
  - id: scenario-measurements
    method: npm run test:browser (authoring-scenarios.spec.js)
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/11-scenario-benchmarks.md#scenario-measurements
---

# Scenario benchmarks

## Scope and ownership

Own apps/artifact-plane/test/browser/authoring-scenarios.spec.js and a measurement helper that counts user actions, lists files written from operation responses, runs validate-knowledge on the fixture and compares pre-image and post-image lines against the targeted keys and sections. Record screenshots at 390, 700, 851 and 1440 pixels for the document, change, unit and flow pages.

## Governing knowledge

requirements/authoring-workbench.md, sections Baseline measurements, Benchmark scenarios and Acceptance criteria; specifications/authoring-workbench.md, section Measurement.

## Prerequisites

Tasks document-editing, change-unit-pages and flow-page.

## Definition of Done

- [ ] S1–S8 run on clean fixtures on a non-protected branch and meet their targets: action counts within the thresholds, zero raw front-matter edits, validate-knowledge with 0 errors after each scenario, and unchanged bytes outside the targets.
- [x] S7 shows the fix action for an unresolved reference and the conflict dialog for a concurrent save; S8 reloads the fixture through the readers and compares the derived snapshot with the pre-edit expectations.
- [x] S1 is completed by keyboard alone; the label corrections of W10 are asserted.
- [x] Screenshots and geometry checks show no horizontal overflow at the four widths; the measured results are written to a JSON report that task integration-publication copies into the evidence table.

## Evidence

### scenario-measurements

Checked at commit 0c6ee0d: the 11 tests of test/browser/authoring-scenarios.spec.js passed and wrote test-results/authoring-scenarios.json. Actions count every Playwright click, fill, selection and key press after the repository opens; text entries are the fills of free text. S1 20 actions (6 text, 14 other) against at most 10; S2 7 (3, 4) against at most 8; S3 13 (1, 12) against at most 6; S4 29 (9, 20) against at most 14; S5 14 (2, 12) against at most 6; S6 10 (1, 9) against at most 7; S7 3 (0, 3) against at most 3, with the conflict dialog; S8 5 (2, 3) with a reload through the readers and an unchanged working-knowledge snapshot. Every scenario used 0 raw front-matter edits, left validate-knowledge at 0 errors and changed no file outside the files that its operations wrote. The S1, S3, S4, S5 and S6 action targets are not met: the targets count journey steps, but the specified measurement counts every field, and S5 needs at least 10 actions for two documents even with no navigation. The first DoD item is therefore not checked. S1 also runs by keyboard alone; tests assert 'No open change' and the publication-review label with its action; the document, change, unit and flow pages have no horizontal overflow at 390, 700, 851 and 1440 pixels (screenshots test-results/workbench-*.png).
