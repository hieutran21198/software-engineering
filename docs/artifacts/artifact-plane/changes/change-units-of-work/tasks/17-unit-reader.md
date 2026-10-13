---
id: unit-reader
depends_on: []
---

# Read unit knowledge and derive establishment evidence

## Scope and location

apps/artifact-plane/server/reader.js, workflow.js; plain unit parser module; existing src/model.js; reader/model tests. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [ ] Exclude units-of-work from artifact nodes and read briefs/provenance/evidence safely for each worktree.
- [ ] Produce additive unit records and diagnose duplicate membership, malformed metadata, unsafe paths, and missing sources.
- [ ] Resolve delivered historical versions independently of the current version and retain legacy behavior.
- [ ] Derive completion with documented-evidence labels and uncertainty when publication or implementation merge evidence is unavailable.
- [ ] Test branch-only and main/master publication, removed retained changes, newer artifact versions, failed/incomplete shared checks, and read-only fingerprints.

## Evidence

Implementation has not started. Record commands/review methods, results, and source references here during approved execution. KISS and STE checks are part of the task self-check.
