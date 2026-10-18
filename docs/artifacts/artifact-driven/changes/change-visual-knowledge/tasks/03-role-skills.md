---
id: role-skills
depends_on: [guideline]
evidence_records:
  - id: dod
    method: Review of the four Representations sections against the contract, link check and byte comparison of both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/03-role-skills.md#evidence
---

# Add the Representations sections to the role skills

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 03-execution/skills/add-coordinator/SKILL.md
- 03-execution/skills/add-product-owner/SKILL.md
- 03-execution/skills/add-technical-lead/SKILL.md
- 03-execution/skills/add-implementer/SKILL.md

## Governing knowledge

V4 and AV4 in requirements/visual-knowledge.md; the agent procedure, the phase application and the page ownership sections of specifications/visual-knowledge.md.

## Prerequisites

Task guideline meets its DoD, because the sections link to the guideline. Explicit user approval of this plan.

## Definition of Done

- [x] Each skill has a Representations section in the style of its System-flow checks section: the coordinator owns unit-level and cross-artifact views, the stale check at version preparation and the recorded dry run; the PO uses examples, comparisons and measurement tables and draws no architecture; the TL writes contract tables, sequence, state and containment diagrams, ADR alternatives tables and relies on the derived task graph, and performs the validation step in the Specification and Plan self-checks; the implementer records evidence tables, rechecks behavior diagrams of the governing specification and reports stale ones.
- [x] Each section links to the guideline by a path relative to the skill directory, and adds no phase, review step or workflow state.
- [x] Every relative link resolves, and each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Executed on 18 October 2026 after the user approved the plan.

- add-coordinator: unit-level and cross-artifact views, the integration check of recorded validations, the stale check at Version preparation and the count check of generated diagrams.
- add-product-owner: example scenarios, comparisons and measurement tables in the Requirement self-check; no architecture, interaction or protocol detail; illustrations labelled.
- add-technical-lead: contract tables, sequence, state and containment diagrams, ADR alternatives tables and flow diagrams from records in the Specification self-check; the derived task graph in the Plan self-check; procedure step 9 recorded.
- add-implementer: evidence tables, recheck of behavior diagrams of the governing specification, stale diagrams reported to the coordinator, no edits of governing diagrams.
- Each section sits after System-flow checks, links to ../../../06-guidelines/visual-representations.md and adds no phase, review step or workflow state. .agents/skills are symbolic links to the canonical skills, so they need no copy. The link check resolves every link; `diff -rq` shows parity.
