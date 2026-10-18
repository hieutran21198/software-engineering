# Render Mermaid in the browser with a bundled, pinned renderer

## Context

ADD 2.7.0 lets authors embed Mermaid diagrams with text alternatives. GitHub and the documentation website render them; the Plane shows the source text. The Plane is a loopback application with a strict Content-Security-Policy and no external resources. Its Markdown output passes DOMPurify, which forbids svg.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Bundled Mermaid in the browser, loaded on demand | Pin Mermaid, import it dynamically when a page has a diagram block, sanitize the SVG, fall back to the code panel. | Same renderer family as GitHub and the website, no server change, no cost for pages without diagrams. Adds a large dependency chunk. Selected. |
| B. Render on the server | Produce SVG in Node and send it with the document. | Mermaid needs a browser DOM, so the server needs a headless browser or a DOM emulation. Adds a process and a cache. Rejected. |
| C. Mermaid from a CDN | Load the library from a public host. | Breaks the no-external-resource rule and the CSP. Rejected. |
| D. A smaller third-party renderer | Use a library that renders a subset of Mermaid. | Output and syntax coverage differ from GitHub and the website, so the same block can render differently or fail. Rejected. |
| E. Keep the source panel | Show text only. | The user asked for the Plane to show the diagrams. Rejected. |

## Decision

Adopt option A as defined in specifications/diagram-rendering.md, with Mermaid pinned to the version that the website uses.

## Consequences

Pages with diagrams load the renderer chunk once per session. A Mermaid upgrade is a dependency change that reruns the diagram browser tests. The fallback keeps every diagram readable as text when rendering fails. Diagram editing and a text and diagram switch stay out of scope.
