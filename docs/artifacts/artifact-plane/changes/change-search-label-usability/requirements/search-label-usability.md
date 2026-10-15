# Search usability and graph label requirements

## Need and scope

Readers must find named flows with the same ordinary search interaction used for units of work. Graph relationship text must remain readable when nodes or other labels occupy its initial position.

## Requirements and acceptance

- U1: In normal title/ID search, typing updates matching results without a required Search click. Clearing restores browsing. Matching ignores case and surrounding whitespace. Both views use consistent labels, clear controls and empty-result feedback.
- U2: A flow title/ID query filters metadata matches before paging. A title with one match produces that match; absent text produces a visible no-match result. A matching flow outside the first browsing page remains discoverable.
- U3: Free-text behavior discovery remains available through an explicit option. Existing HTTP/MCP default discovery and exact/relevance ranking remain compatible. Normal title typing must not invoke semantic embeddings.
- U4: Loading, failures and empty results are distinct. Old query, project, worktree or mode replies cannot overwrite current results. Valid selected context survives refresh; selection outside a filter must not be represented as a search hit.
- U5: Labels on flow and dependency edges remain readable and associated with their edge when midpoint positions intersect visible node content. Long conditions, reverse edges, loops and parallel edges are included. Labels must not hide node controls or intercept their pointer input.
- U6: Node identities, edge identities/directions, dependency meaning, flow participation, existing top-level navigation, unit view order and read-only boundaries remain unchanged. Label placement is presentation, not new graph knowledge.
- U7: Browser checks cover actual title matching, later pages, typing/clear/Enter, search modes, delayed replies, 700/1440 layouts and edge-label/node overlap at representative zoom/expansion states. Installed-model discovery regressions remain verified independently.

- U8: Flow search has a single Artifact selector with All artifacts as the default. It restricts title/ID search and behavior discovery to flows participating in the selected artifact through ownership or explicit recorded relationships, including flows owned by another artifact. Apply the scope before ranking and paging. Artifacts without recorded flows remain selectable and produce honest no-match feedback.
- U9: Find participating flows in Artifact details opens Flows and visibly selects that artifact. Replace any previous artifact selection and paging. Retain the clicked element's narrower relationship context when invoked from element details. Subsequent title queries preserve the selected artifact; clearing the text does not clear it. Project/worktree changes cannot receive stale results from the prior artifact.

## Exclusions and assumptions

No global search, generated answer, ranking threshold, graph engine replacement, workflow database or inferred lifecycle repair is required. The proposed normal search matches title and identifiers as literal text. Behavior discovery remains explicit. The reported screenshot needs live fixture reproduction; existing code confirms no collision-aware placement but does not identify the screenshot's graph.

## Requirement amendment self-check

The user explicitly requested an Artifact filter and contextual selection from Find participating flows. Existing code traverses explicit relationships for this button, so owner-only filtering would regress its meaning. These needs are included in the same outcome, with no new artifact dependency. Recorded executions was inspected to answer a functionality question; its redesign is outside this change. No new Requirement blocker remains.
