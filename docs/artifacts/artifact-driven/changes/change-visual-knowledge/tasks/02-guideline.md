---
id: guideline
depends_on: []
evidence_records: []
---

# Write the representation guideline and the navigation edits

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 06-guidelines/visual-representations.md (new)
- 06-guidelines/README.md (one row for the guideline)
- 06-guidelines/writing-artifacts.md (Representations section)
- 06-guidelines/working-with-ai.md (Representations section)
- 02-methodology/dependencies.md (one sentence in Diagram Views)
- 02-methodology/validation.md (one sentence in Phase Self-Checks)
- README.md (bundle overview: the three new files in the project structure tree)

## Governing knowledge

V2 to V7, V9 and V10 in requirements/visual-knowledge.md; the categories, selection guide, authoring rules, agent procedure, phase application, traceability and maintenance, page ownership and reader support sections of specifications/visual-knowledge.md.

## Prerequisites

Explicit user approval of this plan. No upstream artifact is required.

## Definition of Done

- [ ] The guideline contains, as sections: the categories table, the selection guide with the rule for choosing no representation, authoring rules 1 to 8, the agent procedure steps 1 to 10, the self-review criteria, the prohibitions, the phase application table, the cross-artifact views, the four-graphs table, the traceability and maintenance rules, and reader support. The content follows the contract; the Artifact Plane directions stay in the contract and are not copied.
- [ ] The guideline contains one Mermaid example that follows authoring rules 2 to 4: an introduction paragraph, a fenced block with accTitle and accDescr, and a source line.
- [ ] writing-artifacts.md, working-with-ai.md, dependencies.md and validation.md carry the sections or sentences of the page ownership table and link to the guideline; 06-guidelines/README.md has the row; the bundle README tree lists the three new files.
- [ ] Every relative link resolves, no page links to an ancestor, and each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Implementation has not started.
