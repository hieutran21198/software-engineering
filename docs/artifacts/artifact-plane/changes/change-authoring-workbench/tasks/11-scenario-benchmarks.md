---
id: scenario-benchmarks
depends_on: [document-editing, change-unit-pages, flow-page]
evidence_records: []
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
- [ ] S7 shows the fix action for an unresolved reference and the conflict dialog for a concurrent save; S8 reloads the fixture through the readers and compares the derived snapshot with the pre-edit expectations.
- [ ] S1 is completed by keyboard alone; the label corrections of W10 are asserted.
- [ ] Screenshots and geometry checks show no horizontal overflow at the four widths; the measured results are written to a JSON report that task integration-publication copies into the evidence table.

## Evidence

Implementation has not started.
