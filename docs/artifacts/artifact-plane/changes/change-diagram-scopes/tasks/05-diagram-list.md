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

- [x] The Diagrams section follows Flows with its title, summary and three-line items, the type labels of the contract, the "Illustrative" and "No source line" texts, the Stale badge with its title, and "Show all N" above five items.
- [x] The section is absent for an artifact without diagrams, and the other sections of the page do not change.
- [x] An item opens the document page with `diagram`; after the render, the figure is in view, has the focus, `tabindex="-1"` and its label. An index without a figure opens the page at the top.
- [x] Browser tests at 1440 and 390 pixels cover these cases on the fixture, including Back to the artifact page.

## Evidence

An implementer delivered commit ed4e7eb on branch claude/diagram-scopes-05-diagram-list; the coordinator reviewed its screenshots and merged it (e8f9af6).

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Diagrams section | Browser test at 1440 and 390 pixels on the Ordering artifact of the fixture; a sixth record injected into the overview; test/diagram-labels.test.js for the label table | Section after Flows; "Diagrams 5" with the three lines of each item; "Illustrative" and "No source line"; the Stale badge with the stale text as its title; "Show all 6 diagrams" only above five items; an unknown type keeps its name | apps/artifact-plane/test/browser/diagram-list.spec.js |
| Absent section | Same spec on Payments and on a repository with only a `js` code block; the golden page test | No Diagrams section; other sections unchanged; golden test passes | same spec |
| Document focus | Same spec | The item opens the document; the figure is in view, has the focus, `tabindex="-1"` and the label "Diagram 2: Idempotency check of the order handler"; an index without a figure opens the page at scroll position 0 with no focused figure | same spec |
| Widths and Back | Same spec | Back returns to the artifact page and to the clicked item; no horizontal page scroll at 390 pixels | same spec |

The spec passes 5 of 5. `npm test`: 568 tests, 567 pass, 0 fail, 1 skipped. The full browser suite with the Nix Chromium: 168 of 168 passed. Items follow the document order of the page, then the index, as the contract states. The Stale badge uses the existing status member "Unchecked items" (amber with a clock), because the status vocabulary of the human guidance contract has no Stale member. A figure that fits the viewport scrolls to its center, so its heading and its source and stale lines stay visible.
