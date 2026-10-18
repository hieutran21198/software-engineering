# Flow exploration and retrieval contract

Governs P1–P9 in requirements/flows.md. Consume established ADD 2.1.0, specifications/system-flows.md, delivered through change-flow-discovery. The protected main snapshot, retained delivery task path set/bytes, canonical guide and packaged implementation match the prepared contract after PR #20 merged. The supplying contract is established; this new change still requires approval of its own concrete plan.

## Reader and views

Parse flow front matter from specification elements using the ADD contract. Preserve source-aware element IDs and add typed flow/step identities. Existing references and artifact/task graphs retain their meanings. Resolve same-owner targets in the owning snapshot; cross-artifact targets through established roots unless an explicit proposed supplying change is given. Validate safe tracked implementation/test sources without inventing runtime edges. Return diagnostics for malformed and unresolved records; runtime loops are valid.

Add Flows beside existing Dependencies and Units of work controls. Reuse React Flow, existing layout/selection/Markdown patterns and project-scoped session lifecycle. Display the flow trigger/outcome and step graph; expand supporting artifact/element/source relationships on demand. Show relationship kinds, evidence basis, exclusions, gaps and source selectors. Selecting an artifact/element discovers participating flows. Unit inspectors link affected flows with create/modify/remove intent; no automatic membership or DAG edge is added. Empty/legacy/invalid states remain explicit and accessible.

## Index and freshness

Use Node's existing SQLite capability in a separate flow-index.sqlite file under the private Plane state directory outside registered repositories/worktrees. The graph and parsed records are rebuildable caches, never approval/establishment authority. Store normalized records, reverse support links, source fingerprints, FTS5 documents and Float32 embeddings. Context includes canonical repository/worktree, snapshot selectors, input fingerprints, model revision and index generation. Concurrent HTTP/MCP readers use the same index service and atomic committed generations; interrupted rebuilds do not publish partial generations as complete.

Index heading-sized source chunks capped at the model token limit; include flow purpose, step titles and support reasons. Use local CPU Transformers.js 3.8.1 feature extraction with the quantized Xenova/paraphrase-multilingual-MiniLM-L12-v2 model, revision 2c4055b12046f11709e9df2c122e59ffbdc2f900, mean pooling and normalized vectors. An explicit npm model-install command downloads the pinned model/tokenizer assets into Plane's local model directory and verifies recorded hashes. Disable remote model and runtime-asset loading during normal operation. Missing/corrupt assets produce a diagnostic and preserve keyword/exact/graph retrieval. Do not send repository knowledge to a hosted service or add a generative runtime model.

Nonempty queries lead with unique exact ID matches, then combine FTS5 and exact cosine vector ranks using reciprocal-rank fusion with deterministic ID tie-breaking. Empty queries browse newest-first; do not reorder scored search results by creation date. Default search page size is 10; cap a requested page at 100. Semantic top-k finds starting candidates, not the complete impact set. Impact traverses explicit reverse support/references with a visited set independent of ranked search limits. Return all reachable candidate IDs through pagination, with connecting paths/reasons and whether traversal/results were truncated. Participation does not imply compatibility impact; callers review contracts.

Reuse repository events for knowledge invalidation and extend fingerprints to explicitly registered tracked implementation/test/evidence sources. Avoid recursively indexing all implementation content on each query. At query start validate selected source fingerprints and index context; reindex changed sources/relationships and affected chunks. Check generation again before returning. Stale or unresolved sources cause partial completeness and diagnostics; never report a definitive empty impact set from stale input. Historical and current sources, separate worktrees and proposed/established knowledge never share unqualified identities.

## Public interfaces

Add POST /api/flows/query on the existing loopback service. Requests select a configured repository/worktree and operation search, detail, impact or source, plus the operation's query/IDs, knowledge selector, pagination and excerpt budget. Validate operation selectors, bounded query/excerpt sizes and registered worktrees. Source retrieval accepts an ID from the selected flow context, not an arbitrary filesystem path. Restrict implementation/test reads to safe readable tracked text files referenced by that context; deny escaping symlinks, .git and credential files. Existing HTTP host/origin protections apply.

Responses contain context, revision, generation, freshness, completeness, data, diagnostics, source pointers and pagination/omission metadata. Bound returned excerpts separately from graph traversal; omitted content remains discoverable through source IDs and cursors. No-consumers is supported only for completed traversal over fresh known relationships, not a claim of complete system discovery.

Expose search_flows, get_flow, get_impact_context and read_flow_source through a stdio MCP adapter using the standard TypeScript/JavaScript SDK. Tools call the same service layer as HTTP, with read-only annotations. Supply an npm mcp command, example client registration with explicitly configured repository roots, and stderr-only diagnostics; stdout is protocol traffic. MCP may rebuild local caches but never edits repository knowledge or grants ADD authorization. Preserve equivalent results, validation and freshness labels across adapters.

## Inventory and acceptance

Author specifications/flows records for repository exploration, unit inspection, source retrieval, refresh, project tabs and explicit execution observation from existing code and tests. Every flow owns evidence/gaps; unsupported branches remain inferred. Validate field/path/identity diagnostics, loops/joins/shared support, source deletion/renames, dirty worktrees, ambiguous selectors, interrupted indexing, missing/corrupt models, offline embedding operation, HTTP/MCP parity and repository byte preservation. Use actual model weights for semantic quality checks; fixtures alone cannot prove it. Benchmark cold/warm latency, indexing cost and retrieved context bytes on disclosed hardware/dataset, with expected flows in the top ten and full explicitly connected expected impact consumers.

## Self-check

P1–P9 map to reader/view, ownership, search, index, embeddings, freshness, interfaces, inventory and measurable acceptance. This refines the user-approved local/offline/HTTP+MCP plan without new scope. KISS reuses existing local primitives; STE keeps inferred evidence and completeness explicit. Upstream establishment remains an Implementation gate, not a Specification blocker.

## Named-search amendment

The search-label-usability contract governs the new explicit title/ID mode and shared normal search UI. Existing exact/keyword/semantic discovery and ranking remain the default for omitted external match selectors. Graph identity and evidence semantics remain unchanged.

## Change-impact amendment

The change-impact contract (change-impact.md) governs impact. Semantic ranking stays a discovery entry point above a measured score cutoff and never contributes to impact. The impact operation delegates to the impact service and keeps its result shape. The detail, source and impact operations never initialize the embedding model, and a query reads the repository once.
