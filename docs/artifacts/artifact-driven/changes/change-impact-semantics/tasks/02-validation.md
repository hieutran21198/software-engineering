---
id: validation
depends_on:
  - guidance
---

# Validation

## Scope and ownership

Own the combined checks of the ADD change and the version record docs/artifacts/artifact-driven/versions/2.7.0/README.md with the identity record update.

## Governing knowledge

requirements/change-impact.md, A1 to A4. specifications/change-impact.md, Self-check. The unit brief docs/artifacts/units-of-work/change-impact-intelligence/README.md, criteria semantics and integration.

## Prerequisites

Task guidance satisfies its DoD.

## Definition of Done

- [ ] validate-knowledge reports no error for the repository, and the flows change-delivery and dependency-gates resolve their impact-contract support.
- [ ] The contract has one row per relationship type of M2 and every field of M3 and M4 is named once; the Plane contract references it without copying its rules.
- [ ] `git diff --no-index` of the changed files between docs/artifact-driven and src/archs/artifact-driven is empty.
- [ ] The version record 2.7.0 names source_change change-impact-semantics, states the minor compatibility level with its reason, and current_version in the identity record is 2.7.0.

## Evidence

No checks have run.
