---
id: repository-address
depends_on: []
covers:
  - element: requirements/ui-discovery.md
    ids: [UD4, UDA4]
---

# Repository address

## Scope and ownership

Implementer. `apps/artifact-plane/src/Workspace.jsx` and `src/project-tabs.js` (the `repository` query parameter at load), `test/project-tabs.test.js` and `test/browser/project-tabs.spec.js`. Tab labels, close behavior and the preference format stay unchanged.

## Governing knowledge

specifications/ui-discovery.md: Repository address; specifications/ux-simplification.md: canonical project identity.

## Definition of Done

- [x] A unit test: an absolute `repository` value that equals a restored path selects that tab; another absolute value adds one tab after the restored tabs and selects it; a relative or empty value adds no tab.
- [x] A browser test opens `/?repository=<fixture root>` with no stored tabs: one tab opens the fixture and shows its work page, and the address has no query afterwards (UDA4).
- [x] The same test opens the address again: the tab count stays the same and the fixture tab is active. The path comes from `git rev-parse --show-toplevel` of the fixture (claim canonical-root).
- [x] A reload after the opening adds no tab.
- [x] `npm test` and `npm run test:browser` pass.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Unit test | test/project-tabs.test.js "the repository address selects a restored tab or adds one after the restored tabs": a restored path becomes active with unchanged projects; a new path is appended and active; with no restored projects it is the one project; `relative`, empty and null change nothing | Passed |
| First opening (UDA4) | test/browser/project-tabs.spec.js "the repository address opens or selects one project tab and leaves no query": one tab, selected, titled with the fixture root, the Work page visible, empty `location.search` | Passed |
| Second opening | The same test opens a second fixture first, then the address again: 2 tabs, the fixture tab selected, no query. The path comes from `git -C <fixture> rev-parse --show-toplevel`. The test fails with the earlier Workspace.jsx | Passed |
| Reload | The same test: `page.reload()` keeps 2 tabs and the fixture tab selected | Passed |
| Suites | `npm test` 467 tests, 466 passed, 1 skipped on the task branch. `npm run test:browser` 119 passed on the Playwright headless shell 156 (CI browser) and on the Nix Chromium; on the integrated branch 119 passed on the headless shell 156 | Passed |

The commit of the task is "Artifact Plane: the repository address opens or selects a project tab" on branch impl/repository-address. The workbench removes the whole query, because it reads no other parameter.
