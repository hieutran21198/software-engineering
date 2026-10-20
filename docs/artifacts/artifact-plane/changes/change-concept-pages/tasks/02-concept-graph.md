---
id: concept-graph
depends_on: []
covers:
  - element: requirements/concept-pages.md
    ids: [CP2, CP5, CP6, CP10, CP19, CPA7, CPA13]
---

# Concept graph

## Scope and ownership

Implementer. `apps/artifact-plane/server/flow-model.js` (one model node per logical id, the declares edge, missingSources, the diagnostic fields), `server/flow-reader.js` (baselines in the record), `server/impact.js` (model titles, model origins), a new `server/concepts.js` (the concepts and concept operations), `server/flow-index.js` (operation validation and dispatch) and the tests `test/model-explanations.test.js`, `test/impact.test.js`, a new `test/concepts.test.js` and their fixtures. No client code.

## Governing knowledge

specifications/concept-pages.md: Facts, Graph, Impact, Concept operations; claims one-node-per-concept, model-origin-is-entity, inferred-code-rule, affect-action-ships; specifications/change-impact.md: origins.

## Definition of Done

- [x] A fixture with a model that no flow uses has its model node, the declares edge to an element node with the document title, and `missingSources`; Impact resolves `{model}` for it in both forms (CP10).
- [x] The legacy fixture whose change copies the declaring document gives one node per logical id, and its version-source participant links to that node (claim one-node-per-concept).
- [x] A model origin with two models in one declaring document makes only the origin model and its dependents direct (claim model-origin-is-entity).
- [x] Model Impact items have their title (CPA7, server part).
- [x] `missing-model-source` has `model` and `file`; a historical declaration gives no concept diagnostic (CP6).
- [x] The `concepts` operation returns the fields of the contract for each fixture model, sorted, with `declaration` new, changed, removed and null on fixtures with a branch, and null on the protected branch.
- [x] The `concept` operation answers by identity, by entity and by exact title; it gives `concept-unknown` and `concept-ambiguous` with severity info; `flows`, `implementation`, `branchChanged`, `changes` and `diagnostics` match the contract (CP2, CP5).
- [x] On this repository, the implementation counts are Version 7 and 4, Repository snapshot 10 and 7, Artifact 2 and 0, Change 5 and 4 (claim inferred-code-rule).
- [x] The CPA13 test compares the Impact entities of a fixture concept and its describing documents with the concept facts and finds an entity that the facts do not list; the same comparison on Version and Repository snapshot of this repository is recorded (CP19, claim affect-action-ships).
- [x] The revision of this repository is compared before and after the change and recorded; check_records reports no new error on this repository.
- [x] `npm test` passes.

## Evidence

Code commit: 6989e64. Repository checks ran on a clone of 35b0252 with a local `main` at 0eecce1 (branch not protected), with the 1.24.0 server of 35b0252 and the server of 6989e64.

- `node --test test/concepts.test.js` "CP10, CP6": the unused model a:audit has its model node, `missingSources` [specifications/audit.md], one declares edge to the element node titled Contract; Impact resolves `a:audit` and `model:a:audit` with no unresolved origin. Passed, 6989e64.
- `node --test test/model-explanations.test.js` "claim one-node-per-concept": the legacy change that copies domain-model.md gives one node tenant:member (source change:change-next); the participants of the version-source flows login and report link to it. Passed, 6989e64.
- `node --test test/concepts.test.js` "claim model-origin-is-entity": the origin `{model: 'a:identity'}` makes only flow:a:login direct; no other model of contract.md is affected. Passed, 6989e64.
- `node --test test/concepts.test.js` "CPA7": the Impact model items have the titles Audit, Identity and Session. Passed, 6989e64.
- `node --test test/concepts.test.js` "CP10, CP6": `missing-model-source` has `model` a:audit and `file`; the historical declaration h version 1.0.0 gives no diagnostic (the 1.24.0 server gives one for it). Passed, 6989e64.
- `node --test test/concepts.test.js` "the concepts operation": the items have the contract fields, sorted by artifact and title; `declaration` is null on main, and changed, new and removed on branch feature, uncommitted and committed; the legacy artifact gives null. Passed, 6989e64.
- `node --test test/concepts.test.js` "CP2, CP5": the concept operation answers by identity, entity and case-insensitive title; it gives `concept-unknown` and `concept-ambiguous` with severity info, outside the graph diagnostics; `flows`, `implementation` (one group for two steps), `branchChanged`, `changes` and `diagnostics` match the contract. Passed, 6989e64.
- Read-only script on this repository (conceptAnswer, knowledge planning): implementation counts Version 7 and 4, Repository snapshot 10 and 7, Artifact 2 and 0, Change 5 and 4; equal to the observed facts. The concepts operation takes 18 ms. 6989e64.
- `node --test test/concepts.test.js` "CPA13, CP19": Impact of a:identity and identity.md holds model:a:session, which the concept facts do not list. Passed, 6989e64.
- Read-only script on this repository, Impact depth 2 with the concept and its describing documents: Version adds 5 entities that the facts do not list (model Change, model Artifact, flows change-delivery, unit-validation, version-publication); Repository snapshot adds none (direct and transitive hold 1 listed flow; potential holds 10 lexical items). 6989e64.
- Read-only script on this repository, readFlowRepository with the 1.24.0 and the 6989e64 servers: the revision is equal for planning and established (ba86a628…439fc) and for all (010a84b0…b2aa8); model nodes and diagnostics are equal. 6989e64.
- `node scripts/validate-knowledge.mjs --repository ../..` with the 35b0252 and the 6989e64 validators: ok true, 0 errors, 13 diagnostics each, no new diagnostic; check_records on this worktree: ok true, 0 errors. 6989e64.
- `npm test`: 487 tests, 486 passed, 0 failed, 1 skipped. 6989e64.
