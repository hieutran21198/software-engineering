# Explicit named search and readable graph labels

## Decision

Use literal title/ID filtering as the normal shared UI interaction. Keep behavior discovery explicit and preserve existing external discovery defaults. Place graph labels with node-aware geometry and clear-space fallback; do not change graph knowledge.

## Alternatives and reasons

- Keep only ranked discovery: a small corpus can return nearly the same candidates for a title, which does not meet named filtering expectations.
- Filter only the first returned page in the browser: misses matching flows outside that page. Filter metadata before paging in the shared service instead.
- Hide semantic results below a score threshold: scores are not calibrated relevance probabilities, and the user requested predictable title matching.
- Run semantic search on every keystroke: adds inference and race costs for an ordinary title lookup. Keep explicit discovery submission.
- Raise every edge above every node: can reveal text while covering node content and controls. Use clear label geometry and selective label rendering.
- Replace the graph engine or add an external search service: unnecessary for the bounded existing requirements.

## Consequences

The UI has an explicit distinction between filtering and discovery. External tools gain an optional compatible selector. Label placement must be verified against real rendered bounds. No new dependency, hosted inference, workflow state, edge semantics or lifecycle authority is introduced.
