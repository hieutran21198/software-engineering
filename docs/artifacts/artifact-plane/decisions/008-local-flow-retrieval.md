# Decision: local hybrid retrieval with shared adapters

## Context and alternatives

The user selected local embeddings and HTTP plus MCP access. A hosted embedding service would violate that selection. A standalone vector/graph service adds operations without a present need. Repeating graph/validation logic in each adapter risks conflicting results.

## Decision

Reuse local Node SQLite for a separate rebuildable index, FTS5 and cached normalized vectors, with exact cosine search and explicit reverse graph traversal. Local quantized multilingual MiniLM provides semantic entry points. A shared service supplies HTTP and stdio MCP. Model installation is explicit; normal operation stays offline. The specification owns exact model/revision, result boundaries and freshness rules.

## Consequences

The first model installation requires a download and additional local disk/memory. Exact cosine search is linear in cached vector count; benchmarks report its limits before an approximate index is considered. Missing models reduce retrieval capability explicitly. The index remains disposable and must never become an authority for workflow or establishment.
