# Start a small artifact change

Use this scaffold for one outcome in an existing artifact. Replace `sample`, `small-update`, and every `REPLACE` instruction with verified project facts. The placeholders make the structure readable; they are not completed requirements or check results.

Work on a dedicated branch. Edit the artifact's working knowledge in place: keep applicable requirements, specifications and decisions, and amend, remove or add files as the outcome needs. Copy nothing into the change or a version. The change directory holds only its record and its plan. Preserve earlier plans and evidence in their existing change directories. Check that this is the artifact's single active change.

For a first artifact, write its README with the identity record (`current_version: null`, `depends_on`), ownership and scope before you use this scaffold. Follow the [artifact writing rules](writing-artifacts.md). This scaffold does not create those facts for you.

## Use the existing phase checks

First assign the [tier](change-tiers.md). The copyable files below are for a small change. A medium change adds the unit brief and keeps a commit and an approval for each phase.

| Step | Small | Medium or large |
| --- | --- | --- |
| 1. Requirement | Fill in the change README and the requirement IDs. Investigate affected flows and record the impact assessment in the change README. | Fill in the change README, the unit brief and the requirement IDs. Investigate affected flows and record them in the brief. Self-check and commit. |
| 2. Specification | Write the contract from the requirements. Self-check. An ADR is not allowed. | Write the contract. Add an ADR only for a necessary architectural choice with alternatives. Self-check and commit. |
| 3. Plan | Write the plan paragraph in the change README and the one task. Self-check, then commit Requirement, Specification and Plan together. The owner's request is the plan approval. | Write a fresh plan and concrete task DoD, with `compatibility`. Check membership, `covers`, `depends_on` and cycles. Self-check, commit, and present the plan for explicit approval. |
| 4. Implementation | Implement and run the task checks. Record the method, result, source and limitations once in the task. | After approval and required upstream establishment, do the same for each task. Reference the task details from the unit's evidence. |
| 5. Version | Add the version record with the computed patch number and set `current_version`. Put the plan and the checks in the PR description. Team review and merge establish the version. | Validate the combined outcome. Add the version record with the computed number and set `current_version`. Team review and merge establish the version. |

When the [validator](writing-artifacts.md#check-records-with-the-validator) is available, run it with `--change sample/change-small-update` in each self-check.

The five files below form the minimum small change. The two knowledge files are edits to the artifact's working knowledge, not copies; the blocks show them after the edit. A small change amends existing requirement items and keeps their IDs. A new requirement ID makes the change medium, because it fails the no-contract criterion. Existing knowledge can require more files. Do not treat an uninvestigated flow map as proof of no impact.

## Copyable files

### docs/artifacts/sample/changes/change-small-update/README.md

~~~markdown
---
{"tier": "small"}
---

# REPLACE with the reason for this change

## Reason and scope

REPLACE with the user need, included behavior and exclusions. Knowledge is edited in place on this branch; the protected branch holds the established baseline.

## Plan

One task delivers and validates the outcome. It covers R1 in requirements/outcome.md. Compatibility: patch. REPLACE with the task summary.

## Tier decisions

REPLACE with the one-repository decision and, without an impact tool, the impact assessment: investigated journeys, sources, exclusions and why no entity outside this artifact is reached.

- [Requirements](../../requirements/outcome.md)
- [Specification](../../specifications/outcome.md)
- [Task](tasks/01-deliver.md)
~~~

### docs/artifacts/sample/requirements/outcome.md

~~~markdown
# REPLACE with the required outcome

## Need and constraints

REPLACE with confirmed facts, affected artifacts and constraints.

## Acceptance criteria

- R1: REPLACE with an observable result and its relevant failure case.

## Self-check

Not performed. Resolve requirement blockers and record the check before Specification.
~~~

### docs/artifacts/sample/specifications/outcome.md

~~~markdown
# REPLACE with the behavior contract

## Governing requirement

R1 in requirements/outcome.md.

## Behavior and interfaces

REPLACE with inputs, outputs, rules, errors and applicable compatibility constraints.

## Self-check

Not performed. Resolve contract blockers and record the check before Plan.
~~~

### docs/artifacts/sample/changes/change-small-update/tasks/README.md

~~~markdown
---
{"tasks": ["01-deliver.md"], "compatibility": "patch"}
---

# Implementation plan

1. [Deliver and validate the outcome](01-deliver.md)

## Plan self-check

Not performed. Check requirement coverage, task membership and concrete DoD, then commit the knowledge.
~~~

### docs/artifacts/sample/changes/change-small-update/tasks/01-deliver.md

~~~markdown
---
{"id": "deliver", "depends_on": [], "covers": [{"element": "requirements/outcome.md", "ids": ["R1"]}], "evidence_records": []}
---

# Deliver and validate the outcome

## Scope and ownership

REPLACE with responsible implementation location and file/module boundaries.

## Definition of Done

- [ ] REPLACE with the accepted behavior check, including its relevant failure case.
- [ ] REPLACE with the applicable integration or contract check and concrete method.

## Evidence

Implementation has not started. Record the actual check methods, outcomes, relevant implementation/test references and limitations here after execution.
~~~

## Medium and large additions

A medium or large change sets `"tier": "medium"` or `"tier": "large"`, moves the plan to `tasks/README.md` with one task for each separately checkable piece of work, and adds a unit brief. In the change README, remove the Plan and Tier decisions sections, link the plan `tasks/README.md` instead of the task, and add the sentence "This change belongs to the small-update unit." The brief records the affected flows; an empty affected-flow list needs a reasoned assessment.

### docs/artifacts/units-of-work/small-update/README.md

~~~markdown
---
{
  "unit_of_work": "small-update",
  "changes": [{"artifact": "sample", "change": "change-small-update"}],
  "affected_flows": [],
  "flow_assessment": "REPLACE with investigated journeys, sources, exclusions and the reason no affected flow is listed.",
  "acceptance": [{"id": "outcome", "criterion": "REPLACE with the observable delivered outcome."}],
  "evidence": []
}
---

# REPLACE with one deliverable outcome

## Included scope

REPLACE with included behavior and boundaries.

## Excluded scope

REPLACE with explicit exclusions.

## Validation evidence

No checks have run. Reference the originating task's check details after validation.
~~~

## Record results once

After a task check runs, write its details in that task's Evidence section. Add a check record only when the details exist, using the [evidence format](evidence-records.md); its `source` can be omitted, because it defaults to the task's Evidence section. When a unit brief exists, reference those same details from its `evidence` list with a one-line method. The illustrative passed example in that guide is not part of this fresh scaffold.

Keep failed and incomplete checks visible. A copied scaffold, checked box, or valid source path does not establish approval, execution or publication. Missing or malformed explicit fields require a diagnostic and correction. Use these checks within the existing phase self-checks; no extra review phase is needed.
