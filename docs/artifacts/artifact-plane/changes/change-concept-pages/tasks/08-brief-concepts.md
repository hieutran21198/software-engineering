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

- [x] Fixture branches give each reason: a new, a changed and a removed declaration, a changed participation, and a changed describing document; a changed declaring document with equal entries gives no row.
- [x] The fixture built after 89ed23a (a support added to a step where a concept takes part) gives no concept row; the fixture built after 3c47a48 (an edit of a describing document) gives describing rows only and no PR concept line (CPA8).
- [x] A fixture that renames a participant shows the participation change of the claim participation-diff, and the result is recorded.
- [x] A delivered change uses its commit and first parent; an open change uses the worktree and the merge base.
- [ ] The summary prefix follows the contract order, number form and 3-title limit; without Impact data the summary is the prefix alone (CP12).
- [x] The PR Impact section has the concept line for declaration and participation reasons, then the flow sentence, a blank line and the Coverage line; describing rows add no line (CP12).
- [x] The UI rows link the concept and the document; a removed concept is plain text; concept rows are not in the attention list (CP11).
- [x] The brief operation, the packet brief and MCP get_change_brief give the same `concepts`.
- [x] The brief of this repository's change of commit 3c47a48 is recorded from a local run.
- [x] `npm test` and `npm run test:browser` pass.

## Evidence

Checked on 20 October 2026 in the worktree of branch claude/concept-pages-08-brief-concepts, code commits 20df59c and 0895ed1 (review fixes).

- `node --test test/change-brief.test.js`, test "CP11: fixture branches give each reason": a fixture branch gives the rows declaration-new (Delivery record), declaration-changed (Change), declaration-removed (Ledger), participation-changed (Version in Resolve implementation dependency gates) and describing-document-changed (Release and Version, Change-owned delivery contract); passed, 20df59c.
- `node --test test/change-brief.test.js`, test "a changed declaring document with equal entries gives no row": a body edit of the declaring document gives `concepts: []`; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "CPA8: the fixture after 89ed23a": a support added to a step that has interactions gives `concepts: []`, no summary prefix and no PR concept line; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "CPA8: the fixture after 3c47a48": an edit of knowledge.md gives only the describing rows of Change and Version, no summary prefix and no PR concept line; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "participation-diff: a renamed participant": renaming participant version to knowledge in flow explore gives two participation-changed rows, Repository snapshot and Version in Explore a local ADD repository, because the interaction from snapshot now names knowledge; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "a delivered change compares its commit with the first parent": a later main commit that changes Release adds no row; origin delivery-commit; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "an open change compares the worktree bytes with the merge base": an uncommitted declaration gives a row, and a main commit after the branch point gives none; origin protected-diff; passed, 20df59c.
- `node --test test/change-brief.test.js`, tests "CP12: the summary prefix" and "CP12: without Impact data": the order, the singular and plural forms, `and N more` after 3 titles, and the prefix alone without Impact data; passed, 20df59c.
- `node --test test/change-brief.test.js`, test "CP12: without Impact data and without a prefix": with only describing rows and no Impact data, the summary is the 1.24.0 fallback text "The impact answer is not available.", not an empty string, and the two describing rows stay in the items; passed, 0895ed1.
- `node --test test/change-brief.test.js`, test "CP11: a removed flow document gives participation rows": deleting flows/gates.md gives participation-changed rows whose document is `{path, title, removed: true}` with the flow add:gates; passed, 0895ed1.
- `node --test test/change-description.test.js`, CP12 tests: the Impact section is the concept line, the flow sentence, a blank line and the Coverage line; without Impact data the concept line precedes the fallback text; describing rows add no line; passed, 20df59c.
- `npx playwright test test/browser/change-brief.spec.js`, CP11 concept rows at 1440 and 390 px: the concept and document links open their pages, Ledger is plain text, the attention list has no concept row, link names are unique, no horizontal scroll; passed on Chrome 156 (ci-chrome.sh) and Nix Chromium, 20df59c.
- `npx playwright test test/browser/change-brief.spec.js`, test "CP11: a participation row of a removed flow": the flow link of a removed flow document opens the document page with the notice "This document is removed on this branch."; a middle click and a Control click open no tab; the test fails on 20df59c (flow page "Flow does not exist", and a tab opens on a middle click); passed on Chrome 156 (ci-chrome.sh) and Nix Chromium, 0895ed1.
- `node --test test/change-brief.test.js`, test "CP11: the brief operation, the packet brief and get_change_brief give the same concepts": the three `concepts` arrays are equal; passed, 20df59c. `node --test test/context-packet.test.js`: the Change brief section of the packet shows the concepts; passed, 20df59c.
- Local run on a disposable clone of this repository at 0eecce1, brief of artifact-driven/change-visual-knowledge: origin delivery-commit 3c47a48; concepts are Artifact, Change and Version, each describing-document-changed in Knowledge and execution contract; the summary is "5 flows reached: 1 declared, 0 decided by a claim, 4 undecided. 20 unresolved items."; the PR Impact section has no concept line; 20df59c.
- Local run on the same clone, briefs of artifact-driven/change-impact-semantics and artifact-plane/change-impact-intelligence: origin delivery-commit 89ed23a; `concepts: []`; the summary is "13 flows reached: 6 declared, 0 decided by a claim, 7 undecided. 8 unresolved items."; 20df59c.
- Screenshot review at 1440 and 390 px of the fixture brief with concept rows, its PR description and the 3c47a48 brief on the clone: at 390 px the document button of a row left its line; the rows now use links that wrap with the text, and the browser test checks the line; passed, 20df59c.
- `npm test`: 510 tests, 509 passed, 1 skipped, 0 failed, 0895ed1.
- `npm run test:browser` with Chrome 156 (ci-chrome.sh): 139 passed, 0895ed1. With Nix Chromium: 138 passed and 1 timeout under load (impact-page.spec.js:61 at 1440 px); its rerun with --repeat-each=3 passed 6 of 6, 0895ed1.
- `node scripts/validate-knowledge.mjs --repository ../..`: ok true, 0 errors, 12 open-change-conflict warnings (other open branches), 0895ed1.
