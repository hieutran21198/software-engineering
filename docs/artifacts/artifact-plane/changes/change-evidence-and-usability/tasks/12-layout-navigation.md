---
id: layout-navigation
depends_on: [declared-evidence]
evidence_records: []
---

# Present working and established knowledge

## Scope and ownership

Own src/elements.js, src/knowledge-navigation.js, src/main.jsx, src/Reader.jsx, src/Delivery.jsx, src/ChangeReview.jsx, src/style.css and browser tests explorer.spec.js, workflow-histories.spec.js and change-review.spec.js.

## Governing knowledge

L5, M4; specifications/knowledge-layout-reading.md navigation section; established reading and UX contracts.

## Prerequisites

Explicit approval and the declared-evidence DoD.

## Definition of Done

- [x] In-place artifacts group elements as Working knowledge with an Established on main view through the contained source route; legacy labels are unchanged.
- [x] Delivery work lists change records with task graphs and version records with summaries; the review shows the Git comparison and declared evidence with the exact remaining gate.
- [x] Registered links, keyboard navigation, return focus and project switching work for in-place sources; diagnostics name their layout.
- [x] Browser checks cover an in-place fixture at wide and narrow widths without horizontal overflow.

## Evidence

Executed on 16 October 2026 after the declared-evidence DoD.

- Working knowledge and the established view:
  - In-place element groups carry the "Working knowledge" source heading. Element tags and the inspector show "Working · proposed (new)", "Working · proposed (changed)" or "Working · established" from the baseline comparison.
  - The artifact inspector shows the established version, any proposed version and the layout name. Legacy labels are unchanged.
  - Modified elements offer "Read established on main". It opens the reader through the contained repository query route (`section: markdown`, `revision: established`), which reads only protected-ref bytes of in-place working sources. Other revisions or sections return 400, and sources not established on the ref return 404.
  - Navigation targets include proposed version records. Scoped queries serve in-place version records and root knowledge.
- Delivery: the change list shows "Version <v>" for change records that a version record names. Phases show Documented complete, Declared incomplete or Not declared, and in-place changes state that Git history is not replayed instead of listing commits.
- Review: the review shows "Baseline: established on main" with the legacy snapshot or version, and a Declared evidence section with the six steps and "Remaining gate", next to the existing approval limit. Unchanged in-place records compare against their own text rather than an empty baseline.
- Snapshot diagnostics under an artifact carry its layout, and the diagnostics list names it.
- Keyboard and focus: the reader opens from the focused button with Enter. Back to artifact returns focus into the artifact inspector, which is the existing behavior for canvas-opened elements.
- Checks:
  - `npm test`: 295 tests, 294 pass, 1 skipped, 0 failures, after `npm ci` restored the locked dependencies. The earlier code-highlight failure was a stale local node_modules without highlight.js.
  - `npm run build` passes.
  - Browser checks ran with the Nix Playwright Chromium on port 4312, through an uncommitted coordinator config, because another session held port 4311. test/browser/in-place.spec.js covers working labels, the established view, delivery phases, the review baseline and gate, and no horizontal overflow at 1440 and 390 pixels with unchanged repository bytes. change-review.spec.js (8), workflow-histories.spec.js (1) and explorer.spec.js (3 of 4) pass. explorer.spec.js B1-B7 asserts that no request leaves 127.0.0.1:4311, so it fails on the alternate port, and it fails the same way without these edits. It is rerun on port 4311 at integration.
