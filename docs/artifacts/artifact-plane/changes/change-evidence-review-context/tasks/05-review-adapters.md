---
id: review-adapters
depends_on: [review-context-service]
---

# Expose shared review and context through HTTP and MCP

## Scope and ownership

Own HTTP review routing, additive MCP tool registration/configuration plumbing, adapter tests and implementation-facing README examples. The coordinator handles artifact knowledge. Preserve other edits and all existing flow tool behavior.

Governing knowledge: specifications/change-review.md query/source boundaries and context-packets.md adapters. Consume unit context-handoff and integration criteria.

## Definition of Done

- [ ] POST /api/review/query and get_change_review/get_change_context/read_change_context_source use the same service, envelopes, validation and source cursor semantics.
- [ ] Configured root/registered-worktree selection, local host/origin/request-size checks and sanitized failures reject foreign or arbitrary reads; stdout remains protocol-only.
- [ ] Real HTTP and stdio MCP fixtures prove equivalent facts/omissions, all source pages and stale-revision rejection; existing four flow tools remain callable and compatible.
- [ ] Document explicit root setup, packet capture/coverage/approval limits and bounded retrieval; no hosted calls, model download or inspected-repository writes occur.
- [ ] Focused adapter/read-only checks pass and coordinator receives commands/results.

## Evidence

Implementation has not started. Existing flow adapter checks do not prove additive review behavior.
