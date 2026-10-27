---
tier: large
---

# Show system and artifact diagrams in the Plane

## Reason and scope

Issue 60 asks for a reading experience for diagrams at system and artifact scope. The Plane renders Mermaid without icons, and no page shows system views or lists the diagrams of an artifact.

This change adds a system entry on the home page, a diagram list on the artifact page and bundled icons in the diagram renderer. The ADD member defines the scopes, the discovery rule and the icon set. The shared outcome is documented in `docs/artifacts/units-of-work/diagram-scopes/README.md`. It excludes diagram editing, navigation from diagram nodes, MCP tools for diagrams and remote icons.

The outcome spans two artifacts, so the change is large. It uses this repository only. Plane implementation waits until the ADD member establishes on the protected branch.
