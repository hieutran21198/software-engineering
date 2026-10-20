---
id: concept-page
depends_on: [concept-graph, browser-back]
covers:
  - element: requirements/concept-pages.md
    ids: [CP2, CP3, CP4, CP5, CP6, CP10, CP18, CP19, CPA2, CPA3, CPA4, CPA5, CPA7, CPA11]
---

# Concept page

## Scope and ownership

Implementer. A new `apps/artifact-plane/src/pages/ConceptPage.jsx` with its CSS, the `concept` entry of PAGES and the `model` key of samePage and pageKey, `src/pages/ImpactPage.jsx` and `src/impact-model.js` (concept rows and Open concept), a parity test, and browser tests in a new `test/browser/concept-page.spec.js`.

## Governing knowledge

specifications/concept-pages.md: Concept page, Existing pages (Impact row), Wording, Validation; the approved mockups on the design canvas named in the unit brief.

## Definition of Done

- [x] A fixture concept page shows the eyebrow, title, action, lead, Described in line, Flows rows and closing line in the contract order and wording (CPA2).
- [x] A Flows row toggles with aria-expanded, one row opens at a time, and the open row shows the role, Open flow and the interactions with step links; `focus` opens a row on arrival (CP3).
- [x] Code and tests is closed; it opens to groups with step links, the flow and artifact line, source links through the flow and the inferred footnote; the summary has the `static` KindTag and no interactive content (CP4, CPA2).
- [x] A model that no flow uses shows `No flow uses <title> yet.` and no Flows or Code and tests section (CPA3).
- [x] On a branch fixture, the branch line names the changed describing document and the open change, and a new declaration has the New badge (CPA4, concept page part).
- [x] A missing model source shows the error Notice with the fix link, and the closing line is absent (CPA5).
- [x] The action opens Impact for the concept and its describing documents; the Impact rows of a model read `concept` with the title, and Open concept opens its page (CPA7).
- [x] The parity test maps each visible fact of the Version fixture page to a `concept` answer field (CP18).
- [x] Layout checks pass at 1440 and 390 px: one h1, unique accessible names, no interactive content in a summary or a button, no horizontal scroll.
- [x] `npm test` and `npm run test:browser` pass.

## Evidence

Code commits 08e851f and 482e076 on claude/concept-pages-05-concept-page; bbfe6c1 merges claude/concept-pages (tasks 01 and 06) without conflict. NIX is the Nix Chromium 149; CI is Chrome for Testing 156 (ci-chrome.sh). Each browser run uses its own PLAYWRIGHT_PORT and a 0700 ARTIFACT_PLANE_TEST_STATE_DIR from mktemp. The fixture is test/concept-fixtures.js: artifact add declares Version, Change, Release (no flow) and Ledger (missing source); flows gates (add) and explore (plane) use Version.

- CPA2 order and wording: concept-page.spec.js opens Version from its Impact row and finds, in order, the eyebrow `Artifact-Driven Development / Concept`, the title, `What does Version affect?`, the lead, `Described in Knowledge and execution contract · Change-owned delivery contract`, `Flows 2`, the two rows, `Code and tests in the steps of these flows · 2 code files, 1 test file` and `Declared as a model in ADD models used in dependency gates.`; passed on NIX and CI at 1440 and 390 px, 482e076.
- CP3 rows: the browser test sees both rows with aria-expanded false, opens one, sees `Role: contract · Open flow` and two interaction lines, opens the other and sees the first close; a step link and Open flow open the flow page; passed on NIX and CI, 482e076.
- CP3 focus: concept-page.test.js renders ConceptView with `focus: flow:add:gates` and finds only that row with aria-expanded true; without focus no row is open. No page of this change pushes `focus` yet, so no browser test opens a page with it; passed, 482e076.
- CP4: the browser test sees details closed, the summary KindTag `static`, two groups after a click, the step links of one group, `Resolve implementation dependency gates · Artifact-Driven Development`, `No test file.`, the footnote, and a file link that opens the Source page with the flow in its eyebrow; the node test finds no button, link or input in the summary or in a button; passed, 482e076.
- CPA3: the Release page shows `No flow uses Release yet.`, no Flows region and no details; passed on NIX and CI, 482e076.
- CPA4: on branch feature the Version page shows `Changed on this branch: ADD models used in dependency gates, Knowledge and execution contract. Open change in Artifact-Driven Development: Add the delivery record concept` and no badge; Delivery record shows the New badge; the change and document links open their pages; passed on NIX and CI, 482e076.
- CPA5: the Ledger page shows the alert `Model add:ledger sources do not exist: specifications/ledger.md.`, no closing line, and `Fix in ADD models used in dependency gates` opens that document; passed on NIX and CI, 482e076.
- Unknown concept: after Release leaves the declaring document, the open page shows `No concept add:release is declared in the selected knowledge.` and only the eyebrow link; passed on NIX and CI, 482e076.
- CPA7: the Impact rows of domain-model.md read `concept` with the title; the detail has no entity path line and `Open concept` opens the concept page; the action opens Impact titled `What does Version affect?` with the origins model:add:version, knowledge.md and delivery.md; concept-page.test.js asserts entityLabel and pageFor of a model; passed, 482e076.
- CP18 parity: concept-page.test.js renders the Version page of the fixture with each row open once; every visible text is contract wording or one of 27 answer facts (title, description, declaredIn.title, sources[].title, flows[].title, requires, participant, artifact, interactions[].stepTitle, from, to, action, implementation.groups[] steps, flow, artifact, code and tests paths, the distinct file counts; the artifact titles come from the snapshot by `artifact`), and every fact shows; passed, 482e076.
- Task 06 links: the browser test opens Version from the artifact Concepts row, the document Concepts property and the flow participant link `Open concept Version`; passed on NIX and CI, 482e076.
- Layout: layoutFacts gives one h1 and no duplicate control name on Version (one row and the details open), Release, Ledger and the branch Version page, and noOverflow is true, at 1440 and 390 px on NIX and CI, 482e076.
- CP1: golden.spec.js (task 01) passes on the merged branch on NIX and CI, 482e076.
- `npm test`: 495 tests, 494 passed, 1 skipped, 0 failed on 482e076; the first run on 08e851f failed only in the known flaky test "separate processes atomically publish complete SQLite records", and its rerun passed.
- `npm run test:browser` on 08e851f: 131 passed on NIX and 131 passed on CI. On 482e076 after the merge: 136 passed on NIX and 136 passed on CI, each including golden.spec.js and history.spec.js.
- Screenshots on a disposable clone of cfdb4ce with a local main at 0eecce1 and an added Delivery record model: version, version-open, snapshot, delivery-record and impact-row at 1440 and 390 px in /home/cirius/.claude/jobs/60e4ff1d/tmp/task05-shots/. The review found one defect: at 390 px a wrapped step link pushed its comma to the start of the next line; the comma now sits in the link. Differences from the mockups that follow the contract: the action shows on a page without flows, the open row adds Open flow, the group line has no file count, and Flows rows sort by title.

