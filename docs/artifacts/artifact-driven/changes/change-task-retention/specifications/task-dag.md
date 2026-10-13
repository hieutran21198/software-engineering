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

## External gates and lifecycle

The artifact DAG retains artifact nodes. Required upstream establishment gates the change's implementation independently of internal task readiness. Detailed external references and reasons remain in specifications and task prerequisites. Do not put cross-artifact task IDs in depends_on. A task without internal dependencies can still have an unmet external gate or lack user approval.

Retain stable metadata and plan membership with the complete version snapshot. A new change copies the full snapshot, then replaces the tasks list with its own current work. Historical tasks retain evidence but do not enter that graph by default. Reusing a historical task requires explicit listing and current DoD verification when behavior or prerequisites changed.

## Delivery and impact

Update the canonical foundation definitions/model, dependency methodology, writing/getting-started guidance, and applicable coordinator/TL/implementer role instructions. Explain that the artifact DAG node restriction applies to that graph, not the local task graph. Mirror affected files into src/archs/artifact-driven. Required utility skills remain intact. Existing adoption and publishing behavior stays governed by specifications/delivery.md.

Artifact Plane consumes this proposed contract from artifact-driven/change-implementation-task-dag, element specifications/task-dag.md. ADD does not depend on Artifact Plane. No ADD artifact edge proposal is required.

## Specification self-check

D1–D7 have precise membership, format, failure, lifecycle, and delivery rules. KISS uses task metadata and existing plan files, with no competing DAG file. STE keeps legacy unavailability distinct from invalid current declarations and preserves external gates. No blocker remains for Plan.

## Applicability in this change

For future versions, specifications/task-retention.md replaces requirements to copy or inherit tasks and version-specific task evidence. Existing delivered records remain unchanged.
