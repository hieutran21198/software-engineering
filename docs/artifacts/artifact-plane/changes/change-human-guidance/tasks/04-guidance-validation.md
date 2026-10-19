---
id: guidance-validation
depends_on: [pages]
covers:
  - element: requirements/human-guidance.md
    ids: [HGA1, HGA2, HGA3, HGA4, HGA5, HGA6, HGA7, HGA8, HGA9]
---

# Guidance validation

## Scope and ownership

Coordinator. Browser tests in `test/browser/human-guidance.spec.js`, screenshots and the owner look.

## Governing knowledge

specifications/human-guidance.md: Validation; requirements/human-guidance.md, acceptance criteria.

## Definition of Done

- [ ] Browser tests cover HGA1 to HGA7 on fixtures.
- [ ] The full browser suite passes on the local Chromium and on the Playwright 1.64 headless shell (Chromium 156).
- [ ] Screenshots at 1440 and 390 pixels of the work, artifact, change and flow pages of a disposable clone are taken, and the owner looked at them.
- [ ] `npm test` passes; existing route, tool and packet tests pass without edits.

## Evidence

Not recorded.
