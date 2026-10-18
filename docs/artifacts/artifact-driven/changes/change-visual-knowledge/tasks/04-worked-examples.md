---
id: worked-examples
depends_on: [guideline]
evidence_records:
  - id: dod
    method: Derivation script comparing every derived diagram and the evidence table with the records at 126990d, browser render check and link check.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/04-worked-examples.md#evidence
---

# Build the worked examples from this repository's artifacts

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 06-guidelines/visual-examples.md (new)
- 06-guidelines/README.md (one row for the examples)

The example artifacts under docs/artifacts are read, not edited.

## Governing knowledge

V8 and AV3 in requirements/visual-knowledge.md; the worked examples, authoring rules and selection guide sections of specifications/visual-knowledge.md.

## Prerequisites

Task guideline meets its DoD. Explicit user approval of this plan.

## Definition of Done

- [x] The page contains examples E1 to E9 of the contract. Each example gives the existing representation, the semantic model, the better representation, the reason with its principle and finding, what stays in text, and the consistency rule. Facts are taken from the named elements at revision 126990d, and illustrative statements are labelled.
- [x] Every semantic diagram follows authoring rules 1 to 6, and its count check matches its source: E2 three states; E5 five tasks and five edges; E6 seven criteria, seven entries, four sources and one failed result; E8 three artifacts, two edges and five references; E9 eight steps with eleven transitions and seven steps with seven transitions.
- [x] Each derived diagram states its derivation rule in words, and a derivation script run on the named revision produces the same nodes and edges.
- [x] The page names source elements by logical identity and links to no path under docs/artifacts; every relative link resolves; each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Executed on 18 October 2026 after the user approved the plan.

- 06-guidelines/visual-examples.md has E1 to E9, each with existing representation, semantic model, better representation, reason, what stays in text and consistency rule. E4 keeps the ADR table and E7 uses a table, as the selection guide decides.
- A script read the front matter of a `git archive 126990d docs/artifacts` export with the Plane's yaml package and compared it with the page: task graph 5 nodes and 5 edges; artifact graph 3 nodes, 2 edges and the versions 2.6.0, 1.17.1 and 1.1.0; references 6 nodes, 5 edges and 5 requires rows; knowledge-authoring 8 steps and 11 transitions with titles and conditions; change-delivery 7 steps and 7 transitions; evidence table 7 rows equal to the evidence entries, 7 criteria, 4 sources, 1 failed. Result: all derived examples match the records.
- E2 (3 states, 3 transitions) and E3 (4 parties, 9 messages and 1 note; 3 parties and 7 messages) come from body sentences and were counted by hand against the named sections. E7 rows come from the six version records and `git log --first-parent --diff-filter=A` at 126990d.
- E5 records a finding: the plan self-check of change-agent-efficiency says four internal edges; its declarations give five. The source artifact was not edited.
- All 8 diagrams of the page render to SVG with title and description on the built website. The page names elements by logical identity and links only to the guideline and the artifact model; it has no link under docs/artifacts.
