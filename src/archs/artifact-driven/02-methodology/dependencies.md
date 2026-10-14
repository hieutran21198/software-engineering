# Dependencies

## Two Levels

The artifact DAG determines execution order. Detailed element references explain which knowledge creates each dependency.

| Level | Example | Location |
| --- | --- | --- |
| Artifact | Authentication depends on tenant. | Established dependencies in artifact root READMEs, indexed in `docs/artifacts/dag.yaml`. |
| Element | Login behavior uses tenant identity rules. | References in the consuming requirements, specifications, ADRs, or tasks. |

Elements, changes, versions, and tasks do not become nodes in the artifact DAG. A separate implementation task DAG orders work within one change.

## Element References

Identify the owning artifact, the element path within its knowledge snapshot, and the reason for the reference:

```yaml
references:
  - artifact: tenant
    element: specifications/tenant-identity.md
    requires: tenant identifier format and lifecycle rules
```

For established knowledge, resolve this reference through the owner's root README to its current established version. Do not embed an old version directory in the reference.

During preparation, actors can use an upstream active change's proposed contract. Record that it is proposed and which active change supplies it. Do not present it as established knowledge.

## Established and Proposed Graphs

The established `docs/artifacts/dag.yaml` is generated from artifact root READMEs. Proposed edge additions and removals belong in `dependencies.yaml` inside the dependent artifact's active change.

The coordinator combines the established graph and active proposals for planning while preserving their status. Check for cycles, missing artifacts, and conflicts between proposed contracts. Detailed contracts remain in specifications.

## Preparation and Implementation Gates

Requirement, Specification, and Plan can prepare against proposed upstream contracts. A completed Plan can still be waiting for an external Implementation prerequisite.

Dependent Implementation waits until all required upstream changes establish their new versions. If an upstream dependency already provides the required established contract and has no required pending change, it does not create an additional wait.

Before dependent Implementation starts:

1. Resolve its upstream references to current established versions.
2. Compare the established contracts with those used during preparation.
3. Revise affected specifications, ADRs, and tasks if needed.
4. Repeat relevant phase self-checks and dependency validation.

Independent artifacts can progress in parallel. Within one artifact, implementation tasks can run concurrently when their task dependencies allow it.

## Implementation Task DAG

Each new or materially revised change plan declares its current tasks in `tasks/README.md`. Each listed task owns its stable `id` and `depends_on` list. Derive edges from these declarations, with arrows from prerequisite to dependent. The [task format](../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks) defines membership and validation rules.

A listed task can start only after its internal prerequisites satisfy their applicable DoD, the plan has explicit user approval, and required upstream artifact contracts are established. No internal prerequisite does not mean the task is authorized or externally unblocked. Tasks in one change can run concurrently when these conditions allow it. Integration and validation tasks express the joins needed after independent work.

Validate task paths, declarations, unique IDs, prerequisite resolution, and acyclicity during Plan self-checks. Invalid declarations prevent treating the plan as executable. Do not infer dependencies from prose, filenames, Git order, or checklist state. Legacy plans without a task list remain readable; their task graph is unavailable. Unlisted historical tasks do not enter the current graph.

Task graphs and artifact graphs record relationships, not live execution status. Keep evidence in task files and Git; do not introduce another DAG file, approval registry, or workflow database.

## Coordination State

The DAG records relationships, not live completion status. The coordinator also needs each artifact's active change, current phase, upstream completion status, and whether required contracts are proposed or established.

Keep proposed and established state distinct. When a change establishes its version, update the root README and refresh the established DAG consistently.

## Impact Analysis

During Requirement and Specification, inspect references to changed elements and identify affected artifacts. Retain valid knowledge, amend affected knowledge, remove obsolete knowledge, and add required work.

Before establishment, validate that referenced elements exist and required contracts remain consistent. A reference identifies a dependency; it does not by itself prove compatibility.

## Diagram Views

Generate Mermaid `flowchart TD` diagrams from the graph for reading. Draw arrows from upstream artifact to dependent artifact, and dashed arrows for proposed dependencies. Group element-level views by artifact to explain specific references without changing the execution DAG's node model.

The YAML index remains the machine-readable artifact graph. Derive task diagrams from the plan task list and task declarations. Include single and disconnected tasks. A reader must show diagnostics for invalid plans and must not present them as valid execution order. Show graph unavailable for legacy plans and no planned tasks for an explicit empty list. Task diagram arrows mean task prerequisites; phase sequence and external artifact gates have different meanings. Diagrams are derived views, not competing sources of truth.

## Flow participation and discovery

Follow the [system-flow format](../06-guidelines/system-flows.md) to connect named journeys with supporting elements. Reverse references identify candidate consumers for impact analysis. Review their contracts before deciding whether a change propagates. A shared element can support several flows without copying ownership.

Flow transitions describe behavior and can branch, join, or loop. They do not create artifact or task prerequisites. Participation alone does not require a participant to change, join a unit, or wait for another flow step. Keep proposed references distinct from established knowledge; existing upstream establishment gates remain authoritative.
