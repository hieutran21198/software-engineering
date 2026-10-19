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

- [x] claims.js parses claims in the records the contract allows and ignores the field elsewhere with a diagnostic.
- [x] A fixture test triggers each of the six diagnostic codes, and a valid fixture produces none.
- [x] Evidence sources resolve through the resolver of server/workflow.js; a missing heading is claim-evidence-missing.
- [x] diagnose() reports the claim diagnostics, so an operation whose post-image breaks a claim is refused.
- [x] validate-knowledge reports the codes; warnings do not change its exit status; on this repository it reports no new diagnostic.

## Evidence

Prerequisite: ADD 2.9.0 is established on main at 371e3ab (PR #39). The claim contract on main is byte-identical to the text used for this task.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Parse allowed records | `claimRecord` allows requirements, specifications, decisions, plans, tasks and unit briefs; a version record with claims gives `invalid-claim` and no claims; a flow record is excluded | Passed | test/claims.test.js "only allowed record types" |
| Six codes | Fixtures trigger `invalid-claim` (11 shape and status cases, a non-list), `claim-evidence-missing` (missing heading, unsafe path), `claim-evidence-conflict` (source of a failed check record), `claim-check-missing`, `claim-list-long` (11 claims) and `claim-unverified-at-version` (prepared 1.1.0; none once 1.1.0 is on the protected ref); a valid list of five claims gives none | Passed | test/claims.test.js "each diagnostic code", "a valid list" |
| Source resolver | Sources resolve with `safeKnowledgePath` and `evidenceDetail` of server/units-of-work.js, the resolver that workflow.js uses for evidence_records | Passed | server/claims.js `resolveSource` |
| diagnose() | `document.save` that removes a cited heading is refused with 422 and a new `claim-evidence-missing`; a save that keeps the headings applies. Negative control: with the claims line removed from diagnose() the refusal test fails | Passed | test/claims.test.js "diagnose refuses" |
| validate-knowledge | Fixture with an unchecked open decision: one warning, 0 errors; fixture with kind `guess`: one error. On this repository: 0 errors, one info diagnostic `retained-legacy-change`, unchanged | Passed | `node scripts/validate-knowledge.mjs ../..` |

Full suite: `npm test` 369 tests, 368 pass, 0 fail.
