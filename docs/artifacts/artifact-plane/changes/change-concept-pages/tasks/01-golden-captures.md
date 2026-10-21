---
id: golden-captures
depends_on: []
covers:
  - element: requirements/concept-pages.md
    ids: [CP1, CPA1]
---

# Golden captures

## Scope and ownership

Implementer. A new `apps/artifact-plane/scripts/capture-pages.mjs`, a new fixture builder for a repository without models in `test/browser/`, the committed JSON `test/fixtures/golden-1.24.0.json` and a new browser test `test/browser/golden.spec.js`. No application code changes.

## Governing knowledge

specifications/concept-pages.md: Validation (CP1), claim golden-captures.

## Definition of Done

- [x] The fixture builder writes a repository without models with a fixed root name, fixed Git author and committer dates, two artifacts, a flow, a change on a branch and a unit, so that the work, artifact, document, flow, change, Discover and Impact pages have content.
- [x] The script builds 0eecce1 from a `git worktree` or `git archive` outside this worktree, serves it with its own server and state directory, and captures each page at 1440 and 390 px: the main text, the sidebar and the top bar, with an empty sidebar filter and with the filter `sign`, and the names of the visible controls.
- [x] Two runs of the script on 0eecce1 give the same JSON byte for byte; the JSON is committed.
- [x] `golden.spec.js` captures the current build the same way and passes on an unchanged 1.24.0 tree; a scratch change of one page label makes it fail (claim golden-captures).
- [x] The test allows only the differences that CP1 names: the input title, aria-keyshortcuts and the Discover link while the filter has text.
- [x] `npm test` and `npm run test:browser` pass.

## Evidence

Browsers: Nix Chromium 149 (`/nix/store/0fxasn1rwqc65s8y14ip1ym4hk2rxjwx-playwright-chromium/chrome-linux64/chrome`) and the CI headless shell, Chrome for Testing 156 (`ci-chrome.sh`). Browser runs use `PLAYWRIGHT_PORT=4371` and a new 0700 `ARTIFACT_PLANE_TEST_STATE_DIR`. Code commits: 049e53a and 697327c.

- Fixture: `goldenRepository` in `test/browser/golden-pages.js` writes `golden-plane` with fixed author, committer and dates (2026-01-01, 2026-01-02), Tenant and Authentication, the flow Member sign-in, the change change-sign-in on the checked-out branch change-sign-in, and the unit member-sign-in; no document declares `models`. Review of the 28 captures: each of the seven pages has its content (work card, artifact sections, document properties, flow steps, change brief and plan, 1 Discover result, Impact Direct and Verify rows). Result: passed. Commit 049e53a.
- Script: `node scripts/capture-pages.mjs` extracts 0eecce1 with `git archive` into a `plane-golden-` directory under `/home/cirius/.claude/jobs/60e4ff1d/tmp`, builds it with Vite, serves it on port 4353 with its own state directory, captures 7 pages × 2 widths × 2 filters (empty and `sign`) with the main text, sidebar and top bar and their visible control names, and removes the directory. No extra git worktree. Result: 28 captures written. Commit 697327c.
- Determinism: three runs with Nix Chromium (before and after commit 697327c) and two runs with the CI browser give byte-identical JSON, `cmp` equal, sha256 fc8bdb2004dcd2da1de85ec49c09f8add3fdca4510c1b35df8891e8c052bdda7. The fixture path is replaced with `<root>`; the JSON holds no port, host path or time. Result: passed. Commit 697327c (`test/fixtures/golden-1.24.0.json`).
- `npx playwright test golden.spec.js` on the unchanged 1.24.0 tree: 1 passed with Nix Chromium and 1 passed with the CI browser. Result: passed. Commit 697327c.
- Scratch change of the label `Read the overview` to `Read the summary` in src/pages/ArtifactPage.jsx, rebuilt: golden.spec.js fails on `1440 artifact filter empty` and the other artifact captures, CI browser and Nix Chromium (claim golden-captures). The scratch change is reverted. Result: passed. Commit 697327c.
- Allowed differences: a scratch Sidebar.jsx with the input title `Search or jump to… (/)`, `aria-keyshortcuts="/"` and the link `Find “sign” in Discover behavior` while the filter has text: golden.spec.js passes. The same scratch with the link text `Open Discover`: golden.spec.js fails on every `filter sign` capture. Both on the CI browser, and both reverted. Result: passed. Commit 697327c.
- `npm test`: 480 tests, 479 pass, 0 fail, 1 skipped. Result: passed. Commit 049e53a; 697327c changes only test/browser/golden-pages.js, which `npm test` does not load.
- `npm run test:browser` with Nix Chromium: 119 passed, 1 failed: change-page.spec.js:38 timed out on `Edit task`. An earlier full run failed change-page.spec.js:302 and :449. Result: failed in the full suite. Commit 697327c.
- `npm run test:browser` with the CI browser: 117 passed, 3 failed: change-page.spec.js:496, :520 and :542, `Copy Markdown` stayed disabled for 5 s. golden.spec.js passed in both full runs. Result: failed in the full suite. Commit 697327c.
- `npx playwright test change-page.spec.js` alone: 15 passed with Nix Chromium and 15 passed with the CI browser. The failing tests differ from run to run, run before golden.spec.js, and this task changes no application code or change-page test. Result: passed alone; the full-suite failures are timing failures of change-page.spec.js, open for the coordinator. Commit 697327c.
- Coordinator: the change-page.spec.js timeouts of the task runs came from concurrent suites on a loaded machine. On the integrated branch, the full browser suite passed 136 of 136 on CI Chrome 156 at b7d7836 (task 07) and 163 of 163 on CI Chrome 156 and Nix Chromium 149 at 2d830c1 (task 10), with golden.spec.js; `npm test` passed.
