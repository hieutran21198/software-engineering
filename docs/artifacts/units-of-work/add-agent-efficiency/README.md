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
evidence: []
---

# Simplify ADD knowledge for humans and agents

## Included scope

ADD-owned in-place knowledge layout, records and identity rules, Git-based lifecycle derivation, legacy compatibility, migration procedure, bundle and skill guidance, migration of this repository's artifacts, adoption diagnostics, progressive role context, retention correction, regressions and measurements. The coordinator owns this brief and shared evidence.

## Excluded scope

A workflow database or stored index, a new role or approval field, automatic merges or publication, pruning or rewriting legacy directories, renaming existing changes or units, simplifying the flow schema, harness registration, a change runner, and Plane implementation. Plane reading of the in-place layout belongs to the Plane's active change in the [evidence-and-usability unit](../evidence-and-usability/README.md); that work waits for this contract to establish and creates no membership edge.

## Investigation evidence

The [repository audit](audit.md) of the earlier session covers context loading, adoption preflight and retention. The [knowledge layout requirements](../../artifact-driven/changes/change-agent-efficiency/requirements/knowledge-layout.md) record the layout measurements: 72 percent byte-identical copies under docs/artifacts, 145 flow files for 15 flows, 19 of 21 changes with unknown phase, 11 of 15 units with unknown completion, 14.1 s and 800 git commands per explore, and 116,052-character zero-excerpt packets. Methods: a Python census over docs/artifacts (file hashes, front matter keys, per-change identity to version files), git diff-tree over merged PRs, and the Plane's own exploreRepository and review service run against this worktree.

## Preparation and approval

Requirement, Specification and Plan are preparatory knowledge. Implementation requires explicit approval of the plan. Suggested ADD version: 2.4.0, a compatible minor release that adds a layout and keeps legacy artifacts readable; the user can select 3.0.0 if the guidance change is considered breaking. Plane 1.14.0 remains the Plane plan's version.

- [ADD implementation plan](../../artifact-driven/changes/change-agent-efficiency/tasks/README.md)
- [Plane plan with in-place reading](../../artifact-plane/changes/change-evidence-and-usability/tasks/README.md)

## Combined checks

No implementation checks have run for this outcome. Record executed combined checks here after approval and implementation, with task-owned detail references.
