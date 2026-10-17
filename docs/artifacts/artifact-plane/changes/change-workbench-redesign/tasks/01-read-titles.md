---
id: read-titles
depends_on: []
evidence_records: []
---

# Read titles

## Scope and ownership

Own the overview title fields in apps/artifact-plane/src/model.js, server/repository-query.js (change summaries) and their Node tests.

## Governing knowledge

specifications/authoring-workbench.md, section Read data additions.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [ ] Each artifact element in the overview response has `title`: the first level-1 heading of its body, or the file name without `.md`.
- [ ] Each workflow change has `title`: the first level-1 heading of its change README, or null.
- [ ] No other response field changes; the existing Node tests pass without edits, and new tests cover a heading, a missing heading and a missing README.

## Evidence
