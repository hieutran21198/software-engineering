---
id: guideline
depends_on: []
evidence_records:
  - id: dod
    method: Review of the guideline and the navigation edits against the contract, browser render check, link check and byte comparison of both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/02-guideline.md#evidence
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

- [x] The guideline contains, as sections: the categories table, the selection guide with the rule for choosing no representation, authoring rules 1 to 8, the agent procedure steps 1 to 10, the self-review criteria, the prohibitions, the phase application table, the cross-artifact views, the four-graphs table, the traceability and maintenance rules, and reader support. The content follows the contract; the Artifact Plane directions stay in the contract and are not copied.
- [x] The guideline contains one Mermaid example that follows authoring rules 2 to 4: an introduction paragraph, a fenced block with accTitle and accDescr, and a source line.
- [x] writing-artifacts.md, working-with-ai.md, dependencies.md and validation.md carry the sections or sentences of the page ownership table and link to the guideline; 06-guidelines/README.md has the row; the bundle README tree lists the three new files.
- [x] Every relative link resolves, no page links to an ancestor, and each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Executed on 18 October 2026 after the user approved the plan.

- 06-guidelines/visual-representations.md has the sections Categories, Selection Guide (with the five no-representation conditions), Authoring Rules 1 to 8, Agent Procedure steps 1 to 10 with the eight self-review questions and six prohibitions, Phase Application with the cross-artifact views, Four Graphs, Four Meanings, Traceability and Maintenance, and Reader Support. The Artifact Plane directions are not copied.
- The example is a state diagram of an embedded diagram (proposal, current, stale) with an introduction paragraph, accTitle, accDescr and a source line. It renders on the built website with an SVG title and description.
- Corrections during implementation, also made in the contract: rule 4 gave dashed edges to proposed relationships and dotted edges to element references, but Mermaid has one dotted style (`-.->`), which dependency views already use for proposed edges. Rule 4 now gives that style to proposed relationships; element references are a separate picture under rule 6. Rule 1 now forbids semicolons in unquoted labels, because the render check showed that Mermaid ends a sequence diagram statement at a semicolon.
- writing-artifacts.md and working-with-ai.md have a Representations section, dependencies.md and validation.md one sentence each, all linking to the guideline. 06-guidelines/README.md has the row; the bundle README tree lists the three new files.
- Link check: every relative link resolves; no ancestor link. `diff -rq` lists only bundle.go, bundle_test.go and required-skills.
