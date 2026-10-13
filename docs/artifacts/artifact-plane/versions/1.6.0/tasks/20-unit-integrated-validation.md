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

- [x] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane with dependencies installed.
- [x] Exercise the same repository fixture through API and all three views; verify artifact ownership, exact source links, gates, external prerequisites, and historical completion.
- [x] Compare repository file bytes/Git fingerprints before and after exploration and refresh.
- [x] Record shared integration evidence and member-specific task evidence without duplicating task lists or dependency graphs.
- [x] Propose Plane 1.6.0 for user confirmation; prepare complete snapshot with provenance and consistent package/root/index updates.
- [ ] Open the Plane PR linked to upstream ADD publication; stop for team review and merge.

## Evidence

Integrated validation passed: npm test (91 Node cases), npm run build (production client), and npm run test:browser (13 Chromium acceptance cases) in apps/artifact-plane. All three new unit browser cases and all ten existing cases passed. GOCACHE=/tmp/software-engineering-unit-go-cache go test ./... passed the repository adoption/fidelity checks.

The same source fixture drives real reader/API records, pure aggregate graph checks, and browser exploration. Checks cover membership/provenance, published/proposed/unknown versions, shared evidence, historical delivered sources, external prerequisite closure, internal task DAGs and establishment gates, invalid input, sanitized Markdown, responsive layout, refresh selection, worktree isolation, and unchanged repository bytes/Git fingerprints. Desktop/narrow screenshots were inspected. The default downloaded browser could not load libnspr4; rerun with installed system Chromium passed. Optional Vite library-directive/chunk-size notices do not fail the build. No checks were skipped or represented as passing while unavailable.

The user confirmed Plane 1.6.0. All required knowledge and implementation changes are in this repository. The complete proposed snapshot declares source_change: change-units-of-work. Existing artifact-plane -> artifact-driven dependency remains unchanged, and the obsolete copied proposal was removed. Shared validation evidence references exact delivered tasks and the brief; it contains no completion flag or copied DAG. ADD 1.2.0 is established and its contract recheck passed.

KISS reuses existing libraries and evidence; STE preserves publication and approval limits. PR handoff remains pending. No merge, deployment, or tag has been performed.

## Publication preparation checks

The real project reader resolves two member artifacts: ADD 1.2.0 established and Plane 1.6.0 proposed. Both task graphs are available; the combined graph has eight nodes and seven edges with no diagnostics. All shared evidence resolves; outcome completion remains incomplete solely because Plane is not published to main. Forty root/change/version Markdown links resolve without ancestor references. The active and delivered four-task plans validate with three edges, their complete snapshot files match, and package/lockfile versions agree. git diff --check passed.
