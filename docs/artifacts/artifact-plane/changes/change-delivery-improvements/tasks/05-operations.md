---
id: operations
depends_on: [record-checks]
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI3, PI4, PA2, PA3]
---

# Operations

## Scope and ownership

Implementer, `apps/artifact-plane/server/knowledge-operations.js` and its routes. Add `tier` and `compatibility` to change.start, `covers` to task.add and task.update, the task template without Prerequisites and approval text, evidence.record without a written default source, the composite change.scaffold with one undo entry, and version.prepare with the default level from the plan, the protected base and the refusal of a number that is not greater.

## Governing knowledge

specifications/delivery-support.md (Knowledge operations); specifications/knowledge-editing.md; requirements/delivery-improvements.md, PI3, PI4, PA2 and PA3.

## Prerequisites

Task record-checks.

## Definition of Done

- [x] change.scaffold for a small change writes at most 7 knowledge files that pass the shared checks; for a medium change it writes the existing set with a unit brief; one undo restores the pre-images.
- [x] version.prepare on a fixture where a parallel change took the next minor number on the protected branch computes the following number and refuses a smaller or equal one.
- [x] HTTP and MCP write tools expose the new inputs; the channel rule is unchanged.
- [x] `npm test` passes, and existing operation tests pass without edits.

## Evidence

An implementer agent delivered this task in a separate worktree (commit 4aa61d1, merged in 4242064); the coordinator reviewed it, merged it and ran the checks again.

| DoD item | Check | Result |
| --- | --- | --- |
| change.scaffold | `test/delivery-operations.test.js`: a small scaffold creates 3 files (change README with `tier`, Plan and Tier decisions; plan with `compatibility`; one task with `covers`), the validator and the scoped record checks report no error, and one undo restores the fingerprint; a medium scaffold writes 5 files with the unit brief, no error, one undo; refusals for a second small task, an unknown ID (`covers-unknown-id`), a bad covers shape, a bad tier and compatibility and a one-member brief for small; a configuration that requires a brief for small | Passed |
| version.prepare | After a parallel change takes 1.1.0 on `main`, prepare computes 1.2.0 from the protected 1.1.0, deletes its own unestablished 1.1.0 record and sets the identity record; minor (1.1.0, equal to another change's record) and patch (1.0.1, smaller) are refused with 409; no level without plan compatibility and no protected ref are refused | Passed |
| HTTP and MCP | One test applies change.scaffold, task.update with covers, evidence.record and version.prepare without a level through HTTP and MCP with identical results; a `channel` field is refused by both. The routes are generic over the operation names, so no route changed | Passed |
| Suite | After the merge and the coordinator's placeholder change: `npm test` 403 tests, 402 passed, 0 failed, 1 skipped; existing operation, interface, claim and writer tests unchanged | Passed |

Decisions, recorded in specifications/delivery-support.md: the rename in version.prepare is the only deletion of a version record that the writer allows (a policy that names each path); a number that is not greater than another change's record in the working tree is refused too, because a number computed from the protected record alone is always greater. The template prompts ("Replace this text.") that the operations write are `placeholder-text` warnings, not errors (claim template-prompts-warn), and change.scaffold does not refuse its own prompts. The browser forms do not offer the new inputs; the task names HTTP and MCP only.
