---
tier: large
---

# Diagrams at system and artifact scope

## Reason and scope

Issue 60 asks for diagrams of the whole system and of one artifact, with Mermaid and recognizable icons. The visual representation guide has no scope, no owner for a view that crosses artifacts and no icon rule.

This change adds the two scopes, a selection matrix, the system ownership and discovery rules, the icon sources with their reader fallback, and an invented AWS example to the bundle. Artifact Plane shows the result in a separate member change. The shared outcome is documented in `docs/artifacts/units-of-work/diagram-scopes/README.md`. It excludes a system overview for this repository, icon registration on the website and validator diagram checks.

The outcome spans two artifacts, and the Plane consumes the new contract, so the change is large. It uses this repository only.
