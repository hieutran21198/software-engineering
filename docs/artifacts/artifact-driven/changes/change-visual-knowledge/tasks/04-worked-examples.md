---
id: worked-examples
depends_on: [guideline]
evidence_records: []
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

- [ ] The page contains examples E1 to E9 of the contract. Each example gives the existing representation, the semantic model, the better representation, the reason with its principle and finding, what stays in text, and the consistency rule. Facts are taken from the named elements at revision 126990d, and illustrative statements are labelled.
- [ ] Every semantic diagram follows authoring rules 1 to 6, and its count check matches its source: E2 three states; E5 five tasks and five edges; E6 seven criteria, seven entries, four sources and one failed result; E8 three artifacts, two edges and five references; E9 eight steps with eleven transitions and seven steps with seven transitions.
- [ ] Each derived diagram states its derivation rule in words, and a derivation script run on the named revision produces the same nodes and edges.
- [ ] The page names source elements by logical identity and links to no path under docs/artifacts; every relative link resolves; each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Implementation has not started.
