---
id: validation
depends_on:
  - guidance
evidence_records:
  - id: validation-checks
    method: validate-knowledge on the branch worktree, flow support resolution through the Plane readers, cmp of the changed bundle files, review of the contract rows and fields
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-impact-semantics/tasks/02-validation.md#validation-checks
---

# Validation

## Scope and ownership

Own the combined checks of the ADD change and the version record docs/artifacts/artifact-driven/versions/2.7.0/README.md with the identity record update.

## Governing knowledge

requirements/change-impact.md, A1 to A4. specifications/change-impact.md, Self-check. The unit brief docs/artifacts/units-of-work/change-impact-intelligence/README.md, criteria semantics and integration.

## Prerequisites

Task guidance satisfies its DoD.

## Definition of Done

- [x] validate-knowledge reports no error for the repository, and the flows change-delivery and dependency-gates resolve their impact-contract support.
- [x] The contract has one row per relationship type of M2 and every field of M3 and M4 is named once; the Plane contract references it without copying its rules.
- [x] `git diff --no-index` of the changed files between docs/artifact-driven and src/archs/artifact-driven is empty.
- [x] The version record 2.7.0 names source_change change-impact-semantics, states the minor compatibility level with its reason, and current_version in the identity record is 2.7.0.

## Evidence

### validation-checks

Checked on 18 October 2026 on branch claude/impact-intelligence after the merge of main at 126990d. validate-knowledge reported 0 errors and 18 flows for the repository; the Plane readers resolved the impact-contract support of change-delivery (steps requirement and specification) and dependency-gates (step recheck) as proposed. The contract table has one row for each of the fourteen relationship types named in M2, and the explanation record and coverage statement name their fields once; the Plane contract references the ADD element in front matter and restates no rule. `cmp` reported every bundle file changed since 5680b52 identical between docs/artifact-driven and src/archs/artifact-driven. The version record versions/2.7.0/README.md names source_change change-impact-semantics and the minor compatibility level, and the identity record declares current_version 2.7.0.
