---
current_version: 3.4.0
depends_on: []
---

# Artifact-Driven Development

ADD supplies a reusable method and bundle for artifact-governed software development.

## Scope and ownership

The repository maintainers own ADD knowledge, the five-phase method, role skills, patterns, adoption contracts, and documentation delivery. Foundation, methodology, execution, adoption and publishing are responsibilities within this cohesive technical capability. Utility skills are reused supporting assets. Artifact Plane retains its separate exploration and visualization boundary.

Project knowledge lives here. The canonical method is in docs/artifact-driven, which also holds the Go package that embeds it; the required skills come from src/utils/agents/skills. Adoption implementation lives in cmd/se-adopt and internal/adopt; documentation delivery lives in website and the repository CI configuration. Do not treat these project artifacts as another copy of the bundle guidance.

## Knowledge

This artifact uses the in-place layout. Working knowledge is in requirements, specifications and decisions; system flows are in specifications/flows. Start with:

- [Requirements](requirements/baseline.md) and [source inventory](requirements/evidence.md)
- [Knowledge and execution contract](specifications/knowledge.md) and [in-place knowledge layout](specifications/knowledge-layout.md)
- [Adoption and publishing contract](specifications/delivery.md)
- [Change impact contract](specifications/change-impact.md) and [typed change impact decision](decisions/012-typed-change-impact.md)
- [Knowledge and boundary decision](decisions/001-knowledge-and-boundary.md) and [in-place layout decision](decisions/011-in-place-knowledge-layout.md)

Version records are in versions. Records 1.1.0 to 2.3.0 were converted from complete legacy snapshots; each one gives the Git command that finds its knowledge. Change records and retained delivery plans are in changes.
