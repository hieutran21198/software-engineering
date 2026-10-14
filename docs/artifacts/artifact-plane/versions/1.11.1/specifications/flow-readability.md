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

Keep the first task's readable notices and expandable details. On narrow screens use the existing responsive panel behavior and accessible labels. Do not change HTTP/MCP schemas, index semantics, artifact dependencies or publication rules.

Amendment self-check: this adds UI state ownership and panel integration in main.jsx and Flows.jsx, plus CSS and focused tests. Existing project sessions supply isolation; no new persistence store or dependency is needed. The same-session TL reviewed requirements and this contract sequentially. Approval is required before the new task starts.
