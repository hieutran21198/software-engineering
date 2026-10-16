# Decision: shared derived review and context

## Context and options

Change review and handoff need the same baseline, sources, impact and evidence. Extending only flow selectors would force artifact-change deltas into a journey scope. Separate UI/MCP implementations could disagree. A review database or generated summary adds authority, operations and inference cost without a present requirement.

## Decision

Use one small selected-change review service over existing contained readers and evidence/graph functions. Share it with contextual UI, HTTP and additive MCP tools. Compare exact knowledge text and export bounded deterministic Markdown/JSON with source pointers and revision-bound omissions. Add no dependency, authoritative state or hosted inference.

## Consequences

Baseline is explicitly declared-current knowledge, not a historical code predecessor. Impact is recorded relationships/assessment, not exhaustive code analysis. Protocol parity, stale reads and privacy remain testable. New historical-code or federation capabilities require a separate material contract and plan. KISS keeps one source of facts; STE makes limitations visible.
