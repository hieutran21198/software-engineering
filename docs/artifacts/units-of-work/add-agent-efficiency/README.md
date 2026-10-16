---
unit_of_work: add-agent-efficiency
changes:
  - artifact: artifact-driven
    change: change-agent-efficiency
affected_flows:
  - artifact: artifact-driven
    flow: adoption
    effect: modify
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-driven
    flow: version-publication
    effect: modify
  - artifact: artifact-driven
    flow: dependency-gates
    effect: modify
  - artifact: artifact-driven
    flow: unit-validation
    effect: modify
flow_assessment: Inspected foundation, methodology, guidelines, four role skills,
  adoption CLI, embedded bundle, project artifacts, Plane readers, graph
  projections, MCP adapters, CI, protected refs and retained plans. Measured
  duplication, front matter use, reader cost, phase and completion derivation and
  packet size on this repository. The in-place layout changes how change-delivery,
  version-publication, dependency-gates and unit-validation resolve proposed and
  established knowledge; adoption gains aggregate diagnostics. Plane reading of
  the layout is owned by the Plane's active change in the evidence-and-usability
  unit. Hosted harnesses, other consumer repositories and live UX are excluded.
acceptance:
  - id: layout
    criterion: An artifact keeps its knowledge once at its root; a change adds a
      record and edits in place; a version adds one record; readers derive
      established and proposed knowledge from the protected branch; legacy
      snapshots stay readable and unchanged.
  - id: migration
    criterion: This repository's three artifacts are migrated with byte-identical
      knowledge, an unchanged dependency graph, resolved flows and units, and no
      index or proposal files on the in-place path.
  - id: adoption
    criterion: One preflight reports every independently discoverable safe
      destination conflict in stable order without changing consumer files;
      agents can read a structured result.
  - id: context
    criterion: Roles reuse current instructions already available in their
      session, load governing context on demand and recover from existing
      knowledge, Git and packets without assuming approval or freshness.
  - id: consistency
    criterion: Current guidance agrees that versions are records, delivery stays
      in originating changes, and historical evidence is preserved.
  - id: measurements
    criterion: Recorded before and after measurements show zero copied knowledge
      files, a packet at least 80 percent smaller and at least 50 percent fewer
      git commands on this repository, with methods and limits.
  - id: integration
    criterion: Go, bundle, adoption, scaffold, documentation and link checks pass
      and support a complete ADD release without altering established snapshots.
    integration: true
evidence:
  - criterion: layout
    method: Bundle guidance, scaffold test and Plane layout reader checks.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/01-layout-guidance.md#evidence
  - criterion: migration
    method: Reconciliation, byte equality, graph and census checks of the migration.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/04-migrate-repository.md#evidence
  - criterion: adoption
    method: Go preflight and CLI tests, benchmarks and binary smoke test.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/02-adoption-preflight.md#evidence
  - criterion: context
    method: Same-session walkthrough with read-count and byte proxies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/01-layout-guidance.md#evidence
  - criterion: consistency
    method: Bundle review, mirror parity, link check and legacy-unit comparison.
    result: passed
    source: docs/artifacts/units-of-work/add-agent-efficiency/README.md#combined-checks
  - criterion: measurements
    method: Census and layout benchmark on the legacy and migrated forms.
    result: failed
    source: docs/artifacts/units-of-work/add-agent-efficiency/README.md#combined-checks
  - criterion: integration
    method: Go, bundle, adoption, scaffold, website build and link checks.
    result: passed
    source: docs/artifacts/units-of-work/add-agent-efficiency/README.md#combined-checks
---

# Simplify ADD knowledge for humans and agents

## Included scope

ADD-owned in-place knowledge layout, records and identity rules, Git-based lifecycle derivation, legacy compatibility, migration procedure, bundle and skill guidance, migration of this repository's artifacts, adoption diagnostics, progressive role context, retention correction, regressions and measurements. The coordinator owns this brief and shared evidence.

## Excluded scope

A workflow database or stored index, a new role or approval field, automatic merges or publication, pruning or rewriting legacy directories, renaming existing changes or units, simplifying the flow schema, harness registration, a change runner, and Plane implementation. Plane reading of the in-place layout belongs to the Plane's active change in the [evidence-and-usability unit](../evidence-and-usability/README.md); that work waits for this contract to establish and creates no membership edge.

## Investigation evidence

The [repository audit](audit.md) of the earlier session covers context loading, adoption preflight and retention. The [knowledge layout requirements](../../artifact-driven/requirements/knowledge-layout.md) record the layout measurements: 72 percent byte-identical copies under docs/artifacts, 145 flow files for 15 flows, 19 of 21 changes with unknown phase, 11 of 15 units with unknown completion, 14.1 s and 800 git commands per explore, and 116,052-character zero-excerpt packets. Methods: a Python census over docs/artifacts (file hashes, front matter keys, per-change identity to version files), git diff-tree over merged PRs, and the Plane's own exploreRepository and review service run against this worktree.

## Preparation and approval

Requirement, Specification and Plan are preparatory knowledge. Implementation requires explicit approval of the plan. Suggested ADD version: 2.4.0, a compatible minor release that adds a layout and keeps legacy artifacts readable; the user can select 3.0.0 if the guidance change is considered breaking. Plane 1.14.0 remains the Plane plan's version.

- [ADD implementation plan](../../artifact-driven/changes/change-agent-efficiency/tasks/README.md)
- [Plane plan with in-place reading](../../artifact-plane/changes/change-evidence-and-usability/tasks/README.md)

## Combined checks

Executed on 16 October 2026 on branch claude/add-in-place-layout after explicit user approval (ADD 2.4.0, one coordinated PR, adoption tasks kept). Task details are in the originating tasks; this section records only combined results.

- Integration: `go test ./...`, `go vet ./...`, bundle fidelity, the in-place scaffold test, adoption tests and the website production build after `npm ci` pass. The bundle link script found no broken or ancestor links. versions/2.4.0/README.md is a version record with source_change, without knowledge directories or tasks, and the identity record declares 2.4.0. Established snapshots and delivered changes are unchanged (`git diff origin/main -- docs/artifacts/*/versions` shows only the two new records).
- Consistency: the bundle, AGENTS.md and the scaffold describe the in-place layout and keep one legacy compatibility section. The Plane reads all 15 units of work identically on the legacy and migrated forms of this repository; only this unit differs, because of its new 2.4.0 record. `node apps/artifact-plane/scripts/validate-knowledge.mjs .` reports 0 errors.
- Measurements, as byte, file and command proxies. The benchmark is `node apps/artifact-plane/scripts/layout-benchmark.mjs . 4eb71e3 HEAD --worktrees 9` with local clones and main at 6a0e0c9. Both forms ran with the current readers.

  | Measure | Before | After |
  | --- | --- | --- |
  | Knowledge files copied into the active change | 38 (23 byte-identical to a version) | 0 |
  | Files added by the last version | 33 (versions/2.3.0; PR #28 added 139 files) | 1 (versions/2.4.0/README.md) |
  | Files and bytes under docs/artifacts | 1,322 files, 5,851,350 bytes | 1,330 files, 5,903,540 bytes; legacy snapshots are preserved, so no historical bytes are removed |
  | git commands per explore, 10 worktrees | 771 (800 recorded with the earlier reader) | 102 (86.8 percent fewer) |
  | Explore elapsed time | 23.0 s | 11.0 s |
  | git commands to capture the ADD packet | 1,324 | 50 |
  | Zero-excerpt packet for the ADD change | 139,216 bytes (116,052 characters recorded with the earlier reader) | 145,391 bytes (4 percent larger) |
  | Changes with an unknown phase | 19 of 21 | 0 of 21 |

- The measurements criterion fails on the packet target. The plan assumed that copied knowledge dominates the packet. Records were already deduplicated by path, and most bytes are flow-impact candidates and pointers to implementation and test sources registered by flows. The in-place packet lists each file once and its workflow evidence shrank from about 18 KB to 5 KB, but its total size did not fall. Zero copied files and the git command target are met. A user decision is needed: re-scope the packet target in Specification and Plan, or accept the measured result.
