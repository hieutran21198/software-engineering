---
id: deliver
depends_on: []
covers:
  - element: requirements/workbench-redesign.md
    ids: [D1]
---

# Deliver the short-window layout fix

## Scope and location

apps/artifact-plane/src/styles.css and test/browser/layout.spec.js.

## Definition of Done

- [x] `.page-area` has `position: relative`, so visually hidden text inside it does not extend the document.
- [x] A browser test opens every page at 1200x600 and 2000x660, scrolls the window, and finds that the document is no taller than the window and the shell ends at the window bottom.
- [x] `npm test`, `npm run test:browser`, `npm run build:app` with the application smoke check and `npm run validate` pass.

## Evidence

Implementation commit 3418021 reapplies 93d780d from the reverted 1.31.0 branch: `.page-area` has `position: relative` in `src/styles.css`, and `test/browser/layout.spec.js` measures the document height and the shell bottom on every page at 1200x600 and 2000x660 after a window scroll.

Ran on this branch, stacked on the revert of 1.31.0 (now dfa8d94 on main, #73): `npm test` 586 tests, 585 passed, 0 failed, 1 skipped (the existing pinned-model network test). `npm run test:browser` with the Nix Chromium on the same code: 177 passed, 1 failed (`unit-page.spec.js:177`, a focus check after 14 s under load); the test passed alone in 7.5 s, together with `layout.spec.js` (12 passed). `npm run build:app` and `scripts/app-smoke.mjs release/artifact-plane-linux-amd64`: "All checks passed", and the executable prints 1.30.1. `nix build .#checks.x86_64-linux.packages`: package-smoke passed with the new npm dependency hash.

The record validator against main dfa8d94 (after #73): `ok: true` with 0 errors for the repository, and allowed tier small for this change.
