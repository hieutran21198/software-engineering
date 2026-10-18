---
id: renderer
depends_on: []
evidence_records:
  - id: dod
    method: CSP check first, browser tests at 1440 and 390 pixels, unit and browser suites, build, chunk sizes, render time and screenshot review.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/01-renderer.md#evidence
---

# Render fenced Mermaid blocks in the Markdown component

## Scope and ownership

Implementer in a separate worktree, or the coordinator. Repository: this repository. Files under apps/artifact-plane: package.json and package-lock.json (direct dependency mermaid 11.17.2), src/Markdown.jsx, src/diagram-render.js (new), the stylesheet that styles `.markdown`, a fixture document and a browser test under test/browser. No server, API or schema change.

## Governing knowledge

VP4, VP5 and AVP3 in requirements/visual-artifacts.md; specifications/diagram-rendering.md; decisions/017-bundled-mermaid-rendering.md; the code panel rules of specifications/reading-controls.md.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] First check: a fixture page with one flowchart renders under the unchanged Content-Security-Policy without a CSP violation in the browser console. If it fails, stop and return to Specification.
- [x] Rendering steps 1 to 8 of the contract are implemented; Mermaid is pinned to 11.17.2 and loaded by dynamic import only for a page with a diagram block.
- [x] Browser tests at 1440 and 390 pixels cover each item of the Validation section of the contract: flowchart, sequence and state diagrams with title and desc; invalid block and directive block with the code panel and the note; a label with HTML or a script that leaves no element or attribute outside the profile; no request to another origin; no diagram chunk for a page without a diagram block; no horizontal page scroll at 390 pixels.
- [x] Existing code panels, links and the editor behave as before: the existing unit and browser tests pass.
- [x] Evidence records the size of the renderer and Mermaid chunks and the first render time of the fixture page.
- [x] Screenshots of the fixture page at 1440 and 390 pixels are reviewed as a reader.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan.

- Worker commit on branch claude/va-renderer, integrated as c3d235d. Coordinator integration fixes c9febd4 and 65d5df9 are listed below.
- CSP first check: a flowchart renders under the unchanged Content-Security-Policy with no violation; the test reports every securitypolicyviolation event as a console error and fails on any console error. A probe with an inline script showed that the detection works. server/http.js is unchanged.
- Files: package.json and package-lock.json (exact dependency mermaid 11.17.2, which reuses dompurify 3.4.17 and brings its own marked 16.4.2), src/Markdown.jsx, src/diagram-render.js (new), src/styles.css (four rules), test/browser/diagram-fixture.md and test/browser/diagram-rendering.spec.js (new).
- Integration fixes after code review (c9febd4): blocks that start with Mermaid front matter are refused like `%%{` directives, because both can set theme CSS; CSS `url()` and `@import` are filtered in style attributes as well as style elements (Mermaid's grammar rejects parentheses in `style` statements, verified by a parse error, so this is a second defense); a renderer chunk that does not load leaves every block with its code panel and the note "Diagram not rendered: the diagram renderer did not load."; the shrink rule is recorded in the contract. 65d5df9 adds `sequence.wrap`, after the real-knowledge check of the validation task showed sequence diagrams of 1,511 to 1,732 pixels in a 720-pixel column.
- Browser tests (diagram-rendering.spec.js, 3 tests): at 1440 and 390 pixels, flowchart, sequence and state diagrams render as SVG with title, desc and aria-labelledby; the invalid, directive and front matter blocks keep the code panel with one note each; labels with `<img onerror>`, `<script>` and `<a href>` leave no img, script, a, foreignObject, image or iframe element, no on* attribute, no href outside `#` and no temporary element; no CSS in the rendered SVG names a remote resource; no request goes to another origin; the page without a diagram block requests no diagram-render chunk; at 390 pixels the page does not scroll horizontally and a wide diagram scrolls inside its figure; the js block keeps its highlighted panel. A third test aborts the renderer chunk and finds the code panels with the note. Result: 3 passed.
- Suites on the integrated branch after the rebase on main 3c317fd: `npm test` 365 tests, 364 passed, 0 failed, 1 skipped; the known flaky SQLite test passed. `npm run test:browser` 105 passed. Before the rebase: 364 tests with 363 passed and 103 browser tests passed. `npm run build` succeeds with the existing warnings for chunks above 500 kB.
- Chunk sizes: diagram-render 96.56 kB (33.53 kB gzip). Mermaid is split into many chunks; the largest are the core 662 kB (143 kB gzip), cytoscape 435 kB, katex 259 kB, the config chunk 209 kB and sequenceDiagram 116 kB. The fixture page loads 31 chunks, 880 kB raw; the main chunk grew from 901.84 kB to 904.18 kB and contains no Mermaid code.
- First render time on this machine: about 250 ms from the renderer chunk request to the last SVG of the fixture page, about 465 ms from the start of the navigation.
- Screenshot review at 1440 and 390 pixels by the worker and the coordinator: diagrams use the neutral theme and the Plex Sans font inside the content column; fallback notes appear in muted text under the code panel; at 390 pixels wide diagrams scroll inside the figure. The note for a parse error shows only the first line, for example "Diagram not rendered: Parse error on line 3:", as the contract defines.
