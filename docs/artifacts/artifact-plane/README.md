---
current_version: 1.13.0
depends_on: [artifact-driven]
---

# Artifact Plane

Artifact Plane provides read-only knowledge exploration of local ADD repositories and optional local Codex execution observation.

## Scope

Discover artifact knowledge and visualize artifact dependencies, knowledge references and maintained system flows. Retrieve source-backed context through local keyword, semantic and graph discovery, HTTP and stdio MCP. Inspect local worktrees and workflow evidence. Observe explicitly bound Codex attempts and retain their graph context outside repositories. Implementation belongs in apps/artifact-plane.

## Ownership

This artifact owns the repository explorer and its input interpretation rules.

## Knowledge

This artifact uses the in-place layout. Working knowledge is in requirements, specifications and decisions; system flows are in specifications/flows. Start with:

- [Explorer requirements](requirements/explorer.md) and [explorer contract](specifications/explorer.md)
- [In-place layout reading](specifications/knowledge-layout-reading.md)
- [Local server decision](decisions/001-local-server.md) and [derived workflow decision](decisions/002-derived-workflow.md)

Version records are in versions; 1.5.0 to 1.13.0 are complete legacy snapshots and stay unchanged. Change records and retained delivery plans are in changes.
