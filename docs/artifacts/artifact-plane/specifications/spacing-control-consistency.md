# Inspector rhythm and native dropdown contract

Governs C1–C4. Reuse the existing stylesheet and semantic HTML. No API, artifact graph or runtime model change is required.

## Spacing

Define a small shared spacing scale in existing CSS: 4, 8, 12, 16 and 24 pixels. Use 8 pixels for label/control and action/status separation, 12 pixels between content blocks, and 24 pixels between inspector sections. Apply scoped direct-child rules or small semantic stack classes to inspectors and evidence/action groups. Avoid blanket descendant margins that alter Markdown, node cards or nested evidence layouts. Keep compact toolbars and graph nodes under their existing layout rules. Headings must not accidentally double the shared gap through inherited margins.

Audit Artifact, Unit of Work, Flow, change-review and execution details plus sidebar control groups. Fix demonstrated deviations within this presentation scope, preserving existing information and interactions. Wrap action rows when necessary and allow long paths/selected labels to fit constrained width.

## Dropdowns

Use one shared native select base for the five existing purposes: Worktree, Recorded executions, Artifact, Search mode and Inspect flow source. Match existing dark surfaces and text; use inherited font, consistent 8-by-12-pixel padding, 6-pixel radius and a shared border. Include focus-visible and disabled treatment. Keep the native arrow, selection semantics and labels; no custom menu dependency. Context rules may control width but must not redefine the shared visual properties. Inputs and dropdowns should use the same field rhythm without changing checkbox styling.

## Completion feedback

Keep completionLabel as the authoritative summary. When derivation is not-loaded, omit the equivalent boilerplate reason already represented by that summary; retain any different reason. Do not remove reasons merely because they contain similar words. Preserve loading, error, unavailable and loaded evidence semantics. Separate heading, load action, summary/reasons and explanatory note with the shared rhythm.

## Validation and impact

Render unloaded, loading/error and loaded completion states, all dropdown purposes, long options, narrow/wide and resized inspectors. Check actual gaps/computed control styles, accessible labels, keyboard focus/selection and no horizontal overflow. Compare screenshots; a string-presence check alone does not validate spacing. Run existing affected browser regressions, Node checks and app build. Record actual flow presentation support and gaps in this change before preparing the complete proposed patch.

## Specification self-check

Shared CSS removes demonstrated duplication. Native controls preserve accessibility and avoid a new framework. No new ADR or dependency edge is justified for presentation-only reuse. Existing ADD 2.1.0 remains the supplier. KISS and STE checks pass; no Plan blocker remains.
