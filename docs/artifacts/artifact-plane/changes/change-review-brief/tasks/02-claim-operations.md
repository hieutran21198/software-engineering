---
id: claim-operations
depends_on: [claims-reader]
---

# Claim operations

## Scope and ownership

Implementer in a separate worktree. Files: apps/artifact-plane/server/knowledge-operations.js (claim.record, claim.verify, the channel option of createKnowledgeService), server/http.js (channel person), test/knowledge-operations.test.js, test/knowledge-interfaces.test.js. server/flow-mcp.js keeps the default channel.

## Governing knowledge

specifications/review-brief.md, Knowledge operations; specifications/knowledge-editing.md, Operations and MCP interface; ADD specifications/claim-records.md, Writing and verification; requirements/review-brief.md, B7 and P3.

## Prerequisites

Task claims-reader meets its DoD. Explicit plan approval. ADD 2.9.0 is established on main.

## Definition of Done

- [ ] claim.record writes a claim and its optional detail subsection; a round-trip test shows that only the claim list and that subsection change.
- [ ] claim.record refuses status verified and any verifiedBy input with status 422.
- [ ] claim.verify refuses an empty observed result with status 422; outcome holds sets verified and verified_by; outcome fails sets refuted.
- [ ] Through the HTTP route verified_by is person; through MCP apply_knowledge_operation it is agent; a request with a channel field is refused with status 400.
- [ ] Dry run, undo and digest checks work for both operations as for evidence.record.

## Evidence

Implementation has not started.
