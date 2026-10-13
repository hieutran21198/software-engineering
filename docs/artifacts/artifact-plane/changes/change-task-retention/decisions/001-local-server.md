# Local server and static UI

## Decision

Use Node.js, its built-in HTTP server, and a locally bundled React UI. Use existing YAML, Markdown, and sanitizer libraries. React Flow supplies the interactive canvas and nested artifact/element nodes; Dagre supplies automatic layout. Keep the scanner and HTTP handler separate enough to test them directly. Use a small bundler only to package browser dependencies locally.

Separate repository reads from parsing and graph calculations with plain functions. This applies Ports and Adapters where Git and filesystem access would otherwise make rule tests fragile. Full interface hierarchies and a dependency-injection framework would add work without a required alternative implementation.

## Alternatives

A browser folder picker needs browser-specific filesystem support and cannot directly provide Git branch and status commands. A desktop shell adds packaging beyond the requested web application. A full application framework adds routing and build conventions that this single screen does not need.

Mermaid suits generated diagrams, but the user's interactive-canvas preference calls for node selection and nested expansion in one view. React Flow supplies these interaction primitives and grouping. A custom HTML canvas or SVG engine would require custom interaction and accessibility work. React introduces a UI dependency justified by the requested canvas behavior, without a full application framework.

## Consequences

Readers start one local process and enter a repository path. All assets run locally without a CDN. The HTTP boundary requires loopback binding, request-origin checks, and containment checks. The app reads a repository on the server's computer. A prepared release remains proposed until the required changes merge to main.

## Applicability in this change

Specifications/task-retention.md replaces standalone Workflow canvas/navigation requirements and delivered task-source rules. Unit Workflow and derived workflow evidence remain supported.
