---
id: layout-reader
depends_on: []
evidence_records:
  - id: dod
    method: npm test with in-place, mixed and transition fixtures recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/09-layout-records.md#evidence
---

# Detect the layout and read records

## Scope and ownership

Own src/model.js (parseArtifact, buildSnapshot), server/reader.js (scanRepository), test/fixtures.js, test/model.test.js and test/reader.test.js. Add fixtures: inPlaceFixture (two artifacts with root knowledge, a change record with tasks, a version record), mixedFixture (one legacy and one in-place artifact) and transitionFixture (main legacy, branch in-place).

## Governing knowledge

L1, M1; specifications/knowledge-layout-reading.md; the proposed ADD contract specifications/knowledge-layout.md.

## Prerequisites

Explicit approval of this plan and establishment of the ADD in-place contract, rechecked on protected refs.

## Definition of Done

- [x] parseArtifact returns layout: in-place or legacy from the presence of root knowledge directories; in-place identity comes from front matter only and Markdown declarations are ignored; a missing or malformed identity record yields invalid-identity without prose fallback.
- [x] buildSnapshot discovers in-place elements with source working and logical identity `<artifact>:<path>`, derives open changes from version records, ignores dag.yaml and dependencies.yaml for in-place artifacts with an informational diagnostic, and reports knowledge directories under an in-place version record as a diagnostic.
- [x] scanRepository loads root knowledge, change records, tasks and version records for in-place artifacts without loading legacy version directories twice; mixed repositories load both layouts.
- [x] Existing legacy tests pass unchanged; new tests cover the three fixtures, identity record errors and open-change derivation.

## Evidence

Executed on 16 October 2026 after explicit approval of the coordinated-PR option; the ADD contract is proposed on the same branch and is rechecked at integration.

- src/model.js: detectLayout, parseArtifact(id, markdown, ds, layout) with a front-matter-only identity path (invalid-identity, no prose fallback), and an in-place buildSnapshot path: working elements with source working, logicalId `<artifact>:<path>` and baseline state; change records with layout and version; open change derived from version records; retained-legacy-change, legacy-proposal-ignored and legacy-index-ignored as severity info; version-knowledge-copy and missing-version diagnostics; established and proposed edges and versions from options.baselines. References of in-place consumers come from front matter only; in-place owners resolve in the working tree and selectors do not affect resolution. src/elements.js labels the working source "Working knowledge".
- server/reader.js: per-artifact detection from root knowledge directories; in-place artifacts load root knowledge and do not load versions/<current_version>/ knowledge; mixed repositories load both. server/knowledge-baseline.js reads the protected refs (rev-parse, one ls-tree per ref, identity record blobs) and classifies working files as added, modified or unchanged and baseline files as removed, for in-place or legacy baselines.
- Tests: test/model.test.js adds 7 in-place, mixed and baseline cases; test/reader.test.js adds 4 Git cases (in-place, transition with main legacy and branch in-place, disagreeing and missing refs, mixed) and asserts unchanged repository bytes. Fixtures inPlaceFixture, mixedFixture, transitionFixture and transitionRepository are in test/fixtures.js.
- `npm test`: 279 tests, 277 pass, 1 skipped; the only failure is test/code-highlight.test.js, which fails the same way on main and is unrelated. Existing legacy tests pass unchanged.
- Scan of this repository after migration: three in-place artifacts; local main still holds the legacy layout (ADD 2.2.0, Plane 1.11.0, story 1.1.0) and serves as the transition baseline; 0 error diagnostics; 3 informational retained-legacy-change diagnostics.
