---
id: shared-controls
depends_on: ["named-search"]
---

# Align Unit of Work and Flow search interaction

## Scope and ownership

Own a small common search-field presentation, UnitsOfWork.jsx, Flows.jsx and main integration as required, existing CSS and browser search tests. Governing U1–U4/U7; consume established named-search task output. Coordinate shared CSS with readable-labels; not alone in the codebase. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [ ] Typing title/ID updates matching lists without a required button; clear and Enter behave consistently; default flow mode is explicit.
- [ ] Behavior discovery remains separately available with explicit submission; normal typing does not trigger inference.
- [ ] Loading/no-match/error feedback is distinct; selected details outside matches are not search hits.
- [ ] Late query/mode/project/worktree replies cannot overwrite current results; paging resets and inactive tabs pause reads.
- [ ] Actual title queries, matches beyond 20 items, case/whitespace, clear, keyboard and 700/1440 cases pass.

## Evidence

Implementation has not started. No executable behavior is claimed by this plan.
