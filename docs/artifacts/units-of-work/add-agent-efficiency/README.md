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
flow_assessment: Inspected foundation, phases, four role skills, adoption CLI,
  embedded assets, source-backed retrieval, task/unit/publication readers, CI,
  protected remote history and retained plans. Covers adoption diagnostics,
  context loading and retained delivery. Plane context-handoff remains owned by
  the existing evidence-and-usability outcome. Hosted harnesses, all consumer
  repositories and live visual UX are excluded.
acceptance:
  - id: adoption
    criterion: One preflight reports every independently discoverable safe
      destination conflict in stable order without changing consumer files;
      agents can read a structured result.
  - id: context
    criterion: Roles reuse current instructions already available in their
      session, load governing context on demand and recover from existing
      knowledge, Git and packets without assuming approval or freshness.
  - id: consistency
    criterion: Current guidance agrees that new versions exclude tasks and
      preserve referenced originating plans and historical evidence.
  - id: integration
    criterion: CLI regressions, safety checks, bundle parity, repeatable
      efficiency measurements and documentation build support a compatible
      complete ADD release without altering established snapshots.
    integration: true
evidence: []
---

# Reduce ADD adoption and agent recovery effort

## Included scope

ADD-owned adoption diagnostics, session context loading, retention-rule correction,
regressions and measurements. The coordinator owns this brief and shared evidence.
The new change starts from the complete ADD 2.3.0 snapshot without copied tasks.

## Excluded scope

Harness registration, automatic upgrades, a change runner, automatic approvals,
merge/deploy automation, new roles, caches or workflow databases. No historical
outcome membership or established snapshot is rewritten.

## Related ongoing work

The [repository audit](audit.md) covers both ADD and Plane. Plane remains in the
existing evidence-and-usability unit and its existing active change. Its planned
compact-packet extension is reviewed with this plan but does not join this unit.
The delivered ADD member of that older outcome retains its membership and evidence.
The two units do not create dependency edges. The compact API does not require the
new ADD release; role guidance uses capability detection and existing fallback.

## Preparation and approval

Requirement, Specification and Plan are preparatory knowledge. This request requires
approval of the revised implementation plan before code changes. Existing unchanged
Plane authorization remains recorded in its originating plan; the compact extension
and affected integration join require renewed approval. Suggested new ADD version:
2.4.0, a compatible minor release; suggested Plane 1.14.0 remains the pending plan's
version. Confirm or override these with implementation approval.

## Combined checks

No implementation checks have run for this outcome. Audit baseline checks are
recorded in audit.md and do not satisfy new task DoD. Record executed combined
checks here after approval and implementation, with task-owned detail references.
