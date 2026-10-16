---
id: browsing-shell
depends_on: [loading-recovery]
---

# Remove browsing noise and persistent setup controls

## Scope and ownership

Own SearchField usage, compact repository shell, progressive evidence presentation and duplicated/empty sections in main.jsx, Flows.jsx, Delivery.jsx, UnitsOfWork.jsx and style.css. Own collision labels in Workspace.jsx/project-tabs helper and empty/error/loading execution navigation in RecordedExecutions.jsx/Runtime.jsx as needed. Amend focused search/project/presentation/runtime browser checks. Shared files require sequential integration; do not revert another contributor.

## Governing knowledge

UX6, UX7, UX9, UX10, UX11; specifications/ux-simplification.md Lower-noise browsing and shell; existing search-label/project-tab/presentation contracts.

## Prerequisites

Applicable DoD for loading-recovery must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [x] Artifact/Unit/Flow named fields have Clear, no-match and outside-results feedback; Filter artifact list visibly limits its scope and leaves the graph contextual.
- [x] Behavior discovery is a secondary explicit action with submit and return; HTTP/MCP discovery defaults, query paging and selection isolation remain compatible.
- [x] Routine valid/ID/date/index/publication detail is secondary, meaningful partial/stale/invalid/unresolved states remain visible, empty sections disappear and duplicate dependency/history labels are clarified.
- [x] Successful open uses the compact source bar; Change repository, Cancel, invalid restored roots and Refresh remain accessible with predictable focus.
- [x] Equal basenames use deterministic visible unique suffixes after open/close/restoration; canonical deduplication and keyboard navigation pass.
- [x] Only successful empty execution-context reads hide execution navigation; pending/error/retry and empty-to-present updates remain usable without deleting history.

## Evidence

Production build passed. Four project preference/label Node checks pass, including equal basenames requiring two parent segments and return to short labels when unique. Five focused UX browser checks passed after shell changes: source context, reader/viewport and four widths, safe Markdown, automatic completion recovery, compact setup/search. The compact-shell case verifies hidden successful setup, explicit Change/Cancel, clear and no-match scope with unchanged graph, and hidden successfully empty execution picker. Runtime reads now expose loading/error/retry and reveal loaded contexts rather than hiding failures. Flow discovery retains its existing request modes under secondary actions, and routine metadata remains in named disclosures. Full Flow/runtime/project/visual integration remains task 07.
