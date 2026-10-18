---
id: impact-page
depends_on:
  - interfaces
---

# Impact page

## Scope and ownership

Own apps/artifact-plane/src/pages/ImpactPage.jsx, ImpactPage.css, the page kind impact in src/main.jsx and src/Workspace.jsx, and the impact subgraph builder src/impact-canvas.js with its Node test.

## Governing knowledge

specifications/change-impact.md, section Impact view. specifications/authoring-workbench.md, the page and control rules. requirements/change-impact.md, I8.

## Prerequisites

Task interfaces satisfies its DoD.

## Definition of Done

- [ ] The page shows the origins with their changed declarations or sections, the summary strip with the five counts, and the sections Direct, Transitive, Potential and Unresolved grouped by artifact, then flow with affected steps, knowledge, module and test.
- [ ] Each row shows the name, a kind chip, a strength chip, the hop count and the last relationship; selecting a row opens the detail panel with every path as typed edges with evidence, affected exports, reasons and links.
- [ ] Tier and kind filters, the origin filter, "One more hop (N)" with the frontier count, and "Show as graph" with at most 60 nodes work with the mouse and the keyboard.
- [ ] Loading, stale, partial, empty and error states are visible and the empty state shows the coverage statement.
- [ ] A screenshot review at 1440 and 390 pixels against the research mockup is recorded before this DoD is checked.

## Evidence

No checks have run.
