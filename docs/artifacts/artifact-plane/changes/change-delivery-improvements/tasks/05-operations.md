---
id: operations
depends_on: [record-checks]
---

# Operations

## Scope and ownership

Implementer, `apps/artifact-plane/server/knowledge-operations.js` and its routes. Add `tier` and `compatibility` to change.start, `covers` to task.add and task.update, the task template without Prerequisites and approval text, evidence.record without a written default source, the composite change.scaffold with one undo entry, and version.prepare with the default level from the plan, the protected base and the refusal of a number that is not greater.

## Governing knowledge

specifications/delivery-support.md (Knowledge operations); specifications/knowledge-editing.md; requirements/delivery-improvements.md, PI3, PI4, PA2 and PA3.

## Prerequisites

Task record-checks.

## Definition of Done

- [ ] change.scaffold for a small change writes at most 7 knowledge files that pass the shared checks; for a medium change it writes the existing set with a unit brief; one undo restores the pre-images.
- [ ] version.prepare on a fixture where a parallel change took the next minor number on the protected branch computes the following number and refuses a smaller or equal one.
- [ ] HTTP and MCP write tools expose the new inputs; the channel rule is unchanged.
- [ ] `npm test` passes, and existing operation tests pass without edits.

## Evidence

Not recorded.
