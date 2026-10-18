# Answer impact from a typed ledger of declared and derived relationships

## Context

The user reported that the flow impact results of 1.17.0 are not useful and asked for a researched redesign that distinguishes direct, transitive, potential and unresolved impact, explains every item, validates against real changes and keeps maintenance low. The investigation on 18 October 2026 measured the delivered readers on this repository and built a prototype in a scratch directory; nothing in the repository changed.

Measured causes. flowImpact is a reverse breadth-first search over the declared edges supports, references, defines, participates and describes; it returns flows and the nodes it visited, with no hop count, no step scope, no ranking and no code analysis. The impact operation accepts knowledge paths and IDs only; a change to git-process.js, which every Git command passes through, returned nothing. Every flow query reads the repository two or three times and prepares embeddings for detail and source reads that never use them. Semantic search scores every chunk, so every query returns all 17 flows; for "review a change and assess its impact" the first result was the Story-Driven revision flow. The declared graph holds 9 references, all from this artifact to ADD, and no flow cites flow-model.js, the parser of the flow contract. Deterministic relationships were unused: 413 import edges with named specifiers, Go package imports and go:embed, 38 byte-identical mirror files, and 432 commits of history in which, for example, change-review.js and context-packet.js changed together in 5 of 10 commits without an import between them.

Prototype results on nine cases built from real commits (ground truth from source inspection; depth 2; the numbers are from the published research page):

| Case | Direct precision / recall | Steps exact | Hard negatives | Note |
| --- | --- | --- | --- | --- |
| RuntimeStore fix (a4fb88c) | 1.0 / 1.0 | - | 0 | importers of unrelated exports excluded; 6 flows moved to the verification list through their browser tests |
| knowledge-layout contract (b530581) | 1.0 / 1.0 | 5 of 5 | 0 | story-driven reported unresolved |
| task-dag contract | 1.0 / 1.0 | 2 of 2 | 0 | plan and dispatch steps only |
| system-flows guideline and contract (d37ebae) | 1.0 / 1.0 | 3 of 3 | 0 | flow-model.js found as potential through shared vocabulary |
| git-process.js gitSlot | 1.0 / 1.0 | - | 0 | 97 relationships beyond depth 2 reported as frontier; depth 3 reaches all 7 flows |
| change-review.js vs Story-Driven revision | 1.0 / 1.0 | - | 0 | context-packet.js found as potential through history; the semantic neighbour never appears |
| ADD docs-only release (5680b52) | 1.0 / 1.0 | - | 0 | six mirrors direct; artifact-plane and story-driven reported unresolved, not affected |
| style.css rename (7a80907) | 1.0 / 1.0 | 5 of 5 | 0 | the old path reported as deleted in 7a80907 |
| new importers of reader.js (8327cd8) | recall 1.0 | - | 0 | both new modules present at the new revision without any declaration |

Cost on this repository: full index 1.1 to 1.6 seconds (knowledge 0.4, derived 0.6, history 0.14, vocabulary 0.04 to 0.1), queries 0.5 to 34 milliseconds, compact answers 2.6 to 8.8 kilobytes against 1.4 to 30 kilobytes for the delivered impact JSON of the same seeds. The file-level import closure baseline reached 4 negatives in the first case; history alone had recall 0.1 to 0.55; vocabulary alone had precision 0.14 to 0.33.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Extend flowImpact | Add code paths and ranking to the existing reverse closure. | Keeps one rule for every edge type and whole-file granularity; the measured over-approximation (every importer of a file) stays. Rejected. |
| B. Graph-enhanced retrieval | Rank subgraphs with embeddings or PageRank-style scores, as repository-map tools for agents do. | Good for finding entry points, useless for proving a path; the distractor case ranks first. Rejected for impact; the existing discovery search keeps a bounded semantic rank. |
| C. Language-server or SCIP index | Index symbols with a precise cross-file resolver. | Exact for code, heavy per language, nothing for knowledge and contracts, and a new runtime. Rejected now; the typed ledger can take a precise code index as another derived source later. |
| D. Graph database | Store the relationships in a graph store with a query language. | A second store and a new operational dependency for 243 nodes and 697 edges; SQLite already holds the index. Rejected. |
| E. Typed ledger with tiered propagation | Keep the declared knowledge relations from the existing readers, add derived code, package, embed and mirror relations from cheap deterministic parsing, add history and vocabulary as potential evidence only, and propagate with the ADD rules, symbol closure and a depth limit. | Measured above. Reuses the readers, the private SQLite index, the HTTP handler, the MCP server and the graph panel. Selected. |

## Decision

Implement option E as specifications/change-impact.md: a disposable impact index beside the flow index, an impact service that applies the ADD change-impact contract, the Impact view, POST /api/impact/query, the MCP tool get_change_impact and an additive packet field. Semantic search stays in discovery with a score cutoff and never feeds impact. Flow detail and source reads stop loading the embedding model and stop re-reading the repository.

## Consequences

Agents and people get one bounded answer with tiers, paths, evidence and a coverage statement; the delivered flow-only impact remains available through the existing operations. Transitive results through shared modules such as http.js stay broad and are labeled by hops; the frontier count tells the reader when to expand. Injected functions, dynamic calls, Go and CSS symbols and process boundaries are not analyzed and are named in every answer. The parser adds acorn and acorn-jsx as direct dependencies; Go analysis needs the go command and is reported as absent otherwise. The nine cases become a benchmark that must hold at every later version.
