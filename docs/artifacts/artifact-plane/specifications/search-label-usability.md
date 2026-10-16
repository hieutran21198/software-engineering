# Named search and readable label contract

Governs U1–U9. This contract supplements the retained discovery and presentation contracts without changing default external discovery behavior.

## Named filtering and discovery

Normalize literal title/ID filtering with trim, Unicode NFC and lowercase. Match a substring of each title or identifier independently; do not match a concatenation spanning two fields. Unit filtering remains local over all loaded unit summaries. Flow filtering applies over all summaries in the selected context before page slicing. An exact full title or unambiguous exact identifier sorts first; remaining matching titles use natural title order with opaque-ID ties. Empty flow queries retain newest-first browsing.

Add optional match: title | discovery to search requests only. Omission means discovery and preserves existing exact/keyword/semantic ranking. Reject invalid values or use on non-search operations with the existing 422 selector error. HTTP and search_flows MCP expose the same optional field. All root, source, origin, size and budget guards remain. Cursors bind match mode as well as normalized selectors, context and revision; a cursor from another mode must fail. Existing omitted/default discovery inputs and response envelopes remain compatible. Title mode must not initialize or execute embedding inference; use current graph summaries/index boundaries with no new index or database.

## UI interaction

A small shared search-field presentation supplies label, Title or ID placeholder, native input and clear action to Unit of Work and Flow named search. Units filter immediately. Flows debounce typed named requests by 250 ms to avoid duplicate reads; Enter flushes the latest request immediately. Neither requires a Search click for named filtering. Clearing resets the query/page and restores browsing.

Flow search defaults to Title or ID. An explicit secondary Behavior discovery action preserves semantic/keyword discovery and shows its Search action; Enter submits it. Semantic discovery does not execute on every keystroke. Explain that discovery ranks candidates while named search filters matches. Labels describe the active mode without exposing implementation internals.

Loading, error, no matches and ready are separate visible states. Bind callbacks and pages to project/worktree/knowledge, mode, committed query and refresh epoch; abort or ignore old replies. Reset paging on query/mode/clear. Do not retain a previous query's result payload merely because its repository revision matches. Keep valid selections as context, but visibly identify selected details outside current matches. Inactive projects pause reads. Clear preserves the current project/worktree and unrelated navigation.

## Artifact scope and contextual entry

Add optional artifact to search and impact requests. It is a safe artifact identifier from the selected repository/worktree snapshot, not a filesystem selector. Omission means All artifacts. Invalid syntax, an unknown artifact or use on other operations produces the existing 422 selector error. HTTP, search_flows and get_impact_context expose the same compatible optional selector. Other tools retain their existing fields and strict validation.

Derive the complete eligible flow set with existing explicit reverse relationships for artifact:<id>. This includes flows owned by that artifact and flows owned elsewhere that reference or use its recorded knowledge. It creates no artifact dependency, workflow prerequisite or unit membership. Preserve the existing explicit-relationship coverage warning. An artifact dependency without recorded flow participation is not independently sufficient. Apply eligibility before title matching, keyword/semantic ranking cutoffs and pagination; do not filter a global top-20 result or the currently loaded browser page. For an impact request with explicit element IDs, intersect the complete requested impact closure with the selected artifact's complete participation set and retain the narrower impact reasons.

Search/impact results add artifactOptions containing safe id/title summaries from the current scoped snapshot, including artifacts with no flow records. These are UI options, not evidence of participation. Names are inert text. Default requests without artifact retain existing results and ordering. Bind cursors, caches, response identity and pending queries to artifact in addition to match/query/context/revision. Changing artifact resets result paging and invalidates old replies; old cursors from another artifact fail instead of silently mixing results.

The flow sidebar contains a labelled native Artifact selector with All artifacts and the current snapshot's artifact names. It works with both named filtering and Behavior discovery. Preserve it when text is entered/cleared, search mode changes, knowledge mode changes or the ordinary Flows tab is revisited. Keep it per project session. When a selected artifact disappears, show it as unavailable and request an explicit new selection rather than silently broadening to All artifacts.

Find participating flows passes the clicked artifact ID into the flow entry context and opens the flow view. It replaces any earlier artifact scope, query and result page; the selected dropdown is immediately visible. Artifact-level entry browses that artifact's participation with an empty title query. Element-level entry additionally retains its existing specific relationship selector. Selecting another artifact releases the old element restriction. A new query can replace element-specific discovery while retaining artifact scope. Keep the existing switch to Planning for selected change knowledge; do not silently enable All snapshots. The selected worktree remains explicit.

Tests must include another owner's participating flow, a selected artifact's owned flow that fails the title query and an unrelated other-owner flow, an artifact with no flows, eligible matches beyond 20 records, composite title/discovery filtering, clear behavior, unknown/deleted artifacts, mode/context-bound cursors and delayed artifact replies. Actual HTTP/MCP results must agree. Browser checks select one artifact manually then click another artifact's Find participating flows and verify the dropdown, request scope and visible results.

## Edge text placement

Apply to currently labelled dependency/reference and flow edges; do not add labels to task/unit edges that lack them. Inspect representative overlapping graph fixtures before choosing exact rendering details. Default midpoint placement is insufficient when label bounds intersect visible node content.

Use one small shared label-placement/rendering helper where the two labelled graph implementations need the same behavior. Measure or use actual rendered node/card/header bounds, not only guessed fixed heights. Reserve label dimensions when layout permits; choose deterministic nearby clear space or route/callout positions when a midpoint is blocked. Keep displaced labels visibly associated with their edge. Separate parallel/reverse/loop labels. Wrap long text and accommodate its full bounds in the graph viewport. If dense geometry requires a compact presentation, provide an accessible full-text disclosure in clear space; never silently lose relationship text.

Draw only label presentation above opaque group backgrounds where required; leave graph semantics and node/control stacking intact. Avoid blanket global z-index changes as the sole fix: they can replace hidden labels with labels covering node text. Labels must not overlap visible card/header text or cover controls. Preserve the existing pointer pass-through for noninteractive labels. Any disclosure must have keyboard access and must occupy clear space. Preserve pan, zoom, fit, expansion, node selection, edge identity/direction and membership meaning.

## Validation and limitations

Check exact and partial titles/IDs, case/whitespace, absent titles, matches beyond the first 20 records, metadata filtering before paging, all modes, clear/Enter and zero embedding calls for title mode. Actual HTTP and MCP default discovery remain equivalent; run the installed-model regression independently.

Browser fixtures reproduce node/label intersections on both labelled graph families, long text, cycles and parallel/reverse edges. Inspect 1440/700 screenshots and representative zoom/expansion states; verify full text access and unblocked node controls. Tests must check rendered label/node bounds or visibility, not only that label strings exist. Preserve task/unit graphs and project/review navigation.

## Specification self-check

No upstream contract or artifact dependency changes are required. The current session completes Specification and Plan sequentially. KISS adds one explicit match selector and one shared presentation mechanism where duplication is demonstrated. Alternatives appear in ADR 010. STE names filtering, discovery, capture and visibility precisely. Screenshot geometry remains unverified; fixture reproduction is a task DoD rather than invented evidence. No blocker remains for Plan.

## Artifact-scope amendment self-check

The existing explicit closure supplies participation; no new graph or index authority is introduced. One compatible selector and scoped option summaries are sufficient. Filtering before ranking/paging avoids missing later or cross-owner candidates. Empty/unavailable selections and narrow element context remain explicit. KISS and STE checks pass; no new supplier or Specification blocker remains.

Artifact named filtering also uses the shared field and explicit list-only scope under ux-simplification.md.
