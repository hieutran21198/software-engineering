# Separate current knowledge and change histories

## Scope and ownership

Own src/elements.js, src/canvas.js, source grouping in src/main.jsx, relevant styles and grouping tests. Update active-change declaration parsing in src/model.js.

## Prerequisites and governing elements

User approval. Requirements 16 and B11; Knowledge display contract in specifications/explorer.md in this change.

## Definition of Done

- [x] Primary type groups contain only current-version records; Change histories and each change/type start closed.
- [x] Source-specific counts, natural order, compact records, selections, and reference reveal work in canvas and inspector.
- [x] Valid Active change links select one existing owned change; malformed, contradictory, unsafe, missing, and absent declarations follow the specified diagnostic/fallback rules.
- [x] Existing DAG, proposal, reference, resize, and read-only regressions pass; add meaningful B11 and declaration checks.

## Evidence

The 18 Node checks and 4 Chromium browser checks passed. B11 verifies version-only counts and independent history expansion. Declaration fixtures cover retained candidates, code examples, unsafe paths, contradictory links, and missing targets. Existing browser checks verify reference reveal, compact records, inspector resizing, Git/file fingerprints, and inert Markdown. The grouped canvas screenshot was inspected. Production build passed with the existing non-blocking Vite warnings. KISS uses one shared source-aware control list; STE labels current knowledge and histories explicitly.
