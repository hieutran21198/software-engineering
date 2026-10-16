# Artifact-Driven Development

ADD supplies a reusable method and bundle for artifact-governed software development.

## Scope and ownership

The repository maintainers own ADD knowledge, the five-phase method, role skills, patterns, adoption contracts, and documentation delivery. Foundation, methodology, execution, adoption and publishing are responsibilities within this cohesive technical capability. Utility skills are reused supporting assets. Artifact Plane retains its separate exploration and visualization boundary.

Project knowledge lives here. The canonical local method remains in docs/artifact-driven; packaged implementation inputs remain in src/archs/artifact-driven and src/utils/agents/skills. Adoption implementation lives in cmd/se-adopt and internal/adopt; documentation delivery lives in website and the repository CI configuration.

## Current version

2.2.0

## Publication boundary

PR #27 merged ADD 2.2.0 knowledge, canonical and embedded model guidance, and retained delivery evidence onto main. Local protected main and the remote main ref agree on that merge at this review. Required Go and documentation checks passed. The Artifact Plane job failed separately; its browser results are not reported as passing. Historical proposal wording remains in the delivered snapshot. The evidence-and-usability change prepares the next contract and does not establish it before merge.

## Established dependencies

None.

ADD 2.1.0 knowledge, bundled implementation and retained delivery evidence landed on main through merged PR #20. The published contract was rechecked before downstream implementation. Historical snapshot preparation text is retained.

## Active change

- [Evidence and usability](changes/change-evidence-and-usability/README.md)


## Knowledge snapshot

- [Requirements](versions/2.2.0/requirements/baseline.md)
- [Source inventory and capability limits](versions/2.2.0/requirements/evidence.md)
- [Knowledge and execution contract](versions/2.2.0/specifications/knowledge.md)
- [Adoption and publishing contract](versions/2.2.0/specifications/delivery.md)
- [Knowledge and boundary decision](versions/2.2.0/decisions/001-knowledge-and-boundary.md)
- [Embedded adoption decision](versions/2.2.0/decisions/002-embedded-safe-adoption.md)
- [Publishing decision](versions/2.2.0/decisions/003-derived-documentation.md)
- [Task DAG contract](versions/2.2.0/specifications/task-dag.md)
- [Derived task graph decision](versions/2.2.0/decisions/004-derived-task-graph.md)
- [Plan and validation evidence](changes/change-model-explanations/tasks/README.md)

- [Unit-of-work requirements](versions/2.2.0/requirements/units-of-work.md)
- [Unit-of-work contract](versions/2.2.0/specifications/units-of-work.md)

- [Task retention requirements](versions/2.2.0/requirements/task-retention.md)
- [Change-owned delivery contract](versions/2.2.0/specifications/task-retention.md)

- [Flow requirements](versions/2.2.0/requirements/flows.md)
- [System flow contract](versions/2.2.0/specifications/system-flows.md)
- [Named ADD journeys](versions/2.2.0/README.md)

## Future development

Start future ADD changes from the complete current established snapshot. Retain valid requirements, contracts, and decisions; amend affected knowledge and create fresh tasks in the new change. Previous delivery evidence stays in its originating change. Do not copy tasks into versions. Follow Requirement → Specification → Plan → Implementation → Version with explicit plan approval and team merge. Preserve the reusable bundle; do not treat these project artifacts as another copy of its guidance.

## Reusable models and flow interactions

- [Complete 2.2.0 snapshot](versions/2.2.0/README.md)
- [Model and interaction requirements](versions/2.2.0/requirements/model-explanations.md)
- [Model and interaction contract](versions/2.2.0/specifications/model-explanations.md)
- [Owned ADD models](versions/2.2.0/specifications/domain-model.md)

The delivered model contract preserves declared artifact dependencies and legacy flow behavior. Its originating change retains the delivery tasks and checks. The current evidence-and-usability change has a separate fresh plan.
