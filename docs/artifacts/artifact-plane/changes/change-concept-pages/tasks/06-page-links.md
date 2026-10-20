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

- [x] The artifact page of a fixture with three models shows `Concepts 3` after Flows and before Versions, with the first sentence of each description on one line at 1440 px; six models show five rows and `Show all 6 concepts` (CP7).
- [x] An artifact without models has no Concepts section, and its page equals the golden capture (CPA6).
- [x] The declaring document shows `Declares <names>` and a describing document `Describes <names>`; on a branch fixture a new declaration has `New`, a changed one `Changed` and a removed one is plain text with `Removed` (CP8, CPA4).
- [x] A document that declares and describes no model has no Concepts property (CPA6).
- [x] The flow Model section links each resolved participant title with the aria-label `Open concept <title>`; the existing line text, heading and unresolved participant text stay, and the existing flow page assertions pass (CP9).
- [x] `npm test` and `npm run test:browser` pass.

## Evidence

Code commit: 957c6d6. Browser runs set a 0700 ARTIFACT_PLANE_TEST_STATE_DIR and PLAYWRIGHT_PORT 4366.

- `npx playwright test test/browser/artifact-document.spec.js` "artifact page Concepts": the Tenant fixture with three models shows `Concepts 3` after Flows and before Versions; each row shows the first sentence of its description; at 1440 px each detail is one line and the long first sentence is cut (scrollWidth > clientWidth); at 390 px a detail has at most two lines and the page has no horizontal scroll. The Catalog fixture with six models shows five rows and `Show all 6 concepts`; the button shows all six. A row opens the page object `{kind: 'concept', artifact: 'tenant', model: 'session'}`, read from the props of the rendered page. Passed, 957c6d6 (CP7).
- The same test: Billing, an artifact without models, gets an empty `concepts` answer and has no Concepts section and no text `concept`. Passed, 957c6d6 (CPA6).
- `npx playwright test test/browser/golden.spec.js` of task 01 (049e53a) on a disposable clone of 1169214 with the 957c6d6 pages: the work, artifact, document, flow, change, Discover and Impact pages of the fixture without models equal golden-1.24.0.json at 1440 and 390 px. Passed (CPA6).
- `npx playwright test test/browser/artifact-document.spec.js` "document Concepts": on branch work, the declaring document shows `Declares Audit +New, Legacy −Removed, Member, Session ~Changed` as the property after Kind; Legacy is plain text and the other names are links; the describing documents show `Describes Audit +New, Member, Session ~Changed` and `Describes Legacy −Removed`. A name opens `{kind: 'concept', artifact: 'tenant', model: 'member'}`. Passed, 957c6d6 (CP8, CPA4).
- The same test: a Tenant document that declares and describes no model and a Billing document show no Concepts property after their concepts answer arrives. Passed, 957c6d6 (CPA6).
- `npx playwright test test/browser/flow-page.spec.js` "the Model disclosure": the line `member · Member — Signs in` keeps its text and the Participants heading; Member is the only button, with the name `Open concept Member`; the unresolved line `ghost · tenant:ghost — Missing` has no button; the link opens `{kind: 'concept', artifact: 'tenant', model: 'member'}`. The existing flow page assertions pass. Passed, 957c6d6 (CP9).
- `npm test`: 487 tests, 486 passed, 0 failed, 1 skipped. 957c6d6.
- `npm run test:browser` with Nix Chromium: 121 passed before the last CSS edit; on 957c6d6, 120 passed and W10 of authoring-scenarios.spec.js failed once; a rerun of change-page, human-guidance and authoring-scenarios passed 33 of 33. The failing test reads no file of this task.
- `npm run test:browser` with the CI browser (Chrome 156): the first run on 957c6d6 failed 3 change-page and human-guidance tests under a load average above 4; the rerun of those files passed 33 of 33, and a second full run passed 121 of 121. 957c6d6.
- Screenshot review on a disposable clone of this worktree at 1440 and 390 px, against the Artifact, Document and Flow mockups: the Concepts rows, the Declares property and the Model links match. Two defects were fixed before 957c6d6: a DiffBadge wrapped away from its name (the name and badge now stay together), and the participant links were bolder than the line text. Screenshots: /home/cirius/.claude/jobs/60e4ff1d/tmp/task06-shots/ (artifact-concepts, document-concepts, document-concepts-*-branch, flow-model).
- Contract choices: removed declarations are not rows of the artifact Concepts section; the artifact rows have no DiffBadge; `Show all 6 concepts` is the accessible name and the visible text is `Show all 6`, as in the other sections; a describing document shows the DiffBadge of each declaration, as the declaring document does.
