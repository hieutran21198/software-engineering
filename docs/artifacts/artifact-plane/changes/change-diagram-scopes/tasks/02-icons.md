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

- [x] First check: a browser test records the network requests of a page with diagrams and no icon, and of a page with icons. The result is reported to the coordinator for the claim `lazy-icon-chunk` before other work continues.
- [x] `@iconify-json/logos` 1.2.18 and `@iconify-json/lucide` 1.2.147 are exact development dependencies, and package-lock.json is updated.
- [x] The build emits one separate icon chunk with 65 `logos` names, the 24 `lucide` names, each pack's `info` record and the Lucide ISC notice.
- [x] The build fails when a listed `lucide` name is missing or the `logos` subset does not have 65 names; a test proves both cases.
- [x] Browser tests show icons of both packs as SVG paths, a name outside the set as the unknown-icon mark with its label, no request to another origin, no icon chunk request on a diagram page without icons, and no horizontal page scroll at 390 pixels.
- [x] Browser tests render a `flowchart` with icon shapes, a `flowchart TB` with nested subgraphs and an `erDiagram`; the existing diagram rendering tests still pass.
- [x] The Plane README lists both packs with versions, authors, licenses and URLs.
- [x] Evidence records the sizes of the renderer chunk and the icon chunk.

## Evidence

An implementer delivered commit 81713d2 on branch claude/diagram-scopes-02-icons; the coordinator merged it (f219a08) and updated the Nix npm dependency hash.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Lazy icon chunk first | Browser test that records the scripts of a diagram page without icons and of an icon page | No icon chunk on the first page; the icon page adds the icon chunk and the `erDiagram` chunk; the test fails without the registration | [icon chunk check](../../../specifications/diagram-scopes.md#icon-chunk-check) |
| Exact development dependencies | `git show` of package.json and package-lock.json | `@iconify-json/logos` 1.2.18 and `@iconify-json/lucide` 1.2.147 without a range; the lock file adds only the two packages; `onnxruntime-node` still loads | apps/artifact-plane/package.json |
| Icon chunk content | Node import of the built `_virtual_diagram-icons` chunk | 65 `logos` names and 24 `lucide` names equal the ADD guide lists; both `info` records; `notice` holds the Lucide license file with its ISC and MIT parts | apps/artifact-plane/scripts/diagram-icons.mjs |
| Build failures | test/diagram-icons.test.js (64 and 66 `aws` names, a missing `lucide` name) and one real `vite build` with an unknown name | The tests pass; the real build stops with "The lucide pack has no icon named not-an-icon." | apps/artifact-plane/test/diagram-icons.test.js |
| Icon rendering and safety | Browser test at 1440 and 390 pixels on test/browser/diagram-icons-fixture.md | Icons are nested SVG paths with local gradient references; unknown names show the mark with their labels; no forbidden element, handler, href, remote `url()` or cross-origin request; no page scroll at 390 pixels | apps/artifact-plane/test/browser/diagram-rendering.spec.js |
| Notations | Same browser test | `flowchart` with icon shapes, `flowchart TB` with three nested subgraphs and `erDiagram` render; the existing diagram tests pass (6 of 6) | same spec |
| README | Read the section Diagram icons | Versions, authors, licenses and URLs of both packs | apps/artifact-plane/README.md |
| Chunk sizes | `npm run build` with Vite 8.3.4 | Renderer 96.70 kB (33.60 kB gzip), before 96.56 kB (33.52 kB); icon chunk 144.00 kB (51.64 kB gzip) | this task |

`npm test`: 560 tests, 559 pass, 0 fail, 1 skipped. The full browser suite with the Nix Chromium: 166 passed. A build of the unchanged renderer with and without vite.config.js gave the same 168 files with equal hashes.
