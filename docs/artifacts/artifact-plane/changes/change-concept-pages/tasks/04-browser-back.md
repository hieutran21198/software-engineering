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

- [x] Each trail push writes one history entry; a replacement in place writes none; returnFocus grows only with the trail.
- [x] Browser Back from a document opened from the artifact page returns to the artifact page, and focus returns to the opening control.
- [x] Back from a page opened from Discover returns to Discover with its submitted query and results (CPA10, Discover part).
- [x] Back from a page opened from the change brief returns with the same brief rows open; the default rows stay as in 1.24.0 when no row was toggled (CPA10, brief part).
- [x] A submit in Discover keeps focus in the form, and the TopBar entry Discover behavior keeps the results on an open Discover page.
- [x] With two project tabs, after a worktree switch, after 51 pages and after a reload, Back changes only the active tab and never shows a page of another repository (claim back-moves-active-tab).
- [x] A refused leave() keeps the page and the browser position.
- [x] `npm test` and `npm run test:browser` pass, and the S1 to S8 limits hold.

## Evidence

Code commit baf502b on claude/concept-pages-04-browser-back. NIX is the Nix Chromium 149 (/nix/store/0fxasn1rwqc65s8y14ip1ym4hk2rxjwx-playwright-chromium/chrome-linux64/chrome); CI is Chrome for Testing 156 headless shell (ci-chrome.sh). Each browser run uses PLAYWRIGHT_PORT 4384 or 4385 and a 0700 ARTIFACT_PLANE_TEST_STATE_DIR from mktemp.

- Trail push and replacement: `npx playwright test test/browser/history.spec.js` asserts history.length +1 for each artifact and document push and +0 for two Discover submits, the TopBar Discover entry and two brief toggles; passed on NIX and CI, baf502b.
- returnFocus: the change brief test makes two in-place toggles, pushes, goes Back twice and finds focus on the change row of the sidebar, so the toggles added no focus target; passed on NIX and CI, baf502b.
- Artifact page and focus: the first history.spec.js test opens Identity from the Specifications section, presses Back, sees the Tenant artifact page and the Identity row focused; passed on NIX and CI, baf502b.
- Discover (CPA10, Discover part): the Discover test opens Shared access from the results, presses Back and sees the query "shared access for invoices", the result and "flows found"; passed on NIX and CI, baf502b.
- Brief (CPA10, brief part): the brief test sees only "What should I care about?" open after Back when no row was toggled, and only "What needs my decision?" open after Back when two rows were toggled; passed on NIX and CI, baf502b.
- Discover focus and TopBar entry: the Discover test sees the Behavior field focused after Enter, and the same query and results after the TopBar entry on the open Discover page; passed on NIX and CI, baf502b.
- Claim back-moves-active-tab: history.spec.js tests with two project tabs, after a worktree switch, after 51 pages and after a reload see Back change only the active tab, show no row of the other repository and change no page with an empty trail; passed on NIX and CI, baf502b.
- 51 pages: Chromium keeps 50 session history entries, so the test makes the 49 Back presses that the browser offers and sees each one move one page back; passed on NIX and CI, baf502b.
- Fragment move: the brief test clicks a claim link, presses Back and stays on the change page; with the fragment rule removed in a scratch build, the test failed, baf502b.
- Refused leave(): the first history.spec.js test dismisses "Discard unsaved changes?" on Back and sees the editor text and the same navigation.currentEntry.index, then accepts and sees the artifact page; passed on NIX and CI, baf502b.
- `npm test`: the first run failed only in the known flaky test "separate processes atomically publish complete SQLite records" (database is locked); the rerun passed 479 of 480 tests with 1 skipped and 0 failed, baf502b.
- `npm run test:browser` on NIX: 125 passed, 0 failed, baf502b.
- `npm run test:browser` on CI, first run with `--output=/tmp/c04-ci-results`: 123 passed, and the two Export download tests of change-page.spec.js failed with ENOENT on the download file in that output directory; without `--output` both passed, baf502b.
- `npm run test:browser` on CI, second full run: 124 passed, and change-page.spec.js:38 timed out at 30 s at load average 7; its rerun with `--repeat-each=4` passed 4 of 4, baf502b.
- S1 to S8: authoring-scenarios.spec.js keeps LIMITS S1 20, S2 7, S3 13, S4 29, S5 14, S6 10, S7 3, S8 5, as in specifications/authoring-workbench.md, and passed in each full browser run, baf502b.
