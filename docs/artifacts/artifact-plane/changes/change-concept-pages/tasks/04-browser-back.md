---
id: browser-back
depends_on: []
covers:
  - element: requirements/concept-pages.md
    ids: [CP15, CPA10]
---

# Browser Back

## Scope and ownership

Implementer. `apps/artifact-plane/src/main.jsx` (history entries, popstate in the active tab, the returnFocus rule), `src/pages/DiscoverPage.jsx` (query in the page object), `src/pages/ChangePageBrief.jsx` (open rows in the page object), the samePage and pageKey keys, and browser tests in `test/browser/shell.spec.js` or a new `test/browser/history.spec.js`. No server code and no concept page.

## Governing knowledge

specifications/concept-pages.md: Browser Back; claim back-moves-active-tab.

## Definition of Done

- [ ] Each trail push writes one history entry; a replacement in place writes none; returnFocus grows only with the trail.
- [ ] Browser Back from a document opened from the artifact page returns to the artifact page, and focus returns to the opening control.
- [ ] Back from a page opened from Discover returns to Discover with its submitted query and results (CPA10, Discover part).
- [ ] Back from a page opened from the change brief returns with the same brief rows open; the default rows stay as in 1.24.0 when no row was toggled (CPA10, brief part).
- [ ] A submit in Discover keeps focus in the form, and the TopBar entry Discover behavior keeps the results on an open Discover page.
- [ ] With two project tabs, after a worktree switch, after 51 pages and after a reload, Back changes only the active tab and never shows a page of another repository (claim back-moves-active-tab).
- [ ] A refused leave() keeps the page and the browser position.
- [ ] `npm test` and `npm run test:browser` pass, and the S1 to S8 limits hold.

## Evidence
