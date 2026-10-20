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

- [x] `get_concept` by identity and by exact title returns the concept operation answer with freshness and completeness; an ambiguous title returns candidates (CPA11).
- [x] HTTP and MCP give the same concept answer for one fixture.
- [x] `search_flows` with `kinds: ['concept']` ranks concepts as the contract says, and an empty query lists all concepts with `totals.concepts` (CP17).
- [x] `search_flows` without `kinds` gives the 1.24.0 data and pagination, including cursors, for a title search, a discovery search and an empty query (CPA12).
- [x] `get_flow` participants have `concept` and `title` when they resolve, and keep their other fields.
- [x] The default tool count is 13 in the tests, and the instructions have the line `Concepts: get_concept; search_flows with kinds.`
- [x] `npm test` passes.

## Evidence

Code commit: 94843f8.

- `node --test test/flow-adapters.test.js` "CPA11, CP16": `get_concept` with `a:identity`, `model:a:identity` and `A:IDENTITY` returns the concept answer with `declaredIn`, `sources`, `flows`, `implementation`, `branchChanged`, `changes` and `diagnostics`, freshness fresh and completeness partial; the title `session` returns a:session; the title `Identity` returns `concept-ambiguous` with severity info and the candidates a:identity and b:identity; `Nothing` returns `concept-unknown`. Passed, 94843f8.
- `node --test test/flow-adapters.test.js` "CPA11, CP16": the MCP `get_concept` result equals the HTTP `concept` operation result, without metrics, for `a:identity` and for `session`. Passed, 94843f8.
- `node --test test/flow-index.test.js` "CP17": `kinds: ['concept']` ranks by exact identity, exact title, title substring, then description substring, case-insensitive; an empty query lists all six concepts with `totals.concepts` 6; without `flow` in `kinds`, `data.flows` is empty, `total` is 0 and the encoder is not called; concepts are not paged; invalid `kinds` give 422. Passed, 94843f8.
- `node --test test/flow-adapters.test.js` "CP17, CP16": MCP `search_flows` with `kinds: ['concept']` lists three concepts with `totals.concepts` 3; with `kinds: ['flow', 'concept']` the MCP result equals the HTTP result. Passed, 94843f8.
- `node --test test/flow-index.test.js` "CPA12": without `kinds`, the data keys are the 1.24.0 keys and the cursor selector is the 1.24.0 digest for a title search, a discovery search and an empty query; `kinds` enters the digest only when present, and a cursor of one form is rejected by the other. Passed, 94843f8.
- Read-only script: the 0eecce1 (1.24.0) and the 94843f8 flow services, on the same fixture repositories, return equal `data` and `pagination`, including every cursor page, for title searches, discovery searches and empty queries. Equal on impactFiles and on a concept fixture without a missing source, 94843f8.
- Read-only script, the same comparison on a concept fixture with a missing model source: `data` and `pagination` are equal except the record revision inside the cursors. The 1169214 (task 02) service gives the same difference, and 94843f8 is equal to 1169214; the revision digest holds `graph.diagnostics`, and task 02 adds `model` and `file` to `missing-model-source`. 94843f8.
- `node --test test/flow-adapters.test.js` "CP17, CP16": in `get_flow` a:login, the resolved participant member has `concept` a:identity, `title` Identity and its other fields; the unresolved participant ghost has no `concept` and no `title`; the MCP result equals the HTTP result. Passed, 94843f8.
- `node --test test/flow-adapters.test.js test/review-adapters.test.js test/app.test.js test/agent-mcp.test.js`: the tool lists have 13 tools, `get_concept` is in them, and the instructions end with `Concepts: get_concept; search_flows with kinds.` Passed, 94843f8.
- Read-only script on this repository through MCP: 13 tools; `get_concept` Version gives artifact-driven:version with 2 flows and 2 implementation groups, fresh; `search_flows` with `kinds: ['concept']` gives 4 concepts; the get_flow participants of repository-exploration name their 4 concepts. 94843f8.
- `node scripts/validate-knowledge.mjs --repository ../..`: ok true, 0 errors, 13 diagnostics. 94843f8.
- `npm test`: 491 tests, 490 passed, 0 failed, 1 skipped. 94843f8.
