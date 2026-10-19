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

- [x] claim.record writes a claim and its optional detail subsection; a round-trip test shows that only the claim list and that subsection change.
- [x] claim.record refuses status verified and any verifiedBy input with status 422.
- [x] claim.verify refuses an empty observed result with status 422; outcome holds sets verified and verified_by; outcome fails sets refuted.
- [x] Through the HTTP route verified_by is person; through MCP apply_knowledge_operation it is agent; a request with a channel field is refused with status 400.
- [x] Dry run, undo and digest checks work for both operations as for evidence.record.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Record and round trip | claim.record on a task writes the claim and `### <id>` under Evidence; the fingerprint diff shows one changed file whose only removed line is the "Implementation has not started." placeholder. On a specification without detail it writes only the claim list; options, `rejected`, `risk_if_wrong` and `about` are written as YAML | Passed | test/knowledge-operations.test.js "B7: claim.record and claim.verify" |
| Refusals | status verified, verifiedBy and verified_by inputs give 422; `rejected` on a risk claim, an unknown kind and an identity record path give 422; an unresolved evidence source is refused by the claim diagnostics of the post-image | Passed | Same test |
| Verify | Blank observed gives 422 (field observed); outcome maybe gives 422; an unknown id gives 404; holds sets verified, appends `#<id>-check` and sets `verified_by`; fails sets refuted, removes `verified_by` and writes `#<id>-check-2`; validate-knowledge reports no error after both | Passed | Same test |
| Channel | HTTP `/api/knowledge/edit` records `verified_by: person`; MCP `apply_knowledge_operation` records `agent`; a `channel` field is refused with 400 on HTTP and by the strict MCP input schema; `createKnowledgeService({channel: 'admin'})` throws | Passed | test/knowledge-interfaces.test.js "B7" |
| Dry run, undo, digests | Every applied call goes through preview and apply with digests (test operator); undo restores the verified text byte for byte; a dry run writes nothing; a wrong digest gives 409 digest-mismatch | Passed | test/knowledge-operations.test.js "B7" |

Interpretation recorded for review: `supersededBy` in claim.record sets status superseded and must name another claim of the file; it cannot be combined with a status input. The ADD status table requires `superseded_by` exactly for status superseded.

Full suite: `npm test` 371 tests, 370 pass, 0 fail, 1 skipped (the existing skip).
