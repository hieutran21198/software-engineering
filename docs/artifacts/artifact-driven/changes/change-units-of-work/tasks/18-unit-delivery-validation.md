---
id: unit-delivery-validation
depends_on: [unit-knowledge]
---

# Validate ADD delivery and prepare upstream publication

## Scope and location

src/archs/artifact-driven tests, internal/adopt tests, website delivery; coordinator-owned docs/artifacts. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

No upstream artifact prerequisite. Explicit user plan approval gates implementation.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [ ] Add meaningful contract/delivery fixtures for brief examples, provenance, and reserved-directory conventions.
- [ ] Run go test ./...; run npm run build in website with dependencies installed.
- [ ] Check canonical/packaged fidelity and local Markdown links; record actual results with tasks.
- [ ] Create the agreed outcome brief for these two changes and record applicable shared validation criteria using the new contract.
- [ ] Propose ADD 1.2.0 for user confirmation; prepare full snapshot with source_change, root, and index consistently.
- [ ] Open the upstream PR and stop for team merge; do not treat proposed publication as establishment.

## Evidence

Implementation has not started. Record commands/review methods, results, and source references here during approved execution. KISS and STE checks are part of the task self-check.
