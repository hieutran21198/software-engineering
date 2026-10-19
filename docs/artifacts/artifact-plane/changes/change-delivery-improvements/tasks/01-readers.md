---
id: readers
depends_on: []
---

# Readers

## Scope and ownership

Implementer, `apps/artifact-plane`. Parse the change README `tier`, the plan `compatibility`, task `covers`, list-item and paragraph-label requirement IDs and `docs/artifacts/add.config.yaml` with defaults; resolve a task evidence record without `source` to the task's `#evidence` heading. Report `invalid-tier`, `invalid-compatibility`, `requirement-id-duplicate` and `config-invalid`.

## Governing knowledge

specifications/delivery-support.md (Readers); artifact-driven specifications/delivery-tiers.md and record-checks.md; requirements/delivery-improvements.md, PI1, PI7 and PI8.

## Prerequisites

Explicit plan approval and artifact-driven 3.0.0 established on main.

## Definition of Done

- [ ] Node tests cover each field with a valid value, an invalid value and absence, and the configuration file with defaults, a changed limit and an unknown key.
- [ ] A task evidence record without `source` resolves to its `#evidence` section in the task view and in unit evidence.
- [ ] `npm test` passes, and existing reader tests pass without edits.

## Evidence

Not recorded.
