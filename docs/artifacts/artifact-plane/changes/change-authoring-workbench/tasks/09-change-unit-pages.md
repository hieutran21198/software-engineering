---
id: change-unit-pages
depends_on: [edit-interfaces, workbench-shell]
evidence_records:
  - id: change-unit-browser-tests
    method: npm run test:browser
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/09-change-unit-pages.md#change-unit-browser-tests
---

# Artifact, change and unit pages

## Scope and ownership

Own the artifact page actions (Edit purpose, Start a change, Add document, Add and Remove dependency with Why explanations, Add flow, Migrate), the change page with Overview, Plan and Review tabs (readiness checklist, task table and detail with DoD checkboxes and Record evidence, task graph toggle, changed knowledge comparison, diagnostics, commit form, Prepare version with preview, Record publication review), the work page commit panel and Create branch wiring, and the unit page with its editing actions.

## Governing knowledge

specifications/authoring-workbench.md, sections Pages (artifact, change, unit, work), Journeys, Feedback and states, Labels and vocabulary; specifications/knowledge-editing.md operations for artifacts, changes, tasks, evidence, units, versions, publication and Git.

## Prerequisites

Tasks edit-interfaces and workbench-shell.

## Definition of Done

- [x] Start a change creates the change and plan, optionally a unit, and opens the change page; Add document opens the new document in edit mode; Add dependency rejects cycles inline with the path named.
- [x] The Plan tab adds, edits and removes tasks with prerequisite pickers, toggles DoD items, records evidence, and mounts the existing task canvas on demand; the readiness checklist names each unmet item with a link.
- [x] The Review tab shows changed knowledge against main with the existing comparison, live diagnostics, a commit form limited to the change's knowledge paths with a prefilled message, Prepare version with a two-file preview and the unchecked-DoD acknowledgment, and Record publication review when applicable.
- [x] The unit page adds and removes members from open changes, edits criteria, records evidence with a source picker over task evidence sections and the Combined checks section, sets affected flows and shows completion with the publication-review link when that is the missing record.
- [x] Legacy artifacts show read-only state and Migrate with a plan preview; the protected-branch banner creates a branch and refreshes the branch control.
- [x] Browser tests cover each action, refusals, commit contents and the widths; fixture Git state shows only the expected commits.

## Evidence

### change-unit-browser-tests

Checked at commit 0c6ee0d: 102 of 102 browser tests passed. test/browser/change-unit-pages.spec.js covers Start a change with a new unit, Add requirement into edit mode, the readiness checklist with links, Add, Edit and Remove task with prerequisites, DoD checkboxes, Record evidence, Record plan self-check, a commit that contains only the change's knowledge with the prefilled message while an unrelated edit stays uncommitted, Prepare version with the two-file preview and the unchecked-DoD acknowledgment, Record publication review, unit member, criterion, evidence and affected-flow editing, Add and Remove dependency with an inline cycle refusal, legacy migration with a plan preview, and Create branch from the protected banner. Git logs in the tests contain only the expected commits. Implementation: src/pages/ArtifactPage.jsx, src/pages/ChangePage.jsx, src/pages/UnitPage.jsx and src/pages/forms.jsx.
