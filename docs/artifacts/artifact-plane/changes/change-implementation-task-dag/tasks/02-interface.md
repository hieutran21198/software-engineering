# Graph explorer interface

## Scope and ownership

Own the React UI, locally bundled browser dependencies, styles, and UI checks under `apps/artifact-plane`. Use React Flow for the interactive canvas, Dagre for artifact layout, and existing Markdown sanitization. Governing elements are `requirements/explorer.md`, `specifications/explorer.md`, and `decisions/001-local-server.md` in this change.

## Prerequisites

User approval. The snapshot contract permits initial UI development with fixture data; integrated operation requires task 01.

## Definition of Done

- [x] Consume the documented snapshot contract without filesystem/Git access or duplicated repository parsing in the browser.
- [x] Check fixture snapshots from requirement examples B1–B5 render the specified statuses and relationships.

- [x] Open a repository using a path input and refresh explicitly.
- [x] Render artifact DAG edges with established/addition/removal distinctions and selectable nodes.
- [x] Verify canvas pan, zoom, initial fit, and explicit fit controls against example B7.
- [x] Expand and collapse multiple artifacts in place using grouped element nodes. Relayout groups without resetting zoom or changing repository data.
- [x] Draw references to visible elements or collapsed target artifacts and show missing targets clearly.
- [x] Selecting an element opens its details; artifact selection remains available by keyboard and in the artifact list.
- [x] Keep canvas state in browser memory. Disable graph-editing interactions and node dragging.
- [x] Offer keyboard-accessible artifact selection, details, current version, and active change.
- [x] Show direct and transitive upstream/downstream relationships for established and planning views.
- [x] Expand knowledge elements and show their reference diagram, targets, reasons, statuses, and resolution errors.
- [x] Render hostile Markdown and graph labels without script execution or unsafe navigation.
- [x] Show loading, empty, error, and diagnostic states. All runtime assets load locally.

## Evidence

npm run build passed. npm run test:browser passed both browser tests in local Chromium using PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. The shared fixture exercises B1–B7: repository opening, artifact details, versions/active changes, relationship lists, multiple expanded groups, element selection, pan, zoom, fit, collapse without zoom reset, proposal views, diagnostics, and explicit refresh.

Hostile Markdown did not execute scripts, retain unsafe links/images, or request external assets. The browser reported no page errors. The empty repository and invalid-path states passed. Canvas unit checks verify grouped element endpoints, collapsed targets, missing target markers, and preserved artifact edges. Visual inspection of the browser screenshot confirmed readable canvas groups and inspector content at 1440 × 1000.

All runtime assets are local. KISS uses React Flow interaction primitives and Dagre for outer groups; no custom rendering engine or graph editor was added. STE checks cover labels and usage text. Vite reports non-blocking warnings for React Flow's client directive and the 535 kB JavaScript bundle (171 kB compressed).
