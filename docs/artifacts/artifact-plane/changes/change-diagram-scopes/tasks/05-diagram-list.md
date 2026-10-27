---
id: diagram-list
depends_on: [diagram-index, fixture]
covers:
  - element: requirements/diagram-scopes.md
    ids: [DP3, DP4, DP6]
---

# Diagrams section and document focus

## Scope and ownership

Implementer. Add the Diagrams section to src/pages/ArtifactPage.jsx, the `diagram` parameter to src/pages/DocumentPage.jsx and the focus behavior to src/Markdown.jsx, and add browser tests. Governing sections: [Artifact page](../../../specifications/diagram-scopes.md#artifact-page) and [Document focus](../../../specifications/diagram-scopes.md#document-focus). Leave the purpose line to task `system-entry`.

## Definition of Done

- [ ] The Diagrams section follows Flows with its title, summary and three-line items, the type labels of the contract, the "Illustrative" and "No source line" texts, the Stale badge with its title, and "Show all N" above five items.
- [ ] The section is absent for an artifact without diagrams, and the other sections of the page do not change.
- [ ] An item opens the document page with `diagram`; after the render, the figure is in view, has the focus, `tabindex="-1"` and its label. An index without a figure opens the page at the top.
- [ ] Browser tests at 1440 and 390 pixels cover these cases on the fixture, including Back to the artifact page.

## Evidence

Pending.
