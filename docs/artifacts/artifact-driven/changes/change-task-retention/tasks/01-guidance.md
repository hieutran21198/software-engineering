---
id: guidance
depends_on: []
---

# Update task retention guidance

## Scope and ownership

Repository: this repository. Locations: Canonical docs/artifact-driven, corresponding src/archs/artifact-driven files, applicable .codex/agents profiles and AGENTS.md references, and member knowledge contracts.

Amend future snapshot layouts, fresh-plan creation, retained-change lifecycle, delivery_tasks marker, protected-ref evidence rules, unit references, phase roles, examples, and CI guidance. Replace conflicting copied contract statements with the approved rules. Keep all established snapshots and legacy outcome evidence unchanged.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md; decisions/006-change-owned-delivery.md. No upstream artifact gate. Explicit plan approval is required. Internal prerequisites: none. Required predecessor DoD must pass before starting.

## Definition of Done

- [x] Review all maintained snapshot/task rules for agreement with specifications/task-retention.md; canonical and packaged files match.
- [x] Examples show task-free future versions linked to the exact retained change; next-change plans contain no historical copies.
- [x] KISS/STE self-check preserves contract obligations, full bundle access, and waterfall documentation links.

## Evidence

Reviewed maintained retention rules with rg searches and amended conflicting copied knowledge/task-DAG/unit contracts. Updated 12 canonical guidance files and their packaged counterparts, plus AGENTS.md; role profiles already defer to canonical skills and need no duplicate policy.

node /tmp/check-add-delivery.mjs passed 139 Markdown destination/hierarchy checks, complete bundle fidelity including mounted utility skills, the two-task/one-edge plan, and unit metadata. git diff --check passed. No established snapshot or historical outcome evidence changed.

KISS self-check retains one delivery source and existing provenance with one explicit layout marker. STE self-check preserves approval, publication, retention, and compatibility obligations. New changes create fresh plans; new versions link to retained plans. No new registry, runner, or CLI behavior is introduced.
