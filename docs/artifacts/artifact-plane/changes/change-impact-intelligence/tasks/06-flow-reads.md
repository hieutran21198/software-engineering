---
id: flow-reads
depends_on: []
evidence_records:
  - id: flow-read-checks
    method: cutoff and term-filter measurement on this repository with the installed model; warm detail timing; node --test test/flow-index.test.js test/flow-canvas.test.js; npm test; npm run build; Playwright flow-page and discovery-recorded specs
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/06-flow-reads.md#flow-read-checks
---

# Flow reads

## Scope and ownership

Own the discovery cutoff and the operation changes in apps/artifact-plane/server/flow-index.js, the fingerprint freshness check in server/flow-reader.js, the diagram source in src/pages/FlowPage.jsx, and the tests test/flow-index.test.js and test/flow-canvas.test.js.

## Governing knowledge

specifications/change-impact.md, section Discovery and flow reads. specifications/flows.md, Change-impact amendment. requirements/change-impact.md, I9 to I11.

## Prerequisites

Explicit plan approval. No internal prerequisite. The owner may defer this task at approval; the other tasks do not depend on it.

## Definition of Done

- [x] The semantic cutoff is measured on this repository's inventory and recorded with its value: an unrelated query returns no flow or few flows instead of all 17, a related query no longer returns every flow, and the expected flows of P9 stay in the top ten.
- [x] The detail, source and impact operations never initialize the embedder; a test asserts that the embedder's embed function is not called for them.
- [x] The flow page renders the diagram from the document front matter before the detail reply arrives; the detail reply adds resolution and sources.
- [x] A flow query reads the repository once; the end-of-request check compares HEAD, the worktree status and the observation fingerprint; a warm detail request on this repository answers within 300 milliseconds, measured.

## Evidence

### flow-read-checks

Checked on 18 October 2026 on branch claude/impact-flow-reads (commits c86201d, 3f61fd6, 28f8c8a, d45f7e6 and da4b7af, merged into claude/impact-intelligence).

Semantic cutoff: SEMANTIC_CUTOFF is 0.5. Best cosine scores per flow with the installed model: unrelated sentences at most 0.26, "asdf qwerty" at most 0.508, the expected flows of the six P9 queries 0.637 to 0.728, the review query to change-review 0.593. The keyword rank drops terms shorter than 3 characters and, when a context has at least 5 flows, terms present in at least 80 percent of its flows; if no term remains, the keyword rank is skipped. Flows returned out of 18 before the task and after: repository exploration 18 to 15; source retrieval 18 to 16; project tabs 18 to 11; dependency gates 18 to 16; story revision 18 to 9; "review a change and assess its impact" 18 to 15; "duyệt kế hoạch trước khi code" 18 to 9; "xem lại thay đổi" 18 to 14; "bake a chocolate cake" 18 to 0; "weather forecast tomorrow" 0; "asdf qwerty" 1. All six P9 expected flows rank first. Limit: the ADD adoption query still returns 18 flows, because 17 flows score at least 0.5 on the semantic rank alone; for the review query change-review ranks fifth because "change" and "review" occur in 18 and 16 flows.

Model-free reads: only a discovery search chunks and embeds; a test asserts zero embed calls for detail, source and impact. The flow page draws the diagram from the front matter through flowDiagram in src/flow-canvas.js and does not redraw when the detail arrives. One repository read per query: flowFingerprint (HEAD, status, protected refs, worktree list; 28 to 32 ms) and an LRU of 4 loaded repositories replace the three loader calls. Warm detail on this repository: before 1648 to 1711 ms, after 79 to 80 ms; cold detail 57 s to 0.7 s.

`node --test test/flow-index.test.js test/flow-canvas.test.js`: 25 tests, 24 passed, 1 skipped. `npm test`: 342 tests, 341 passed, 1 skipped, 0 failed. `npm run build` passed. Playwright flow-page and discovery-recorded specs with the Nix Chromium: 21 of 21 passed in two runs before the term filter and once after it; the term filter did not change the page.
