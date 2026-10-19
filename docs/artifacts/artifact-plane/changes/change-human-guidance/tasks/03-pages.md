---
id: pages
depends_on: [status-model, visual-system]
covers:
  - element: requirements/human-guidance.md
    ids: [HG1, HG2, HG3, HG9, HG12]
---

# Pages

## Scope and ownership

Implementer, after tasks status-model and visual-system merge into the change branch. The work, artifact, document, change, unit and flow pages, the sidebar and the PR description section: status cards, version labels, the three badge families, `Term` at the first glossary term of each section, the two remove controls and the flow step action groups.

## Governing knowledge

specifications/human-guidance.md: Status card, Version labels, Visual grammar of controls, Sections and cards; specifications/authoring-workbench.md, Labels.

## Definition of Done

- [ ] The work page and the change page show a status card for each change in progress, with at most one primary button.
- [ ] The artifact page, the change page and the sidebar use "established" and "prepared on this branch" with a link to the preparing change.
- [ ] No page renders the old `.badge` tones; every badge comes from a family component.
- [ ] The dependency and support remove controls are `button.danger` with "Remove"; removing a dependency asks for confirmation.
- [ ] Existing browser tests pass after label updates only; no route, tool or packet test changes.

## Evidence

Not recorded.
