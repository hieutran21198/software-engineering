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

- [ ] A fixture concept page shows the eyebrow, title, action, lead, Described in line, Flows rows and closing line in the contract order and wording (CPA2).
- [ ] A Flows row toggles with aria-expanded, one row opens at a time, and the open row shows the role, Open flow and the interactions with step links; `focus` opens a row on arrival (CP3).
- [ ] Code and tests is closed; it opens to groups with step links, the flow and artifact line, source links through the flow and the inferred footnote; the summary has the `static` KindTag and no interactive content (CP4, CPA2).
- [ ] A model that no flow uses shows `No flow uses <title> yet.` and no Flows or Code and tests section (CPA3).
- [ ] On a branch fixture, the branch line names the changed describing document and the open change, and a new declaration has the New badge (CPA4, concept page part).
- [ ] A missing model source shows the error Notice with the fix link, and the closing line is absent (CPA5).
- [ ] The action opens Impact for the concept and its describing documents; the Impact rows of a model read `concept` with the title, and Open concept opens its page (CPA7).
- [ ] The parity test maps each visible fact of the Version fixture page to a `concept` answer field (CP18).
- [ ] Layout checks pass at 1440 and 390 px: one h1, unique accessible names, no interactive content in a summary or a button, no horizontal scroll.
- [ ] `npm test` and `npm run test:browser` pass.

## Evidence
