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

## Consistent explorer navigation

Use the existing view-toggle selected styling for Dependencies, Units of work and Flows. Keep aria-pressed consistent with the visible view. Reuse segmented controls in the toolbar for Established and Planning. Store their shared choice in the project session, initially Established, and use it for dependency and flow requests. All snapshots is available only in Flows; returning to Dependencies restores the last common Established/Planning choice. Returning to Flows restores its All snapshots choice until a common choice is changed. Unit-specific workflow and recorded-execution modes retain their existing meanings.

Give flow state a project-session lifetime so switching views does not unmount and discard search, selected flow, selected step, support visibility or source paging. Keep it isolated between project tabs. A knowledge or worktree change cancels old requests and resets incompatible concrete selections. Refresh preserves valid flow/source selections and reloads source excerpts from the first page. Invalid or removed selections clear with an explicit empty state.

In Flows, replace the artifact navigation with the searchable flow list in the left panel. The center displays the selected flow graph and its supporting-node toggle. The right inspector displays the selected flow summary, evidence, supporting knowledge, gaps, exclusions and source reader; a graph node filters its relevant support. Selecting a flow, step or source updates the same context across panels. Artifact and unit participation links still open their requested flow/impact context. Switching back restores the prior dependency or unit selection without showing it as the active flow selection.

Keep the first task's readable notices and expandable details. On narrow screens use the existing responsive panel behavior and accessible labels. Preserve HTTP/MCP compatibility, retrieval candidate semantics, artifact dependencies and publication rules.

Amendment self-check: this adds UI state ownership and panel integration in main.jsx and Flows.jsx, plus CSS and focused tests. Existing project sessions supply isolation; no new persistence store or dependency is needed. The same-session TL reviewed requirements and this contract sequentially. Approval is required before the new task starts.

## Lazy pages and creation-date order

Request 20 flow records per page using the existing search/impact cursor contract. Fetch the first page on entering Flows. Append the next page once when its sentinel enters the scroll viewport; also expose a keyboard-accessible Load more button. Permit only one next-page request at a time. Deduplicate opaque IDs and retain the selected flow. Show initial, next-page loading and retry states separately. Do not fetch details for every list row or source text before selection. Hidden views issue no list/detail/source requests.

Use the first available Git commit introducing the selected flow document as createdAt, an ISO UTC timestamp. This is the selected record's creation date, not a claim about the original logical journey across all snapshots. Uncommitted records and histories with insufficient creation proof expose null and a Creation date unknown label. Do not substitute file mtime or an observed index timestamp. Derive metadata from contained registered repository history in bounded batched reads and reuse it by Git revision in the disposable cache. Preserve the existing read-only and safe-path rules.

Sort search and impact candidate lists by createdAt descending before cursor pagination. Existing retrieval still determines candidate membership and may expose its scores; newest-first determines displayed order. Use opaque ID as the stable tie breaker and put unknown dates last. Return creation metadata additively through the shared HTTP/MCP service; existing clients remain valid. Bind cursors to the selected context/revision/query as before.

Reset pages when search, knowledge or worktree changes. On revision refresh or stale-cursor rejection, reload the first page and retain a selected detail only if it still resolves. Abort or ignore old-context page responses. Creation-date metadata follows Git revision invalidation. All snapshots orders each snapshot record by its own documented Git creation date. This amendment permits only the needed reader/index metadata and ordering additions; other backend behavior is unchanged.

Specification self-check: existing cursor pagination supplies the transport and safe context binding. This design adds no workflow database or model download. Tests must cover larger lists, tie/unknown dates, page boundaries, read-only parity and stale requests before delivery evidence can pass.
