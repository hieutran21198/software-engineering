---
id: model-explanations
depends_on: [layout-navigation]
evidence_records:
  - id: dod
    method: Unit, adapter and browser checks recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/04-model-explanations.md#evidence
---

# Explain dependencies and model interactions

## Scope and ownership

Own model/flow parsing and indexing, src/model.js, graph edge inspector, Flows.jsx, flow-canvas.js and focused tests. Coordinator owns pilot knowledge and source evidence.

## Governing knowledge

P4 and model-explanations P1-P6; specifications/model-explanations.md; specifications/domain-model.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Dependency selection shows supplier/consumer direction, recorded reasons, selector/status and exact sources; missing reasons remain explicit.
- [x] Named models group by owner; selected steps expose actions/outcomes and branch/loop context with source navigation and known participation.
- [x] Tests cover duplicate/missing models, unsafe sources, self interactions, legacy fallback, shared model identity across flows, unresolved reasons and parallel edge statuses.
- [x] HTTP/MCP graph/detail/impact parity and invalidation preserve project/worktree/snapshot isolation. Browser checks cover keyboard focus, source return and desktop/narrow layouts.
- [x] Record fresh delivery evidence under this change. Do not mark old model-explanations tasks or its unit complete using a different source_change.

## Evidence

Implemented on 16 October 2026 in a separate worktree by an implementer session (branch plane-model-explanations from d6ac2d7) and integrated by cherry-pick as "feat(artifact-plane): explain dependencies and model interactions". Files: server/flow-model.js, server/flow-index.js, src/model.js, src/canvas.js, src/main.jsx, src/Flows.jsx, src/style.css (new classes only), test/model.test.js, test/flow-adapters.test.js, test/model-explanations.test.js and test/browser/model-explanations.spec.js.

- Dependency explanations: each snapshot edge carries `declaration` and `explanations`. Explanations come only from the consumer's references to that supplier, in the consumer source that matches the edge status: version, active change or working tree. Each one has the consuming and supplying elements, the reason, the selector, the resolution state and the source file, without duplicates. The inspector shows the supplier-to-consumer direction, status and declaration source, and each reason or "Reason not documented". A transitive selection shows its path with each direct edge. Parallel edges with other statuses keep distinct IDs and accessible labels. Explanations open by pointer, by keyboard Enter on an edge and from the Dependencies list. Back to dependency returns from the consuming source.
- Named models: parseModels reads `models` in specification front matter and reports invalid-model, unsafe-model-source, missing-model-source and duplicate-model without picking a duplicate. Flow participants and step interactions form a separate layer; invalid records give diagnostics and leave the legacy flow valid. Participants resolve like knowledge support: working tree for in-place owners, the flow snapshot for the same owner, the current version for others, the named change for proposed. Unresolved participants stay named missing nodes.
- The graph adds participates, interaction (with flow, step, action, outcome, supports, bases, resolved) and describes edges. Models are shared across flows by concrete identity. Impact traverses models, and detail returns participants, models, known flows, missing sources and a coverage note. The UI groups model cards by owner, steps through interactions with Next, Loop and Back from transitions, reads model sources and switches to known flows.
- Tests: test/model-explanations.test.js (5) covers duplicate, missing and unsafe models, self interactions, legacy fallback, proposed and in-place selection, shared model identity, unresolved reasons, parallel edge statuses and impact through models. test/flow-adapters.test.js adds HTTP and MCP parity for search, detail and impact, invalidation after a model edit, and worktree isolation. test/browser/model-explanations.spec.js covers keyboard and pointer explanation, source return, model cards, step and loop navigation, known-flow switching and model source reading, without horizontal overflow at 1440 and 390 pixels.
- Integrated results: `npm test` reports 308 tests, 307 pass, 1 skipped, 0 failures. `npm run build` passes. The full `npm run test:browser` on port 4311 with the Nix Chromium passed 76 of 77 twice. Each run had one different failure (search-usability.spec.js:17, then units-of-work.spec.js:35). Each of these passed every isolated rerun (3 of 3 and 4 of 4), and the failure snapshot showed loading in progress, so they are load-timing flakiness. Coverage is labeled "Known participation in recorded flows only".
