---
source_change: change-evidence-review-context
delivery_tasks: change
---

# artifact-plane 1.12.0 — evidence-based change review and context handoff

This proposed compatible minor version corrects publication recognition, flow search order and worktree-specific observations. It adds a read-only selected-change review and bounded source-backed context through local Markdown/JSON exports, HTTP and MCP. The complete requirements, specifications and decisions retain merged flow readability behavior. Delivery tasks and validation evidence remain in their originating change.

- [Evidence requirements](requirements/evidence-correctness.md)
- [Review and context requirements](requirements/change-review-context.md)
- [Review contract](specifications/change-review.md)
- [Context packet contract](specifications/context-packets.md)
- [Shared service decision](decisions/009-derived-change-review-context.md)
- [Originating plan and evidence](../../changes/change-evidence-review-context/tasks/README.md)

## Publication boundary

Version 1.12.0 is proposed for team review. Passing checks and captured context do not establish publication or grant approval. The artifact root still declares 1.11.0. Establishment requires the required knowledge and implementation to land on main and the applicable scoped publication evidence. Historical snapshots and task evidence remain unchanged.
