---
id: read-titles
depends_on: []
evidence_records:
  - id: title-tests
    method: node --test test/read-titles.test.js and npm test
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/01-read-titles.md#title-tests
---

# Read titles

## Scope and ownership

Own the overview title fields in apps/artifact-plane/src/model.js, server/repository-query.js (change summaries) and their Node tests.

## Governing knowledge

specifications/authoring-workbench.md, section Read data additions.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] Each artifact element in the overview response has `title`: the first level-1 heading of its body, or the file name without `.md`.
- [x] Each workflow change has `title`: the first level-1 heading of its change README, or null.
- [x] No other response field changes; the existing Node tests pass without edits, and new tests cover a heading, a missing heading and a missing README.

## Evidence

### title-tests

Checked in apps/artifact-plane on branch claude/plane-workbench-redesign. `node --test test/read-titles.test.js`: 3 of 3 passed. They cover a document with a first heading, a document without one (file name), a heading inside a code fence (ignored), a change README with a heading, a change without README (null), and a scoped change reply that keeps the overview title. `npm test`: 337 tests, 336 passed, 1 skipped, 0 failed, with no edits to the existing tests. On this repository the overview returns titles such as "Bounded agent context retrieval" for elements and "Redesign the authoring workbench" for the open change. Implementation: src/model.js (headingTitle, documentTitle), server/repository-query.js (change summaries), src/reload.js (mergeChange keeps the title).
