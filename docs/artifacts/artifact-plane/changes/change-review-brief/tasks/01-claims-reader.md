---
id: claims-reader
depends_on: []
---

# Claims reader

## Scope and ownership

Implementer in a separate worktree. Files: apps/artifact-plane/server/claims.js (new), server/knowledge-operations.js (diagnose()), scripts/validate-knowledge.mjs, test/claims.test.js (new) and fixtures.

## Governing knowledge

specifications/review-brief.md, Claim reader and diagnostics; ADD specifications/claim-records.md, Where claims appear, Fields, Status rules and Diagnostics; requirements/review-brief.md, B6.

## Prerequisites

Explicit plan approval. ADD 2.9.0 is established on main; recheck the claim contract against the established text first.

## Definition of Done

- [ ] claims.js parses claims in the records the contract allows and ignores the field elsewhere with a diagnostic.
- [ ] A fixture test triggers each of the six diagnostic codes, and a valid fixture produces none.
- [ ] Evidence sources resolve through the resolver of server/workflow.js; a missing heading is claim-evidence-missing.
- [ ] diagnose() reports the claim diagnostics, so an operation whose post-image breaks a claim is refused.
- [ ] validate-knowledge reports the codes; warnings do not change its exit status; on this repository it reports no new diagnostic.

## Evidence

Implementation has not started.
