# Artifact-Driven Development

ADD supplies a reusable method and bundle for artifact-governed software development.

## Scope and ownership

The repository maintainers own ADD knowledge, the five-phase method, role skills, patterns, adoption contracts, and documentation delivery. Foundation, methodology, execution, adoption and publishing are responsibilities within this cohesive technical capability. Utility skills are reused supporting assets. Artifact Plane retains its separate exploration and visualization boundary.

Project knowledge lives here. The canonical local method remains in docs/artifact-driven; packaged implementation inputs remain in src/archs/artifact-driven and src/utils/agents/skills. Adoption implementation lives in cmd/se-adopt and internal/adopt; documentation delivery lives in website and the repository CI configuration.

## Current established version

2.1.0

## Established dependencies

None.

This branch proposes the post-merge 2.1.0 root and snapshot. ADD 2.0.0 remains established on main until the new knowledge, bundled implementation and retained delivery evidence land through team review and merge. Historical snapshot preparation text is retained.

## Active change

- [Flow discovery and retrieval](changes/change-flow-discovery/README.md)


## Knowledge snapshot

- [Requirements](versions/2.1.0/requirements/baseline.md)
- [Source inventory and capability limits](versions/2.1.0/requirements/evidence.md)
- [Knowledge and execution contract](versions/2.1.0/specifications/knowledge.md)
- [Adoption and publishing contract](versions/2.1.0/specifications/delivery.md)
- [Knowledge and boundary decision](versions/2.1.0/decisions/001-knowledge-and-boundary.md)
- [Embedded adoption decision](versions/2.1.0/decisions/002-embedded-safe-adoption.md)
- [Publishing decision](versions/2.1.0/decisions/003-derived-documentation.md)
- [Task DAG contract](versions/2.1.0/specifications/task-dag.md)
- [Derived task graph decision](versions/2.1.0/decisions/004-derived-task-graph.md)
- [Plan and validation evidence](changes/change-task-retention/tasks/README.md)

- [Unit-of-work requirements](versions/2.1.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/2.1.0/specifications/units-of-work.md)

- [Task retention requirements](versions/2.1.0/requirements/task-retention.md)
- [Change-owned delivery contract](versions/2.1.0/specifications/task-retention.md)

- [Flow requirements](versions/2.1.0/requirements/flows.md)
- [System flow contract](versions/2.1.0/specifications/system-flows.md)
- [Named ADD journeys](versions/2.1.0/README.md)

## Future development

Start future ADD changes from the complete current established snapshot. Retain valid requirements, contracts, and decisions; amend affected knowledge and create fresh tasks in the new change. Previous delivery evidence stays in its originating change. Do not copy tasks into versions. Follow Requirement → Specification → Plan → Implementation → Version with explicit plan approval and team merge. Preserve the reusable bundle; do not treat these project artifacts as another copy of its guidance.
