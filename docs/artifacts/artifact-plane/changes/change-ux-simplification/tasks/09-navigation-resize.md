---
id: navigation-resize
depends_on: [heading-hierarchy]
---

# Resize the left navigation safely

## Scope and ownership

Sequential implementation owner covers src/main.jsx, src/style.css and existing resize/project-tab browser fixtures. These tasks extend the current unmerged outcome; do not reopen, copy or change earlier completed task evidence.

## Governing knowledge

UX13; specifications/reading-controls.md Left navigation resizing.

## Prerequisites

The listed prerequisite must satisfy its applicable DoD. The original seven-task approval covers its original scope only. Obtain explicit approval of this concrete reading-control amendment before any new application/dependency changes. The established ADD 2.1.0 supplier and existing source/evidence boundaries remain unchanged; no new artifact dependency is introduced.

## Definition of Done

- [x] Pointer capture, ArrowLeft/Right, Home/End, visible focus and ARIA values work with a 180–420px left bound, existing right bounds and a 300px central minimum above 800px.
- [x] Both resize directions, window shrink, no-inspector and open-reader layouts preserve alignment, selection and usable space. Width stays project-local through view/source switches and Refresh; narrow layouts hide handles without losing desktop preference.
- [x] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

Production build and the pure panel-layout matrix passed. Three focused reading-control Chromium cases passed, including pointer/keyboard left widths, the two-panel central minimum at 851px, reader alignment, narrow handle hiding, desktop preference restoration, Refresh and per-project width isolation. The existing right-panel resize case and five project-tab regressions also passed. The initial new tab test used an unscoped label that included an inactive form; scoping it to the active tab panel fixed the test. Source inputs and graph semantics are untouched; geometry derives from per-project preferences without persistent settings. Fixture bytes/Git state remain unchanged. KISS/STE self-check passed.
