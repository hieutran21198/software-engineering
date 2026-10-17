---
id: change-unit-pages
depends_on: [edit-interfaces, workbench-shell]
evidence_records: []
---

# Artifact, change and unit pages

## Scope and ownership

Own the artifact page actions (Edit purpose, Start a change, Add document, Add and Remove dependency with Why explanations, Add flow, Migrate), the change page with Overview, Plan and Review tabs (readiness checklist, task table and detail with DoD checkboxes and Record evidence, task graph toggle, changed knowledge comparison, diagnostics, commit form, Prepare version with preview, Record publication review), the work page commit panel and Create branch wiring, and the unit page with its editing actions.

## Governing knowledge

specifications/authoring-workbench.md, sections Pages (artifact, change, unit, work), Journeys, Feedback and states, Labels and vocabulary; specifications/knowledge-editing.md operations for artifacts, changes, tasks, evidence, units, versions, publication and Git.

## Prerequisites

Tasks edit-interfaces and workbench-shell.

## Definition of Done

- [ ] Start a change creates the change and plan, optionally a unit, and opens the change page; Add document opens the new document in edit mode; Add dependency rejects cycles inline with the path named.
- [ ] The Plan tab adds, edits and removes tasks with prerequisite pickers, toggles DoD items, records evidence, and mounts the existing task canvas on demand; the readiness checklist names each unmet item with a link.
- [ ] The Review tab shows changed knowledge against main with the existing comparison, live diagnostics, a commit form limited to the change's knowledge paths with a prefilled message, Prepare version with a two-file preview and the unchecked-DoD acknowledgment, and Record publication review when applicable.
- [ ] The unit page adds and removes members from open changes, edits criteria, records evidence with a source picker over task evidence sections and the Combined checks section, sets affected flows and shows completion with the publication-review link when that is the missing record.
- [ ] Legacy artifacts show read-only state and Migrate with a plan preview; the protected-branch banner creates a branch and refreshes the branch control.
- [ ] Browser tests cover each action, refusals, commit contents and the widths; fixture Git state shows only the expected commits.

## Evidence

Implementation has not started.
