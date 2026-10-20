---
id: sidebar-search
depends_on: [wave-1-review]
covers:
  - element: requirements/concept-pages.md
    ids: [CP13, CP14, CPA9]
---

# Sidebar search

## Scope and ownership

Implementer. `apps/artifact-plane/src/Sidebar.jsx` (concept rows, the Discover link, the input title), `src/work-model.js` (sidebarRows), `src/main.jsx` (the concept cache in ProjectExplorer and the `/` key), and the tests `test/change-status.test.js`, `test/browser/shell.spec.js` and `test/browser/discovery-recorded.spec.js`.

## Governing knowledge

specifications/concept-pages.md: Sidebar search; claim sidebar-enter-unchanged.

## Definition of Done

- [ ] The filter `version` shows the Version row under Artifact-Driven Development, before its kind rows, with the detail `Concept`; the row opens the concept page (CP13).
- [ ] The filter `artifact-plane:repository-snapshot` matches only that concept row.
- [ ] While the filter has text, the Discover link shows after the tree, is a Tab stop, opens Discover with the query, and Enter in the box never chooses it; `Nothing matches this title or ID.` still shows above it (CP14).
- [ ] `/` focuses the search of the active tab, opens the drawer at 390 px, and does nothing in an input, a textarea, a select, an editable element or an open form; the input has the title and aria-keyshortcuts (CP14, CPA9).
- [ ] Enter keeps the first-match rule; the result of the queries `version` and `change` is recorded (claim sidebar-enter-unchanged).
- [ ] Concepts load once for a worktree and shell epoch, and the filter of a repository without models makes no visible change except CP1's.
- [ ] `npm test` and `npm run test:browser` pass, and the S1 to S8 limits hold.

## Evidence
