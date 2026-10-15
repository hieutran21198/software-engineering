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

- [ ] Artifact overview and unit purpose/brief precede routine relationships/evidence controls; selected documents render in the main reading area with clear parent/graph return.
- [ ] Opening inspector/list sections and selecting list documents do not add graph nodes or alter pan/zoom; explicit canvas expansion and graph reference reveal still work.
- [ ] Reading successive sources and returning preserves exact source selection and viewport; worktree replacement clears incompatible history and missing source leaves a usable Back action.
- [ ] At 390/700/851/1440 widths and resized inspector widths, reader, graph controls and keyboard return remain usable without horizontal page overflow.

## Evidence

No implementation checks have run for this task. Record actual commands, observed results, source references and limitations here after approved execution.
