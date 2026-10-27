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

- [x] The System section appears before Dependencies with its title, summary, muted line and items, ordered and labelled as the contract states, and it is absent when no element has `systemView`.
- [x] An item opens the document page; the owner table links of the fixture open `ordering` and `payments` knowledge.
- [x] The artifact page shows "System view: <title>" after "Read the overview" when the repository has one system view document, the plural form for several, and nothing otherwise.
- [x] Browser tests at 1440 and 390 pixels cover these cases, and browser Back returns to the previous page.

## Evidence

An implementer delivered commit 71f4e34 on branch claude/diagram-scopes-04-system-entry; the coordinator reviewed its screenshots and merged it (2b71e61).

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| System section | Browser test of the section order, the muted line and the item lines on the fixture; a second fixture with three system views; `inPlaceFixture()` without system views | Sections Uncommitted knowledge, System 1, Dependencies; item "Bookshop system overview" over "Platform · 3 diagrams"; order by artifact title then path; "1 diagram" and "No diagram"; no System region without system views | apps/artifact-plane/test/browser/system-entry.spec.js |
| Item and owner table links | Same spec | The item opens the system overview with three rendered diagrams; "Orders API" and "Order data" open Ordering, "Payment worker" opens Payments, "Storefront web app" opens Storefront | same spec |
| System view link | Same spec | "Read the overview · System view: Bookshop system overview" on Ordering and Platform; the plural form with three links in order; the line of an artifact without system views is unchanged | same spec |
| Widths and Back | Same spec at 1440 and 390 pixels | Back returns to the previous page in each case; no horizontal page scroll at 390 pixels; no page error | same spec |

The spec passes 6 of 6. `npm test`: 566 tests, 565 pass, 0 fail, 1 skipped. The full browser suite with the Nix Chromium: 168 of 169 passed; change-page.spec.js:38 timed out once and passed alone, and integrated validation reruns it. The shared ordering is `systemViews` in src/work-model.js, and the link is `SystemViewLinks` in src/pages/ArtifactPageParts.jsx.
