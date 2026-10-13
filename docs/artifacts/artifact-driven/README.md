# Artifact-Driven Development

ADD supplies a reusable method and bundle for artifact-governed software development.

## Scope and ownership

The repository maintainers own ADD knowledge, the five-phase method, role skills, patterns, adoption contracts, and documentation delivery. Foundation, methodology, execution, adoption and publishing are responsibilities within this cohesive technical capability. Utility skills are reused supporting assets. Artifact Plane retains its separate exploration and visualization boundary.

Project knowledge lives here. The canonical local method remains in docs/artifact-driven; packaged implementation inputs remain in src/archs/artifact-driven and src/utils/agents/skills. Adoption implementation lives in cmd/se-adopt and internal/adopt; documentation delivery lives in website and the repository CI configuration.

## Current established version

1.0.0

## Proposed initial version

1.0.0 records the recovered existing baseline. Local DoD checks passed and the user confirmed this version. This declaration and the new DAG entry describe proposed post-merge state on the change branch. No initial version is established on main until this knowledge merges; an unmerged snapshot is not established. The artifact version is separate from se-adopt binary release tags and Artifact Plane versions.

## Established dependencies

None.

## Knowledge snapshot

- [Requirements](versions/1.0.0/requirements/baseline.md)
- [Source inventory and capability limits](versions/1.0.0/requirements/evidence.md)
- [Knowledge and execution contract](versions/1.0.0/specifications/knowledge.md)
- [Adoption and publishing contract](versions/1.0.0/specifications/delivery.md)
- [Knowledge and boundary decision](versions/1.0.0/decisions/001-knowledge-and-boundary.md)
- [Embedded adoption decision](versions/1.0.0/decisions/002-embedded-safe-adoption.md)
- [Publishing decision](versions/1.0.0/decisions/003-derived-documentation.md)
- [Plan and validation evidence](versions/1.0.0/tasks/README.md)

## Active change

[Recover the existing ADD baseline](changes/change-initial/README.md).

## Future development

After merge establishes 1.0.0, start future ADD changes from its full snapshot. Retain valid requirements, contracts, decisions and evidence; amend affected knowledge and add required tasks. Follow Requirement → Specification → Plan → Implementation → Version with explicit plan approval and team merge. Preserve the reusable bundle; do not treat these project artifacts as another copy of its guidance.
