---
id: renderer
depends_on: []
evidence_records: []
---

# Render fenced Mermaid blocks in the Markdown component

## Scope and ownership

Implementer in a separate worktree, or the coordinator. Repository: this repository. Files under apps/artifact-plane: package.json and package-lock.json (direct dependency mermaid 11.17.2), src/Markdown.jsx, src/diagram-render.js (new), the stylesheet that styles `.markdown`, a fixture document and a browser test under test/browser. No server, API or schema change.

## Governing knowledge

VP4, VP5 and AVP3 in requirements/visual-artifacts.md; specifications/diagram-rendering.md; decisions/017-bundled-mermaid-rendering.md; the code panel rules of specifications/reading-controls.md.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [ ] First check: a fixture page with one flowchart renders under the unchanged Content-Security-Policy without a CSP violation in the browser console. If it fails, stop and return to Specification.
- [ ] Rendering steps 1 to 8 of the contract are implemented; Mermaid is pinned to 11.17.2 and loaded by dynamic import only for a page with a diagram block.
- [ ] Browser tests at 1440 and 390 pixels cover each item of the Validation section of the contract: flowchart, sequence and state diagrams with title and desc; invalid block and directive block with the code panel and the note; a label with HTML or a script that leaves no element or attribute outside the profile; no request to another origin; no diagram chunk for a page without a diagram block; no horizontal page scroll at 390 pixels.
- [ ] Existing code panels, links and the editor behave as before: the existing unit and browser tests pass.
- [ ] Evidence records the size of the renderer and Mermaid chunks and the first render time of the fixture page.
- [ ] Screenshots of the fixture page at 1440 and 390 pixels are reviewed as a reader.

## Evidence

Implementation has not started.
