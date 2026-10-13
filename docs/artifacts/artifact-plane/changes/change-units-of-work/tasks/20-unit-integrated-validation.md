---
id: unit-integrated-validation
depends_on: [unit-interface]
---

# Validate integrated outcome and prepare Plane publication

## Scope and location

apps/artifact-plane tests/build; coordinator-owned artifact tasks and shared outcome evidence. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [ ] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane with dependencies installed.
- [ ] Exercise the same repository fixture through API and all three views; verify artifact ownership, exact source links, gates, external prerequisites, and historical completion.
- [ ] Compare repository file bytes/Git fingerprints before and after exploration and refresh.
- [ ] Record shared integration evidence and member-specific task evidence without duplicating task lists or dependency graphs.
- [ ] Propose Plane 1.6.0 for user confirmation; prepare complete snapshot with provenance and consistent package/root/index updates.
- [ ] Open the Plane PR linked to upstream ADD publication; stop for team review and merge.

## Evidence

Implementation has not started. Record commands/review methods, results, and source references here during approved execution. KISS and STE checks are part of the task self-check.
