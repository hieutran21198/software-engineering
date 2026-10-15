# Named search and readable label contract

Governs U1–U7. This contract supplements the retained discovery and presentation contracts without changing default external discovery behavior.

## Named filtering and discovery

Normalize literal title/ID filtering with trim, Unicode NFC and lowercase. Match a substring of each title or identifier independently; do not match a concatenation spanning two fields. Unit filtering remains local over all loaded unit summaries. Flow filtering applies over all summaries in the selected context before page slicing. An exact full title or unambiguous exact identifier sorts first; remaining matching titles use natural title order with opaque-ID ties. Empty flow queries retain newest-first browsing.

Add optional match: title | discovery to search requests only. Omission means discovery and preserves existing exact/keyword/semantic ranking. Reject invalid values or use on non-search operations with the existing 422 selector error. HTTP and search_flows MCP expose the same optional field. All root, source, origin, size and budget guards remain. Cursors bind match mode as well as normalized selectors, context and revision; a cursor from another mode must fail. Existing omitted/default discovery inputs and response envelopes remain compatible. Title mode must not initialize or execute embedding inference; use current graph summaries/index boundaries with no new index or database.

## UI interaction

A small shared search-field presentation supplies label, Title or ID placeholder, native input and clear action to Unit of Work and Flow named search. Units filter immediately. Flows debounce typed named requests by 250 ms to avoid duplicate reads; Enter flushes the latest request immediately. Neither requires a Search click for named filtering. Clearing resets the query/page and restores browsing.

Flow search defaults to Title or ID. An explicit Behavior discovery option preserves semantic/keyword discovery and shows its Search action; Enter submits it. Semantic discovery does not execute on every keystroke. Explain that discovery ranks candidates while named search filters matches. Labels describe the active mode without exposing implementation internals.

Loading, error, no matches and ready are separate visible states. Bind callbacks and pages to project/worktree/knowledge, mode, committed query and refresh epoch; abort or ignore old replies. Reset paging on query/mode/clear. Do not retain a previous query's result payload merely because its repository revision matches. Keep valid selections as context, but visibly identify selected details outside current matches. Inactive projects pause reads. Clear preserves the current project/worktree and unrelated navigation.

## Edge text placement

Apply to currently labelled dependency/reference and flow edges; do not add labels to task/unit edges that lack them. Inspect representative overlapping graph fixtures before choosing exact rendering details. Default midpoint placement is insufficient when label bounds intersect visible node content.

Use one small shared label-placement/rendering helper where the two labelled graph implementations need the same behavior. Measure or use actual rendered node/card/header bounds, not only guessed fixed heights. Reserve label dimensions when layout permits; choose deterministic nearby clear space or route/callout positions when a midpoint is blocked. Keep displaced labels visibly associated with their edge. Separate parallel/reverse/loop labels. Wrap long text and accommodate its full bounds in the graph viewport. If dense geometry requires a compact presentation, provide an accessible full-text disclosure in clear space; never silently lose relationship text.

Draw only label presentation above opaque group backgrounds where required; leave graph semantics and node/control stacking intact. Avoid blanket global z-index changes as the sole fix: they can replace hidden labels with labels covering node text. Labels must not overlap visible card/header text or cover controls. Preserve the existing pointer pass-through for noninteractive labels. Any disclosure must have keyboard access and must occupy clear space. Preserve pan, zoom, fit, expansion, node selection, edge identity/direction and membership meaning.

## Validation and limitations

Check exact and partial titles/IDs, case/whitespace, absent titles, matches beyond the first 20 records, metadata filtering before paging, all modes, clear/Enter and zero embedding calls for title mode. Actual HTTP and MCP default discovery remain equivalent; run the installed-model regression independently.

Browser fixtures reproduce node/label intersections on both labelled graph families, long text, cycles and parallel/reverse edges. Inspect 1440/700 screenshots and representative zoom/expansion states; verify full text access and unblocked node controls. Tests must check rendered label/node bounds or visibility, not only that label strings exist. Preserve task/unit graphs and project/review navigation.

## Specification self-check

No upstream contract or artifact dependency changes are required. The current session completes Specification and Plan sequentially. KISS adds one explicit match selector and one shared presentation mechanism where duplication is demonstrated. Alternatives appear in ADR 010. STE names filtering, discovery, capture and visibility precisely. Screenshot geometry remains unverified; fixture reproduction is a task DoD rather than invented evidence. No blocker remains for Plan.
