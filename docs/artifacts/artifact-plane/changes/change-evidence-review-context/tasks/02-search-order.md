---
id: search-order
depends_on: []
---

# Preserve exact and relevance search order

## Scope and ownership

Own apps/artifact-plane/server/flow-index.js ordering, src/Flows.jsx list-order label, focused flow-index/browser search checks, and scripts/benchmark-flows.mjs assertions. Preserve all unrelated edits and published history. Other implementers own publication and runtime work.

Governing knowledge: E3/E5, specifications/evidence-correctness.md flow ordering, specifications/flows.md and flow-readability.md. Consume the unit's trustworthy-evidence criterion. Existing optional local embedding contract remains.

## Definition of Done

- [ ] Nonempty searches put unique exact IDs first, then relevance; empty/whitespace browse and impact retain newest-first deterministic order.
- [ ] Sorting occurs before paging; ties, unknown dates, multi-page uniqueness and stale-context cursor rejection remain correct through HTTP/MCP.
- [ ] UI accurately names Relevance first versus Newest records first and retains project/view/source state.
- [ ] Deterministic regressions are required in npm test, including an older exact match against newer weak matches; actual offline-model queries put exact IDs first and all five representative semantic cases in the top ten.
- [ ] Focused Node/browser checks pass; benchmark evidence reports hardware/dataset/cold-warm costs and no invented token savings. Return commands/results to the coordinator.

## Evidence

Implementation has not started. Prior passing retrieval checks do not validate this new order.
