---
id: brief-concepts
depends_on: [wave-1-review]
covers:
  - element: requirements/concept-pages.md
    ids: [CP11, CP12, CPA8]
---

# Brief concepts

## Scope and ownership

Implementer. `apps/artifact-plane/server/change-brief.js` (concepts, reasons, bases, summary prefix), `server/change-description.js` (the concept line), `src/pages/ChangePageBrief.jsx` (concept and document links on rows), and the tests `test/change-brief.test.js`, `test/change-description.test.js`, `test/context-packet.test.js` and `test/browser/change-brief.spec.js` with new fixture repositories.

## Governing knowledge

specifications/concept-pages.md: Change brief; claim participation-diff.

## Definition of Done

- [ ] Fixture branches give each reason: a new, a changed and a removed declaration, a changed participation, and a changed describing document; a changed declaring document with equal entries gives no row.
- [ ] The fixture built after 89ed23a (a support added to a step where a concept takes part) gives no concept row; the fixture built after 3c47a48 (an edit of a describing document) gives describing rows only and no PR concept line (CPA8).
- [ ] A fixture that renames a participant shows the participation change of the claim participation-diff, and the result is recorded.
- [ ] A delivered change uses its commit and first parent; an open change uses the worktree and the merge base.
- [ ] The summary prefix follows the contract order, number form and 3-title limit; without Impact data the summary is the prefix alone (CP12).
- [ ] The PR Impact section has the concept line for declaration and participation reasons, then the flow sentence, a blank line and the Coverage line; describing rows add no line (CP12).
- [ ] The UI rows link the concept and the document; a removed concept is plain text; concept rows are not in the attention list (CP11).
- [ ] The brief operation, the packet brief and MCP get_change_brief give the same `concepts`.
- [ ] The brief of this repository's change of commit 3c47a48 is recorded from a local run.
- [ ] `npm test` and `npm run test:browser` pass.

## Evidence
