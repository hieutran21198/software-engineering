---
id: layout-reader
depends_on: []
evidence_records: []
---

# Detect the layout and read records

## Scope and ownership

Own src/model.js (parseArtifact, buildSnapshot), server/reader.js (scanRepository), test/fixtures.js, test/model.test.js and test/reader.test.js. Add fixtures: inPlaceFixture (two artifacts with root knowledge, a change record with tasks, a version record), mixedFixture (one legacy and one in-place artifact) and transitionFixture (main legacy, branch in-place).

## Governing knowledge

L1, M1; specifications/knowledge-layout-reading.md; the proposed ADD contract specifications/knowledge-layout.md.

## Prerequisites

Explicit approval of this plan and establishment of the ADD in-place contract, rechecked on protected refs.

## Definition of Done

- [ ] parseArtifact returns layout: in-place or legacy from the presence of root knowledge directories; in-place identity comes from front matter only and Markdown declarations are ignored; a missing or malformed identity record yields invalid-identity without prose fallback.
- [ ] buildSnapshot discovers in-place elements with source working and logical identity `<artifact>:<path>`, derives open changes from version records, ignores dag.yaml and dependencies.yaml for in-place artifacts with an informational diagnostic, and reports knowledge directories under an in-place version record as a diagnostic.
- [ ] scanRepository loads root knowledge, change records, tasks and version records for in-place artifacts without loading legacy version directories twice; mixed repositories load both layouts.
- [ ] Existing legacy tests pass unchanged; new tests cover the three fixtures, identity record errors and open-change derivation.

## Evidence

Implementation has not started. Record executed commands, outcomes, sources and limitations here after approval.
