# Main-area reading with contained local navigation

## Context

Readers currently use a narrow details panel, Markdown links are inert, and flow sources require a second selector. Unrestricted Markdown navigation would defeat the existing read-only source boundaries. The audited UI also lets document-list disclosure expand the graph unexpectedly.

## Decision

Use a main-area document reader and an in-session return stack within the existing project explorer. Keep graph components mounted while reading. Separate list disclosure from canvas expansion. Permit direct local navigation only through a generated target map and the existing scoped/registered source services. Keep sanitizer, server containment, exact source/revision identity and external-resource restrictions.

## Alternatives

Keeping all reading in the inspector preserves code but retains the demonstrated narrow-reading and indirect-navigation costs. A new router/document service adds authority and lifecycle mechanisms not needed for an in-session reader. Unrestricted hrefs or a generic filesystem endpoint widen source access. A new editor/workflow app exceeds this outcome. Retain the existing React and scoped query boundaries instead.

## Consequences

Source-aware Markdown presentation and return controls need focused containment and cancellation checks. Unsupported destinations explain their limit. The application must preserve graph viewport while the reader is visible and reset navigation on source context changes. No persistent navigation registry, external fetch, file editing or Git mutation is introduced.
