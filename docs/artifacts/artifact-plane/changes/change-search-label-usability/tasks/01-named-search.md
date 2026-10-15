---
id: named-search
depends_on: []
---

# Filter flow metadata before paging

## Scope and ownership

Own server/flow-index.js, additive HTTP/MCP search schema and focused adapter/index tests. Governing U1–U4 and the search-label-usability contract. Preserve default discovery and all existing guards. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [ ] Title/ID matching is normalized and complete before paging; exact and no-match cases pass, including later browsing pages.
- [ ] Optional match selector is compatible by default and bound to cursors; actual HTTP/MCP parity and invalid cross-mode cursors pass.
- [ ] Title mode executes zero embedding inference; installed-model default discovery remains available.

## Evidence

Implementation has not started. No executable behavior is claimed by this plan.
