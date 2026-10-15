---
id: reading-layout
depends_on: [source-context]
---

# Put knowledge before navigation machinery

## Scope and ownership

Own main-area reader/return handling and artifact/unit presentation in src/main.jsx, UnitsOfWork.jsx and style.css, plus focused explorer/units/resize browser checks. Keep the graph mounted behind reader visibility, restore viewport on return and omit the empty inspector/divider. Separate canvas expansion from list disclosure. Preserve exact retained task sources and pending presentation spacing.

## Governing knowledge

UX2, UX5, UX11; specifications/ux-simplification.md Reading and return and Independent disclosure; decisions/011-contained-reading-navigation.md.

## Prerequisites

Applicable DoD for source-context must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [x] Artifact overview and unit purpose/brief precede routine relationships/evidence controls; selected documents render in the main reading area with clear parent/graph return.
- [x] Opening inspector/list sections and selecting list documents do not add graph nodes or alter pan/zoom; explicit canvas expansion and graph reference reveal still work.
- [x] Reading successive sources and returning preserves exact source selection and viewport; worktree replacement clears incompatible history and missing source leaves a usable Back action.
- [x] At 390/700/851/1440 widths and resized inspector widths, reader, graph controls and keyboard return remain usable without horizontal page overflow.

## Evidence

Production build and focused Chromium reading check passed. The check verifies no initial empty inspector, overview purpose before navigation, list disclosure without added graph nodes, main reader and explicit return, identical React Flow viewport transform after return, repository fingerprint preservation and no horizontal page overflow at 390/700/851/1440. The first fixture attempt used a nonexistent README and was corrected to its actual requirement path. A genuine viewport shift from resizing the canvas during reader opening was fixed by placing the reader across the workspace while keeping graph and inspector geometry mounted. Unit brief and task/source reader entry points share the same reader. Full integrated journeys and screenshots remain in task 07.
