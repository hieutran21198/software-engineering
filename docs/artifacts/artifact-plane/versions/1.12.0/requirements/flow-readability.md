# Flow readability requirements

The flow explorer currently prints raw diagnostic messages and serialized omission records above the graph. A missing optional model repeats a filesystem error. The supporting-node checkbox inherits a column layout that separates its control from its text.

## Scope and acceptance

- Keep the flow title, trigger, outcome and graph easy to scan on wide and narrow screens.
- Show the missing-model condition once per visible explorer context in plain language. State that keyword and graph discovery remain available. Keep exact diagnostic details available on demand.
- Show shortened-source counts with expandable readable paths and omitted character counts. Hide empty omission lists. Do not claim omitted text means missing artifacts.
- Keep the supporting-node checkbox beside its label and usable with the keyboard.
- Preserve freshness, completeness, source publication, diagnostic severity, source pagination and navigation behavior.

This retained presentation scope excludes model installation, new dependencies and historical snapshot changes. Backend corrections and selected-change review/context work are separately governed by this change's evidence-correctness and change-review-context requirements.

## Navigation consistency amendment

The user supplied further screenshots while the readability PR remained open. The Flows switcher has no active visual state, flow knowledge uses an independent native dropdown, and artifact clicks do not change the visible flow canvas or placeholder inspector.

- Every active explorer view has the same visible selected style and accessible pressed state.
- Established and Planning use consistent segmented controls and retain their shared choice when switching between Dependencies and Flows within one project. All snapshots remains a clearly identified flow-only option.
- Flows uses the established three-panel layout: flow list on the left, graph in the center, selected flow/step/source details on the right.
- Preserve valid flow selection, search and source context when switching away and back. Project tabs and worktrees remain isolated.
- A list selection updates the matching center canvas and right inspector. Do not leave clickable artifacts that only update an invisible dependency selection while Flows is visible.

## Requirement self-check

Inspected Flows.jsx, its CSS, the shipped flow specification and the delivered browser evidence. The screenshot matches raw JSON rendering and the shared column-label rule. One owning artifact is affected. KISS limits work to presentation; STE uses direct notices and keeps technical detail available. No requirement blocker remains.

Amendment check: inspected main.jsx state and panel rendering, Flows.jsx local state and view-toggle CSS. Confirmed the missing active class, independent default and placeholder inspector in code. The same open unit owns this presentation outcome. Navigation consistency is new scope; prior presentation evidence remains valid, but it does not validate the amendment.

## Lazy paginated discovery

Load flow results only when the Flows view is active. Load detail only after selection and source text only when requested. Fetch the list in bounded pages as the user scrolls, with an accessible Load more control as a fallback. Empty-query browsing and impact lists retain descending creation-date order; nonempty search leads with exact IDs and relevance under E3. Do not use filesystem modification time as creation evidence. Preserve loaded pages and selection across view switches when their context and revision remain valid. Unknown creation dates remain explicit.

Requirements amendment check: existing search/impact operations already expose cursor pagination but sort by relevance/ID and contain no creation metadata. Creation-date provenance and sorting therefore require a small additive retrieval change; the earlier backend-change exclusion is narrowed to allow this specific metadata/order work. Model installation, index algorithms, arbitrary file access and historical authoring remain excluded.
