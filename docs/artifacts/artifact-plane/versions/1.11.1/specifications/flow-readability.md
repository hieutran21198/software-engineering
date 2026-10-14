# Flow evidence presentation

## Status and diagnostics

Render freshness and completeness as separate readable status labels. Put generation in expandable technical details. Show a compact missing-model notice: Semantic search is unavailable. Keyword search and graph discovery still work. Offer the existing manual installation command in expanded details; do not download or install anything from the view.

Merge identical search/detail diagnostics by code and message for the same visible context. Keep other unique diagnostics visible with readable summaries. Preserve exact codes and messages in native details/summary controls that support keyboard activation. Source-specific responses retain their own relevant evidence. Missing optional semantic capability does not change the backend completeness claim.

## Shortened sources

Do not render JSON as normal prose. Hide empty omissions. For nonempty omissions, show the number of shortened sources and expand a list of readable repository-relative paths and omitted character counts. Resolve opaque source IDs from returned source records where available, or safely decode the existing tuple identity. If decoding fails, retain the original identity in technical details. Never invent a filename or a missing-artifact claim.

## Layout

Add spacing between toolbar, status, flow summary and graph. Use a dedicated inline checkbox label rule instead of the general column-label rule. Keep paths and diagnostic details wrapped within their panel. Preserve source publication state/reason while removing serialized publication objects from normal prose. Existing graph behavior, fetch lifecycle and source pagination stay unchanged.

## Impact and self-check

Only Flows.jsx, its existing stylesheet and focused browser coverage require code changes. Existing HTTP/MCP response schemas, model installation, source safety and artifact dependencies remain compatible. No ADR or new abstraction is needed. Update the owned exploration/source-retrieval descriptions to mention compact expandable evidence. KISS reuses native details controls; STE preserves status meanings. No specification blocker remains.
