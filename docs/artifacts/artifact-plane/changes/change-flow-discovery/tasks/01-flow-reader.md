---
id: flow-reader
depends_on: []
---

# Read flow knowledge and support links

## Scope and governing knowledge

Own apps/artifact-plane source-aware flow parsing/model, source containment, reverse graph projection and unit affected-flow interpretation. Reuse existing readers and diagnostics.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [ ] Valid shared/branch/join/loop/disconnected fixtures parse; malformed IDs/owners/paths/endpoints diagnose.
- [ ] Legacy inputs remain readable and snapshot/worktree identities do not collide.
- [ ] Reference resolution and safe tracked source reads preserve repository bytes.

## Evidence

No implementation checks have run for this task.
