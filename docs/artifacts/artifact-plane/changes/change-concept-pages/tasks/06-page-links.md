---
id: page-links
depends_on: [concept-graph]
covers:
  - element: requirements/concept-pages.md
    ids: [CP7, CP8, CP9, CPA4, CPA6]
---

# Page links

## Scope and ownership

Implementer. `apps/artifact-plane/src/pages/ArtifactPage.jsx` (Concepts section), `src/pages/DocumentPage.jsx` (Concepts property), `src/pages/FlowPage.jsx` (participant links), shared row CSS, and browser tests in `test/browser/artifact-document.spec.js` and `test/browser/flow-page.spec.js`. The links target `{kind: 'concept', artifact, model}`; the concept page itself is task 05.

## Governing knowledge

specifications/concept-pages.md: Existing pages (Artifact, Document, Flow), Wording.

## Definition of Done

- [ ] The artifact page of a fixture with three models shows `Concepts 3` after Flows and before Versions, with the first sentence of each description on one line at 1440 px; six models show five rows and `Show all 6 concepts` (CP7).
- [ ] An artifact without models has no Concepts section, and its page equals the golden capture (CPA6).
- [ ] The declaring document shows `Declares <names>` and a describing document `Describes <names>`; on a branch fixture a new declaration has `New`, a changed one `Changed` and a removed one is plain text with `Removed` (CP8, CPA4).
- [ ] A document that declares and describes no model has no Concepts property (CPA6).
- [ ] The flow Model section links each resolved participant title with the aria-label `Open concept <title>`; the existing line text, heading and unresolved participant text stay, and the existing flow page assertions pass (CP9).
- [ ] `npm test` and `npm run test:browser` pass.

## Evidence
