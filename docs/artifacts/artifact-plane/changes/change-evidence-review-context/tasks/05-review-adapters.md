---
id: review-adapters
depends_on: [review-context-service]
---

# Expose shared review and context through HTTP and MCP

## Scope and ownership

Own HTTP review routing, additive MCP tool registration/configuration plumbing, adapter tests and implementation-facing README examples. The coordinator handles artifact knowledge. Preserve other edits and all existing flow tool behavior.

Governing knowledge: specifications/change-review.md query/source boundaries and context-packets.md adapters. Consume unit context-handoff and integration criteria.

## Definition of Done

- [x] POST /api/review/query and get_change_review/get_change_context/read_change_context_source use the same service, envelopes, validation and source cursor semantics.
- [x] Configured root/registered-worktree selection, local host/origin/request-size checks and sanitized failures reject foreign or arbitrary reads; stdout remains protocol-only.
- [x] Real HTTP and stdio MCP fixtures prove equivalent facts/omissions, all source pages and stale-revision rejection; existing four flow tools remain callable and compatible.
- [x] Document explicit root setup, packet capture/coverage/approval limits and bounded retrieval; no hosted calls, model download or inspected-repository writes occur.
- [x] Focused adapter/read-only checks pass and coordinator receives commands/results.

## Evidence

Implemented in c0b08fb. The focused adapter, service, formatter and repository-observer suites passed 29 tests with no skips. Actual HTTP and stdio MCP return equivalent envelopes and omissions, reconstruct all source pages, reject stale cursors and enforce configured roots, registered worktrees and local HTTP guards. Review-only registered sources invalidate repeated dirty edits. Existing four flow tools remain callable; stdout stays protocol-only. README records explicit setup and limits.
