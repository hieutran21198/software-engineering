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

- [ ] A unit test: an absolute `repository` value that equals a restored path selects that tab; another absolute value adds one tab after the restored tabs and selects it; a relative or empty value adds no tab.
- [ ] A browser test opens `/?repository=<fixture root>` with no stored tabs: one tab opens the fixture and shows its work page, and the address has no query afterwards (UDA4).
- [ ] The same test opens the address again: the tab count stays the same and the fixture tab is active. The path comes from `git rev-parse --show-toplevel` of the fixture (claim canonical-root).
- [ ] A reload after the opening adds no tab.
- [ ] `npm test` and `npm run test:browser` pass.

## Evidence
