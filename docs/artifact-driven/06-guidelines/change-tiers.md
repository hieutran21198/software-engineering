# Change tiers

A change has a tier: `small`, `medium` or `large`. The tier sets the records, commits and human gates of the change. A small fix gets few records, one knowledge commit and one human gate. A medium or large change keeps every phase commit and explicit plan approval. The guarantees at the end of this page hold for every tier.

## Record the tier

The coordinator assigns the tier at Requirement and writes it in the front matter of the change README. This is the only front-matter key of a change README:

```yaml
---
tier: small
---
```

A change README without front matter, or without `tier`, is a medium change. Existing change records stay valid without edits. The README body still states the reason and the scope in prose.

The owner can raise the tier at any time, and a raise needs no reason. A lower tier is allowed only while every small-tier criterion holds.

## Small-tier criteria

A change is small only when every criterion passes. A criterion that fails, or that is unresolved, keeps the change medium or large.

| ID | Criterion | Decided by |
| --- | --- | --- |
| one-artifact | The knowledge difference against the protected branch changes files of one artifact only, and no unit brief names a second member. | validator |
| one-repository | The change needs no companion change in another repository. | coordinator |
| patch-level | The plan declares `compatibility: patch`. | validator |
| no-contract | The difference adds or removes no flow record, changes no element that another artifact references, adds no decision file and adds no requirement ID. | validator |
| upstream-established | Every `depends_on` target of the artifact has an established version on the protected branch. | validator |
| code-limit | Fewer than `tiers.small.max_code_lines` changed code and test lines (default 100). The count excludes `docs/artifacts/**`, the bundle, lockfiles and generated files. | validator |
| impact-contained | The [change impact](change-impact.md) over the difference reaches no entity outside the artifact, and its coverage statement leaves no reached item unresolved. | a tool that computes change impact, or the coordinator's recorded impact assessment when no such tool is available |

Each criterion has one result:

| Result | Meaning |
| --- | --- |
| `pass` | The criterion holds. |
| `fail` | The criterion does not hold. |
| `unresolved` | A tool answer was necessary and was not available, or the answer did not decide. |
| `coordinator` | The coordinator decides the criterion and records the decision in the change README. |

A change that touches more than one artifact, or changes a contract that another artifact consumes, is large. Every other change that is not small is medium.

## Records, commits and gates by tier

| Item | Small | Medium | Large |
| --- | --- | --- | --- |
| Change README | reason, scope, tier, the plan as one short paragraph and, without an impact tool, the impact assessment | reason and scope | reason and scope |
| Requirement and specification | edited in place, one `self_check` each | edited in place | edited in place |
| ADR | not allowed (see no-contract) | when a choice has several options | when a choice has several options |
| `tasks/README.md` | one task | task list | task list |
| Unit brief | not required | required by default | required |
| Knowledge commits | one commit for Requirement, Specification and Plan | one commit per phase | one commit per phase |
| Plan approval | the owner's request; the plan appears in the PR description | explicit, before implementation | explicit, before implementation |
| Compatibility level | patch, confirmed by the owner at merge | proposed in the plan, confirmed with plan approval | proposed in the plan, confirmed with plan approval |
| Owner look at a changed user interface | screenshot in the PR description | recorded before Version | recorded before Version |
| Version record and identity record | yes | yes | yes |
| PR and team review | yes | yes | yes |

The coordinator asks again for the level only when the level changes after approval. When several unit members present their plans together, one approval covers all of them. The coordinator reads merges from Git and does not ask the owner to report them.

A small change still has every phase. Requirement, Specification and Plan are short and are committed together. The owner's request to make the change counts as the plan approval, because a small change cannot break a contract, cannot reach another artifact and cannot wait for an upstream version.

## Example of a small change README

This invented example shows the change README of a small change. It holds the plan paragraph. Without a tool that computes change impact, it also holds the coordinator's impact assessment and the one-repository decision:

```text
---
tier: small
---

# Keep document reads working with several tabs open

## Reason and scope

With four browser tabs open, document reads time out, because each tab
holds an event stream and the browser limits connections per host. This
change closes the stream of a hidden tab and opens it again when the tab
becomes visible. Excluded: a shared worker for all tabs.

## Plan

One task changes the stream client and adds a browser test with four tabs.
The task covers DR1 and DR2 in requirements/document-reads.md.
Compatibility: patch.

## Tier decisions

One repository: the client and its test are in this repository.
Impact: the stream client is used only by the page shell of this artifact;
no other artifact imports it, and no flow record changes.
```

## Compatibility level and version number

The front matter of the plan `tasks/README.md` can declare `compatibility` with the value `patch`, `minor` or `major`:

```yaml
---
tasks:
  - 01-deliver.md
compatibility: patch
---
```

The plan does not state a version number. At Version, the coordinator computes the number from `current_version` of the artifact identity record on the protected branch:

| Level | New number |
| --- | --- |
| patch | Increment the third part. |
| minor | Increment the second part and set the third part to 0. |
| major | Increment the first part and set the other parts to 0. |

A first version is `1.0.0`. When the protected branch moves before merge, compute the number again and rename the version record. The validator reports a version record whose number is not the computed number.

## Owner look at a user interface

When a medium or large change changes a user interface, the plan has one DoD item: the owner looked at screenshots or at the running interface. The task evidence records what the owner looked at. For a small change, the screenshot goes in the PR description. The owner look is a check record, not an approval.

## Configuration file

A project can add `docs/artifacts/add.config.yaml`. Without it, the defaults apply. Unknown keys and wrong types are the error `config-invalid`.

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

## Check the tier

When the [validator](writing-artifacts.md#check-records-with-the-validator) is available, run it with `--change <artifact>/<change>`. Its `tier` object gives the declared tier, the allowed tier and one result for each criterion. A declared small tier with a criterion that fails or is unresolved is the error `tier-mismatch`. The validator reports one-repository and, without an impact tool, impact-contained as `coordinator`; record those two decisions in the change README. Without the validator, check each criterion by hand and record the results in the change README.

## Guarantees

| Guarantee | Small | Medium and large |
| --- | --- | --- |
| `main` shows the current truth | Requirement and specification are edited in place in the same branch as the code. | Unchanged. |
| Traceability | The task declares `covers`; the validator checks it. | Unchanged, with `covers` checked. |
| Versions and the established rule | The patch version record is written and establishes only on the protected branch. | Unchanged. |
| Upstream wait | A change with an unestablished upstream fails upstream-established and cannot be small. | Unchanged. |
| A person approves a large plan | Not applicable: a small change is not large; the owner's request starts it. | Explicit approval before implementation. |

Approval stays out of files. Tiers add no workflow state, registry, phase, role or gate.
