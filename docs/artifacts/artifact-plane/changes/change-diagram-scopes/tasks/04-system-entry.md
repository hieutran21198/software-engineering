---
id: system-entry
depends_on: [diagram-index, fixture]
covers:
  - element: requirements/diagram-scopes.md
    ids: [DP1, DP2, DP5]
---

# System section and System view link

## Scope and ownership

Implementer. Edit src/pages/WorkPage.jsx and the purpose line of src/pages/ArtifactPage.jsx, and add browser tests. Governing sections: [Home page](../../../specifications/diagram-scopes.md#home-page) and the System view link of [Artifact page](../../../specifications/diagram-scopes.md#artifact-page). Keep to the purpose line in ArtifactPage.jsx; task `diagram-list` edits the sections.

## Definition of Done

- [ ] The System section appears before Dependencies with its title, summary, muted line and items, ordered and labelled as the contract states, and it is absent when no element has `systemView`.
- [ ] An item opens the document page; the owner table links of the fixture open `ordering` and `payments` knowledge.
- [ ] The artifact page shows "System view: <title>" after "Read the overview" when the repository has one system view document, the plural form for several, and nothing otherwise.
- [ ] Browser tests at 1440 and 390 pixels cover these cases, and browser Back returns to the previous page.

## Evidence

Pending.
