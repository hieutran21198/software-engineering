---
id: shared-controls
depends_on: ["named-search"]
---

# Align Unit of Work and Flow search interaction

## Scope and ownership

Own a small common search-field presentation, UnitsOfWork.jsx, Flows.jsx and main integration as required, existing CSS and browser search tests. Governing U1–U4/U7–U9; consume established named-search task output. Coordinate shared CSS with readable-labels; not alone in the codebase. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [x] Typing title/ID updates matching lists without a required button; clear and Enter behave consistently; default flow mode is explicit.
- [ ] Behavior discovery remains separately available with explicit submission; normal typing does not trigger inference.
- [ ] Loading/no-match/error feedback is distinct; selected details outside matches are not search hits.
- [ ] Late query/mode/project/worktree replies cannot overwrite current results; paging resets and inactive tabs pause reads.
- [ ] Actual title queries, matches beyond 20 items, case/whitespace, clear, keyboard and 700/1440 cases pass.

- [ ] A visible Artifact selector combines with title/ID and Behavior discovery; clear text preserves scope and selecting another artifact resets result pages/old element restrictions.
- [ ] Find participating flows opens Flows and selects the clicked artifact, replacing an earlier selection while preserving worktree/knowledge and narrower element context when applicable.
- [ ] Cross-owner participation, no-flow/deleted artifacts and delayed artifact/context replies pass actual browser fixtures; search and filter state remain per project.

## Evidence

Eight new browser cases and the complete 56-case Chromium suite passed. Actual HTTP fixtures verify normalized title filtering beyond the first 20 records, Unit of Work typing/clear, explicit Behavior submission, cross-owner Artifact participation, empty/deleted artifacts, clicked Artifact entry, retained knowledge scope and delayed query/worktree replies. Mocked same-revision generation changes are checked on refresh and continuation; paging restarts instead of mixing rankings. Existing project-tab, review, flow, unit and runtime cases pass. Screenshots at 1440 and 700 show the shared controls without sidebar horizontal overflow. Find participating flows retains the clicked worktree and narrower element selector. Title requests never initialize embeddings; Behavior typing alone submits no query.
