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

- [ ] Pointer capture, ArrowLeft/Right, Home/End, visible focus and ARIA values work with a 180–420px left bound, existing right bounds and a 300px central minimum above 800px.
- [ ] Both resize directions, window shrink, no-inspector and open-reader layouts preserve alignment, selection and usable space. Width stays project-local through view/source switches and Refresh; narrow layouts hide handles without losing desktop preference.
- [ ] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

No implementation or checks have run for this follow-up task. Earlier delivered checks are retained in their original tasks and do not validate this scope.
