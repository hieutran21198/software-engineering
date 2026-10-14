---
id: search-order
depends_on: []
---

# Preserve exact and relevance search order

## Scope and ownership

Own apps/artifact-plane/server/flow-index.js ordering, src/Flows.jsx list-order label, focused flow-index/browser search checks, and scripts/benchmark-flows.mjs assertions. Preserve all unrelated edits and published history. Other implementers own publication and runtime work.

Governing knowledge: E3/E5, specifications/evidence-correctness.md flow ordering, specifications/flows.md and flow-readability.md. Consume the unit's trustworthy-evidence criterion. Existing optional local embedding contract remains.

## Definition of Done

- [x] Nonempty searches put unique exact IDs first, then relevance; empty/whitespace browse and impact retain newest-first deterministic order.
- [x] Sorting occurs before paging; ties, unknown dates, multi-page uniqueness and stale-context cursor rejection remain correct through HTTP/MCP.
- [x] UI accurately names Relevance first versus Newest records first and retains project/view/source state.
- [x] Deterministic regressions are required in npm test, including an older exact match against newer weak matches; actual offline-model queries put exact IDs first and all five representative semantic cases in the top ten.
- [x] Focused Node/browser checks pass; benchmark evidence reports hardware/dataset/cold-warm costs and no invented token savings. Return commands/results to the coordinator.

## Evidence

Search now trims queries and sorts once before paging: unique exact identifiers, then RRF relevance for nonempty searches; empty queries and impact retain newest-first. List labels reflect the mode. Deterministic older-exact/newer-weak regressions pass, including normalized cursor continuation.

Checks: node --test test/flow-index.test.js test/flow-adapters.test.js passed 21 checks with the optional model case skipped in that run. FLOW_MODEL_STATE=/tmp/plane-flow-model-state node --test test/flow-index.test.js then passed all 15, including actual pinned offline weights. The app build passed with existing React Flow directive/bundle-size warnings. The installed-Chromium flow browser suite passed all 10 cases in 15 seconds.

The actual benchmark on this 16-planning-flow repository used local pinned model assets; exact repository-exploration and all five semantic expected journeys ranked 1, fresh/complete with no diagnostics. Both explicit adoption consumers were returned. Cold request was about 12.1 seconds; concurrent local validation affected later timing, so these numbers are observations rather than an isolated performance comparison. No token/cost saving is inferred. Read-only adapter fingerprints passed. KISS uses existing ranking and cursors; STE distinguishes browsing order and relevance. Integrated outcome validation remains pending.
