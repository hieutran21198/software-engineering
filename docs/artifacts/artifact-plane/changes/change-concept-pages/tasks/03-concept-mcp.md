---
id: concept-mcp
depends_on: [concept-graph]
covers:
  - element: requirements/concept-pages.md
    ids: [CP16, CP17, CPA11, CPA12]
---

# Concept MCP

## Scope and ownership

Implementer. `apps/artifact-plane/server/flow-mcp.js` (the `get_concept` tool, the `kinds` input, the instructions), `server/flow-index.js` (kinds in validation, ranking and the cursor selector), the `get_flow` participant fields, and the tests `test/flow-adapters.test.js`, `test/flow-index.test.js`, `test/agent-mcp.test.js`, `test/app.test.js` and `test/review-adapters.test.js`.

## Governing knowledge

specifications/concept-pages.md: Concept operations, MCP; specifications/agent-integration.md: MCP.

## Definition of Done

- [ ] `get_concept` by identity and by exact title returns the concept operation answer with freshness and completeness; an ambiguous title returns candidates (CPA11).
- [ ] HTTP and MCP give the same concept answer for one fixture.
- [ ] `search_flows` with `kinds: ['concept']` ranks concepts as the contract says, and an empty query lists all concepts with `totals.concepts` (CP17).
- [ ] `search_flows` without `kinds` gives the 1.24.0 data and pagination, including cursors, for a title search, a discovery search and an empty query (CPA12).
- [ ] `get_flow` participants have `concept` and `title` when they resolve, and keep their other fields.
- [ ] The default tool count is 13 in the tests, and the instructions have the line `Concepts: get_concept; search_flows with kinds.`
- [ ] `npm test` passes.

## Evidence
