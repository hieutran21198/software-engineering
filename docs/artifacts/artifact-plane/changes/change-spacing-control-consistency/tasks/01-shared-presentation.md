---
id: shared-presentation
depends_on: []
---

# Normalize inspector spacing and dropdown styles

## Scope and ownership

Own style.css and minimal semantic wrappers in main, Flows, Delivery, RecordedExecutions, ChangeReview and Runtime as needed. Governs C1/C2/C4. Preserve graph and Markdown styles. Preserve unrelated edits; other contributors can be present.

## Definition of Done

- [x] Rendered headings/actions/status/helper blocks have deliberate 8/12/24 spacing; all five select purposes share computed visual properties, focus and disabled behavior without horizontal overflow.

## Evidence

Shared native select styling replaces separate Recorded executions, Worktree and Flow-filter visual definitions and covers the source picker. Rendered checks compare all five dropdown purposes and verify identical font, padding, border, radius, surface and text styles. Keyboard Artifact and source selection pass; long selected names stay within available width. Completion content measures 12 pixels after the heading, 8 after the action and 12 before the helper note at 1440/700 and a resized inspector. Screenshots were inspected. Scoped direct-child rhythm leaves Markdown internals and graph cards unchanged. Nested review evidence uses the same scale; delivery actions wrap with an 8-pixel gap. Integrated regressions are recorded in visual-validation.
