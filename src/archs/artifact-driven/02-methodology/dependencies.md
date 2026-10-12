# Dependencies

## Two Levels

The artifact DAG determines execution order. Detailed element references explain which knowledge creates each dependency.

| Level | Example | Location |
| --- | --- | --- |
| Artifact | Authentication depends on tenant. | Established dependencies in artifact root READMEs, indexed in `docs/artifacts/dag.yaml`. |
| Element | Login behavior uses tenant identity rules. | References in the consuming requirements, specifications, ADRs, or tasks. |

Elements, changes, and versions do not become separate execution DAG nodes.

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

## Coordination State

The DAG records relationships, not live completion status. The coordinator also needs each artifact's active change, current phase, upstream completion status, and whether required contracts are proposed or established.

Keep proposed and established state distinct. When a change establishes its version, update the root README and refresh the established DAG consistently.

## Impact Analysis

During Requirement and Specification, inspect references to changed elements and identify affected artifacts. Retain valid knowledge, amend affected knowledge, remove obsolete knowledge, and add required work.

Before establishment, validate that referenced elements exist and required contracts remain consistent. A reference identifies a dependency; it does not by itself prove compatibility.

## Diagram Views

Generate Mermaid `flowchart TD` diagrams from the graph for reading. Draw arrows from upstream artifact to dependent artifact, and dashed arrows for proposed dependencies. Group element-level views by artifact to explain specific references without changing the execution DAG's node model.

The YAML index remains the machine-readable graph. Diagrams are derived views, not competing sources of truth.
