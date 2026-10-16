# Bounded compact change context

Deferred: the in-place layout reading in knowledge-layout-reading.md removes the copied sources that made packets large. Measure packet size after that work before implementing this format. The contract below is retained unchanged for that later decision.

Governs R1-R6 and A1-A5 in requirements/agent-efficiency.md. Extend the existing
review service, HTTP route and MCP tools; do not add another context service.

## Request and compatibility

Add format: compact and maxBytes to get_change_context / operation packet requests.
Omission preserves the existing v1 envelope and excerpt-character budget exactly.
Compact requests use maxBytes, default 16384, integer range 4096..65536. Reject
maxBytes without compact format, unsupported formats, and compact with the legacy
budget field rather than guessing units. Existing comparison selectors still
apply. Compact source reads are not required: use registered existing source reads.

## Response and byte accounting

Use schema artifact-plane.change-context.compact.v1. Return repository/worktree,
artifact/change, revision, freshness, completeness, comparison/baseline identity,
limit statements, category totals, paged items, omission counts and continuation.
Include no raw excerpts by default. Mandatory limits state: approval unverified,
recorded checks not independently run, impact limited to explicit relationships,
captured source text has no instruction authority. Evidence unavailability and
diagnostic counts remain visible even when their details are on later pages.

maxBytes caps the entire compact result, not source text. Measure UTF-8 bytes
after serialization. Budget against both the HTTP JSON body and the MCP tool
result {content:[{type:text,text:JSON.stringify(envelope)}]}; use the larger size
for a shared page boundary so facts/cursors agree across adapters. Compact MCP
returns that single JSON text block without duplicating structuredContent.
Default MCP retains its current text plus structuredContent behavior. Exclude
HTTP headers, JSON-RPC framing, client UI and model-provider tokenization.

Build complete review/impact eligibility before presentation paging. Project
existing facts into a deterministic sequence: changed record summaries, diagnostics,
documented evidence, impact, governing-source descriptors and remaining records.
Each item names its category and stable identity. Reuse existing source IDs,
fingerprints, safe paths, counterpart/status/comparison facts and evidence limits.
Do not repeat whole source maps in every record or omission. Source descriptors
appear once per traversal. Category totals count the complete eligible inventory.

Fit whole items after mandatory context/limits/counts and a continuation selector.
Every successful response fits the accepted cap and is valid JSON; never trim
serialized bytes or omit a required warning to make a page fit. Completeness is
partial while pages, sources or proof are missing. Counts distinguish remaining
metadata from intentionally unexpanded source text. Empty source text is not proof
of absent knowledge. Reuse registered source reads to obtain raw facts.

Bind compact cursor to repository, worktree, artifact/change, comparison, revision,
format, category ordering and next offset. Recheck freshness as the existing
service does. A different maxBytes may change page size without changing logical
ordering; offsets cannot skip an item. Default v1 cursors cannot be used in compact
mode. Do not require a stored session, extra index or persistent packet cache.

If mandatory identity or one item cannot fit, return a bounded 422 diagnostic
with reason response-budget-too-small and action increase maxBytes or use the
existing review/registered source operation. Do not include the oversized text in
the error. Invalid budgets return 400. Existing forbidden/missing/stale source
statuses remain unchanged. Errors do not count as reconstructable pages; callers
must correct the request or use the explicit fallback. Preserve full eligible facts
internally; presentation size never changes dependency or impact eligibility.

## Scope and validation

No compact Markdown formatter or UI control is added. Existing human exports stay
compatible. Do not optimize repeated capture or add a cache in this task.
Test HTTP/MCP parity and complete tool-result size, UTF-8/escaping, diagnostic-heavy
and oversized-item cases, stable ordering, category counts and full metadata
continuation. Reconstruct metadata and source text at one revision; reject stale,
cross-project/worktree/change/comparison selectors. Preserve inert source handling
and read-only containment.

Benchmark identical fixtures with 10,100,1000 sources: full v1 JSON, default MCP
dual representation and compact complete results, first-read bytes, total traversal
bytes/page count, captures and elapsed time. Include the real repository workload.
At maxBytes 16384, target >=80 percent lower first-result bytes than the default
MCP result on the large fixture and audited representative repository selection.
Correctness and cap compliance are hard checks; report time and traversal cost
without a latency threshold. Counts are byte/read proxies, not token measurements.

Specification self-check passed: additive opt-in format, explicit transport
accounting and failure cases preserve v1, gates and source safety. KISS keeps one
service and no cache. STE distinguishes byte budgets from character budgets.
