---
id: named-search
depends_on: []
---

# Filter flow metadata before paging

## Scope and ownership

Own server/flow-index.js, additive HTTP/MCP search schema and focused adapter/index tests. Governing U1–U4 and U8–U9 and the search-label-usability contract. Preserve default discovery and all existing guards. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [ ] Title/ID matching is normalized and complete before paging; exact and no-match cases pass, including later browsing pages.
- [ ] Optional match selector is compatible by default and bound to cursors; actual HTTP/MCP parity and invalid cross-mode cursors pass.
- [ ] Title mode executes zero embedding inference; installed-model default discovery remains available.

- [ ] Optional artifact scope reuses complete recorded participation before ranking and paging, including cross-owner flows; option metadata includes artifacts without flows.
- [ ] Composite title/behavior/element-impact queries and artifact-bound cursors preserve explicit context and HTTP/MCP parity; unknown selectors are rejected.

## Evidence

Implementation has not started. No executable behavior is claimed by this plan.
