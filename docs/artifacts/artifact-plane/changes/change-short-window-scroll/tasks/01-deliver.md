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

- [ ] `.page-area` has `position: relative`, so visually hidden text inside it does not extend the document.
- [ ] A browser test opens every page at 1200x600 and 2000x660, scrolls the window, and finds that the document is no taller than the window and the shell ends at the window bottom.
- [ ] `npm test`, `npm run test:browser`, `npm run build:app` with the application smoke check and `npm run validate` pass.

## Evidence
