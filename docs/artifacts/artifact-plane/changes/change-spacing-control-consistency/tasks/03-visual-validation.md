---
id: visual-validation
depends_on: [shared-presentation, completion-feedback]
---

# Validate and prepare the presentation patch

## Scope and ownership

Coordinator owns integrated checks, knowledge/flow support, unit evidence, full proposed 1.12.2 snapshot and PR handoff. Governs C1–C4. Preserve unrelated edits; other contributors can be present.

## Definition of Done

- [ ] Inspect actual wide/narrow screenshots, computed gaps/styles, keyboard selection and resized inspector behavior across affected views. Node/browser regressions and build pass; preserve read-only sources and graph behavior. Validate documentation links, task DAG, unique unit membership and complete snapshot provenance without copied tasks. Push and attach PR; stop for team review and merge.

## Evidence

Integrated checks passed 258 Node checks with the installed model and zero skips, all 59 Chromium browser checks, production app build, Go tests/vet and website documentation build. Three new presentation cases measure 12/8/12-pixel heading/action/helper separation at 1440 and 700 widths and a resized inspector; compare computed style across all five native dropdown purposes; retain keyboard Artifact/source selection and long options; and preserve distinct completion reasons and error/retry behavior. Existing review, execution, graph, project, source, unit and Markdown reflow checks pass with read-only repository fingerprints. Screenshots of completion, dropdowns, review, runtime and resized inspectors were inspected. Knowledge checks validate three tasks/two edges, eight flow records, unique unit membership, 44 byte-identical complete snapshot files and 35 release links without ancestor destinations or copied tasks. Historical snapshots and upstream knowledge are unchanged. Proposed patch 1.12.2 preserves source-change/task provenance and the root declaration remains 1.11.0. PR handoff is recorded below after publication.
