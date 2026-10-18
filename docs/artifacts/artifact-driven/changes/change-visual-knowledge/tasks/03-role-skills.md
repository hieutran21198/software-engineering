---
id: role-skills
depends_on: [guideline]
evidence_records: []
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

- [ ] Each skill has a Representations section in the style of its System-flow checks section: the coordinator owns unit-level and cross-artifact views, the stale check at version preparation and the recorded dry run; the PO uses examples, comparisons and measurement tables and draws no architecture; the TL writes contract tables, sequence, state and containment diagrams, ADR alternatives tables and relies on the derived task graph, and performs the validation step in the Specification and Plan self-checks; the implementer records evidence tables, rechecks behavior diagrams of the governing specification and reports stale ones.
- [ ] Each section links to the guideline by a path relative to the skill directory, and adds no phase, review step or workflow state.
- [ ] Every relative link resolves, and each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Implementation has not started.
