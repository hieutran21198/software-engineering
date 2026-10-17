---
source_change: change-authoring-workbench
---

# artifact-plane 1.16.0 — Author ADD knowledge in Artifact Plane

Compatible minor version. Knowledge editing is additive; the read endpoints, MCP read tools, packet schemas and legacy reading are unchanged.

Artifact Plane becomes an ADD workbench. One navigation tree and content pages replace the three view switchers. A deterministic operation service creates and edits artifacts, changes, documents, references, tasks, evidence, units, flows and version records inside docs/artifacts of a worktree with a non-protected branch, validates every result with the readers, writes atomically with digests and undo, and commits knowledge paths. POST /api/knowledge/edit and /api/knowledge/git and opt-in MCP write tools share the service.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-authoring-workbench/tasks/README.md).
