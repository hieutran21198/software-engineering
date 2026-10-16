# Reading controls and highlighted code

Governs UX12–UX14 and amends presentation only. This same capable session completes Specification after Requirement. The original eight flows, retained source/evidence rules and API contracts remain valid. No architectural change requires a new ADR; contained reading decision 011 still governs.

## Heading hierarchy

Use relative Markdown heading sizes so every level stays larger than its local body: h1 1.9em, h2 1.6em, h3 1.33em, h4 1.2em, h5 1.13em, h6 1.07em. At the reader's existing 15px body these are approximately 28.5/24/20/18/17/16px. Keep weight and vertical spacing distinct from prose. Reader source/page titles use a responsive 22–28px size; long paths wrap. Do not enlarge graph labels, ordinary prose or all navigation controls as a side effect.

## Left navigation resizing

Add one vertical divider at the sidebar's right edge. Reuse the existing pointer capture and keyboard resize pattern; keep state in ProjectExplorer rather than adding persistence or a resize framework. The divider has an accessible Resize navigation panel name, orientation, controlled sidebar ID and min/max/current values. Dragging right widens the left panel. ArrowRight adds 20px; ArrowLeft removes 20px. Home selects the minimum; End selects the currently permitted maximum. Preserve visible keyboard focus.

Above 800px, permit 180–420px, further constrained so the center retains at least 300px and a grid-occupying right inspector retains at least 240px. The right panel keeps its existing 240–640px limits. A drag clamps against the other current panel. On a narrower window first constrain the left width against minimum right space, then constrain the right width against the resulting left width; both must remain feasible. Preserve existing initial 220px wide/180px medium defaults until the user resizes. The main-area reader's left edge derives from the same actual sidebar width, including retained graph geometry.

At 800px or below hide both resize handles and use the existing compact left widths/stacked inspector behavior. Do not discard the preferred desktop sidebar width merely because a narrow layout is active. Keep the new width with each project during the session, across navigation, source switching and Refresh. Reload persistence is outside this request. Resizing must not initiate repository reads or move source identity, reset selection or alter graph semantics.

## Code panels

Use one small shared code rendering helper for raw source in Reader and fenced Markdown blocks. Add a direct, pinned highlight.js dependency and import its core plus only JavaScript, TypeScript, JSON, YAML, Bash, Go, Python, CSS, XML and SQL grammars. HTML uses XML; jsx/tsx/js/ts/yml/sh aliases map to the appropriate known grammar. Choose language from an explicit fence label or source extension, never automatic detection or a hosted service. Primary API reference: [highlight.js core API](https://highlightjs.readthedocs.io/en/latest/api.html); the official [module usage](https://highlightjs.org/#usage) supports importing selected grammars. Verify the package version from the registry during approved implementation.

Render a dark bordered code panel with readable 13px monospace text, padding, a small language label and contrasting syntax colors. Preserve whitespace and horizontal code scrolling inside the panel without horizontal page overflow. Do not add an editor, execution or copy/format toolbar. Inline backtick code keeps a distinct inline style; ordinary prose remains prose.

For an unknown/missing language, a highlighting error or more than 20,000 UTF-16 characters in one block, render all text as escaped plain code; do not truncate. Explain an oversized plain-code fallback with a concise label. Keep raw source text exactly as returned, including whitespace and final newlines. Preserve the fence parser's code payload without formatting it. Excerpt pagination and partial-source labels remain unchanged.

Highlight strings using the explicit-language API and sanitize generated markup before insertion. Only inert token spans/classes and code text may enter code panels; never allow executable HTML, event handlers, external resources or forged knowledge-link markers. Markdown retains its existing final sanitization and trusted link conversion. No server/source API or arbitrary filesystem access is added.

## Impact and self-check

Amend repository-exploration and source-retrieval presentation support with this documented contract. Other flow identities and existing observed evidence stay retained; earlier checks do not prove these new controls pass. No artifact dependency edge changes; highlight.js is a frontend package, not a new artifact supplier. Preserve the pending 1.13.0 snapshot until this extension is approved, implemented and validated, then reconcile that proposal's complete knowledge with its unchanged source_change provenance.

KISS uses existing resize patterns and one shared bounded code renderer, with no new settings store or framework. STE keeps language, fallback, source and responsive limits precise. Requirements are covered without a missing domain fact. A renewed concrete plan approval remains required before implementation.
