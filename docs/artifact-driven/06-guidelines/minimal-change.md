# Start a small artifact change

Use this scaffold for one outcome in an existing artifact. Replace `sample`, `small-update`, and every `REPLACE` instruction with verified project facts. The placeholders make the structure readable; they are not completed requirements or check results.

Start from the artifact's complete established knowledge. Keep applicable requirements, specifications, and decisions. Exclude historical tasks and delivered provenance from the new change. Preserve the originating plans and evidence in their existing directories. Check that this is the artifact's single active change and that the new change belongs to exactly one unit.

For a first artifact, establish its identity, ownership, root README and no-established-version boundary before using the change layout. Use `change-initial` and follow the [artifact writing rules](writing-artifacts.md). This scaffold does not create those facts for you.

## Use the existing phase checks

1. Fill in the unit and change scope, then complete Requirement. Investigate affected flows and record the scope and gaps. Self-check and commit on a dedicated branch.
2. Complete Specification from the requirements. Add an ADR only for a necessary architectural choice with alternatives. Self-check and commit.
3. Write a fresh plan and concrete task DoD. Check membership, references, prerequisites and cycles. Self-check, commit, and present the concrete plan for explicit user approval.
4. After approval and required upstream establishment, implement and run the task checks. Record the actual method, result, source and limitations once in the owning task. Reference those details from the unit's evidence.
5. Validate the combined outcome. Prepare the confirmed version with `source_change` and `delivery_tasks: change`, excluding tasks from the snapshot. Follow team review and merge before claiming establishment.

The six files below form the minimum example. Existing baseline knowledge can require more files or tasks. An empty affected-flow list requires a reasoned assessment; replace it with discovered affected flows when applicable. Do not treat an uninvestigated flow map as proof of no impact.

## Copyable files

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

### docs/artifacts/sample/changes/change-small-update/README.md

~~~markdown
# REPLACE with the reason for this change

## Need and scope

REPLACE with the user need, included behavior and exclusions.

## Baseline and ownership

REPLACE with the verified established baseline and affected owners. Keep complete applicable knowledge and create fresh tasks. This change belongs to the small-update unit.

- [Requirements](requirements/outcome.md)
- [Specification](specifications/outcome.md)
- [Plan](tasks/README.md)
~~~

### docs/artifacts/sample/changes/change-small-update/requirements/outcome.md

~~~markdown
# REPLACE with the required outcome

## Need and constraints

REPLACE with confirmed facts, affected artifacts and constraints.

## Acceptance criteria

- R1: REPLACE with an observable result and its relevant failure case.

## Self-check

Not performed. Resolve requirement blockers, then record the check and commit before Specification.
~~~

### docs/artifacts/sample/changes/change-small-update/specifications/outcome.md

~~~markdown
# REPLACE with the behavior contract

## Governing requirement

R1 in requirements/outcome.md.

## Behavior and interfaces

REPLACE with inputs, outputs, rules, errors and applicable compatibility constraints. Record affected owners and necessary upstream references.

## Self-check

Not performed. Resolve contract blockers, then record the check and commit before Plan.
~~~

### docs/artifacts/sample/changes/change-small-update/tasks/README.md

~~~markdown
---
{"tasks": ["01-deliver.md"]}
---

# Implementation plan

1. [Deliver and validate the outcome](01-deliver.md)

## Approval and prerequisites

Present the concrete plan for explicit approval. Required upstream versions must establish before dependent implementation. A material amendment requires renewed approval.

## Plan self-check

Not performed. Check requirement coverage, task membership, dependencies and concrete DoD, then commit the plan before requesting approval.
~~~

### docs/artifacts/sample/changes/change-small-update/tasks/01-deliver.md

~~~markdown
---
{"id": "deliver", "depends_on": [], "evidence_records": []}
---

# Deliver and validate the outcome

## Scope and ownership

REPLACE with responsible implementation location and file/module boundaries.

## Governing knowledge

R1 in requirements/outcome.md; specifications/outcome.md. REPLACE with any additional applicable contracts.

## Prerequisites

Explicit approval of this plan and required upstream establishment. REPLACE with the exact upstream contract or state that none is required after discovery.

## Definition of Done

- [ ] REPLACE with the accepted behavior check, including its relevant failure case.
- [ ] REPLACE with the applicable integration or contract check and concrete method.

## Evidence

Implementation has not started. Record the actual check methods, outcomes, relevant implementation/test references and limitations here after execution.
~~~

## Record results once

After a task check runs, write its details in that task's Evidence section. Add a check record only when the details exist, using the [evidence format](evidence-records.md). Reference those same details from the unit's existing `evidence` list. The illustrative passed example in that guide is not part of this fresh scaffold.

Keep failed and incomplete checks visible. A copied scaffold, checked box, or valid source path does not establish approval, execution or publication. Missing or malformed explicit fields require a diagnostic and correction. Use these checks within the existing phase self-checks; no extra review phase is needed.
