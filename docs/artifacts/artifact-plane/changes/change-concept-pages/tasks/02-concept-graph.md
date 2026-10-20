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

- [ ] A fixture with a model that no flow uses has its model node, the declares edge to an element node with the document title, and `missingSources`; Impact resolves `{model}` for it in both forms (CP10).
- [ ] The legacy fixture whose change copies the declaring document gives one node per logical id, and its version-source participant links to that node (claim one-node-per-concept).
- [ ] A model origin with two models in one declaring document makes only the origin model and its dependents direct (claim model-origin-is-entity).
- [ ] Model Impact items have their title (CPA7, server part).
- [ ] `missing-model-source` has `model` and `file`; a historical declaration gives no concept diagnostic (CP6).
- [ ] The `concepts` operation returns the fields of the contract for each fixture model, sorted, with `declaration` new, changed, removed and null on fixtures with a branch, and null on the protected branch.
- [ ] The `concept` operation answers by identity, by entity and by exact title; it gives `concept-unknown` and `concept-ambiguous` with severity info; `flows`, `implementation`, `branchChanged`, `changes` and `diagnostics` match the contract (CP2, CP5).
- [ ] On this repository, the implementation counts are Version 7 and 4, Repository snapshot 10 and 7, Artifact 2 and 0, Change 5 and 4 (claim inferred-code-rule).
- [ ] The CPA13 test compares the Impact entities of a fixture concept and its describing documents with the concept facts and finds an entity that the facts do not list; the same comparison on Version and Repository snapshot of this repository is recorded (CP19, claim affect-action-ships).
- [ ] The revision of this repository is compared before and after the change and recorded; check_records reports no new error on this repository.
- [ ] `npm test` passes.

## Evidence
