# Local server and static UI

## Decision

Use Node.js, its built-in HTTP server, and a static browser UI. Use existing YAML, Markdown, sanitizer, and Mermaid libraries. Keep the scanner and HTTP handler separate enough to test them directly. Use a small bundler only to package browser dependencies locally.

Separate repository reads from parsing and graph calculations with plain functions. This applies Ports and Adapters where Git and filesystem access would otherwise make rule tests fragile. Full interface hierarchies and a dependency-injection framework would add work without a required alternative implementation.

## Alternatives

A browser folder picker needs browser-specific filesystem support and cannot directly provide Git branch and status commands. A desktop shell adds packaging beyond the requested web application. A full application framework adds routing and build conventions that this single screen does not need.

## Consequences

Readers start one local process and enter a repository path. All assets run locally without a CDN. The HTTP boundary requires loopback binding, request-origin checks, and containment checks. The app reads a repository on the server's computer. This decision remains proposed until plan approval.
