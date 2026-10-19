---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/delivery-tiers.md#specification-self-check
claims:
  - id: coordinator-criteria
    kind: decision
    statement: The coordinator decides the one-repository criterion and, when no
      Plane tier check is available, the impact criterion; the validator reports
      them as coordinator-decided, not as unresolved.
    status: open
    basis: inferred
    check: Assign a tier to a change in a repository without the Plane and
      confirm that the validator can return small when every decidable
      criterion passes.
    rejected:
      - option: Treat every criterion that the validator cannot decide as
          unresolved.
        reason: No change could be small without the Plane, against DI1.
      - option: Require the Plane for the small tier.
        reason: ADD stays usable without the Plane.
---

# Delivery tiers contract

Governs DI1 to DI5, DI12, DI14 and DI15 in requirements/delivery-improvements.md. The [record checks contract](record-checks.md) defines the fields that the validator reads. The [tier decision](../decisions/015-change-tiers.md) records the choice of tiers.

## Tier record

A change README may start with YAML front matter. The only defined key is `tier`, with the value `small`, `medium` or `large`. A change README without front matter, or without `tier`, is a medium change. Existing change records stay valid without edits. The README body still records the reason and scope in prose.

```yaml
---
tier: small
---
```

The coordinator assigns the tier at Requirement. The owner can raise the tier at any time; a raise needs no reason. A lower tier is allowed only while every small-tier criterion holds.

## Small-tier criteria

A change is small only when every criterion passes. A criterion that fails, or that is unresolved, keeps the change medium or large.

| ID | Criterion | Decided by |
| --- | --- | --- |
| one-artifact | The knowledge difference against the protected branch changes files of one artifact only, and no unit brief names a second member. | validator |
| one-repository | The change needs no companion change in another repository. | coordinator |
| patch-level | The plan declares `compatibility: patch`. | validator |
| no-contract | The difference adds or removes no flow record, changes no element that another artifact references, adds no decision file and adds no requirement ID. | validator |
| upstream-established | Every `depends_on` target of the artifact has an established version on the protected branch. | validator |
| code-limit | Fewer than `tiers.small.max_code_lines` changed code and test lines (default 100). The count excludes `docs/artifacts/**`, the bundle source, lockfiles and generated files. | validator |
| impact-contained | The change impact over the difference reaches no entity outside the artifact, and its coverage statement leaves no reached item unresolved. | Plane tier check, or the coordinator's recorded impact assessment when the Plane is not available |

A criterion result is `pass`, `fail`, `unresolved` or `coordinator`. `unresolved` means that a tool answer was needed and was not available, or did not decide. `coordinator` means that the coordinator decides it and records it in the change README.

A change that touches more than one artifact, or changes a contract that another artifact consumes, is large. Every other change that is not small is medium.

## Records, commits and gates by tier

| Item | Small | Medium | Large |
| --- | --- | --- | --- |
| Change README | reason, scope, tier, the plan as one short paragraph and, without the Plane, the impact assessment | reason and scope | reason and scope |
| Requirement and specification | edited in place, one `self_check` each | edited in place | edited in place |
| ADR | not allowed (see no-contract) | when a choice has several options | when a choice has several options |
| `tasks/README.md` | one task | task list | task list |
| Unit brief | not required | required by default | required |
| Knowledge commits | one commit for Requirement, Specification and Plan | one commit per phase | one commit per phase |
| Plan approval | the owner's request; the plan appears in the PR description | explicit, before implementation | explicit, before implementation |
| Compatibility level | patch, confirmed by the owner at merge | proposed in the plan, confirmed with plan approval | proposed in the plan, confirmed with plan approval |
| Owner look at a changed UI | screenshot in the PR description | recorded before Version | recorded before Version |
| Version record and identity record | yes | yes | yes |
| PR and team review | yes | yes | yes |

The coordinator asks again for the level only when the level changes after approval. When several unit members present their plans together, one approval covers all of them. The coordinator reads merges from Git and does not ask the owner to report them.

## Compatibility level and version number

The plan `tasks/README.md` front matter may declare `compatibility` with the value `patch`, `minor` or `major`. The plan does not state a version number.

At Version, the coordinator computes the number from `current_version` of the artifact identity record on the protected branch: patch increments the third part, minor increments the second part and sets the third to 0, major increments the first part and sets the others to 0. A first version is `1.0.0`. When the protected branch moves before merge, the coordinator computes the number again and renames the version record. The validator reports a record whose number is not this computed number.

## Owner look at a user interface

When a medium or large change changes a user interface, the plan has one DoD item: the owner looked at screenshots or the running interface. The task evidence records what the owner looked at. The owner look is a check record, not an approval.

## Configuration file

A project may add `docs/artifacts/add.config.yaml`. Without it, the defaults apply. Unknown keys and wrong types are the error `config-invalid`.

```yaml
version: 1
tiers:
  small:
    max_code_lines: 100
unit_brief:
  required_for: [medium, large]
reading:
  coordinator: []
  product-owner: []
  technical-lead: []
  implementer: []
```

| Key | Type | Default | Rule |
| --- | --- | --- | --- |
| `version` | integer | 1 | Only 1 is defined. |
| `tiers.small.max_code_lines` | positive integer | 100 | Upper limit, not included, of the code-limit criterion. |
| `unit_brief.required_for` | list of tiers | `[medium, large]` | Tiers for which an outcome with one member needs a unit brief. An outcome with more than one member always needs one. |
| `reading.<role>` | list of repository-relative Markdown paths | `[]` | Extra guidance that the role reads at start, in addition to its skill core. |

## Guarantees

| Guarantee | Small | Medium and large |
| --- | --- | --- |
| `main` shows the current truth | Requirement and specification are edited in place in the same branch as the code. | Unchanged. |
| Traceability | The task declares `covers`; the validator checks it. | Unchanged, with `covers` checked. |
| Versions and the established rule | The patch version record is written and establishes only on the protected branch. | Unchanged. |
| Upstream wait | A change with an unestablished upstream fails upstream-established and cannot be small. | Unchanged. |
| A person approves a large plan | Not applicable: a small change is not large; the owner's request starts it. | Explicit approval before implementation. |

Approval stays out of files. No workflow state, registry, phase, role or gate is added.

## Repository instructions

This repository's `AGENTS.md` changes to match: phase commits and explicit plan approval apply to medium and large changes; a small change follows the small-tier path; a unit of work is required for medium and large outcomes; roles apply the KISS and STE checklists in their self-checks and read the full required skills when the checklist is not enough.

## Specification self-check

Each item of DI1 to DI5, DI12, DI14 and DI15 maps to a section above. Every small-tier criterion names who decides it, so A1 and A7 are testable. The guarantee table answers A6. The tier record and the plan key are optional, so A5 holds. Claims: one open decision with its check. KISS: one optional front-matter key in two records and one optional file. STE: one rule per sentence. Representations: the criteria, tier and guarantee tables were checked against DI1, DI2, DI3 and DI15; each row has a source requirement. No blocker prevents Plan.
