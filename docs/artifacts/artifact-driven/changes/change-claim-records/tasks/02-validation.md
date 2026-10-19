---
id: validation
depends_on: [guidance]
---

# Validate the combined result

## Scope and ownership

Coordinator. Checks over the ADD knowledge and the bundle; the version record and the identity record of artifact-driven; the unit evidence entry for claims-contract.

## Governing knowledge

requirements/claim-records.md, A1–A5; the claims-contract and integration criteria of the human-cognitive-support unit.

## Prerequisites

Task guidance meets its DoD. Explicit plan approval.

## Definition of Done

- [x] validate-knowledge reports no error and no new diagnostic on this repository.
- [x] A search of the changed bundle pages finds no approval field, workflow state, registry, phase, role or gate.
- [x] The two examples of the guideline parse with the claim rules of the contract (a scripted check of fields and status rules).
- [x] The version record versions/2.9.0/README.md names source_change change-claim-records and the identity record sets current_version 2.9.0, after the user confirms the level.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| validate-knowledge | `node apps/artifact-plane/scripts/validate-knowledge.mjs .` after commit d3c0263 | Passed: one diagnostic, info `retained-legacy-change`, the same as on main | Command in this row |
| No approval or state | Search of the lines that the change adds to docs/artifact-driven for approval, workflow state, registry, phase, role and gate | Passed: every match is a negation ("not approval", "records no approval and no workflow state", "no phase, role or gate", "no step, a gate or a claim registry") or the existing plan-review wording | The diff from 6c00423 |
| Examples parse | A script reads the two `~~~text` blocks of the Claims section with the yaml package and applies the field table, the status table, the observed-basis rule, the source rule and the check rule | Passed: 2 examples, 3 claims, 0 errors, 0 warnings. Negative control: status `verified` without `verified_by` gives one error | Script run in this row |
| Version record | The user confirmed 2.9.0 on 19 October 2026. versions/2.9.0/README.md names source_change change-claim-records; the identity record sets current_version 2.9.0; validate-knowledge rerun after the change | Passed | versions/2.9.0/README.md |
