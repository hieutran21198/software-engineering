---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/diagram-rendering.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/visual-knowledge.md
    requires: Reader support rules and direction R1 for fenced Mermaid blocks, text alternatives and the source panel fallback.
---

# Diagram rendering contract

Governs VP4 and VP5 in requirements/visual-artifacts.md. It implements direction R1 of the ADD visual knowledge contract. [Decision 017](../decisions/017-bundled-mermaid-rendering.md) records the choice of a bundled renderer in the browser. The [code panel rules](reading-controls.md#code-panels) and the contained reading of decision 011 stay in force.

## Scope

The shared component src/Markdown.jsx renders knowledge Markdown for the document, artifact, change review and source pages. This contract changes only that component and adds one module, src/diagram-render.js. A fenced code block whose info string has `mermaid` as its first word is a diagram block. Every other block keeps the code panel.

## Rendering

1. Synchronous step. The Markdown renderer writes each diagram block as a `figure` element with the class `diagram-block` and an index attribute, and puts the existing code panel for the block text inside it. The block text stays in a list in component memory; it is not read back from the DOM. The sanitizing profile of the Markdown output adds only the `figure` element and the index attribute.
2. Loading. After the component mounts with at least one diagram block, it imports src/diagram-render.js with a dynamic import. Vite bundles the module and Mermaid as separate chunks served by the Plane. A page without a diagram block loads neither chunk.
3. Configuration. The module initializes Mermaid once: `startOnLoad: false`, `securityLevel: 'strict'`, `htmlLabels: false` and `flowchart.htmlLabels: false`, theme `neutral`, the Plane body font, and the default `maxTextSize` of 50,000 characters. Mermaid is a direct dependency pinned to 11.17.2, the version that the documentation website renders with.
4. Refusal before rendering. The module does not render a block that contains a configuration directive (`%%{`) or starts with Mermaid front matter (`---`), because the ADD authoring rules forbid directives and both forms can change theme CSS. It does not render a block above `maxTextSize`.
5. Rendering. The module renders the blocks of one page in document order with `mermaid.render` and a unique ID per block. A newer render of the component discards older results.
6. Sanitizing. The SVG passes DOMPurify with the SVG profile. It removes `script`, `foreignObject`, `a`, `image`, event handler attributes, `href` and `xlink:href` values that do not start with `#`, and, inside `style` elements and `style` attributes, `@import` rules and `url()` values that do not start with `#`. Mermaid's grammar does not accept parentheses in `style` statements, so the attribute rule is a second defense. It keeps `title`, `desc`, `role` and the `aria-*` attributes that Mermaid writes from `accTitle` and `accDescr`.
7. Display. The sanitized SVG replaces the code panel inside the figure. The figure has the width of the content column. The SVG has its natural width and shrinks to fit the column down to three quarters of that width, so that its text stays legible; a wider diagram scrolls horizontally inside the figure, and the page does not scroll horizontally at 390 pixels.
8. Fallback. When a block is refused, does not parse or does not render, the code panel stays and a note follows it: "Diagram not rendered: " and the first line of the reason, at most 160 characters. The module removes any temporary element that Mermaid left in the document. When the renderer chunk does not load, every diagram block keeps its code panel with the note "Diagram not rendered: the diagram renderer did not load."

The Plane Content-Security-Policy is unchanged: `script-src 'self'` and `connect-src 'self'` keep the renderer local, and `style-src 'unsafe-inline'` allows the style element of the SVG.

## Unchanged behavior

Other code blocks, the Markdown sanitizing profile for other content, knowledge links and their navigation, the editor, the HTTP and MCP interfaces, the packet schemas and the server do not change. The raw source view of a non-Markdown file keeps its code panel.

## Flow supports

Add the element support `diagram-rendering-contract` for this document to the inspect step of repository-exploration and the read step of source-retrieval, and add implementation and test supports for src/diagram-render.js and its browser test when Implementation creates them. Steps and transitions do not change.

## Validation

Browser tests on a fixture document check: a flowchart, a sequence diagram and a state diagram render as SVG with `title` and `desc`; an invalid block and a block with a directive show the code panel and the note; a label that contains HTML or a script produces no element or attribute outside the sanitized profile; no request goes to another origin; a page without a diagram block requests no diagram chunk; at 390 pixels the page has no horizontal scroll. A check on this repository's knowledge renders every Mermaid block of the changed documents without a note. Task evidence records the size of the two chunks and the first render time on this machine.

## Specification self-check

VP4 maps to Rendering, VP5 to Unchanged behavior and Flow supports, AVP3 and AVP4 to Validation. KISS: one module, one dynamic import, one pinned dependency, no server change, no new page or control. STE: each rendering step has one rule. Risk: a Mermaid dependency could need code generation at run time, which the CSP forbids; Implementation checks this first in the browser test and returns to Specification if it fails. No Specification blocker prevents Plan.
