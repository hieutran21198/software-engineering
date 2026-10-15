---
id: named-search
depends_on: []
---

# Filter flow metadata before paging

## Scope and ownership

Own server/flow-index.js, additive HTTP/MCP search schema and focused adapter/index tests. Governing U1–U4 and U8–U9 and the search-label-usability contract. Preserve default discovery and all existing guards. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [x] Title/ID matching is normalized and complete before paging; exact and no-match cases pass, including later browsing pages.
- [x] Optional match selector is compatible by default and bound to cursors; actual HTTP/MCP parity and invalid cross-mode cursors pass.
- [x] Title mode executes zero embedding inference; installed-model default discovery remains available.

- [x] Optional artifact scope reuses complete recorded participation before ranking and paging, including cross-owner flows; option metadata includes artifacts without flows.
- [x] Composite title/behavior/element-impact queries and artifact-bound cursors preserve explicit context and HTTP/MCP parity; unknown selectors are rejected.

## Evidence

The integrated flow index and adapter suites passed 26 checks with the installed model and no skips. Actual HTTP/MCP fixtures cover title/ID matches beyond the first page, cross-owner participation, empty-artifact options, normalized queries, strict selectors and mode/artifact-bound cursors. Title queries do not initialize or call the encoder. Discovery-title-discovery switching preserves shared vector rows and does not re-embed documents. All six installed-model benchmark cases ranked their expected flow first; both adoption consumers were returned. No inspected repository bytes changed in the fixture checks.
