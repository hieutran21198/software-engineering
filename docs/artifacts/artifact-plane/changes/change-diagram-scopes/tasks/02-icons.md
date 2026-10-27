---
id: icons
depends_on: []
covers:
  - element: requirements/diagram-scopes.md
    ids: [DP7, DP8, DP9, DP10, DP11]
---

# Bundled icon packs

## Scope and ownership

Implementer. Add the two exact development dependencies, vite.config.js with the `virtual:diagram-icons` plugin, src/diagram-icon-names.js, the registration in src/diagram-render.js, the Lucide notice, the README list of packs and the browser tests. Governing sections: [Icons](../../../specifications/diagram-scopes.md#icons) and [Diagram types](../../../specifications/diagram-scopes.md#diagram-types). The coordinator updates the Nix npm dependency hash.

## Definition of Done

- [ ] First check: a browser test records the network requests of a page with diagrams and no icon, and of a page with icons. The result is reported to the coordinator for the claim `lazy-icon-chunk` before other work continues.
- [ ] `@iconify-json/logos` 1.2.18 and `@iconify-json/lucide` 1.2.147 are exact development dependencies, and package-lock.json is updated.
- [ ] The build emits one separate icon chunk with 65 `logos` names, the 24 `lucide` names, each pack's `info` record and the Lucide ISC notice.
- [ ] The build fails when a listed `lucide` name is missing or the `logos` subset does not have 65 names; a test proves both cases.
- [ ] Browser tests show icons of both packs as SVG paths, a name outside the set as the unknown-icon mark with its label, no request to another origin, no icon chunk request on a diagram page without icons, and no horizontal page scroll at 390 pixels.
- [ ] Browser tests render a `flowchart` with icon shapes, a `flowchart TB` with nested subgraphs and an `erDiagram`; the existing diagram rendering tests still pass.
- [ ] The Plane README lists both packs with versions, authors, licenses and URLs.
- [ ] Evidence records the sizes of the renderer chunk and the icon chunk.

## Evidence

Pending.
