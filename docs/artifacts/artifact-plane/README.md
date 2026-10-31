---
current_version: 1.30.0
depends_on: [artifact-driven]
---

# Artifact Plane

Artifact Plane is the local workbench for exploring and authoring ADD repositories, with optional local agent execution observation.

## Scope

Discover artifact knowledge and visualize artifact dependencies, knowledge references and maintained system flows. Create and maintain artifacts, changes, documents, dependencies, references, tasks, units, flows and versions through deterministic operations that write only inside docs/artifacts of a selected worktree on a non-protected branch. Retrieve source-backed context through local keyword, semantic and graph discovery, HTTP and stdio MCP. Inspect local worktrees and workflow evidence. Observe supported agent attempts with explicit or inferred task bindings and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

## Knowledge

This artifact uses the in-place layout. Working knowledge is in requirements, specifications and decisions; system flows are in specifications/flows. Start with:

- [Explorer requirements](requirements/explorer.md) and [explorer contract](specifications/explorer.md)
- [Authoring requirements](requirements/authoring-workbench.md), [workbench redesign requirements](requirements/workbench-redesign.md), [workbench contract](specifications/authoring-workbench.md) and [knowledge editing contract](specifications/knowledge-editing.md)
- [In-place layout reading](specifications/knowledge-layout-reading.md)
- [Change impact requirements](requirements/change-impact.md), [change impact service contract](specifications/change-impact.md) and [typed impact ledger decision](decisions/016-typed-impact-ledger.md)
- [Local server decision](decisions/001-local-server.md) and [derived workflow decision](decisions/002-derived-workflow.md)

Version records are in versions. Records 1.5.0 to 1.13.0 were converted from complete legacy snapshots; each one gives the Git command that finds its knowledge. Change records and retained delivery plans are in changes.
