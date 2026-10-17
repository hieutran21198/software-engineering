---
id: work-page
depends_on: [style-and-shell]
evidence_records:
  - id: work-review
    method: Page build, Node tests and screenshot comparison with the Main and Phone mockups
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/03-work-page.md#work-review
  - id: work-suite
    method: npx playwright test test/browser/work-page.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/03-work-page.md#work-suite
---

# Work page

## Scope and ownership

Own apps/artifact-plane/src/pages/WorkPage.jsx and its start-change and new-unit forms.

## Governing knowledge

specifications/authoring-workbench.md, sections Work page and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [x] Each open change card shows the eyebrow, change title, five phase steps, "Next:" hint and Continue to the change page.
- [x] Start a change offers the startable artifacts and "A new artifact"; a new artifact runs artifact.create and opens its change-initial page; New unit creates a unit as in 1.16.0.
- [x] Uncommitted knowledge lists files by title with kind, badge and a uniquely named Discard, and commits the checked files with the prefilled message; it says "All knowledge is committed." when empty.
- [x] A protected branch shows the Create branch notice; the dependencies sentence and Show graph open the inline graph panel.
- [x] Screenshots at 1440 and 390 pixels match the Work and phone mockups.

## Evidence

### work-review

Checked on a disposable clone of this repository and on the repository itself:
- `npm run build` passed; `npm test`: 336 passed, 1 skipped.
- Screenshots at 1440 and 390 pixels with 1 and 3 open changes, Start a change (including "A new artifact"), New unit, uncommitted files, Show graph, the protected branch and the empty state. The coordinator compared them with the Main and Phone mockups; no horizontal overflow and no page errors.
- In the clone, a commit of 2 of 3 checked files contained exactly those 2 files.

Implementation: src/pages/WorkPage.jsx, WorkPageForms.jsx, WorkPage.css.

### work-suite

`work-page.spec.js`: 7 of 7 passed in two runs. It covers:
- change cards, Start a change and New unit;
- Commit of the selected files and Discard;
- the protected-branch notice with Create branch;
- Show graph with proposal styles;
- an invalid path and an empty artifact directory.

The coordinator's review fixed three things:
- a staged deletion could not be committed (server/knowledge-git.js; a new Node test fails without the fix);
- a repeat click on Uncommitted did not scroll;
- the graph legend covered the zoom controls.
