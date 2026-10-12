# Separate current knowledge and change histories

## Scope and ownership

Own src/elements.js, src/canvas.js, source grouping in src/main.jsx, relevant styles and grouping tests. Update active-change declaration parsing in src/model.js.

## Prerequisites and governing elements

User approval. Requirements 16 and B11; Knowledge display contract in specifications/explorer.md in this change.

## Definition of Done

- [ ] Primary type groups contain only current-version records; Change histories and each change/type start closed.
- [ ] Source-specific counts, natural order, compact records, selections, and reference reveal work in canvas and inspector.
- [ ] Valid Active change links select one existing owned change; malformed, contradictory, unsafe, missing, and absent declarations follow the specified diagnostic/fallback rules.
- [ ] Existing DAG, proposal, reference, resize, and read-only regressions pass; add meaningful B11 and declaration checks.

## Evidence

Implementation has not started.
