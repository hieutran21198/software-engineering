# Implementation task DAG contract

Governs D1–D7 in requirements/task-dag.md. This extends the copied knowledge and delivery contracts. The task graph is distinct from the artifact DAG and runtime graphs.

## Plan membership

New and materially revised plans declare current implementation task paths in YAML front matter in tasks/README.md:

```yaml
---
tasks:
  - 04-task-contract.md
  - 05-delivery-checks.md
---
```

Paths are unique strings relative to tasks/, use forward slashes, and end in .md. README.md cannot be a task. Absolute paths, dot segments, backslashes, NUL, and paths outside tasks/ are invalid. Nested task paths are allowed. Listed paths must identify readable Markdown task files within the change. Unlisted files remain historical/context knowledge and are excluded. An explicit empty list is a valid empty plan. Missing tasks front matter means graph unavailable for a legacy plan; it does not invalidate historical knowledge. A tasks value with the wrong type is invalid.

## Task declarations

Each listed task has YAML front matter with id and depends_on:

```yaml
---
id: delivery-checks
depends_on: [task-contract]
---
```

An ID is a nonempty string matching [a-z0-9][a-z0-9-]* and is unique among this plan's tasks. It remains stable when the file is renamed. depends_on is a required list of unique task ID strings; [] declares no internal prerequisite. Each dependency resolves to a listed task in this same change. Self-dependencies, missing IDs, malformed metadata, duplicate IDs, duplicate prerequisite entries, and cycles invalidate the graph. Unknown metadata keys do not define edges. YAML duplicate mapping keys are invalid. No prose or filename fallback creates dependencies.

A graph edge goes from prerequisite to dependent task. The graph must be acyclic. Validate plan membership before resolving edges, then check cycles. Invalid plans are not executable. Human/agent Plan self-checks enforce this contract; the visualizer provides diagnostics and does not authorize execution. This change does not add a standalone runner or CLI validator.

The table lists the conditions of Plan membership and Task declarations and their outcomes. The text above stays the contract; invalid plans are not executable.

| Condition | Outcome |
| --- | --- |
| A listed path is a unique string relative to tasks/, uses forward slashes, ends in .md and identifies a readable Markdown task file within the change; nested paths are allowed | Member of the plan |
| A file is in tasks/ but not listed | Excluded; remains historical or context knowledge |
| README.md is listed | Cannot be a task |
| A listed path is absolute, has dot segments, backslashes or NUL, or is outside tasks/ | Invalid |
| tasks is an explicit empty list | Valid empty plan |
| tasks front matter is missing | Graph unavailable for a legacy plan; historical knowledge stays valid |
| tasks has the wrong type | Invalid |
| depends_on is [] | No internal prerequisite |
| Self-dependency, missing IDs, malformed metadata, duplicate IDs, duplicate prerequisite entries or a cycle | Graph invalid |
| YAML duplicate mapping keys | Invalid |
| Unknown metadata keys, prose or filenames | No edge |

Source: artifact-driven:specifications/task-dag.md, Plan membership paragraph 2 and Task declarations paragraph 2; derived one row per stated condition and outcome; current snapshot.

## External gates and lifecycle

The artifact DAG retains artifact nodes. Required upstream establishment gates the change's implementation independently of internal task readiness. Detailed external references and reasons remain in specifications and task prerequisites. Do not put cross-artifact task IDs in depends_on. A task without internal dependencies can still have an unmet external gate or lack user approval.

Retain stable metadata, plan membership, and evidence in the originating change. New versions contain no tasks and declare delivery_tasks: change alongside source_change. A new change copies version knowledge excluding legacy task copies and creates a fresh plan. Prior delivery work is not copied or overwritten. Legacy version-owned task records remain readable. Reused behavior requires current tasks and DoD checks when behavior or prerequisites changed. See specifications/task-retention.md for evidence publication.

## Delivery and impact

Update the canonical foundation definitions/model, dependency methodology, writing/getting-started guidance, and applicable coordinator/TL/implementer role instructions. Explain that the artifact DAG node restriction applies to that graph, not the local task graph. Mirror affected files into src/archs/artifact-driven. Required utility skills remain intact. Existing adoption and publishing behavior stays governed by specifications/delivery.md.

Artifact Plane consumes the existing task format and retained-delivery contract in specifications/task-retention.md. ADD does not depend on Artifact Plane. No ADD artifact edge proposal is required.

## Specification self-check

D1–D7 have precise membership, format, failure, lifecycle, and delivery rules. KISS uses task metadata and existing plan files, with no competing DAG file. STE keeps legacy unavailability distinct from invalid current declarations and preserves external gates. No blocker remains for Plan.
