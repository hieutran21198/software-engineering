---
id: flow-reader
depends_on: []
---

# Read flow knowledge and support links

## Scope and governing knowledge

Own apps/artifact-plane source-aware flow parsing/model, source containment, reverse graph projection and unit affected-flow interpretation. Reuse existing readers and diagnostics.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Valid shared/branch/join/loop/disconnected fixtures parse; malformed IDs/owners/paths/endpoints diagnose.
- [x] Legacy inputs remain readable and snapshot/worktree identities do not collide.
- [x] Reference resolution and safe tracked source reads preserve repository bytes.

## Evidence

Implemented source-aware flow parsing, typed graph projection, reverse impact traversal, additive unit flow assessment, safe tracked-source resolution, source fingerprints and protected-ref source-byte labels. Source publication labels do not claim complete artifact establishment.

node --test test/flows.test.js test/units-of-work.test.js passed 52 checks with temporary Git subprocess permissions. Fixtures cover shared elements, runtime loops, source/context isolation, malformed IDs/owners/endpoints/basis/YAML, credential and traversal guards, legacy/empty unit assessments, read-only reads, changed sources and escaping symlinks. Current repository integration reads eight valid ADD/Story-Driven flows with no diagnostics and 27 supporting sources. New planned Plane inventory remains separate. KISS/STE self-check passed; upstream ADD 2.1.0 recheck is recorded in this change README.
